#!/bin/bash
# Démarrage sur Mac (pour tester). Double-clic.
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
node server.js
