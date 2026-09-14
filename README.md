# Kanal Bot

Telegram boti — uchta vazifasi bor:

1. **Kanalga post yuborish** — qo'lda yoki jadval bo'yicha avtomatik
2. **Obunachilarga rassilka** — botga `/start` bosgan odamlarga ommaviy xabar
3. **Avto-javob** — botga savol yozganga tayyor javob qaytaradi

Boshqaruv buyruqlari faqat sizda (admin). Boshqa odamlar botga obuna bo'lib,
xabar olib turadi.

## 1. Bot yaratish

1. Telegramda [@BotFather](https://t.me/BotFather) ga kiring
2. `/newbot` deb yozing
3. Botga nom va username bering (username `_bot` bilan tugashi kerak)
4. BotFather sizga **token** beradi — nusxa oling

## 2. Botni kanalga admin qilish

1. Kanalingizga kiring → **Administrators** → **Add Administrator**
2. Botingizni qidirib toping va qo'shing
3. **Post Messages** ruxsatini yoqing (bu majburiy!)

## 3. O'z ID raqamingizni bilish

Botni ishga tushirgandan keyin unga `/id` deb yozing — u sizning ID raqamingizni aytadi.
Yoki [@userinfobot](https://t.me/userinfobot) ga `/start` yozing.

## 4. Sozlash

`.env.example` faylidan nusxa olib, `.env` deb nomlang:

```bash
copy .env.example .env
```

Keyin `.env` faylini ochib to'ldiring:

```
BOT_TOKEN=BotFather bergan token
CHANNEL_ID=@kanalimning_nomi
ADMIN_IDS=sizning_id_raqamingiz
SCHEDULE_CRON=0 9 * * *
TIMEZONE=Asia/Tashkent
```

**Yopiq kanal bo'lsa**: `CHANNEL_ID` ga `@nom` emas, raqamli ID kerak
(masalan `-1001234567890`). Kanaldan biror postni [@userinfobot](https://t.me/userinfobot)
ga forward qilsangiz, u ID ni aytadi.

## 5. Ishga tushirish

```bash
npm install
npm start
```

Terminalda `Bot ishga tushdi.` chiqsa — tayyor.

## Buyruqlar

### Darhol yuborish
| Buyruq | Vazifasi |
|---|---|
| `/post matn` | Kanalga hoziroq yuboradi |
| Rasm + izohiga `/post` | Rasmni izoh bilan yuboradi |

### Navbat (jadval bo'yicha ketadi)
| Buyruq | Vazifasi |
|---|---|
| `/qosh matn` | Navbat oxiriga qo'shadi |
| Rasm + izohiga `/qosh` | Rasmni navbatga qo'shadi |
| `/navbat` | Navbatdagi postlar ro'yxati |
| `/ochir <id>` | Bitta postni o'chiradi |
| `/tozala` | Butun navbatni tozalaydi |
| `/keyingi` | Navbatdagi birinchisini hoziroq yuboradi |

### Obunachilarga rassilka
| Buyruq | Vazifasi |
|---|---|
| `/rassilka matn` | Barcha faol obunachilarga yuboradi |
| Rasm + izohiga `/rassilka` | Rasmni hammaga yuboradi |
| `/obunachilar` | Statistika: faol, chiqqan, bloklagan |

### Avto-javob
| Buyruq | Vazifasi |
|---|---|
| `/javoblar` | Savol-javoblar ro'yxati |
| `/javob kalitlar \| javob` | Yangi savol-javob qo'shadi |
| `/javobochir <id>` | Bittasini o'chiradi |

### Boshqa
| Buyruq | Vazifasi |
|---|---|
| `/holat` | Bot va jadval haqida ma'lumot |
| `/id` | Telegram ID raqamingiz |
| `/help` | Buyruqlar ro'yxati |

## Avto-javob qanday ishlaydi

Odam botga savol yozsa, bot kalit so'zlarga qarab tayyor javobni topib beradi.

**Misol:**
> Odam: `narxi qancha?`
> Bot: `Kurs narxi: 500 000 so'm`

### Yangi javob qo'shish

```
/javob sertifikat, diplom, guvohnoma | Ha, kurs oxirida sertifikat beriladi.
```

Chap tomonda **kalit so'zlar** (vergul bilan), `|` belgisidan keyin **javob matni**.
Odam shu so'zlardan birini yozsa, javob chiqadi.

**Kalit so'z tanlash maslahati:** so'zning o'zagini yozing. `narx` deb yozsangiz,
`narxi`, `narxlar`, `narxingiz` — hammasi topiladi.

### Javob topilmasa

Bot "Savolingizni oldik, tez orada javob beramiz" deb yozadi va **sizga xabar
yuboradi** — kim nima so'raganini ko'rasiz. Shunda o'zingiz javob berasiz yoki
o'sha savolni `/javob` bilan qo'shib qo'yasiz.

Bu xabarni `.env` dagi `JAVOB_TOPILMADI` orqali o'zgartirsangiz bo'ladi.

### Tayyor javoblarni fayldan tahrirlash

Ko'p javob qo'shmoqchi bo'lsangiz, `data/javoblar.json` faylini to'g'ridan-to'g'ri
tahrirlash osonroq. Keyin botni qayta ishga tushiring.

**Eslatma:** avto-javob faqat botga shaxsiy yozganda ishlaydi — guruhlarda emas.
Sizga (admin) javob bermaydi, chunki siz buyruq berasiz.

## Obunachilar qanday yig'iladi

Odam botga `/start` bossa — ro'yxatga tushadi va rassilka ola boshlaydi.
Boshqa yo'l yo'q: ro'yxatni qo'lda qo'shib bo'lmaydi va bu **atayin shunday**.

Kanal havolasini tarqating (bio, boshqa tarmoqlar, kanal posti) — odamlar o'zi keladi.

### Odamlar qanday chiqib ketadi

| Yo'l | Natija |
|---|---|
| Xabar tagidagi **🔕 Obunani bekor qilish** tugmasi | Darhol chiqadi |
| `/stop` buyrug'i | Darhol chiqadi |
| Botni bloklash | Bot buni sezib, ro'yxatdan avtomatik chiqaradi |

Chiqib ketgan odam `/start` bosib qaytishi mumkin.

## ⚠️ Bot hisobini asrash

Bot ham xuddi oddiy akkaunt kabi **spam uchun cheklanishi yoki o'chirilishi**
mumkin. Bunga yo'l qo'ymaslik uchun:

1. **Faqat `/start` bosganlarga yozing.** Hech qachon tayyor ro'yxat sotib
   olmang va ID larni qo'lda qo'shmang — bu eng tez blokga olib boradigan yo'l.
2. **"Obunani bekor qilish" tugmasini olib tashlamang.** U har rassilkaga
   avtomatik qo'shiladi. Norozi odam shikoyat yozish o'rniga shu tugmani bosadi —
   aynan shu bot hisobingizni asraydi.
3. **Kuniga 1–2 martadan ko'p yozmang.** Tez-tez xabar — shikoyatning asosiy sababi.
4. **Foydali kontent yuboring.** Odam nima uchun obuna bo'lgan bo'lsa, o'shani bering.

Bot Telegram limitlarini o'zi hurmat qiladi: sekundiga 20 ta xabar yuboradi,
limitga urilsa kutib turadi.

## Jadvalni o'zgartirish

`.env` dagi `SCHEDULE_CRON` ni o'zgartiring:

| Qiymat | Ma'nosi |
|---|---|
| `0 9 * * *` | Har kuni soat 09:00 |
| `0 9,21 * * *` | Har kuni 09:00 va 21:00 |
| `0 */3 * * *` | Har 3 soatda |
| `30 8 * * 1` | Har dushanba 08:30 |
| `0 12 * * 1-5` | Dushanba–juma soat 12:00 |

O'zgartirgandan keyin botni qayta ishga tushiring.

## Matnni bezash

Postlarda HTML ishlatsangiz bo'ladi:

```
/post <b>Qalin matn</b> va <i>qiya matn</i>
/post <a href="https://example.com">Havola</a>
```

## Muhim eslatmalar

- **`.env` faylini hech kimga bermang** — tokeningiz o'sha yerda. GitHub ga ham
  yuklamang (`.gitignore` da allaqachon yozilgan).
- Navbat `data/navbat.json`, obunachilar `data/obunachilar.json` da saqlanadi —
  botni qayta ishga tushirsangiz ham yo'qolmaydi. **`data/` papkasini vaqti-vaqti
  bilan nusxalab qo'ying** — obunachilar ro'yxati eng qimmatli narsangiz.
- Jadval bo'yicha post yuborilmasa (masalan internet uzilsa), post navbatga
  qaytariladi va sizga xabar keladi.
- Bot ishlab turishi uchun kompyuter yoqiq bo'lishi kerak. Doimiy ishlashi uchun
  server (VPS) ga qo'ying.
