#!/usr/bin/env bash
# aortic edu — one-command installer for ubuntu / debian vps (run as root)
#
#   from the project folder:   bash install.sh
#   straight from github:      curl -fsSL https://raw.githubusercontent.com/USER/REPO/main/install.sh | REPO_URL=https://github.com/USER/REPO.git bash
#
# safe to run again: it just rebuilds and restarts everything.
set -euo pipefail

APP_DIR=/opt/aortic-edu
SERVICE=aortic-edu

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die() { printf '\nerror: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "please run as root (put 'sudo' in front of the command)."
command -v apt-get >/dev/null || die "this installer supports ubuntu and debian servers only."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || true)"

say "installing system packages (nginx, git, curl)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx git curl ca-certificates

say "checking node.js (needs version 18 or newer)"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v

say "putting the website files in $APP_DIR"
mkdir -p "$APP_DIR"
if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/package.json" ] && [ -d "$SCRIPT_DIR/server" ]; then
  if [ "$SCRIPT_DIR" != "$APP_DIR" ]; then
    cp -a "$SCRIPT_DIR"/. "$APP_DIR"/
  fi
elif [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
elif [ -n "${REPO_URL:-}" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  die "run this from inside the project folder, or set REPO_URL to your github repository."
fi

say "installing dependencies and building the site (this takes a minute or two)"
cd "$APP_DIR"
npm install --no-audit --no-fund
npm run build
mkdir -p .cache
chown -R www-data:www-data "$APP_DIR"

say "starting the background service"
sed "s|__NODE__|$(command -v node)|" deploy/aortic-edu.service > /etc/systemd/system/$SERVICE.service
systemctl daemon-reload
systemctl enable --now $SERVICE
systemctl restart $SERVICE

say "configuring nginx"
cp deploy/nginx.conf /etc/nginx/sites-available/aortic-edu
ln -sf /etc/nginx/sites-available/aortic-edu /etc/nginx/sites-enabled/aortic-edu
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 'Nginx Full' >/dev/null || true
  ufw allow OpenSSH >/dev/null || true
fi

IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
say "done. open this address in your browser:  http://${IP:-your-server-ip}"
echo "to add a domain and https later:  sudo bash $APP_DIR/setup-domain.sh yourdomain.com you@email.com"
