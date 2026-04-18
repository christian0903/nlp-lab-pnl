#!/bin/bash
# Déploiement sur OVH VPS — lab.atelierpnl.eu
set -e

VPS_USER="ubuntu"
VPS_HOST="79.137.14.155"
VPS_PATH="/var/www/nlp-lab-pnl"
TMP_PATH="/tmp/nlp-lab-pnl-deploy"

echo "🔨 Build du projet..."
npm run build

echo "📤 Upload vers le VPS..."
rsync -avz --delete dist/ "${VPS_USER}@${VPS_HOST}:${TMP_PATH}/"

echo "🚀 Mise en production..."
ssh "${VPS_USER}@${VPS_HOST}" "\
  sudo find ${VPS_PATH} -mindepth 1 -not -path '${VPS_PATH}/.git*' -not -path '${VPS_PATH}/.env*' -delete && \
  sudo cp -r ${TMP_PATH}/* ${TMP_PATH}/.htaccess ${VPS_PATH}/ && \
  sudo chown -R www-data:www-data ${VPS_PATH} && \
  rm -rf ${TMP_PATH}"

echo ""
echo "✅ Déployé sur https://lab.atelierpnl.eu"
