#!/bin/bash

REPO="https://github.com/latham5656/-SNI.git"
TARGET="/var/www/html"
TMP="/tmp/retro-arcade-deploy"

# ── Цвета ──────────────────────────────────────
R='\033[0;31m'   # red
G='\033[0;32m'   # green
C='\033[0;36m'   # cyan
Y='\033[0;33m'   # yellow
M='\033[0;35m'   # magenta
W='\033[1;37m'   # white bold
D='\033[2m'      # dim
NC='\033[0m'     # reset

# ── Хелперы ────────────────────────────────────
ok()   { echo -e "  ${G}✔${NC}  $1"; }
info() { echo -e "  ${C}▶${NC}  $1"; }
warn() { echo -e "  ${Y}!${NC}  $1"; }
fail() { echo -e "  ${R}✖${NC}  $1"; exit 1; }

spinner() {
  local pid=$1 msg=$2
  local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  local i=0
  while kill -0 "$pid" 2>/dev/null; do
    printf "\r  ${C}${frames[$i]}${NC}  ${D}%s${NC}" "$msg"
    i=$(( (i+1) % ${#frames[@]} ))
    sleep 0.1
  done
  printf "\r\033[K"
}

# ── Шапка ──────────────────────────────────────
clear
echo ""
echo -e "${M}  ██████╗ ███████╗████████╗██████╗  ██████╗ ${NC}"
echo -e "${C}  ██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗${NC}"
echo -e "${G}  ██████╔╝█████╗     ██║   ██████╔╝██║   ██║${NC}"
echo -e "${Y}  ██╔══██╗██╔══╝     ██║   ██╔══██╗██║   ██║${NC}"
echo -e "${R}  ██║  ██║███████╗   ██║   ██║  ██║╚██████╔╝${NC}"
echo -e "${D}  ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ${NC}"
echo ""
echo -e "${W}        ◄  A R C A D E   I N S T A L L E R  ►${NC}"
echo -e "${D}  ══════════════════════════════════════════════${NC}"
echo ""
sleep 0.5

# ── Шаг 1: git ─────────────────────────────────
info "Проверяем зависимости..."
if ! command -v git &>/dev/null; then
  warn "Git не найден — устанавливаем..."
  (apt-get update -q && apt-get install -y -q git) &
  spinner $! "Установка git"
  ok "Git установлен"
else
  ok "Git найден: $(git --version)"
fi
echo ""

# ── Шаг 2: клонируем ───────────────────────────
info "Загружаем репозиторий..."
rm -rf "$TMP"
(git clone "$REPO" "$TMP" &>/dev/null) &
spinner $! "Клонирование с GitHub"
if [ ! -d "$TMP" ]; then
  fail "Не удалось клонировать репозиторий"
fi
ok "Репозиторий загружен"
echo ""

# ── Шаг 3: копируем файлы ──────────────────────
info "Устанавливаем файлы в ${TARGET}..."
sleep 0.3

FILES=("index.html" "style.css" "app.js" "geo.php")
for f in "${FILES[@]}"; do
  if [ -f "$TMP/$f" ]; then
    cp "$TMP/$f" "$TARGET/"
    ok "${f}"
    sleep 0.15
  else
    warn "Файл не найден: ${f}"
  fi
done
echo ""

# ── Шаг 4: права ───────────────────────────────
info "Настраиваем права доступа..."
chown -R www-data:www-data "$TARGET" 2>/dev/null || true
chmod -R 755 "$TARGET"
ok "Права установлены"
echo ""

# ── Шаг 5: чистим temp ─────────────────────────
rm -rf "$TMP"

# ── Определяем домен / IP ──────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}')
# Домен можно передать аргументом: bash install.sh mydomain.com
DISPLAY_URL="${1:-$SERVER_IP}"

# ── Финал ──────────────────────────────────────
echo -e "${D}  ══════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${G}★  Установка завершена успешно!${NC}"
echo ""
echo -e "  ${C}►${NC}  Сайт:       ${W}http://${DISPLAY_URL}${NC}"
echo -e "  ${C}►${NC}  IP:         ${D}${SERVER_IP}${NC}"
echo -e "  ${C}►${NC}  Директория: ${W}${TARGET}${NC}"
echo ""
echo -e "${D}  ══════════════════════════════════════════════${NC}"
echo ""
