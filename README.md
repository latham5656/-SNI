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

## ⚡ Быстрая установка на VPS

```bash
curl -sL https://raw.githubusercontent.com/latham5656/-SNI/refs/heads/main/install.sh | bash
```

> ⚠️ Запускать от **root** или через **sudo**

### Что делает скрипт автоматически:

- 📦 Устанавливает **git** и **php-fpm** если не установлены
- 📁 Копирует файлы сайта в `/var/www/html/`
- ⚙️ Добавляет PHP-блок в **nginx.conf** (ищет `/opt/remnawave/` или `/opt/remnanode/`)
- 🔄 Перезапускает **remnanode** через `docker compose`
- 🔒 Выставляет корректные права доступа

---

## 📋 Требования

- 🐧 Linux VPS (Ubuntu / Debian)
- 🌐 Nginx (в docker compose — `/opt/remnawave/` или `/opt/remnanode/`)
- 🐳 Docker + Docker Compose
- 🔀 Git

---

## 🔄 Обновление сайта

После пуша изменений запусти на VPS (без кэша GitHub):

```bash
cd /tmp && rm -rf _test && git clone https://github.com/latham5656/-SNI.git _test && bash /tmp/_test/install.sh
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

## 📜 Лицензия

MIT
