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

echo "==> Очищаем $TARGET..."
rm -rf "$TARGET"
mkdir -p "$TARGET"

echo "==> Клонируем репозиторий..."
git clone "$REPO" "$TARGET"

# Права доступа
chown -R www-data:www-data "$TARGET" 2>/dev/null || true
chmod -R 755 "$TARGET"

echo ""
echo "✓ Готово! Сайт обновлён."
