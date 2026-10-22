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
start "" http://127.0.0.1:4173
call npm start
endlocal