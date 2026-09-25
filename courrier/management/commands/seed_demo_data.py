from django.core.management.base import BaseCommand

from courrier.models import ConfigurationRoles, Service
from utilisateurs.models import Utilisateur


class Command(BaseCommand):
    help = 'Crée les paramètres de démonstration pour le projet de gestion du courrier.'

    def handle(self, *args, **options):
        config = ConfigurationRoles.get_config()
        config.pds_actif = True
        config.services_concernes_actifs = True
        config.delai_relance_jours = 3
        config.save()

        for username, role, service_nom in [
            ('service_courrier', 'service_courrier', None),
            ('sg', 'sg', None),
            ('pds', 'pds', None),
            ('direction_a', 'service_concerne', 'DSTM'),
        ]:
            if not Utilisateur.objects.filter(username=username).exists():
                service = None
                if service_nom:
                    service = Service.objects.filter(code=service_nom).first()
                Utilisateur.objects.create_user(
                    username=username,
                    password='123456',
                    role=role,
                    service=service,
                )

        self.stdout.write(self.style.SUCCESS('Données de démonstration créées.'))
