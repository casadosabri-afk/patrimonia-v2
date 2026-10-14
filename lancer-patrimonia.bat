@echo off
rem ---------------------------------------------------------------------------
rem  PATRIMONIA - lanceur Windows.
rem
rem  Double-cliquez sur ce fichier. Il verifie Node.js, installe les
rem  dependances au premier lancement, compile l'application, demarre le
rem  serveur et ouvre votre navigateur.
rem
rem  Pour arreter : revenez sur cette fenetre et appuyez sur Ctrl+C.
rem ---------------------------------------------------------------------------
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "HELPER=scripts\launcher.mjs"

echo.
echo   PATRIMONIA   La vision intelligente du patrimoine
echo.

rem ------------------------------------------------------------- Node.js ----
where node >nul 2>&1
if errorlevel 1 (
  echo   Node.js est introuvable.
  echo   Installez la version LTS depuis https://nodejs.org puis relancez ce fichier.
  goto :erreur
)

if not exist "%HELPER%" (
  echo   Fichier %HELPER% manquant. Le dossier du projet semble incomplet.
  goto :erreur
)

for /f "delims=" %%v in ('node "%HELPER%" check-node 2^>nul') do set "NODE_VERSION=%%v"
if not defined NODE_VERSION (
  echo   Votre version de Node.js est trop ancienne.
  echo   PATRIMONIA demande la version 20 ou superieure ^(https://nodejs.org^).
  goto :erreur
)
echo   [ok] Node.js !NODE_VERSION! detecte.

rem ---------------------------------------------------------------- Port ----
for /f "delims=" %%p in ('node "%HELPER%" port 2^>nul') do set "PORT=%%p"
if not defined PORT (
  echo   Aucun port libre entre 3000 et 3024.
  echo   Fermez les applications qui les occupent puis reessayez.
  goto :erreur
)
if not "!PORT!"=="3000" echo        Le port 3000 est occupe, PATRIMONIA utilisera le port !PORT!.

set "URL=http://localhost:!PORT!"

rem ----------------------------------------------- Configuration locale ----
for /f "delims=" %%e in ('node "%HELPER%" env !PORT! 2^>nul') do set "ENV_STATE=%%e"
if not defined ENV_STATE (
  echo   Impossible d'ecrire le fichier .env.local.
  echo   Verifiez les droits sur ce dossier.
  goto :erreur
)
if "!ENV_STATE!"=="created" echo   [ok] Premiere configuration : secret de session genere.
if "!ENV_STATE!"=="rebuild" (
  echo        Le port a change : l'application sera recompilee.
  if exist ".next" rmdir /s /q ".next"
)

rem -------------------------------------------------------- Dependances ----
if not exist "node_modules" (
  echo   [..] Installation des dependances ^(une seule fois, comptez une minute^).
  call npm install --no-fund --no-audit
  if errorlevel 1 (
    echo   L'installation des dependances a echoue. Verifiez votre connexion internet.
    goto :erreur
  )
) else (
  echo   [ok] Dependances deja installees.
)

rem --------------------------------------------------------- Compilation ----
if not exist ".next\BUILD_ID" (
  echo   [..] Compilation de l'application ^(une seule fois, comptez une minute^).
  call npm run build
  if errorlevel 1 (
    echo   La compilation a echoue. Transmettez le message ci-dessus pour diagnostic.
    goto :erreur
  )
) else (
  echo   [ok] Application deja compilee.
)

rem ------------------------------------------------------------- Serveur ----
echo   [..] Demarrage du serveur sur !URL!
start "PATRIMONIA - serveur" /min cmd /c "npx next start -p !PORT!"

node "%HELPER%" wait !PORT!
if errorlevel 1 (
  echo   Le serveur n'a pas demarre. Consultez la fenetre "PATRIMONIA - serveur".
  goto :erreur
)

start "" "!URL!"

echo.
echo   PATRIMONIA est en ligne.
echo.
echo   Adresse      !URL!
echo   Si le navigateur ne s'est pas ouvert, copiez cette adresse dedans.
echo.
echo   Comptes de demonstration   ^(mot de passe commun : patrimonia^)
echo.
echo     thomas@horizon.demo         Conseiller
echo     admin@horizon.demo          Administrateur du cabinet
echo     jean.dupont@exemple.demo    Client
echo     advisor@meridien.demo       Conseiller d'un second cabinet
echo.
echo   Les donnees clients sont fictives. Les donnees de marche sont reelles
echo   lorsqu'un fournisseur repond, sinon simulees et signalees DEMO.
echo.
echo   Pour arreter PATRIMONIA : fermez la fenetre "PATRIMONIA - serveur".
echo.
echo   Appuyez sur une touche pour fermer cette fenetre ^(le serveur continue^).
pause >nul
exit /b 0

:erreur
echo.
echo   Appuyez sur une touche pour fermer.
pause >nul
exit /b 1
