from django.core.management.base import BaseCommand
from courrier.models import Service
from courrier.services_seed import SERVICES_DEFAUT


class Command(BaseCommand):
    help = 'Charge la liste des services/directions du bordereau de la mairie pour la gestion du courrier.'

    def handle(self, *args, **options):
        created = 0
        for code, nom in SERVICES_DEFAUT:
            _, was_created = Service.objects.get_or_create(
                code=code,
                defaults={'nom': nom, 'actif': True}
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f'{created} service(s) ajouté(s).'))
