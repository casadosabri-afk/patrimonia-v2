PATRIMONIA ERP — PROJET SCOLAIRE

OUVRIR LA MAQUETTE HTML SUR MAC, SANS NODE.JS
1. Télécharge le ZIP de la branche de refonte et extrais-le.
2. Ouvre le dossier prototype.
3. Double-clique sur index.html. Si besoin, ouvre-le depuis Safari avec Fichier > Ouvrir le fichier.
Cette page HTML autonome sert à présenter le design et les principaux écrans. Elle contient des données fictives et une connexion simulée. Elle ne se connecte pas à la base SQLite et ne représente pas l'ERP complet.

UTILISER L'ERP COMPLET SUR MAC
L'ERP connecté à sa base locale nécessite Node.js 20 ou plus récent.
1. Ouvre Terminal dans le dossier prototype.
2. Lance npm install (première utilisation seulement).
3. Lance npm start.
4. Ouvre http://127.0.0.1:4173 dans Safari.
5. Pour arrêter l'ERP, retourne dans Terminal et appuie sur Ctrl+C.

Le compte administrateur Sabri Casado est sabri@patrimonia.local. Au premier démarrage du serveur, le mot de passe aléatoire initial s'affiche une fois dans Terminal. Conserve-le; il pourra ensuite être modifié depuis l'application.

SOUS WINDOWS
Lance LANCER-PATRIMONIA.bat. Node.js 20 ou plus récent doit être installé.

DONNÉES
L'ERP complet garde sa base SQLite et les documents localement sur l'ordinateur utilisé. Les appareils ne se synchronisent pas entre eux. Utilise uniquement les données fictives du projet scolaire.
