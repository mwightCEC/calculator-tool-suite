#!/usr/bin/env bash
#
# One-time setup of an Ubuntu server to host the static export (apps/web/out)
# with nginx and a Let's Encrypt certificate from certbot.
#
# Run on the server, after the domain's DNS A record points at it:
#
#   sudo bash setup-server.sh <domain> <email> [site-dir]
#
#   domain    hostname to serve, e.g. tools.example.com
#   email     address Let's Encrypt uses for expiry and account notices
#   site-dir  where the site's files live (default /var/www/cctv-tools)
#
# Safe to re-run: it rewrites this site's nginx config, then certbot keeps the
# existing certificate until it is due for renewal and puts HTTPS back into the
# config. Other nginx sites on the server are left alone.
#
# Running certbot here accepts the Let's Encrypt Subscriber Agreement
# (https://letsencrypt.org/repository/) for the given email.

set -euo pipefail

SITE_NAME=cctv-tools

usage() {
  echo "Usage: sudo bash $0 <domain> <email> [site-dir]" >&2
  exit 1
}

[[ $# -ge 2 && $# -le 3 ]] || usage
DOMAIN=$1
EMAIL=$2
SITE_DIR=${3:-/var/www/$SITE_NAME}

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo: sudo bash $0 $*" >&2
  exit 1
fi
if [[ ! $DOMAIN =~ ^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
  echo "Not a hostname: $DOMAIN" >&2
  exit 1
fi
if [[ ! $EMAIL =~ ^[^@[:space:]]+@[^@[:space:]]+$ ]]; then
  echo "Not an email address: $EMAIL" >&2
  exit 1
fi

# The user who ran sudo owns the site files, so uploads with rsync need no sudo.
DEPLOY_USER=${SUDO_USER:-root}

echo "==> Installing nginx and certbot"
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

echo "==> Preparing $SITE_DIR (owned by $DEPLOY_USER)"
mkdir -p "$SITE_DIR"
chown "$DEPLOY_USER": "$SITE_DIR"
if [[ -z $(ls -A "$SITE_DIR") ]]; then
  # Placeholder until the first upload, so the certificate check has a page to load.
  echo '<!doctype html><title>CCTV tool suite</title><p>Site coming soon.</p>' \
    > "$SITE_DIR/index.html"
  chown "$DEPLOY_USER": "$SITE_DIR/index.html"
fi

echo "==> Writing nginx config for $DOMAIN"
cat > "/etc/nginx/sites-available/$SITE_NAME" <<EOF
# CCTV tool suite: static export of apps/web. Managed by deploy/setup-server.sh.
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    root $SITE_DIR;
    index index.html;

    # Pages are exported as files like tools/storage.html; serve them at /tools/storage.
    location / {
        try_files \$uri \$uri.html \$uri/index.html =404;
    }

    # Hashed build assets never change, so browsers can cache them for a year.
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check for monitoring; exported as a file without an extension.
    location = /api/health {
        default_type application/json;
    }

    error_page 404 /404.html;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml text/plain;
}
EOF
ln -sf "/etc/nginx/sites-available/$SITE_NAME" "/etc/nginx/sites-enabled/$SITE_NAME"
nginx -t
systemctl enable --now nginx
systemctl reload nginx

if command -v ufw > /dev/null && ufw status | grep -q "Status: active"; then
  echo "==> Opening HTTP and HTTPS in the firewall"
  ufw allow 'Nginx Full'
fi

echo "==> Requesting the HTTPS certificate"
certbot --nginx --non-interactive --agree-tos --email "$EMAIL" \
  --domains "$DOMAIN" --redirect --keep-until-expiring

# The certbot package renews certificates automatically with a systemd timer.
systemctl list-timers certbot.timer --no-pager || true

echo
echo "Done: https://$DOMAIN is served from $SITE_DIR"
echo "Upload a build from your machine with:"
echo "  rsync -avz --delete apps/web/out/ $DEPLOY_USER@$DOMAIN:$SITE_DIR/"
