#!/bin/bash
set -e

REPO="https://github.com/latham5656/-SNI.git"
TARGET="/var/www/html"
TMP="/tmp/retro-arcade-deploy"

echo "==> Retro Arcade installer"

# Проверяем git
if ! command -v git &>/dev/null; then
  echo "Устанавливаем git..."
  apt-get update -q && apt-get install -y -q git
fi

# Клонируем в /tmp
echo "==> Скачиваем файлы..."
rm -rf "$TMP"
git clone "$REPO" "$TMP"

# Копируем только нужные файлы
echo "==> Копируем файлы в $TARGET..."
cp "$TMP/index.html" "$TARGET/"
cp "$TMP/style.css"  "$TARGET/"
cp "$TMP/app.js"     "$TARGET/"
cp "$TMP/geo.php"    "$TARGET/"

# Убираем временную папку
rm -rf "$TMP"

# Права доступа
chown -R www-data:www-data "$TARGET" 2>/dev/null || true
chmod -R 755 "$TARGET"

echo ""
echo "✓ Готово! Сайт обновлён."
