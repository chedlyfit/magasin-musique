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

echo.
echo  Demarrage du serveur... laisse cette fenetre OUVERTE.
echo.
node server.js
pause
