from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    ServiceViewSet, ImputationViewSet, DossierViewSet, ImputationDossierViewSet,
    ConfigurationRolesViewSet, StatistiquesView, UtilisateurCourantView, JournalAuditViewSet
)

router = DefaultRouter()
router.register('services', ServiceViewSet)
router.register('imputations', ImputationViewSet)
router.register('dossiers', DossierViewSet, basename='dossier')
router.register('imputations-dossier', ImputationDossierViewSet)
router.register('configuration-roles', ConfigurationRolesViewSet)
router.register('journal-audit', JournalAuditViewSet, basename='journal-audit')

urlpatterns = router.urls + [
    path('statistiques/', StatistiquesView.as_view(), name='statistiques'),
    path('utilisateur-courant/', UtilisateurCourantView.as_view(), name='utilisateur-courant'),
]