from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from courrier.models import ImputationDossier, ConfigurationRoles, JournalAudit
from courrier.notifications import notifier_utilisateurs


class Command(BaseCommand):
    help = "Envoie une relance aux expéditeurs (SG/PDS) dont les tâches assignées n'ont pas eu de réponse à temps."

    def handle(self, *args, **options):
        delai = ConfigurationRoles.get_config().delai_relance_jours
        seuil = timezone.now() - timedelta(days=delai)

        en_retard = ImputationDossier.objects.filter(
            relance_envoyee=False,
            date_application__lte=seuil,
            dossier__statut='en_traitement',
        )

        for imputation_dossier in en_retard:
            dossier = imputation_dossier.dossier
            notifier_utilisateurs(
                [imputation_dossier.applique_par],
                dossier,
                f"Relance : le dossier {dossier.numero} attend une réponse depuis plus de {delai} jour(s)."
            )
            JournalAudit.objects.create(
                dossier=dossier,
                utilisateur=None,
                action=f"Relance automatique envoyée à {imputation_dossier.applique_par}"
            )
            imputation_dossier.relance_envoyee = True
            imputation_dossier.save()

        self.stdout.write(self.style.SUCCESS(f"{en_retard.count()} relance(s) envoyée(s)."))