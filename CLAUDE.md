# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Bot Haqida (Kanal-Bot)

**Telegram bot** — kanalga post yuborish, obunachilarga rassilka, avto-javoblar, AI bilan matn yaratish (referat, maqola, quiz, tezis), to'lov tizimi, user kabinet.

## Asosiy Komanlar

```bash
npm install          # Dependencies o'rnatish
npm start            # Botni ishga tushirish (production)
npm run dev          # Dev rejimida (--watch bilan)
```

## Arxitektura

**Asosiy fayl:** `src/index.js` — Telegraf bot (barcha handler'lar)

**Modular fayllar:**
- `config.js` — .env dan sozlamalarni o'qish
- `yuborish.js` — Kanalga post yuborish (text + photo)
- `navbat.js` — Postlar navbatini JSON da saqlash
- `javoblar.js` — Avto-javoblar (fuzzy match bilan)
- `obunachilar.js` — Subscribers tracking (faol, chiqib ketgan, bloklagan)
- `rassilka.js` — Bulk messaging (20 msg/sec limit)
- `tolash.js` — To'lov tizimi (Click, Payme integratsiyasi)
- `katalog.js` — Kurslar katalogi
- `cabinet.js` — User profil va statistika
- `features.js` — AI bo'yicha matn yaratish (referat, maqola, quiz, tezis, glossary, va h.k.)
- `ai.js` — Google Gemini API wrapper (kommentlangan, faqat import qilingan)

**Data struktura:** `data/` papkasida JSON fayllar
- `navbat.json` — Post navbati
- `obunachilar.json` — Subscribers
- `javoblar.json` — QA pairs
- `tolash/` — To'lovlar
- `katalog/` — Kurslar
- `cabinet/` — User profillari
- `features/` — User-generated (referat, quiz, taqdimot, va h.k.)

## Konfiguratsiya (.env)

```
BOT_TOKEN=           # @BotFather dan olingan
CHANNEL_ID=          # @username yoki -1001234567890
ADMIN_IDS=           # Comma-separated Telegram IDs
SCHEDULE_CRON=       # Cron format (0 9 * * * = har kuni 9:00)
TIMEZONE=            # Asia/Tashkent
GEMINI_API_KEY=      # Google Gemini (free API)
```

Bot kanal admin bo'lishi **MAJBURIY** — `Post Messages` ruxsati kerak.

## AI Feature'lar (Gemini Pro)

**Hozir kommentlangan, quyidagini uncomment qilish kerak:**

- `ai.js` imported lekin ishlatilmadi
- `features.js` dagi quyidagi funksiyalar AI yoq:
  - `features.refarat.yaratish()` — text yaratadi, AI yoq
  - `features.maqola.yaratish()` — text yaratadi, AI yoq
  - `features.tezis.yaratish()` — text yaratadi, AI yoq
  - `features.quiz.yaratish()` — array yaratadi, AI yoq

**Qo'shish kerak:**
1. `ai.js` yoqish va wrapper funksiyalari yozish
2. Har bir feature'da `generateWithAI()` chaqirish
3. `index.js` dagi handler'larni AI bilan to'liq qilish
4. Pricing qo'shish (har bir feature uchun narx)

## To'lov Tizimi

- Click va Payme test mode ishlamoqda
- `tolash.js` — `/pay`, `/payclick`, `/paypayme` commands
- Status: `kutilmoqda`, `tasdiqlandi`, `bekor`
- Admin: `/tasdiqlash ID` bilan manual confirm qiladi

**Real payment:** API key'larni real qiymatlar bilan o'zgartirib qo'ying.

## Buyruqlar (Admin)

```
/post <matn>           # Darhol kanalga yuborish
/qosh <matn>           # Navbatga qo'shish
/rassilka <matn>       # Barcha obunachilarga
/javob <keys>|<text>   # Avto-javob qo'shish
/navbat                # Queue ko'rish
/obunachilar           # Stats
/holat                 # Bot status
/kurslar               # Katalog
/cabinet               # User kabinet
```

User buttons: `📚 Kurs ishi yaratish`, `🧩 Krosword yaratish`, `📝 Quiz yaratish`, va h.k.

## Muhim Eslatmalar

1. **.env faylini hech kimga bermang** — token bor
2. **Bot admin bo'lishi kerak** — raqat qiladi aks holda
3. **Obunachilarga xabar haddan tashqari yuborma** — spam blokchasiga olib boradi (3-4 xabar/kun tavsiyalangan)
4. **Jadval `.env` da SCHEDULE_CRON orqali sozlanadi**
5. **Navbat va obunachilar `data/` da saqlanadi** — backup qilish kerak
6. **Gemini API** — 100 so'rov/kun free (production uchun yetarli emas)

## Deployment

Bot **24/7 ishlaishi uchun:**
- Render (free tier, sleeping)
- Railway ($7/month)
- VPS O'zbekistan orqali
- Heroku (deprecated)

Hozir **localhost** da ishlamoqda (kompyuter yoqiq bo'lishi kerak).
