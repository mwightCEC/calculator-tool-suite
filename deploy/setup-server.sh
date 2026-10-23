#!/usr/bin/env bash
#
# One-time setup of an Ubuntu server to run the Next.js app (standalone server)
# behind nginx, with a Let's Encrypt certificate from certbot.
#
# Copy the whole deploy/ folder to the server, then run as the user who will
# deploy releases, after the domain's DNS A record points at the server:
#
#   sudo bash deploy/setup-server.sh <domain> <email>
#
#   domain  hostname to serve, e.g. tools.example.com
#   email   address Let's Encrypt uses for expiry and account notices
#
# What it sets up:
#   - Node.js (official build, checksum-verified) in /opt, linked into /usr/local/bin
#   - /opt/cctv-tools, owned by the deploying user; releases are built there
#   - cctv-tools.service: runs the app as an unprivileged system user on 127.0.0.1:3000
#   - cctv-tools-release: the server half of deploy/release.sh
#   - a sudo rule letting the deploying user restart that one service, nothing else
#   - an nginx site proxying the domain to the app, then HTTPS via certbot
#
# Safe to re-run: it rewrites its own files, then certbot keeps the existing
# certificate until it is due for renewal and puts HTTPS back into the nginx
# config. Other nginx sites on the server are left alone.
#
# Running certbot here accepts the Let's Encrypt Subscriber Agreement
# (https://letsencrypt.org/repository/) for the given email.

set -euo pipefail

SERVICE=cctv-tools
APP_USER=cctv-tools
BASE_DIR=/opt/cctv-tools
APP_PORT=3000
# Keep in step with the Dockerfile's NODE_VERSION.
NODE_VERSION=22.13.1

usage() {
  echo "Usage: sudo bash $0 <domain> <email>" >&2
  exit 1
}

[[ $# -eq 2 ]] || usage
DOMAIN=$1
EMAIL=$2
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo: sudo bash $0 $*" >&2
  exit 1
fi
DEPLOY_USER=${SUDO_USER:-}
if [[ -z $DEPLOY_USER || $DEPLOY_USER == root ]]; then
  echo "Run with sudo from the account that will deploy releases, not as root." >&2
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
if [[ ! -f $SCRIPT_DIR/server-release.sh ]]; then
  echo "server-release.sh not found next to this script; copy the whole deploy/ folder." >&2
  exit 1
fi

echo "==> Installing nginx, certbot and tools"
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx curl xz-utils

install_node() {
  local arch
  case $(uname -m) in
    x86_64) arch=x64 ;;
    aarch64) arch=arm64 ;;
    *)
      echo "Unsupported CPU architecture: $(uname -m)" >&2
      exit 1
      ;;
  esac
  local name="node-v$NODE_VERSION-linux-$arch"
  local tmp
  tmp=$(mktemp -d)
  echo "==> Installing Node.js $NODE_VERSION ($arch)"
  curl -fsSL -o "$tmp/$name.tar.xz" "https://nodejs.org/dist/v$NODE_VERSION/$name.tar.xz"
  curl -fsSL -o "$tmp/SHASUMS256.txt" "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt"
  (cd "$tmp" && grep " $name.tar.xz\$" SHASUMS256.txt | sha256sum -c -)
  tar -xJf "$tmp/$name.tar.xz" -C /opt
  rm -rf "$tmp"
  for bin in node npm npx; do
    ln -sf "/opt/$name/bin/$bin" "/usr/local/bin/$bin"
  done
}

if [[ $(/usr/local/bin/node --version 2> /dev/null) == "v$NODE_VERSION" ]]; then
  echo "==> Node.js $NODE_VERSION already installed"
else
  install_node
fi

echo "==> Creating the $APP_USER user and $BASE_DIR"
if ! id "$APP_USER" > /dev/null 2>&1; then
  useradd --system --no-create-home --shell /usr/sbin/nologin "$APP_USER"
fi
mkdir -p "$BASE_DIR"
chown "$DEPLOY_USER": "$BASE_DIR"

echo "==> Installing the release command and its restart permission"
install -m 755 "$SCRIPT_DIR/server-release.sh" /usr/local/bin/cctv-tools-release
SUDOERS_FILE=/etc/sudoers.d/$SERVICE
echo "$DEPLOY_USER ALL=(root) NOPASSWD: /usr/bin/systemctl restart $SERVICE" > "$SUDOERS_FILE.tmp"
chmod 440 "$SUDOERS_FILE.tmp"
visudo -cf "$SUDOERS_FILE.tmp"
mv "$SUDOERS_FILE.tmp" "$SUDOERS_FILE"

echo "==> Writing $SERVICE.service"
cat > "/etc/systemd/system/$SERVICE.service" <<EOF
# Clinton Tool Suite (Next.js standalone server). Managed by deploy/setup-server.sh.
[Unit]
Description=Clinton Tool Suite
After=network.target

[Service]
User=$APP_USER
WorkingDirectory=$BASE_DIR/app
ExecStart=/usr/local/bin/node apps/web/server.js
Environment=NODE_ENV=production
Environment=NEXT_TELEMETRY_DISABLED=1
# Only nginx on this machine can reach the app.
Environment=HOSTNAME=127.0.0.1
Environment=PORT=$APP_PORT
Restart=always
RestartSec=2
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable "$SERVICE"
# Started by the first release; until then nginx answers 502 Bad Gateway.
if [[ -f $BASE_DIR/app/apps/web/server.js ]]; then
  systemctl restart "$SERVICE"
fi

echo "==> Writing nginx config for $DOMAIN"
cat > "/etc/nginx/sites-available/$SERVICE" <<EOF
# Clinton Tool Suite: proxy to the Next.js server. Managed by deploy/setup-server.sh.
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # The app doesn't use next/image, so keep the image optimizer unreachable.
    location /_next/image {
        return 404;
    }

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    gzip on;
    gzip_proxied any;
    gzip_types text/css application/javascript application/json image/svg+xml text/plain;
}
EOF
ln -sf "/etc/nginx/sites-available/$SERVICE" "/etc/nginx/sites-enabled/$SERVICE"
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
echo "Done. Deploy the first release from your machine (repo root):"
echo "  DEPLOY_HOST=$DEPLOY_USER@$DOMAIN npm run deploy"
