from django.contrib.auth.models import AbstractUser
from django.db import models


class Utilisateur(AbstractUser):
    ROLE_CHOICES = [
        ('service_courrier', 'Service Courrier'),
        ('sg', 'Secrétariat Général'),
        ('pds', 'Président de la Délégation Spéciale'),
        ('service_concerne', 'Service concerné'),
    ]

    role = models.CharField(max_length=30, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"

    service = models.ForeignKey(
        'courrier.Service', on_delete=models.SET_NULL,
        null=True, blank=True,
        help_text="Service d'appartenance, uniquement pour le rôle 'service_concerne'"
    )