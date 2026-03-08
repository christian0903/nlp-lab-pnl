#!/bin/bash
# Script de build + zip pour déploiement o2switch
set -e

echo "🔨 Build du projet..."
npm run build

echo "📦 Création du zip..."
cd dist
zip -r ../deploy-o2switch.zip . -x "*.DS_Store"
cd ..

echo ""
echo "✅ Fichier prêt : deploy-o2switch.zip"
echo "📤 Uploadez son contenu dans public_html/ sur o2switch (cPanel > Gestionnaire de fichiers)"
