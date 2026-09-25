from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'service', 'is_staff', 'is_active']
    list_filter = ['role', 'is_staff', 'is_active', 'service']
    search_fields = ['username', 'first_name', 'last_name', 'email']
    fieldsets = UserAdmin.fieldsets + (
        ('Rôle et service', {'fields': ('role', 'service')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Rôle et service', {'fields': ('role', 'service')}),
    )
