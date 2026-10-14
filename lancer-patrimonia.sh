#!/usr/bin/env bash
#
# PATRIMONIA — lanceur macOS et Linux.
#
# Double-cliquez sur ce fichier, ou lancez-le depuis un terminal. Il vérifie
# Node.js, installe les dépendances au premier lancement, compile
# l'application, démarre le serveur et ouvre votre navigateur.
#
# Pour arrêter : revenez sur cette fenêtre et appuyez sur Ctrl+C.

set -uo pipefail

# Se placer dans le dossier du projet, quel que soit l'endroit d'où l'on part.
cd "$(dirname "${BASH_SOURCE[0]}")" || exit 1

BOLD=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'
RED=$'\033[31m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'

HELPER="scripts/launcher.mjs"

step() { printf '  %s▸%s %s\n' "$GREEN" "$RESET" "$1"; }
note() { printf '    %s%s%s\n' "$DIM" "$1" "$RESET"; }

fail() {
  printf '\n  %s%s%s\n\n' "$RED" "$1" "$RESET"
  printf '  Cette fenêtre reste ouverte. Appuyez sur Entrée pour la fermer.\n'
  read -r _ 2> /dev/null || true
  exit 1
}

printf '\n%s  PATRIMONIA%s  %sLa vision intelligente du patrimoine%s\n\n' \
  "$BOLD" "$RESET" "$DIM" "$RESET"

# --------------------------------------------------------------- Node.js ----
command -v node > /dev/null 2>&1 \
  || fail "Node.js est introuvable. Installez la version LTS depuis https://nodejs.org puis relancez ce fichier."

[ -f "$HELPER" ] \
  || fail "Fichier $HELPER manquant. Le dossier du projet semble incomplet."

NODE_VERSION="$(node "$HELPER" check-node 2> /dev/null)" \
  || fail "Node.js $(node -v 2> /dev/null) est trop ancien. PATRIMONIA demande la version 20 ou supérieure (https://nodejs.org)."
step "Node.js $NODE_VERSION détecté."

# ------------------------------------------------------------------ Port ----
PORT="$(node "$HELPER" port 2> /dev/null)" \
  || fail "Aucun port libre entre 3000 et 3024. Fermez les applications qui les occupent puis réessayez."

[ "$PORT" = "3000" ] || note "Le port 3000 est occupé, PATRIMONIA utilisera le port $PORT."
URL="http://localhost:$PORT"

# ------------------------------------------------- Configuration locale ----
ENV_STATE="$(node "$HELPER" env "$PORT" 2> /dev/null)" \
  || fail "Impossible d'écrire le fichier .env.local. Vérifiez les droits sur ce dossier."

case "$ENV_STATE" in
  created) step "Première configuration : secret de session généré." ;;
  rebuild) note "Le port a changé : l'application sera recompilée."; rm -rf .next ;;
esac

# ---------------------------------------------------------- Dépendances ----
if [ ! -d node_modules ]; then
  step "Installation des dépendances (une seule fois, comptez une minute)."
  npm install --no-fund --no-audit \
    || fail "L'installation des dépendances a échoué. Vérifiez votre connexion internet."
else
  step "Dépendances déjà installées."
fi

# ----------------------------------------------------------- Compilation ----
if [ ! -f .next/BUILD_ID ]; then
  step "Compilation de l'application (une seule fois, comptez une minute)."
  npm run build \
    || fail "La compilation a échoué. Transmettez le message ci-dessus pour diagnostic."
else
  step "Application déjà compilée."
fi

# -------------------------------------------------------------- Serveur ----
step "Démarrage du serveur sur $URL"
npx next start -p "$PORT" &
SERVER_PID=$!

cleanup() {
  printf '\n  Arrêt de PATRIMONIA.\n\n'
  kill "$SERVER_PID" 2> /dev/null || true
  wait "$SERVER_PID" 2> /dev/null || true
}
trap cleanup INT TERM EXIT

if ! node "$HELPER" wait "$PORT"; then
  printf '\n  %sLe serveur n’a pas démarré. Le message ci-dessus indique pourquoi.%s\n\n' "$RED" "$RESET"
  printf '  Appuyez sur Entrée pour fermer.\n'
  read -r _ 2> /dev/null || true
  exit 1
fi

# ------------------------------------------------------------- Ouverture ----
if command -v open > /dev/null 2>&1; then
  open "$URL" 2> /dev/null || true
elif command -v xdg-open > /dev/null 2>&1; then
  xdg-open "$URL" 2> /dev/null || true
fi

cat <<INFO

  ${GREEN}PATRIMONIA est en ligne.${RESET}

  Adresse      ${BOLD}$URL${RESET}
  ${DIM}Si le navigateur ne s’est pas ouvert, copiez cette adresse dedans.${RESET}

  ${BOLD}Comptes de démonstration${RESET}  ${DIM}(mot de passe commun : patrimonia)${RESET}

    thomas@horizon.demo         Conseiller
    admin@horizon.demo          Administrateur du cabinet
    jean.dupont@exemple.demo    Client
    advisor@meridien.demo       Conseiller d’un second cabinet

  ${DIM}Les données clients sont fictives. Les données de marché sont réelles
  lorsqu’un fournisseur répond, sinon simulées et signalées DEMO.${RESET}

  ${YELLOW}Pour arrêter : Ctrl+C dans cette fenêtre.${RESET}

INFO

wait "$SERVER_PID"
