from rest_framework import permissions
from .models import ConfigurationRoles


class EstPDS(permissions.BasePermission):
    """PDS actif ET rôle PDS activé dans la config (mécanisme d'activation)"""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'pds'
            and ConfigurationRoles.get_config().pds_actif
        )


class EstServiceConcerne(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'service_concerne'
            and ConfigurationRoles.get_config().services_concernes_actifs
        )


class PeutVoirDossier(permissions.BasePermission):
    """
    Confidentialité (section 9.2) : un dossier confidentiel n'est
    visible/gérable que par le PDS, y compris dans les vues de
    supervision globale du SG.

    Service concerné (section 7.4) : aucune visibilité sur les
    dossiers des autres services.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True

        role = request.user.role

        if obj.confidentiel:
            return role == 'pds'

        if role in ('service_courrier', 'sg'):
            return True

        if role == 'pds':
            return ConfigurationRoles.get_config().pds_actif

        if role == 'service_concerne':
            return (
                ConfigurationRoles.get_config().services_concernes_actifs
                and obj.service_actuel_id == request.user.service_id
            )

        return False


class DossierNonVerrouille(permissions.BasePermission):
    """Une fois l'imputation définitive posée, la fiche est verrouillée (section 4.2)"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if view.action == 'changer_statut':
            return True  # la transition gère elle-même ses règles, y compris après verrouillage (ex: archivage)
        return not obj.verrouille