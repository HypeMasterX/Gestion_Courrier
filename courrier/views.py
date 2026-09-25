from rest_framework.filters import SearchFilter
from rest_framework.views import APIView
from django.db.models import Count
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Service, Imputation, Dossier, ImputationDossier, ConfigurationRoles, JournalAudit
from .serializers import (
    ServiceSerializer, ImputationSerializer, DossierSerializer,
    ImputationDossierSerializer, ConfigurationRolesSerializer, JournalAuditSerializer
)
from .permissions import PeutVoirDossier, DossierNonVerrouille
from .notifications import notifier_utilisateurs
from utilisateurs.models import Utilisateur


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]


class ImputationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Imputation.objects.all()
    serializer_class = ImputationSerializer
    permission_classes = [permissions.IsAuthenticated]


# Transitions officielles autorisées : {type_courrier: {statut_actuel: [(statut_suivant, [roles_autorises])]}}
TRANSITIONS = {
    'arrivee': {
        'enregistre': [('transmis_sg', ['service_courrier'])],
        'transmis_sg': [('en_traitement', ['sg']), ('transmis_pds', ['sg'])],
        'transmis_pds': [('en_traitement', ['pds'])],
        'imputation_definitive': [('archive', ['service_courrier'])],
    },
    'depart': {
        'redige': [('en_validation', ['service_courrier'])],
        'en_validation': [('signe', ['sg', 'pds'])],
        'signe': [('expedie', ['service_courrier'])],
        'expedie': [('classe', ['service_courrier'])],
    },
}


class DossierViewSet(viewsets.ModelViewSet):
    serializer_class = DossierSerializer
    filter_backends = [SearchFilter]
    search_fields = ['numero', 'objet', 'origine_destinataire']
    permission_classes = [permissions.IsAuthenticated, PeutVoirDossier, DossierNonVerrouille]

    def get_queryset(self):
        user = self.request.user
        qs = Dossier.objects.all()
        config = ConfigurationRoles.get_config()

        if user.is_superuser:
            return qs
        if user.role == 'pds':
            return qs if config.pds_actif else qs.none()
        if user.role in ('service_courrier', 'sg'):
            return qs.filter(confidentiel=False)
        if user.role == 'service_concerne':
            if not config.services_concernes_actifs:
                return qs.none()
            return qs.filter(confidentiel=False, service_actuel=user.service)
        return qs.none()

    def perform_create(self, serializer):
        dossier = serializer.save(cree_par=self.request.user)
        JournalAudit.objects.create(
            dossier=dossier, utilisateur=self.request.user,
            action=f"Création du dossier {dossier.numero}"
        )

    def perform_update(self, serializer):
        ancien_statut = serializer.instance.statut
        dossier = serializer.save()
        if dossier.statut != ancien_statut:
            JournalAudit.objects.create(
                dossier=dossier, utilisateur=self.request.user,
                action=f"Changement de statut : {ancien_statut} → {dossier.statut}"
            )
        else:
            JournalAudit.objects.create(dossier=dossier, utilisateur=self.request.user, action="Modification du dossier")

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        """Fait avancer un dossier dans son circuit officiel (section 3.1/3.2 du cahier des charges)."""
        dossier = self.get_object()
        nouveau_statut = request.data.get('statut')

        transitions_possibles = TRANSITIONS.get(dossier.type_courrier, {}).get(dossier.statut, [])
        transition_valide = next((t for t in transitions_possibles if t[0] == nouveau_statut), None)

        if not transition_valide:
            return Response(
                {'detail': f"Transition de « {dossier.statut} » vers « {nouveau_statut} » non autorisée."},
                status=status.HTTP_400_BAD_REQUEST
            )

        _, roles_autorises = transition_valide
        if not (request.user.is_superuser or request.user.role in roles_autorises):
            return Response({'detail': "Vous n'avez pas le rôle requis pour cette transition."},
                             status=status.HTTP_403_FORBIDDEN)

        ancien_statut = dossier.statut
        dossier.statut = nouveau_statut
        dossier.save()

        JournalAudit.objects.create(
            dossier=dossier, utilisateur=request.user,
            action=f"Transition : {ancien_statut} → {nouveau_statut}"
        )

        # Notifications email (section 9.1)
        if nouveau_statut == 'transmis_sg':
            notifier_utilisateurs(Utilisateur.objects.filter(role='sg'), dossier,
                                   f"Le dossier {dossier.numero} vous a été transmis.")
        elif nouveau_statut == 'transmis_pds':
            notifier_utilisateurs(Utilisateur.objects.filter(role='pds'), dossier,
                                   f"Le dossier {dossier.numero} vous a été escaladé.")

        return Response(DossierSerializer(dossier).data)

    @action(detail=True, methods=['post'])
    def renvoyer_au_sg(self, request, pk=None):
        """Un service concerné rend la main au SG après traitement."""
        dossier = self.get_object()
        if request.user.role != 'service_concerne' and not request.user.is_superuser:
            return Response(
                {'detail': "Seul un service concerné peut renvoyer un dossier."},
                status=status.HTTP_403_FORBIDDEN,
            )

        ancien_service = dossier.service_actuel
        dossier.service_actuel = None
        dossier.statut = 'transmis_sg'
        dossier.save(update_fields=['service_actuel', 'statut', 'date_maj'])

        JournalAudit.objects.create(
            dossier=dossier,
            utilisateur=request.user,
            action=f"Rapport renvoyé au SG par {ancien_service.nom if ancien_service else 'un service'}",
        )
        notifier_utilisateurs(
            Utilisateur.objects.filter(role='sg'),
            dossier,
            f"Le service a renvoyé son rapport sur le dossier {dossier.numero}.",
        )
        return Response(DossierSerializer(dossier).data)


class UtilisateurCourantView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'role': request.user.role or ('admin' if request.user.is_superuser else ''),
        })


class ImputationDossierViewSet(viewsets.ModelViewSet):
    queryset = ImputationDossier.objects.all()
    serializer_class = ImputationDossierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _appliquer_imputation(self, dossier, imputation, service_destinataire, commentaire, est_definitive, user):
        obj = ImputationDossier.objects.create(
            dossier=dossier,
            imputation=imputation,
            service_destinataire=service_destinataire,
            commentaire=commentaire or '',
            est_definitive=bool(est_definitive),
            applique_par=user,
        )

        JournalAudit.objects.create(
            dossier=dossier, utilisateur=user,
            action=f"Imputation « {obj.imputation.libelle} » appliquée"
        )

        if service_destinataire:
            dossier.service_actuel = service_destinataire
            dossier.save()
            notifier_utilisateurs(
                Utilisateur.objects.filter(role='service_concerne', service=service_destinataire),
                dossier,
                f"Le dossier {dossier.numero} a été attribué à votre service."
            )

        if obj.est_definitive:
            dossier.verrouille = True
            dossier.statut = 'imputation_definitive'
            dossier.save()
            JournalAudit.objects.create(
                dossier=dossier, utilisateur=user,
                action="Imputation définitive posée — dossier verrouillé"
            )

        return obj

    def perform_create(self, serializer):
        imputation_dossier = serializer.save(applique_par=self.request.user)
        self._appliquer_imputation(
            dossier=imputation_dossier.dossier,
            imputation=imputation_dossier.imputation,
            service_destinataire=imputation_dossier.service_destinataire,
            commentaire=imputation_dossier.commentaire,
            est_definitive=imputation_dossier.est_definitive,
            user=self.request.user,
        )

    @action(detail=False, methods=['post'])
    def bulk(self, request):
        dossier_id = request.data.get('dossier')
        items = request.data.get('imputations')

        if not dossier_id or not isinstance(items, list) or not items:
            return Response({'detail': 'Dossier et liste d’imputations obligatoires.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            dossier = Dossier.objects.get(pk=dossier_id)
        except Dossier.DoesNotExist:
            return Response({'detail': 'Dossier introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        created = []
        for item in items:
            if not isinstance(item, dict):
                return Response({'detail': 'Chaque imputation doit être un objet valide.'}, status=status.HTTP_400_BAD_REQUEST)

            imputation_id = item.get('imputation')
            if not imputation_id:
                return Response({'detail': 'Une imputation est obligatoire.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                imputation = Imputation.objects.get(pk=imputation_id)
            except Imputation.DoesNotExist:
                return Response({'detail': f"Imputation introuvable : {imputation_id}"}, status=status.HTTP_404_NOT_FOUND)

            service_values = item.get('service_destinataire')
            if isinstance(service_values, list):
                service_ids = service_values
            elif service_values in (None, '', [], 'null'):
                service_ids = [None]
            else:
                service_ids = [service_values]

            for service_id in service_ids:
                service_dest = None
                if service_id not in (None, '', 'null'):
                    service_dest = Service.objects.filter(pk=service_id).first()
                    if service_dest is None:
                        return Response({'detail': f"Service destinataire introuvable : {service_id}"}, status=status.HTTP_404_NOT_FOUND)

                created_obj = self._appliquer_imputation(
                    dossier=dossier,
                    imputation=imputation,
                    service_destinataire=service_dest,
                    commentaire=item.get('commentaire', ''),
                    est_definitive=item.get('est_definitive', False),
                    user=request.user,
                )
                created.append(created_obj.id)

        return Response({'created': len(created), 'dossier': dossier.id}, status=status.HTTP_201_CREATED)


class ConfigurationRolesViewSet(viewsets.ModelViewSet):
    queryset = ConfigurationRoles.objects.all()
    serializer_class = ConfigurationRolesSerializer
    permission_classes = [permissions.IsAdminUser]


class StatistiquesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = Dossier.objects.all()

        if not user.is_superuser and user.role != 'pds':
            qs = qs.filter(confidentiel=False)
        if user.role == 'service_concerne':
            qs = qs.filter(service_actuel=user.service)

        par_statut = qs.values('statut').annotate(total=Count('id'))
        par_type = qs.values('type_courrier').annotate(total=Count('id'))

        return Response({
            'total_dossiers': qs.count(),
            'par_statut': list(par_statut),
            'par_type': list(par_type),
            'confidentiels': qs.filter(confidentiel=True).count() if user.role == 'pds' or user.is_superuser else None,
        })


class JournalAuditViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = JournalAuditSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = JournalAudit.objects.all()
        dossier_id = self.request.query_params.get('dossier')
        if dossier_id:
            qs = qs.filter(dossier_id=dossier_id)
        return qs