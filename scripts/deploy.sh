#!/bin/bash
# Déploiement sur OVH VPS — lab.atelierpnl.eu
set -e

VPS_USER="ubuntu"
VPS_HOST="79.137.14.155"
VPS_PATH="/var/www/pnl-lab"
TMP_PATH="/tmp/pnl-lab-deploy"

echo "🔨 Build du projet..."
npm run build

echo "📤 Upload vers le VPS..."
rsync -avz --delete dist/ "${VPS_USER}@${VPS_HOST}:${TMP_PATH}/"

echo "🚀 Mise en production..."
ssh "${VPS_USER}@${VPS_HOST}" "\
  sudo rm -rf ${VPS_PATH}/* && \
  sudo cp -r ${TMP_PATH}/* ${VPS_PATH}/ && \
  sudo chown -R www-data:www-data ${VPS_PATH} && \
  rm -rf ${TMP_PATH}"

echo ""
echo "✅ Déployé sur https://lab.atelierpnl.eu"
