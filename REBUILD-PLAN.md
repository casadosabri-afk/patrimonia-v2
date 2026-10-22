# PATRIMONIA ERP — cahier fonctionnel et proposition de refonte

## Objectif

Créer, pour un projet scolaire, un ERP web local et réellement utilisable pour simuler le fonctionnement d’un cabinet de gestion de patrimoine. Les données de la démonstration sont fictives. Le prototype actuel reste intact sur la branche principale pendant la refonte.

## Périmètre fonctionnel validé

### Accès et rôles

L’application est réservée à l’équipe du cabinet, sans portail client dans la première version.

- Administrateur : accès complet, gestion des utilisateurs et des dossiers.
- Gestionnaire : supervision et attribution des dossiers.
- Conseiller : accès uniquement aux foyers qui lui sont attribués.
- Les droits d’accès s’appliquent aussi aux fichiers et aux exports liés au dossier.

### Clients et foyers

Un dossier peut représenter une personne ou un foyer. Un foyer peut contenir plusieurs personnes. Le patrimoine peut être détenu par le foyer ou par un membre. Le dossier contient le conseiller référent, les objectifs patrimoniaux, l’horizon d’investissement, le profil de risque et la date de prochaine revue. Le profil aide au suivi et ne déclenche aucune recommandation automatique.

### Patrimoine

- Enveloppes financières : contrats ou comptes (par exemple assurance-vie, PEA, compte-titres).
- Positions détaillées : titres rattachés à une enveloppe, avec identifiant, quantité, devise et valeur.
- Pour les titres cotés : récupération du dernier cours disponible, au plus une fois par jour. L’écran indique la date et la source du cours.
- Pour les autres actifs, dont l’immobilier et les placements non cotés : valorisation manuelle, datée et attribuée à son auteur.
- Emprunts et dettes : suivi du capital restant dû.
- Patrimoine net calculé à partir des actifs financiers et immobiliers moins les dettes.

La récupération de cours passe par un fournisseur externe appelé côté serveur. Le fournisseur et la configuration dépendront de la couverture des marchés et des conditions d’accès. Sans clé API, le mode démonstration reste utilisable avec les données fictives.

### Suivi opérationnel

- Tâches rattachées à un foyer, attribuées à un conseiller, avec échéance, priorité et états : à faire, en cours, en attente, terminée.
- Rendez-vous liés à un dossier, avec date, statut, compte rendu et possibilité de créer des tâches de suivi.
- Création automatique d’une tâche de préparation 30 jours avant une revue patrimoniale.
- Le gestionnaire voit l’ensemble du suivi ; le conseiller voit uniquement son portefeuille.

### Documents et rapports

- Import et téléchargement de PDF et d’images liés au dossier.
- Stockage intégré à l’application dans la première version.
- Synthèse patrimoniale PDF par foyer et export CSV des positions détaillées.

## Format de livraison et architecture proposée

L’application sera livrée sous forme d’interface HTML accessible dans le navigateur, accompagnée d’un lanceur Windows. Elle doit rester consultable et modifiable comme un projet scolaire. L’interface compilée produit un fichier `index.html`.

Un fichier HTML seul ne peut pas assurer une authentification réelle, des rôles protégés, un stockage SQLite partagé ou la protection d’une clé de fournisseur. Le lanceur démarrera donc un service local et ouvrira l’interface HTML dans le navigateur. Le même projet pourra être emballé en `.exe` ultérieurement si ce format devient nécessaire.

- Interface : React, TypeScript et Vite, compilés en HTML/CSS/JavaScript.
- Serveur : Node.js et Express pour l’authentification, les règles d’accès, les calculs et les échanges avec les fournisseurs de cours.
- Données : SQLite locale, adaptée à une démonstration autonome et persistante.
- Documents : répertoire de stockage privé local, servi uniquement après vérification des droits du dossier.
- Authentification : mots de passe hachés côté serveur, sessions sécurisées, rôles vérifiés à chaque requête.
- Cours de marché : adaptateur serveur configurable, avec mise en cache quotidienne et affichage de l’horodatage et de la source.

## Direction visuelle proposée

Interface claire, professionnelle et sobre, inspirée des outils CRM et de gestion patrimoniale sans reprendre leur identité graphique.

- Écran de connexion distinct, avec marque PATRIMONIA et formulaire centré.
- Navigation latérale : Vue d’ensemble, Foyers, Placements, Immobilier, Emprunts, Tâches, Agenda, Documents, Rapports et Administration.
- Tableau de bord : patrimoine net, actifs et dettes, tâches en retard, rendez-vous proches et revues à préparer.
- Fiche foyer organisée en onglets : Synthèse, Membres, Patrimoine, Suivi, Documents, Historique.
- Palette bleu nuit, blanc cassé et accents vert/bronze, avec contraste lisible et mise en page responsive.
- Montants et dates formatés en français, données de démonstration clairement identifiées.

## Ordre de réalisation recommandé

1. Socle d’authentification, rôles, base SQLite et données de démonstration.
2. Foyers, membres, attribution des conseillers et profil patrimonial.
3. Enveloppes, positions, immobilier, dettes et calcul du patrimoine net.
4. Tâches, rendez-vous et création automatique des préparations de revue.
5. Documents, exports CSV/PDF et adaptateur de cours coté.
6. Polissage responsive et vérification du parcours complet avant remplacement de l’ancien prototype.
