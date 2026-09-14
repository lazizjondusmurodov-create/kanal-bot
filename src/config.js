import 'dotenv/config';

function talab(nom) {
  const qiymat = process.env[nom];
  if (!qiymat) {
    console.error(`XATO: .env faylida ${nom} ko'rsatilmagan.`);
    console.error(".env.example dan nusxa oling va to'ldiring.");
    process.exit(1);
  }
  return qiymat;
}

export const config = {
  botToken: talab('BOT_TOKEN'),
  // Kanal ixtiyoriy — faqat /post va jadval uchun kerak.
  // Bo'sh bo'lsa bot avto-javob va rassilka bilan ishlayveradi.
  channelId: process.env.CHANNEL_ID || null,
  adminIds: talab('ADMIN_IDS')
    .split(',')
    .map((id) => Number(id.trim()))
    .filter(Boolean),
  scheduleCron: process.env.SCHEDULE_CRON || '0 9 * * *',
  timezone: process.env.TIMEZONE || 'Asia/Tashkent',
  javobTopilmadi:
    process.env.JAVOB_TOPILMADI ||
    "Savolingizni oldik! Tez orada javob beramiz. 🙏",
  geminiApiKey: process.env.GEMINI_API_KEY || null,
};

if (config.adminIds.length === 0) {
  console.error("XATO: ADMIN_IDS bo'sh yoki noto'g'ri formatda.");
  process.exit(1);
}
