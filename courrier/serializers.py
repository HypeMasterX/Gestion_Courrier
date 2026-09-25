from rest_framework import serializers
from .models import Service, Imputation, Dossier, ImputationDossier, ConfigurationRoles, JournalAudit


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'


class ImputationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Imputation
        fields = '__all__'


class ImputationDossierSerializer(serializers.ModelSerializer):
    imputation_libelle = serializers.CharField(source='imputation.libelle', read_only=True)

    class Meta:
        model = ImputationDossier
        fields = ['id', 'dossier', 'imputation', 'imputation_libelle', 'applique_par',
                   'service_destinataire', 'commentaire', 'est_definitive', 'date_application']
        read_only_fields = ['applique_par', 'date_application']


class DossierSerializer(serializers.ModelSerializer):
    imputations_appliquees = ImputationDossierSerializer(many=True, read_only=True)

    class Meta:
        model = Dossier
        fields = '__all__'
        read_only_fields = ['numero', 'verrouille', 'cree_par']


class ConfigurationRolesSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigurationRoles
        fields = ['pds_actif', 'services_concernes_actifs', 'delai_relance_jours']


class JournalAuditSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.CharField(source='utilisateur.username', read_only=True, default='Système')

    class Meta:
        model = JournalAudit
        fields = ['id', 'action', 'horodatage', 'utilisateur_nom']