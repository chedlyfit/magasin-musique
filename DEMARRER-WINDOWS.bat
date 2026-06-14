@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Musique Magasin

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js n'est pas installe sur ce PC.
  echo  Installe-le ici :  https://nodejs.org   ^(version "LTS"^)
  echo  Puis relance ce fichier.
  echo.
  pause
  exit /b
)

if not exist node_modules (
  echo  Installation ^(une seule fois, ca prend ~30 sec^)...
  call npm install
)

echo.
echo  Demarrage du serveur... laisse cette fenetre OUVERTE.
echo.
node server.js
pause
