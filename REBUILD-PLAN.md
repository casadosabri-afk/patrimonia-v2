# PATRIMONIA — périmètre de la simulation

## Objectif

Présenter un ERP de cabinet de gestion de patrimoine dans le cadre d'un projet scolaire. L'application principale est une simulation interactive, entièrement contenue dans un fichier HTML et ouvrable directement dans un navigateur sur Mac ou Windows.

## Principe

- Utiliser uniquement des personnes, foyers, conversations et données fictifs.
- Simuler la connexion avec plusieurs comptes et montrer des vues selon le profil.
- Permettre d'explorer les principaux écrans et quelques interactions sans serveur.
- Conserver certaines modifications de démonstration dans le navigateur, sans synchronisation.
- Ne jamais utiliser de données personnelles réelles ni de secrets.

## Fonctions de démonstration

### Connexion et profils

- Administrateur de démonstration : Sabri Casado, avec vue globale et création de foyers fictifs.
- Conseillère de démonstration : Camille Durand, avec portefeuille fictif limité.
- Déconnexion et changement de compte.
- Les identifiants sont affichés dans le projet et ne protègent aucune donnée réelle.

### Écrans

- Tableau de bord avec indicateurs patrimoniaux fictifs.
- Foyers, membres et placements de démonstration.
- Tâches avec changement d'état.
- Agenda, documents et rapports de démonstration.
- Messagerie avec conversations fictives, création de conversation et envoi de messages.
- Paramètres de profil en lecture seule et préférences locales de notification/devise.

Les foyers ajoutés, les tâches modifiées, les conversations et les préférences sont conservés dans le stockage local du navigateur utilisé.

## Format et ouverture

Le livrable principal est `prototype/index.html`, un fichier HTML/CSS/JavaScript autonome. Il suffit de le télécharger, de le décompresser puis de l'ouvrir dans Safari ou un autre navigateur. Aucun fichier `.exe`, Node.js ou service externe n'est nécessaire.

## Limites assumées

Cette simulation ne fournit pas d'authentification réelle, de base de données serveur, de synchronisation entre appareils, de cours de marché en direct ni de stockage réel de documents. Les données sont fictives et accessibles dans le fichier et le navigateur. Les actions non simulées sont présentées comme telles dans l'interface.

Le dossier `prototype/web` contient une ancienne expérimentation avec serveur local et ne fait pas partie du livrable HTML autonome.

## Pistes d'évolution à prioriser

1. Fiche foyer plus complète avec membres, objectifs, patrimoine net et historique des échanges.
2. Compte rendu de rendez-vous avec création simulée de tâches de suivi.
3. Liste de pièces à fournir, avec statut reçu/manquant/à renouveler.
4. Répartition visuelle du patrimoine par catégorie et enveloppe.
5. Recherche et filtres globaux sur les foyers et les tâches.
6. Exports de démonstration imprimables ou téléchargeables en CSV/PDF côté navigateur.

## Direction visuelle

Interface sobre et professionnelle, inspirée des outils de gestion patrimoniale : bleu nuit, blanc, accents bronze et vert, navigation latérale, tableaux lisibles, adaptation aux petits écrans et libellés en français.
