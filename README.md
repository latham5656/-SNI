# 🕹️ RETRO ARCADE

> Браузерный аркадный игровой портал в стиле ретро с CRT-эффектами, пиксельной графикой и поддержкой мобильных устройств.

![Platform](https://img.shields.io/badge/platform-web-blue)
![Mobile](https://img.shields.io/badge/mobile-iOS%20%7C%20Android-green)
![PHP](https://img.shields.io/badge/backend-PHP-purple)

---

## 🎮 Игры

| Игра | Сложность | Описание |
|------|-----------|----------|
| 🐍 **Snake** | ●●●○○ | Классическая змейка |
| 🏓 **Pong** | ●●○○○ | Настольный теннис |
| 🧱 **Breakout** | ●●●●○ | Разбивай блоки |
| 👾 **Invaders** | ●●●●● | Отбивай волны пришельцев |

---

## ✨ Возможности

- 👁️ **CRT-эффект** — сканлайны и виньетка как на настоящем аркадном автомате
- 🌟 **Анимированный фон** — звёздное небо на canvas
- 🌍 **Определение IP и геолокации** — страна, город, регион и флаг эмодзи
- 📡 **ISP-детект** — показывает оператора связи посетителя
- 📱 **Полная мобильная адаптация** — iOS Safari, Android Chrome
- 🎮 **Touch D-pad** — кнопки управления для мобильных устройств
- 🏆 **Таблица рекордов** — Hi-score сохраняется в localStorage

---


---

## ⚡ Быстрая установка на VPS

Одной командой — клонирует репозиторий и настраивает права в `/var/www/html/`:

```bash
curl -sL https://raw.githubusercontent.com/latham5656/-SNI/refs/heads/main/install.sh | bash
```

> ⚠️ Запускать от **root** или через **sudo**

---

## 📋 Требования

- 🐧 Linux VPS (Ubuntu / Debian)
- 🌐 Nginx или Apache
- 🐘 PHP 7.4+ (для `geo.php` — определение IP/геолокации)
- 🔀 Git

### Установка PHP + Nginx (если не установлены)

```bash
apt update && apt install -y nginx php php-fpm
```

Для **Nginx** добавь в конфиг обработку PHP:

```nginx
server {
    listen 80;
    root /var/www/html;
    index index.html;

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

---

## 📁 Структура проекта

```
/
├── index.html      # Главная страница
├── style.css       # Стили (CRT, адаптив, touch-controls)
├── app.js          # Логика: игры, IP-детект, touch D-pad
├── geo.php         # Серверный прокси → ipinfo.io
└── install.sh      # Скрипт деплоя на VPS
```

---

## 🔄 Обновление сайта

После пуша изменений в репозиторий — запусти ту же команду на VPS:

```bash
curl -sL https://raw.githubusercontent.com/latham5656/-SNI/refs/heads/main/install.sh | bash
```

---

## 📜 Лицензия

MIT
