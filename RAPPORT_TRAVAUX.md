# Rapport de travaux
## Application de gestion du courrier - Mairie de Banfora

**Date du rapport :** 20 septembre 2026  
**Projet :** Gestion_courrier  
**Architecture :** Django REST Framework + React TypeScript/Vite  
**Objet :** Synthèse détaillée des travaux réalisés, des décisions prises, des validations et des points restant à finaliser.

---

## 1. Résumé exécutif

Le projet a été structuré comme une application de gestion du courrier municipal couvrant le cycle de vie d'un dossier entrant ou sortant : enregistrement, transmission, traitement, imputation, affectation à un service, suivi, relance, archivage et traçabilité.

Les choix principaux retenus sont :

- un backend Django avec API REST ;
- une interface React TypeScript ;
- un système d'utilisateurs personnalisé avec rôles métier ;
- un workflow contrôlé par des transitions officielles ;
- une sélection multiple des imputations et des services destinataires par cases à cocher ;
- une configuration permettant de préparer les rôles PDS et services concernés avant leur activation ;
- un journal d'audit pour conserver l'historique des actions ;
- un référentiel de services issu du bordereau municipal ;
- une interface modernisée pour la connexion, le tableau de bord, le détail des dossiers et la création d'un dossier.

Le backend et le frontend ont été compilés/testés avec succès dans l'environnement du projet. Le test automatisé actuel valide la création de plusieurs imputations et affectations de services sur un même dossier.

---

## 2. Compréhension du besoin métier

Le projet concerne le suivi administratif du courrier de la mairie de Banfora. Le système doit éviter que les dossiers soient suivis uniquement par des échanges informels ou des documents isolés. Chaque courrier doit devenir un dossier identifiable, consultable selon les droits de l'utilisateur et traçable de bout en bout.

Le fonctionnement retenu distingue notamment :

- le **Service Courrier**, qui enregistre, transmet et classe les courriers ;
- le **Secrétariat Général**, qui reçoit les courriers transmis, les traite et peut les orienter ;
- le **PDS**, qui représente un rôle de supervision et peut accéder aux dossiers confidentiels lorsque ce rôle est activé ;
- les **services concernés**, qui ne voient que les dossiers affectés à leur propre service lorsque ce mode est activé.

Les décisions fonctionnelles importantes ont été intégrées dans le code plutôt que laissées sous forme de simples indications visuelles.

---

## 3. Architecture technique

### 3.1 Backend

Le backend utilise :

- Django ;
- Django REST Framework ;
- authentification par token et session ;
- PostgreSQL comme base configurée dans les paramètres ;
- `courrier` comme application métier principale ;
- `utilisateurs` comme application de gestion des comptes ;
- migrations Django pour créer et faire évoluer la base.

Le modèle utilisateur configuré est `utilisateurs.Utilisateur` grâce à `AUTH_USER_MODEL`.

### 3.2 Frontend

Le frontend utilise :

- React ;
- TypeScript ;
- Vite ;
- React Router ;
- Axios pour les appels API ;
- une route protégée pour empêcher l'accès aux écrans métier sans authentification.

Les routes principales sont :

- `/connexion` : connexion ;
- `/dossiers` : tableau de bord et liste des dossiers ;
- `/dossiers/nouveau` : création d'un dossier ;
- `/dossiers/:id` : détail d'un dossier, transitions, imputations et historique.

---

## 4. Modèle de données métier

Les modèles principaux sont définis dans [courrier/models.py](courrier/models.py).

### 4.1 Service

Le modèle `Service` représente les directions, cellules et services opérationnels de la mairie.

Il contient notamment :

- `nom` : nom lisible du service ;
- `code` : code unique ;
- `actif` : possibilité de désactiver un service sans le supprimer.

### 4.2 Imputation

Le modèle `Imputation` contient le référentiel officiel des 18 imputations.

Chaque imputation possède :

- un libellé ;
- une portée officielle ;
- une instruction claire destinée aux utilisateurs opérationnels ;
- un ordre d'affichage.

La liste des imputations est conservée comme référentiel central afin d'éviter que chaque utilisateur invente sa propre formulation.

### 4.3 ConfigurationRoles

`ConfigurationRoles` est un singleton de configuration. Il permet d'activer ou de désactiver certains profils sans modifier le code.

Les paramètres sont :

- `pds_actif` ;
- `services_concernes_actifs` ;
- `delai_relance_jours`.

Le singleton est toujours enregistré avec la clé primaire `1`. La méthode `get_config()` garantit qu'une configuration existe.

Cette décision répond à la demande de développer les fonctionnalités maintenant, puis de laisser l'administrateur décider du moment de leur activation.

### 4.4 Dossier

Le modèle `Dossier` représente un courrier enregistré.

Il contient notamment :

- un numéro automatique au format `année-numéro`, par exemple `2026-0001` ;
- le type `arrivee` ou `depart` ;
- la date d'enregistrement ;
- l'expéditeur ou le destinataire ;
- l'objet ;
- le statut ;
- le caractère confidentiel ;
- une pièce jointe facultative ;
- l'utilisateur créateur ;
- le service actuel ;
- le verrouillage après imputation définitive ;
- les dates de création et de mise à jour.

### 4.5 ImputationDossier

Ce modèle relie un dossier à une imputation appliquée.

Il conserve :

- le dossier ;
- l'imputation ;
- l'utilisateur ayant appliqué l'imputation ;
- le service destinataire éventuel ;
- le commentaire ;
- le caractère définitif ;
- la date d'application ;
- l'indicateur de relance envoyée.

### 4.6 JournalAudit

Le journal d'audit conserve les actions importantes :

- création du dossier ;
- modification ;
- changement de statut ;
- application d'une imputation ;
- imputation définitive ;
- verrouillage du dossier.

Le modèle est rendu immuable : une entrée existante ne peut plus être modifiée ni supprimée par les méthodes `save()` et `delete()`.

---

## 5. Gestion des utilisateurs et des rôles

Le modèle personnalisé est défini dans [utilisateurs/models.py](utilisateurs/models.py).

Les rôles disponibles sont :

| Code | Rôle |
|---|---|
| `service_courrier` | Service Courrier |
| `sg` | Secrétariat Général |
| `pds` | Président de la Délégation Spéciale |
| `service_concerne` | Service concerné |

Un utilisateur du rôle `service_concerne` peut être lié à un objet `Service`. Cette relation permet de filtrer les dossiers et de garantir qu'un service ne consulte que les dossiers qui lui sont affectés.

L'administration Django a été configurée dans [utilisateurs/admin.py](utilisateurs/admin.py) avec :

- affichage du nom d'utilisateur, de l'adresse e-mail, du rôle et du service ;
- filtres par rôle, service, activité et statut administrateur ;
- recherche par identifiant, nom, prénom et e-mail ;
- champs de rôle et de service dans les formulaires d'ajout et de modification.

La création opérationnelle des utilisateurs se fait donc depuis `/admin/`, après création d'un superutilisateur avec `createsuperuser`.

---

## 6. Workflow des dossiers

Les transitions sont définies dans [courrier/views.py](courrier/views.py).

### 6.1 Courrier arrivée

Le circuit prévu est :

```text
Enregistré -> Transmis au SG -> En traitement
                         |
                         -> Transmis au PDS -> En traitement
```

Les droits sont répartis ainsi :

- Service Courrier : `enregistre` vers `transmis_sg` ;
- SG : `transmis_sg` vers `en_traitement` ou `transmis_pds` ;
- PDS : `transmis_pds` vers `en_traitement` ;
- Service Courrier : archivage après imputation définitive.

### 6.2 Courrier départ

Le circuit prévu est :

```text
Rédigé -> En validation -> Signé -> Expédié -> Classé
```

Les droits sont répartis ainsi :

- Service Courrier : rédaction, expédition et classement ;
- SG ou PDS : validation et signature.

### 6.3 Contrôle d'une transition

L'endpoint `changer_statut` vérifie :

1. que la transition existe pour le type et le statut courants ;
2. que le rôle de l'utilisateur est autorisé ;
3. que le dossier peut être chargé par l'utilisateur ;
4. que l'action est ajoutée au journal d'audit ;
5. que les notifications appropriées sont déclenchées.

---

## 7. Sélection multiple par cases à cocher

La demande de remplacer une sélection unique par une sélection multiple a été prise en compte.

Dans [frontend/src/pages/DetailDossier.tsx](frontend/src/pages/DetailDossier.tsx), l'utilisateur peut cocher :

- plusieurs imputations ;
- plusieurs services destinataires ;
- une imputation définitive ;
- un commentaire commun à l'action.

Le frontend construit ensuite une charge utile pour l'endpoint :

```text
POST /api/imputations-dossier/bulk/
```

L'endpoint bulk :

- vérifie la présence du dossier ;
- vérifie que la liste d'imputations est valide ;
- vérifie l'existence de chaque imputation ;
- accepte un ou plusieurs services destinataires ;
- crée les relations `ImputationDossier` ;
- met à jour le service actuel du dossier ;
- notifie les utilisateurs du service concerné ;
- pose le statut `imputation_definitive` et verrouille le dossier si demandé ;
- écrit les actions dans le journal d'audit.

Le comportement permet donc de traiter plusieurs orientations dans une seule opération.

---

## 8. Permissions et confidentialité

Les permissions sont définies dans [courrier/permissions.py](courrier/permissions.py).

### 8.1 PDS

Le rôle PDS n'est réellement actif que si :

```text
utilisateur.role = pds
ConfigurationRoles.pds_actif = True
```

Lorsque le PDS est désactivé, les requêtes et les permissions empêchent l'accès métier correspondant.

### 8.2 Services concernés

Le rôle service concerné n'est actif que si :

```text
utilisateur.role = service_concerne
ConfigurationRoles.services_concernes_actifs = True
```

Un service concerné est limité aux dossiers dont `service_actuel` correspond à son service d'appartenance.

### 8.3 Confidentialité

Les dossiers confidentiels sont réservés au PDS, sauf superutilisateur.

Le Service Courrier et le SG voient les dossiers non confidentiels. Le service concerné ne voit que les dossiers non confidentiels qui lui sont affectés.

### 8.4 Verrouillage

Une imputation définitive verrouille le dossier. Les lectures restent possibles, mais les modifications ordinaires sont bloquées. La transition d'archivage possède un traitement spécifique dans le workflow.

---

## 9. API mise en place

Les routes API sont regroupées dans [courrier/urls.py](courrier/urls.py).

Les ressources disponibles sont :

- `/api/services/` ;
- `/api/imputations/` ;
- `/api/dossiers/` ;
- `/api/imputations-dossier/` ;
- `/api/imputations-dossier/bulk/` ;
- `/api/configuration-roles/` ;
- `/api/journal-audit/` ;
- `/api/statistiques/` ;
- `/api/utilisateur-courant/`.

Les services et dossiers utilisent des ViewSets REST. Les statistiques et l'utilisateur courant utilisent des vues API dédiées.

La recherche des dossiers porte sur :

- le numéro ;
- l'objet ;
- l'expéditeur ou le destinataire.

---

## 10. Notifications et relances

La logique de notification est utilisée lorsque :

- un dossier est transmis au SG ;
- un dossier est transmis au PDS ;
- une imputation affecte un dossier à un service concerné.

Le projet utilise actuellement le backend e-mail console de Django. En développement, les messages sont donc affichés dans la console plutôt qu'envoyés vers une messagerie réelle.

Le champ `relance_envoyee` et la configuration `delai_relance_jours` préparent la gestion des relances. Une commande de management `relancer_dossiers.py` est présente dans le projet pour cette partie du processus.

---

## 11. Référentiel des services

Le fichier [courrier/services_seed.py](courrier/services_seed.py) contient le référentiel des services issu du bordereau.

Il comprend notamment :

- DSTM ;
- DPM ;
- DDF ;
- DAJ ;
- SG ;
- PDS ;
- DDEL ;
- DADF ;
- DEAHP ;
- SRH ;
- CT ;
- plusieurs cellules, directions et services particuliers.

La commande `seed_services` permet d'insérer cette liste dans la base sans devoir saisir chaque service manuellement.

---

## 12. Données de démonstration

La commande [courrier/management/commands/seed_demo_data.py](courrier/management/commands/seed_demo_data.py) prépare un environnement de démonstration.

Elle :

- active le PDS ;
- active les services concernés ;
- configure le délai de relance à trois jours ;
- crée les comptes de démonstration s'ils n'existent pas ;
- crée notamment les utilisateurs `service_courrier`, `sg`, `pds` et `direction_a`.

Le mot de passe de démonstration prévu par cette commande est `123456`. Il doit être remplacé avant toute utilisation réelle.

---

## 13. Interface utilisateur réalisée

### 13.1 Mise en page générale

Le composant [frontend/src/components/Layout.tsx](frontend/src/components/Layout.tsx) fournit :

- une barre supérieure ;
- l'identité visuelle de la mairie ;
- le nom de l'utilisateur connecté ;
- l'intitulé du rôle ;
- le bouton de déconnexion ;
- l'enveloppe commune des écrans protégés.

### 13.2 Connexion

La page [frontend/src/pages/connexion.tsx](frontend/src/pages/connexion.tsx) contient :

- un formulaire identifiant/mot de passe ;
- la gestion de l'erreur d'authentification ;
- un design centré et responsive ;
- une identité visuelle Banfora ;
- une redirection vers le tableau de bord après connexion.

### 13.3 Tableau de bord

La page [frontend/src/pages/Dossiers.tsx](frontend/src/pages/Dossiers.tsx) contient :

- le titre adapté au rôle ;
- le nombre total de dossiers ;
- le nombre de dossiers en traitement ;
- le nombre de dossiers archivés ;
- la recherche ;
- le tableau des dossiers ;
- le statut sous forme de badge ;
- le lien vers le détail ;
- le bouton de création réservé au Service Courrier et à l'administrateur.

### 13.4 Création d'un dossier

La page [frontend/src/pages/NouveauDossier.tsx](frontend/src/pages/NouveauDossier.tsx) permet de saisir :

- le type de courrier ;
- l'expéditeur ou le destinataire ;
- l'objet ;
- le caractère confidentiel.

### 13.5 Détail d'un dossier

La page [frontend/src/pages/DetailDossier.tsx](frontend/src/pages/DetailDossier.tsx) permet de consulter :

- les métadonnées du dossier ;
- le statut courant ;
- les transitions accessibles ;
- les imputations ;
- les services destinataires ;
- le commentaire ;
- le verrouillage définitif ;
- l'historique d'audit.

### 13.6 Style global

Le fichier [frontend/src/index.css](frontend/src/index.css) a été restructuré avec :

- des variables de couleurs ;
- un fond clair avec profondeur visuelle ;
- une barre de navigation colorée ;
- des panneaux et cartes structurés ;
- des boutons primaires et secondaires ;
- des formulaires cohérents ;
- des tableaux responsives ;
- des badges de statut ;
- une adaptation mobile ;
- une hiérarchie typographique plus lisible.

---

## 14. Commandes exécutées et résultats

### 14.1 Initialisation des services

Commande exécutée :

```powershell
.\venv\Scripts\python.exe manage.py seed_services
```

Résultat observé : 28 services ajoutés.

### 14.2 Initialisation des données de démonstration

Commande exécutée :

```powershell
.\venv\Scripts\python.exe manage.py seed_demo_data
```

Résultat observé : les paramètres de configuration et les utilisateurs de démonstration ont été créés.

### 14.3 Test backend

Commande exécutée :

```powershell
.\venv\Scripts\python.exe manage.py test courrier.tests --verbosity 2
```

Résultat :

```text
System check identified no issues (0 silenced).
Ran 1 test in 2.691s
OK
```

Le test vérifie qu'une requête bulk crée plusieurs imputations et plusieurs services associés au même dossier.

### 14.4 Build frontend

Commande exécutée depuis `frontend` :

```powershell
npm run build
```

Résultat :

- compilation TypeScript réussie ;
- transformation Vite réussie ;
- génération du bundle réussie ;
- génération du service worker PWA réussie ;
- aucune erreur TypeScript signalée.

### 14.5 Vérification serveur Django

Le serveur de développement a été lancé avec :

```powershell
python manage.py runserver
```

Dans une session où l'environnement virtuel est correctement utilisé, l'application est prévue pour être accessible sur l'adresse locale standard de Django.

---

## 15. Ce qui est terminé

Les éléments suivants sont réalisés :

- compréhension et structuration du besoin métier ;
- modèles de données courrier ;
- utilisateurs personnalisés et rôles ;
- administration Django des utilisateurs ;
- référentiel des imputations ;
- référentiel des services ;
- workflow des courriers arrivée et départ ;
- permissions par rôle ;
- confidentialité ;
- configuration d'activation PDS/services concernés ;
- sélection multiple par cases à cocher ;
- endpoint bulk ;
- notifications de transmission et d'affectation ;
- journal d'audit immuable ;
- statistiques ;
- recherche de dossiers ;
- verrouillage après imputation définitive ;
- commandes de seed ;
- écrans React principaux ;
- redesign de l'interface ;
- test backend ciblé ;
- build frontend validé.

---

## 16. Limites actuelles à connaître

### 16.1 Interfaces par rôle

Les rôles sont déjà pris en compte dans les permissions, les données visibles, les transitions et certains contrôles d'affichage. L'interface actuelle reste toutefois principalement commune aux profils.

Il n'existe pas encore une suite complète de tableaux de bord totalement séparés pour chaque rôle, avec par exemple :

- un espace SG indépendant ;
- un espace PDS indépendant ;
- un espace de travail propre à chaque service concerné ;
- une administration frontend complète de la configuration des rôles.

La base technique est prête pour cette spécialisation, mais cette étape constitue encore un approfondissement fonctionnel.

### 16.2 Couverture des tests

Le test automatisé présent couvre le scénario principal de création multiple d'imputations et de services. Il faut encore ajouter des tests pour :

- l'accès ou le refus d'accès selon chaque rôle ;
- les dossiers confidentiels ;
- la désactivation du PDS ;
- la désactivation des services concernés ;
- les transitions de statut ;
- le verrouillage définitif ;
- le journal immuable ;
- les notifications ;
- les relances ;
- la création d'un dossier par API.

### 16.3 Sécurité de production

Les paramètres actuels sont adaptés au développement mais doivent être durcis pour la production :

- remplacer le `SECRET_KEY` exposé dans les paramètres ;
- désactiver `DEBUG` ;
- configurer `ALLOWED_HOSTS` ;
- sortir le mot de passe PostgreSQL du fichier source ;
- remplacer le mot de passe des comptes de démonstration ;
- configurer un vrai service e-mail ;
- servir les fichiers statiques et médias avec une configuration de production ;
- vérifier les règles CORS et CSRF.

### 16.4 Gestion des pièces jointes

Le modèle prévoit une pièce jointe, mais le parcours frontend de dépôt et de consultation des fichiers doit encore être approfondi pour constituer une gestion documentaire complète.

---

## 17. Procédure de démarrage recommandée

### Backend

Depuis la racine du projet :

```powershell
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py seed_services
.\venv\Scripts\python.exe manage.py seed_demo_data
.\venv\Scripts\python.exe manage.py runserver
```

### Frontend

Dans un autre terminal :

```powershell
cd frontend
npm install
npm run dev
```

### Création d'un administrateur

```powershell
.\venv\Scripts\python.exe manage.py createsuperuser
```

Puis ouvrir l'administration Django sur `/admin/` pour créer ou modifier les utilisateurs.

---

## 18. Comptes de démonstration

Après exécution de `seed_demo_data`, les comptes suivants sont prévus :

| Identifiant | Rôle | Service |
|---|---|---|
| `service_courrier` | Service Courrier | Aucun |
| `sg` | Secrétariat Général | Aucun |
| `pds` | PDS | Aucun |
| `direction_a` | Service concerné | DSTM si présent |

Le mot de passe de démonstration est `123456`. Ces comptes servent uniquement aux tests locaux et doivent être remplacés ou supprimés avant déploiement.

---

## 19. Conclusion

Le projet dispose maintenant d'une base fonctionnelle cohérente pour la gestion numérique du courrier municipal. Le cœur métier, les rôles, les transitions, l'imputation multiple, la traçabilité, la configuration d'activation et l'interface principale sont en place.

Les validations réalisées confirment que :

- les migrations s'appliquent correctement dans l'environnement de test ;
- le contrôle système Django ne signale pas d'erreur ;
- le scénario d'imputations multiples fonctionne ;
- le frontend TypeScript/Vite se compile correctement.

La prochaine étape logique est une recette fonctionnelle avec un compte de chaque rôle, suivie d'une extension des écrans dédiés et d'un renforcement de la couverture de tests avant un déploiement réel.
