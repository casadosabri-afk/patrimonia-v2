# PATRIMONIA — périmètre de la simulation

## Objectif

Présenter un ERP de cabinet de gestion de patrimoine dans le cadre d'un projet scolaire. L'application principale est une simulation interactive, entièrement contenue dans un fichier HTML et ouvrable directement dans un navigateur sur Mac ou Windows.

## Principe

- Utiliser uniquement des personnes, foyers et données fictifs.
- Simuler la connexion avec plusieurs comptes de démonstration.
- Montrer des vues différentes selon le profil : administrateur et conseiller.
- Permettre d'explorer les principaux écrans et quelques interactions.
- Conserver certaines modifications de démonstration dans le navigateur, sans serveur ni synchronisation.
- Ne pas utiliser de données personnelles réelles ni de secrets.

## Fonctions de démonstration

### Connexion et profils

- Administrateur de démonstration : Sabri Casado, accès à la vue globale et création de foyers fictifs.
- Conseillère de démonstration : Camille Durand, accès à son portefeuille fictif.
- Déconnexion et changement de compte.
- Les identifiants sont affichés sur l'écran d'accueil; ils ne protègent aucune donnée réelle.

### Écrans présentés

- Tableau de bord avec indicateurs patrimoniaux fictifs.
- Foyers et composition familiale.
- Placements avec enveloppes, positions et valorisations de démonstration.
- Tâches et états de suivi.
- Agenda.
- Documents fictifs.
- Rapports et aperçu imprimable.

Les tâches peuvent être mises à jour et de nouveaux foyers de démonstration peuvent être ajoutés. Ces changements sont conservés dans le stockage local du navigateur utilisé.

## Format et ouverture

Le livrable principal est `prototype/index.html`, un fichier HTML/CSS/JavaScript autonome. Pour la présentation, il suffit de le télécharger, de le décompresser puis de l'ouvrir dans Safari ou un autre navigateur. Aucun fichier `.exe`, Node.js ou service externe n'est nécessaire.

## Limites assumées de la simulation

Cette version ne fournit pas d'authentification réelle, de base de données serveur, de synchronisation entre appareils, de cours de marché en direct ni de stockage réel de documents. Les données de démonstration sont visibles dans le fichier et dans le navigateur. Les actions qui ne sont pas simulées sont présentées comme telles dans l'interface.

Le dossier `prototype/web` contient une ancienne expérimentation serveur et ne fait pas partie du livrable HTML autonome.

## Direction visuelle

Interface sobre et professionnelle, inspirée des outils de gestion patrimoniale : bleu nuit, blanc, accents bronze et vert, navigation latérale, tableaux lisibles, adaptation aux petits écrans et libellés en français.
