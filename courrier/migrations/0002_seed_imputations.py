from django.db import migrations

IMPUTATIONS = [
    ("Pour transmettre", "Achemine le dossier instruit par le SG vers le PDS pour décision finale."),
    ("Pour disposition à prendre", "Anticiper les mesures logistiques, matérielles ou financières nécessaires."),
    ("Pour amendement et correction", "Renvoi d'un projet au service rédacteur pour correction ou modification."),
    ("Pour information", "Diffusion à un service tiers pour connaissance, sans action attendue."),
    ("Pour élaborer un document ou acte administratif", "Rédaction d'un texte officiel à valeur juridique."),
    ("Pour mettre en instance", "Mise en attente formelle et temporaire du dossier."),
    ("Me voir avec le dossier", "Convocation du responsable du service pour un arbitrage verbal."),
    ("Pour classement", "Clôture de la procédure et versement du dossier aux archives."),
    ("Pour suite à donner", "Exécution de la phase opérationnelle consécutive à une approbation."),
    ("Pour suivi", "Contrôle et surveillance continue de l'avancement d'un projet."),
    ("Pour attribution", "Désignation de la direction pilote de l'instruction du dossier."),
    ("Pour signature", "Présentation de l'acte finalisé à l'autorité compétente."),
    ("Pour traitement", "Prise en charge courante de l'affaire par les services opérationnels."),
    ("Pour avis", "Demande d'analyse technique ou d'opportunité, formalisée par une note."),
    ("Pour participation assortie d'un CR", "Représentation à une instance externe avec compte rendu obligatoire."),
    ("Pour enquête", "Vérifications matérielles ou de terrain (constat, vérification, etc.)."),
    ("Pour exploitation", "Étude et synthèse de données brutes ou de rapports volumineux."),
    ("BE pour...", "Bordereau d'Envoi : expédition officielle de pièces à une autorité externe."),
]


def creer_imputations(apps, schema_editor):
    Imputation = apps.get_model('courrier', 'Imputation')
    for ordre, (libelle, portee) in enumerate(IMPUTATIONS, start=1):
        Imputation.objects.create(libelle=libelle, portee=portee, ordre=ordre)


def supprimer_imputations(apps, schema_editor):
    Imputation = apps.get_model('courrier', 'Imputation')
    Imputation.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('courrier', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(creer_imputations, supprimer_imputations),
    ]