#!/usr/bin/env bash
# Instala o Ser em um servidor Ubuntu/Debian (Google Cloud, Oracle ou outro).
# Uso (troque os valores):
#   REPO=https://github.com/USUARIO/SERAPK.git DOMINIO=nome.duckdns.org DUCK_TOKEN=seu-token bash instalar-servidor.sh
# Pode rodar de novo para atualizar o app.
set -euo pipefail
: "${REPO:?Defina REPO}"; : "${DOMINIO:?Defina DOMINIO}"; : "${DUCK_TOKEN:?Defina DUCK_TOKEN}"
APP_USER="$(whoami)"; APP_DIR="$HOME/ser"; DATA="$HOME/ser-dados"
SUB="${DOMINIO%.duckdns.org}"

echo ">> Instalando programas..."
sudo apt-get update -y
sudo apt-get install -y git build-essential python3 curl gpg openssl debian-keyring debian-archive-keyring apt-transport-https

# Memória extra (1 GB de RAM é pouco para instalar as dependências)
if ! swapon --show | grep -q .; then
  sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo apt-get update -y && sudo apt-get install -y caddy
fi

echo ">> Baixando o Ser..."
if [ -d "$APP_DIR/.git" ]; then git -C "$APP_DIR" pull; else git clone "$REPO" "$APP_DIR"; fi
cd "$APP_DIR" && npm install --omit=dev
mkdir -p "$DATA"

if [ ! -f /etc/ser.env ]; then
  sudo tee /etc/ser.env >/dev/null <<EOF
PORT=3000
TZ=America/Sao_Paulo
APP_SECRET=$(openssl rand -hex 32)
BRIDGE_KEY=$(openssl rand -hex 16)
DATA_DIR=$DATA
DEV_LOGIN=true
WA_TOKEN=
WA_PHONE_ID=
EOF
  sudo chmod 600 /etc/ser.env
fi

echo ">> Configurando o serviço..."
sudo tee /etc/systemd/system/ser.service >/dev/null <<EOF
[Unit]
Description=Ser
After=network.target
[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=/etc/ser.env
ExecStart=$(command -v node) server.js
Restart=always
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable ser
sudo systemctl restart ser

sudo tee /etc/caddy/Caddyfile >/dev/null <<EOF
$DOMINIO {
  reverse_proxy localhost:3000
}
EOF
sudo systemctl restart caddy

# Mantém o endereço apontando para o IP do servidor (o IP grátis pode mudar se a máquina reiniciar)
mkdir -p "$HOME/duckdns"
cat > "$HOME/duckdns/duck.sh" <<EOF
#!/bin/sh
curl -s "https://www.duckdns.org/update?domains=$SUB&token=$DUCK_TOKEN&ip=" -o "$HOME/duckdns/duck.log"
EOF
chmod 700 "$HOME/duckdns/duck.sh"
( crontab -l 2>/dev/null | grep -v duck.sh || true; echo "*/5 * * * * $HOME/duckdns/duck.sh >/dev/null 2>&1" ) | crontab -
"$HOME/duckdns/duck.sh" || true

echo
echo "Pronto! Abra: https://$DOMINIO"
echo "(o certificado HTTPS pode levar 1 a 2 minutos para aparecer na primeira vez)"
echo "Para ver erros: sudo journalctl -u ser -n 50 --no-pager"
