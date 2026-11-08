#!/usr/bin/env bash
# aortic edu — connect a domain and turn on https (free certificate from let's encrypt)
#   sudo bash setup-domain.sh yourdomain.com you@email.com [--no-www]
set -euo pipefail
DOMAIN="${1:-}"; EMAIL="${2:-}"; WWW=1
[ "${3:-}" = "--no-www" ] && WWW=0
[ -n "$DOMAIN" ] && [ -n "$EMAIL" ] || { echo "usage: sudo bash setup-domain.sh yourdomain.com you@email.com [--no-www]"; exit 1; }
[ "$(id -u)" -eq 0 ] || { echo "please run as root (use sudo)."; exit 1; }

NAMES="$DOMAIN"; ARGS=(-d "$DOMAIN")
if [ "$WWW" -eq 1 ]; then NAMES="$DOMAIN www.$DOMAIN"; ARGS+=(-d "www.$DOMAIN"); fi

CONF=/etc/nginx/sites-available/aortic-edu
sed -i "s|^\(\s*server_name\s\).*;|\1$NAMES;|" "$CONF"
nginx -t && systemctl reload nginx

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y certbot python3-certbot-nginx
certbot --nginx "${ARGS[@]}" --non-interactive --agree-tos -m "$EMAIL" --redirect
echo "done. your site is live at https://$DOMAIN"
