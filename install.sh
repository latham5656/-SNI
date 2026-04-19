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

# ── Шаг 6: php-fpm ─────────────────────────────
info "Проверяем PHP-FPM..."
if ! command -v php-fpm* &>/dev/null && ! systemctl list-units --type=service 2>/dev/null | grep -q php; then
  (apt-get install -y -q php-fpm &>/dev/null) &
  spinner $! "Установка php-fpm"
  ok "PHP-FPM установлен"
else
  PHP_VER=$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;' 2>/dev/null)
  ok "PHP-FPM уже установлен: php${PHP_VER}"
fi
echo ""

# ── Шаг 7: nginx.conf ──────────────────────────
info "Настраиваем nginx для PHP..."

# Ищем nginx.conf в известных путях
NGINX_CONF=""
for DIR in /opt/remnanode /opt/remnawave; do
  if [ -f "$DIR/nginx.conf" ]; then
    NGINX_CONF="$DIR/nginx.conf"
    break
  fi
done

PHP_BLOCK='
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_pass unix:/run/php/php-fpm.sock;
    }'

if [ -z "$NGINX_CONF" ]; then
  warn "nginx.conf не найден в /opt/remnanode/ и /opt/remnawave/"
else
  # Проверяем — уже добавлен ли блок
  if grep -q "fastcgi_pass" "$NGINX_CONF"; then
    ok "PHP уже настроен в ${NGINX_CONF}"
  else
    # Определяем сокет php-fpm
    PHP_SOCK=$(ls /run/php/php*-fpm.sock 2>/dev/null | head -1)
    PHP_SOCK="${PHP_SOCK:-/run/php/php-fpm.sock}"
    ok "Сокет php-fpm: ${PHP_SOCK}"

    # Вставляем PHP-блок ВНУТРЬ server-блока с root /var/www/html
    # (перед первой строкой "}" идущей после этой директивы)
    python3 - "$NGINX_CONF" "$PHP_SOCK" << 'PYEOF'
import sys

conf_path = sys.argv[1]
php_sock  = sys.argv[2]

php_block = (
    '    location ~ \\.php$ {\n'
    '        include fastcgi_params;\n'
    '        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;\n'
    f'        fastcgi_pass unix:{php_sock};\n'
    '    }\n'
)

with open(conf_path) as f:
    lines = f.readlines()

target = None
for i, line in enumerate(lines):
    if 'root /var/www/html' in line:
        target = i
        break

if target is not None:
    for i in range(target, len(lines)):
        if lines[i].strip() == '}':
            lines.insert(i, php_block)
            break

with open(conf_path, 'w') as f:
    f.writelines(lines)
PYEOF

    ok "PHP-блок добавлен внутрь server-блока в ${NGINX_CONF}"

    # Перезагружаем через docker compose
    if [ -d "/opt/remnawave" ]; then
      (cd /opt/remnawave && docker compose pull remnanode &>/dev/null && docker compose down remnanode &>/dev/null && docker compose up -d &>/dev/null) &
      spinner $! "Перезапускаем remnanode"
      ok "remnanode перезапущен (/opt/remnawave)"
    elif [ -d "/opt/remnanode" ]; then
      (cd /opt/remnanode && docker compose pull remnanode &>/dev/null && docker compose down remnanode &>/dev/null && docker compose up &>/dev/null) &
      spinner $! "Перезапускаем remnanode"
      ok "remnanode перезапущен (/opt/remnanode)"
    else
      warn "Папка /opt/remnawave и /opt/remnanode не найдены — перезагрузи nginx вручную"
    fi
  fi
fi
echo ""

# ── Финал ──────────────────────────────────────
echo -e "${D}  ══════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${G}★  Установка завершена успешно!${NC}"
echo ""
echo -e "  ${C}►${NC}  Директория: ${W}${TARGET}${NC}"
echo ""
echo -e "${D}  ══════════════════════════════════════════════${NC}"
echo ""
