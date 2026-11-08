#!/usr/bin/env bash
# aortic edu — pull the latest code (if installed from github), rebuild and restart
set -euo pipefail
APP_DIR=/opt/aortic-edu
[ "$(id -u)" -eq 0 ] || { echo "please run as root (use sudo)."; exit 1; }
cd "$APP_DIR"
if [ -d .git ]; then git pull --ff-only; else echo "(no git repository here: using the files already on the server)"; fi
npm install --no-audit --no-fund
npm run build
chown -R www-data:www-data "$APP_DIR"
systemctl restart aortic-edu
systemctl reload nginx
echo "updated."
