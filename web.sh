bash -c 'cat > /tmp/aortic-install.sh <<'"'"'SCRIPT'"'"'
#!/bin/bash
set -e
REPO="https://github.com/baconzoro87-svg/Codex.git"
DIR="/opt/aortic-edu"
LOG="/var/log/aortic-edu-install.log"
P="\033[38;5;141m"
G="\033[38;5;114m"
R="\033[38;5;203m"
N="\033[0m"
step(){ echo -e "\n${P}[ $1/7 ] $2${N}"; }
run(){ if "$@" >>"$LOG" 2>&1; then echo -e "${G}✓ completed${N}"; else echo -e "${R}✗ failed. Check $LOG${N}"; exit 1; fi; }
echo -e "${P}╔════════════════════════════════════╗${N}"
echo -e "${P}       AORTIC EDU INSTALLER         ${N}"
echo -e "${P}╚════════════════════════════════════╝${N}"
: > "$LOG"
step 1 "installing system dependencies"
run apt-get update -y
run apt-get install -y nginx git curl ca-certificates
step 2 "checking node.js"
run bash -c '\''if ! command -v node >/dev/null || [ "$(node -p "process.versions.node.split(\".\")[0]")" -lt 18 ]; then curl -fsSL https://deb.nodesource.com/setup_20.x | bash -s -- && apt-get install -y nodejs; fi'\''
step 3 "downloading aortic edu from github"
run bash -c '\''if [ -d /opt/aortic-edu/.git ]; then git -C /opt/aortic-edu pull --ff-only; else rm -rf /opt/aortic-edu && git clone --depth 1 https://github.com/baconzoro87-svg/Codex.git /opt/aortic-edu; fi'\''
step 4 "installing website dependencies"
run bash -c '\''cd /opt/aortic-edu && npm install --no-audit --no-fund'\''
step 5 "building website"
run bash -c '\''cd /opt/aortic-edu && npm run build && mkdir -p .cache && chown -R www-data:www-data /opt/aortic-edu'\''
step 6 "configuring background service"
run bash -c '\''sed "s|__NODE__|$(command -v node)|" /opt/aortic-edu/deploy/aortic-edu.service > /etc/systemd/system/aortic-edu.service && systemctl daemon-reload && systemctl enable aortic-edu && systemctl restart aortic-edu'\''
step 7 "configuring nginx and port 8080"
run bash -c '\''cp /opt/aortic-edu/deploy/nginx.conf /etc/nginx/sites-available/aortic-edu && sed -i "s/listen 80 default_server;/listen 8080 default_server;/; s/listen \[::\]:80 default_server;/listen [::]:8080 default_server;/" /etc/nginx/sites-available/aortic-edu && ln -sf /etc/nginx/sites-available/aortic-edu /etc/nginx/sites-enabled/aortic-edu && rm -f /etc/nginx/sites-enabled/default && nginx -t && systemctl enable nginx && systemctl reload nginx && (ufw allow 8080/tcp || true)'\''
IP=$(hostname -I | awk '\''{print $1}'\'')
echo -e "\n${G}╔════════════════════════════════════╗"
echo -e "       INSTALLATION COMPLETE"
echo -e "╚════════════════════════════════════╝${N}"
echo -e "${P}website: http://${IP}:8080${N}"
echo -e "${G}visit your domain or IP and verify the latest update.${N}"
echo -e "${P}logs: $LOG${N}"
SCRIPT
bash /tmp/aortic-install.sh'
