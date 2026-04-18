#!/bin/bash
set -e

REPO="https://raw.githubusercontent.com/latham5656/-SNI/refs/heads/main/install.sh"
TARGET="/var/www/html"

echo "==> Retro Arcade installer"

# Проверяем git
if ! command -v git &>/dev/null; then
  echo "Устанавливаем git..."
  apt-get update -q && apt-get install -y -q git
fi

# Клонируем или обновляем
if [ -d "$TARGET/.git" ]; then
  echo "==> Обновляем существующую копию..."
  git -C "$TARGET" pull
else
  echo "==> Клонируем репозиторий в $TARGET..."
  git clone "$REPO" "$TARGET"
fi

# Права доступа
chown -R www-data:www-data "$TARGET" 2>/dev/null || true
chmod -R 755 "$TARGET"

echo ""
echo "✓ Готово! Сайт доступен по адресу вашего VPS."
