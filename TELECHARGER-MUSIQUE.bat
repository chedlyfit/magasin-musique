@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Telecharger la musique
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n'est pas installe. Installe-le : https://nodejs.org  puis relance.
  pause
  exit /b
)
node telecharger-musique.js
echo.
pause
