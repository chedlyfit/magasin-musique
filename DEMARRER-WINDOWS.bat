@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Musique Magasin

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n'est pas installe. Installe-le ici : https://nodejs.org   ^(version "LTS"^)
  echo Puis relance ce fichier.
  pause
  exit /b
)

echo  Mise a jour de l'application...
curl -fsSL -o index.html.new https://raw.githubusercontent.com/chedlyfit/magasin-musique/main/index.html
if exist index.html.new move /Y index.html.new index.html >nul
curl -fsSL -o server.js.new https://raw.githubusercontent.com/chedlyfit/magasin-musique/main/server.js
if exist server.js.new move /Y server.js.new server.js >nul

if not exist node_modules (
  echo  Installation ^(une seule fois, ~30 sec^)...
  call npm install
)

echo  Demarrage du serveur...
start "Musique Magasin - serveur (NE PAS FERMER)" cmd /c "node server.js"
timeout /t 3 /nobreak >nul

echo  Ouverture de l'application dans le navigateur du PC...
start "" http://localhost:8080

echo.
echo  ==================================================
echo   L'application s'ouvre dans le navigateur du PC.
echo    - Plein ecran : touche  F11
echo    - Pour PARLER : clique le gros bouton rouge et AUTORISE le micro
echo    - Le son sort par l'audio du PC (branche ou Bluetooth vers l'ampli)
echo   Laisse les deux fenetres ouvertes.
echo  ==================================================
echo.
pause
