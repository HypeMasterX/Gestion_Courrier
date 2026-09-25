from django.contrib import admin
from .models import Service, Imputation, ConfigurationRoles, Dossier, ImputationDossier, JournalAudit


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code', 'actif']


@admin.register(Imputation)
class ImputationAdmin(admin.ModelAdmin):
    list_display = ['ordre', 'libelle', 'portee']
    ordering = ['ordre']


@admin.register(ConfigurationRoles)
class ConfigurationRolesAdmin(admin.ModelAdmin):
    list_display = ['pds_actif', 'services_concernes_actifs']

    def has_add_permission(self, request):
        return not ConfigurationRoles.objects.exists()


class ImputationDossierInline(admin.TabularInline):
    model = ImputationDossier
    extra = 1


@admin.register(Dossier)
class DossierAdmin(admin.ModelAdmin):
    list_display = ['numero', 'type_courrier', 'objet', 'statut', 'confidentiel', 'service_actuel']
    list_filter = ['type_courrier', 'statut', 'confidentiel']
    search_fields = ['numero', 'objet', 'origine_destinataire']
    readonly_fields = ['numero']
    inlines = [ImputationDossierInline]


@admin.register(JournalAudit)
class JournalAuditAdmin(admin.ModelAdmin):
    list_display = ['horodatage', 'utilisateur', 'action', 'dossier']
    readonly_fields = ['dossier', 'utilisateur', 'action', 'horodatage']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False