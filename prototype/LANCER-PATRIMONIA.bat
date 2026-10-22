@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 ou plus recent est necessaire pour lancer PATRIMONIA ERP.
  echo Installe-le depuis https://nodejs.org puis relance ce fichier.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Installation des composants necessaires...
  call npm install
  if errorlevel 1 (
    echo L'installation a echoue. Verifie ta connexion internet puis reessaie.
    pause
    exit /b 1
  )
)
start "PATRIMONIA ERP - serveur local" cmd /c "npm start"
for /l %%i in (1,1,20) do (
  powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4173/api/health -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
  if not errorlevel 1 goto ready
  timeout /t 1 /nobreak >nul
)
echo Le serveur n'a pas demarre. Verifie Node.js et les messages de la fenetre du serveur.
pause
exit /b 1
:ready
start "" http://127.0.0.1:4173
echo PATRIMONIA est ouvert dans le navigateur.
echo Pour arreter l'application, ferme la fenetre reduite "PATRIMONIA ERP - serveur local".
endlocal