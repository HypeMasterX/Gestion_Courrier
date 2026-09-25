from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Dossier, Imputation, ImputationDossier, Service


class ImputationDossierBulkTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username='sg1',
            password='secret123',
            role='sg',
        )
        self.client.force_authenticate(user=self.user)

        self.service_1 = Service.objects.create(nom='Direction A', code='DIRA')
        self.service_2 = Service.objects.create(nom='Direction B', code='DIRB')
        self.imputation_1 = Imputation.objects.get(libelle='Pour traitement')
        self.imputation_2 = Imputation.objects.get(libelle='Pour avis')

        self.dossier = Dossier.objects.create(
            type_courrier='arrivee',
            origine_destinataire='Mairie centrale',
            objet='Dossier test',
            cree_par=self.user,
            service_actuel=self.service_1,
        )

    def test_bulk_create_should_create_multiple_imputations_and_services(self):
        payload = {
            'dossier': self.dossier.id,
            'imputations': [
                {
                    'imputation': self.imputation_1.id,
                    'service_destinataire': self.service_1.id,
                    'commentaire': 'À traiter rapidement',
                    'est_definitive': False,
                },
                {
                    'imputation': self.imputation_2.id,
                    'service_destinataire': self.service_2.id,
                    'commentaire': 'Demande d’avis',
                    'est_definitive': False,
                },
            ],
        }

        response = self.client.post('/api/imputations-dossier/bulk/', payload, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(ImputationDossier.objects.filter(dossier=self.dossier).count(), 2)
        self.assertEqual(
            set(ImputationDossier.objects.filter(dossier=self.dossier).values_list('imputation_id', flat=True)),
            {self.imputation_1.id, self.imputation_2.id},
        )
