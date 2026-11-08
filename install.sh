#!/usr/bin/env bash
# Aortic Edu main installer — Debian/Ubuntu, Nginx on port 8080
set -Eeuo pipefail

APP_DIR="/opt/aortic-edu"
SERVICE="aortic-edu"
PORT=8080
REPO_URL="https://github.com/baconzoro87-svg/Codex.git"
BACKUP="/root/aortic-edu-backup-$(date +%Y%m%d-%H%M%S)"

say(){ printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die(){ echo "ERROR: $*" >&2; exit 1; }
success(){
  echo
  echo "=============================================="
  echo "                 AORTIC EDU                   "
  echo "=============================================="
  echo "             DONE BY AZMAL"
  echo "          PROBLEM SOLVED BY AZMAL"
  echo
}

[[ $EUID -eq 0 ]] || die "Run as root: sudo -i"
[[ -r /etc/os-release ]] || die "Cannot detect OS."
. /etc/os-release
echo "Detected OS: ${PRETTY_NAME:-unknown}"
case "${ID:-}" in debian|ubuntu) ;; *) die "Supports Debian/Ubuntu only." ;; esac

echo "This installer will replace the current website serving port 8080."
echo "It will back up current Nginx configuration and /opt/aortic-edu."
read -r -p "Continue? [y/N] " ans
[[ "$ans" =~ ^[Yy]$ ]] || exit 0

export DEBIAN_FRONTEND=noninteractive
say "Installing system packages"
apt-get update
apt-get install -y nginx git curl ca-certificates psmisc

# Install supported Node.js if absent/old
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  say "Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

say "Backing up current configuration"
mkdir -p "$BACKUP"
cp -a /etc/nginx/sites-available "$BACKUP/" 2>/dev/null || true
cp -a /etc/nginx/sites-enabled "$BACKUP/" 2>/dev/null || true
cp -a /etc/nginx/nginx.conf "$BACKUP/" 2>/dev/null || true
if [[ -d "$APP_DIR" ]]; then cp -a "$APP_DIR" "$BACKUP/previous-app"; fi
echo "Backup saved: $BACKUP"

say "Stopping current Nginx and any Docker container publishing port 8080"
systemctl stop nginx 2>/dev/null || true
if command -v docker >/dev/null 2>&1; then
  while read -r cid; do
    [[ -n "$cid" ]] || continue
    docker port "$cid" 2>/dev/null | grep -qE '(^|:)8080$' && {
      echo "Stopping Docker container using port 8080: $cid"
      docker stop "$cid" || true
    }
  done < <(docker ps -q)
fi

say "Stopping remaining process(es) listening on port 8080"
fuser -k -TERM 8080/tcp 2>/dev/null || true
sleep 2
fuser -k -KILL 8080/tcp 2>/dev/null || true

say "Cloning Aortic Edu source"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
git clone --depth 1 "$REPO_URL" "$TMP/repo" || die "Git clone failed."
[[ -f "$TMP/repo/package.json" && -f "$TMP/repo/server/index.js" ]] || die "Repository files missing."

say "Deploying project to $APP_DIR"
mkdir -p "$APP_DIR"
# Replace app contents while preserving the backup above
find "$APP_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
cp -a "$TMP/repo/." "$APP_DIR/"

say "Building website"
cd "$APP_DIR"
npm install --no-audit --no-fund
npm run build
mkdir -p .cache
chown -R www-data:www-data "$APP_DIR"

say "Writing backend systemd service"
sed "s|__NODE__|$(command -v node)|" "$APP_DIR/deploy/aortic-edu.service" > "/etc/systemd/system/${SERVICE}.service"
systemctl daemon-reload
systemctl enable "$SERVICE"

say "Configuring Nginx to listen on 8080"
sed \
  -e 's/listen 80 default_server;/listen 8080 default_server;/' \
  -e 's/listen \[::\]:80 default_server;/listen [::]:8080 default_server;/' \
  "$APP_DIR/deploy/nginx.conf" > /etc/nginx/sites-available/aortic-edu

# Backups were made; disable conflicting enabled sites so Aortic Edu is the sole default site.
for site in /etc/nginx/sites-enabled/*; do
  [[ -e "$site" ]] || continue
  [[ "$(basename "$site")" == "aortic-edu" ]] && continue
  rm -f "$site"
done
ln -sf /etc/nginx/sites-available/aortic-edu /etc/nginx/sites-enabled/aortic-edu

nginx -t || die "Nginx configuration test failed."
systemctl enable nginx
systemctl restart "$SERVICE"
systemctl restart nginx

say "Verifying service and port"
systemctl is-active --quiet "$SERVICE" || {
  journalctl -u "$SERVICE" -n 60 --no-pager || true
  die "Backend service failed."
}
curl -fsS --max-time 10 "http://127.0.0.1:${PORT}/" >/dev/null || {
  echo "Nginx/backend logs:"
  journalctl -u nginx -u "$SERVICE" -n 60 --no-pager || true
  die "Aortic Edu did not respond on port ${PORT}."
}

IP="$(hostname -I | awk '{print $1}')"
success
echo "Website: http://${IP:-YOUR_PUBLIC_IP}:${PORT}"
echo "Backup: $BACKUP"
echo "If it doesn't open externally, confirm AWS Security Group inbound TCP 8080."
