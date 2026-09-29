#!/bin/sh
set -e

# Aplica migrations pendentes antes de subir. Desligue com
# MIGRATE_ON_START=false quando rodar migrations por fora.
if [ "$MIGRATE_ON_START" != "false" ]; then
  echo "Aplicando migrations..."
  (cd /migrate && node node_modules/prisma/build/index.js migrate deploy)
fi

exec "$@"
