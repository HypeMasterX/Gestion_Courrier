from django.core.mail import send_mail
from django.conf import settings


def notifier_utilisateurs(utilisateurs, dossier, message):
    """Section 9.1 : notification email à chaque attribution d'un dossier."""
    emails = [u.email for u in utilisateurs if u.email]
    if not emails:
        return
    send_mail(
        subject=f"[Gestion Courrier] Dossier {dossier.numero}",
        message=f"{message}\n\nObjet : {dossier.objet}\nStatut actuel : {dossier.get_statut_display()}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=emails,
        fail_silently=True,
    )