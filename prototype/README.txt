PATRIMONIA ERP — VERSION LOCALE EN COURS

OUVRIR SOUS WINDOWS
Pour utiliser l'exécutable autonome, télécharge l'artefact « patrimonia-erp-windows-portable » dans l'onglet Actions du dépôt après la réussite du workflow de construction. Extrais l'artefact ZIP puis double-clique sur PATRIMONIA-ERP-1.0.0-Windows-Portable.exe. Node.js n'est pas nécessaire sur l'ordinateur du professeur.
L'exécutable ouvre une fenêtre de bureau et conserve ses données dans le profil Windows de l'utilisateur.
Le fichier LANCER-PATRIMONIA.bat reste disponible pour le développement. Cette méthode requiert Node.js 20 ou plus récent et ouvre l'application dans le navigateur.

COMPTE ADMINISTRATEUR PERSONNEL
Nom : Sabri Casado
Identifiant : sabri@patrimonia.local
Au premier démarrage, un mot de passe aléatoire unique est généré et présenté dans une fenêtre. Conserve-le, puis connecte-toi avec cet identifiant. Tu peux ensuite le remplacer depuis le bouton « Mot de passe ».
Le profil administrateur voit et peut gérer tous les foyers, les utilisateurs, les tâches, les rendez-vous, les documents et les exports.

Comptes de démonstration :
Administrateur de démonstration : admin@patrimonia.local / ChangeMe123!
Conseillère : camille@patrimonia.local / Camille2026!
Mot de passe : Camille2026!
Deuxième conseillère : alex@patrimonia.local
Mot de passe : Alex2026!

Le mot de passe initial de Sabri est créé localement et n'est jamais inscrit dans le dépôt. Le compte est aussi créé au prochain lancement si la base SQLite existe déjà. L'exécutable Windows autonome est construit par GitHub Actions; il ne requiert pas Node.js au moment de son utilisation.

DONNÉES
Les dossiers créés sont enregistrés sur cet ordinateur dans prototype/data/patrimonia.sqlite. Les PDF et images restent dans prototype/data/documents. Ces données ne sont ni envoyées à un serveur distant ni synchronisées entre ordinateurs. Utilise uniquement des données fictives pour le projet scolaire.

ÉTAT
Cette version contient une authentification locale par rôles, des dossiers et personnes, des actifs, des dettes, des tâches, des rendez-vous, des documents, et des exports PDF/CSV. Les données de départ sont fictives.
Le fournisseur de cours financiers automatiques et le packaging autonome en .exe restent à réaliser.
