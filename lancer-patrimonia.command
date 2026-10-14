#!/usr/bin/env bash
# PATRIMONIA — lanceur macOS.
#
# macOS n'ouvre au double-clic que les fichiers portant l'extension .command.
# Ce relais appelle le lanceur commun afin qu'il n'existe qu'une seule logique
# à maintenir.
cd "$(dirname "${BASH_SOURCE[0]}")" || exit 1
exec ./lancer-patrimonia.sh "$@"
