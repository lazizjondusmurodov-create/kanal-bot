import { Markup } from 'telegraf';
import { obunachilar } from './obunachilar.js';

// Telegram sekundiga ~30 xabarga ruxsat beradi. Xavfsiz bo'lish uchun
// sekundiga 20 ta yuboramiz — ya'ni har 50 ms da bitta.
const XABARLAR_ORASI_MS = 50;

// Har bir rassilka xabarining tagida chiqadigan tugma.
// Norozi odam shikoyat yozish o'rniga shu tugmani bosadi — bu bot hisobini asraydi.
export const bekorQilishTugmasi = Markup.inlineKeyboard([
  Markup.button.callback('🔕 Obunani bekor qilish', 'obunani_bekor_qil'),
]);

function kutish(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function bittagaYubor(telegram, id, post) {
  const sozlama = { parse_mode: 'HTML', ...bekorQilishTugmasi };

  if (post.rasm) {
    return telegram.sendPhoto(id, post.rasm, { caption: post.matn || undefined, ...sozlama });
  }
  return telegram.sendMessage(id, post.matn, sozlama);
}

/**
 * Barcha faol obunachilarga xabar yuboradi.
 * @param hisobot — har 25 tadan keyin chaqiriladi, jarayonni ko'rsatish uchun
 */
export async function hammagaYubor(telegram, post, hisobot) {
  const royxat = await obunachilar.faollar();
  const natija = { jami: royxat.length, yuborildi: 0, bloklagan: 0, xato: 0 };

  for (const [indeks, odam] of royxat.entries()) {
    try {
      await bittagaYubor(telegram, odam.id, post);
      natija.yuborildi++;
    } catch (xato) {
      const kod = xato.response?.error_code;
      const sabab = xato.response?.description || '';

      if (kod === 403 || sabab.includes('user is deactivated') || sabab.includes('chat not found')) {
        // Bloklagan yoki hisobini o'chirgan — keyingi rassilkalarda o'tkazib yuboramiz.
        await obunachilar.bloklaganDebBelgila(odam.id);
        natija.bloklagan++;
      } else if (kod === 429) {
        // Telegram "sekinroq" dedi — kutib, shu odamga qayta urinamiz.
        const kutishSoniya = xato.response?.parameters?.retry_after || 5;
        console.warn(`Limit: ${kutishSoniya} soniya kutilmoqda...`);
        await kutish((kutishSoniya + 1) * 1000);
        try {
          await bittagaYubor(telegram, odam.id, post);
          natija.yuborildi++;
        } catch {
          natija.xato++;
        }
      } else {
        console.error(`Xato (id ${odam.id}):`, sabab || xato.message);
        natija.xato++;
      }
    }

    if (hisobot && (indeks + 1) % 25 === 0) {
      await hisobot(indeks + 1, natija.jami);
    }

    await kutish(XABARLAR_ORASI_MS);
  }

  return natija;
}
