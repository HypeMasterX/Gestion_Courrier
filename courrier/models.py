from django.db import models
from django.conf import settings
from django.utils import timezone


class Service(models.Model):
    """Directions et services opérationnels (DSTM, DPM, DDF, Affaires Juridiques, etc.)"""
    nom = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    actif = models.BooleanField(default=True)

    def __str__(self):
        return self.nom


class Imputation(models.Model):
    """Référentiel des 18 imputations officielles"""
    libelle = models.CharField(max_length=100, unique=True)
    portee = models.TextField(help_text="Description officielle de la portée")
    instruction_claire = models.TextField(
        blank=True,
        help_text="Traduction en langage clair pour les services opérationnels"
    )
    ordre = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['ordre']

    def __str__(self):
        return self.libelle


class ConfigurationRoles(models.Model):
    """Singleton : active/désactive PDS et Services concernés sans toucher au code"""
    pds_actif = models.BooleanField(default=False)
    services_concernes_actifs = models.BooleanField(default=False)
    delai_relance_jours = models.PositiveSmallIntegerField(default=3)

    class Meta:
        verbose_name = "Configuration des rôles"
        verbose_name_plural = "Configuration des rôles"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_config(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Configuration des rôles"


class Dossier(models.Model):
    TYPE_CHOICES = [
        ('arrivee', 'Courrier Arrivée'),
        ('depart', 'Courrier Départ'),
    ]

    STATUT_CHOICES = [
        ('enregistre', 'Enregistré'),
        ('transmis_sg', 'Transmis au SG'),
        ('en_traitement', 'En traitement'),
        ('transmis_pds', 'Transmis au PDS'),
        ('imputation_definitive', 'Imputation définitive posée'),
        ('archive', 'Archivé'),
        ('redige', 'Rédigé'),
        ('en_validation', 'En validation'),
        ('signe', 'Signé'),
        ('expedie', 'Expédié'),
        ('classe', 'Classé'),
    ]

    numero = models.CharField(max_length=20, unique=True, editable=False)
    type_courrier = models.CharField(max_length=10, choices=TYPE_CHOICES)
    date_enregistrement = models.DateField(default=timezone.now)
    origine_destinataire = models.CharField(max_length=255)
    objet = models.CharField(max_length=255)
    statut = models.CharField(max_length=30, choices=STATUT_CHOICES, default='enregistre')
    confidentiel = models.BooleanField(default=False)
    piece_jointe = models.FileField(upload_to='dossiers/%Y/%m/', blank=True, null=True)
    cree_par = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='dossiers_crees')
    service_actuel = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, related_name='dossiers_en_cours')
    verrouille = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_maj = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.numero:
            annee = timezone.now().year
            dernier = Dossier.objects.filter(numero__startswith=f"{annee}-").order_by('-id').first()
            nouveau_num = int(dernier.numero.split('-')[1]) + 1 if dernier else 1
            self.numero = f"{annee}-{nouveau_num:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.numero} - {self.objet}"


class ImputationDossier(models.Model):
    dossier = models.ForeignKey(Dossier, on_delete=models.CASCADE, related_name='imputations_appliquees')
    imputation = models.ForeignKey(Imputation, on_delete=models.PROTECT)
    applique_par = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    service_destinataire = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True)
    commentaire = models.TextField(blank=True)
    est_definitive = models.BooleanField(default=False)
    date_application = models.DateTimeField(auto_now_add=True)
    relance_envoyee = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.imputation.libelle} sur {self.dossier.numero}"


class JournalAudit(models.Model):
    """Journal immuable : aucune modification ni suppression possible après création"""
    dossier = models.ForeignKey(Dossier, on_delete=models.CASCADE, related_name='journal', null=True, blank=True)
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    horodatage = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-horodatage']

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValueError("Le journal d'audit est en lecture seule après création.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("Le journal d'audit est immuable : suppression interdite.")

    def __str__(self):
        return f"[{self.horodatage}] {self.utilisateur} — {self.action}"