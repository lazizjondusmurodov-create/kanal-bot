import { Telegraf } from 'telegraf';
import express from 'express';
import cron from 'node-cron';
import { config } from './config.js';
import { javoblar, javobTop } from './javoblar.js';
import { navbat } from './navbat.js';
import { obunachilar } from './obunachilar.js';
import { hammagaYubor } from './rassilka.js';
import { kanalgaYubor } from './yuborish.js';
import * as features from './features.js';
import { tolash, tolovLinki, tolovUsullari } from './tolash.js';
import { userCabinet, cabinetLink } from './cabinet.js';
import { katalog, defaultKurslarQosh } from './katalog.js';
import { ai } from './ai.js';
import { pricing, getNarxText } from './pricing.js';

const bot = new Telegraf(config.botToken);
const app = express();
const PORT = process.env.PORT || 3000;
const adminmi = (ctx) => config.adminIds.includes(ctx.from?.id);
const userSessions = new Map();

// Default kurslarni qo'shish
defaultKurslarQosh().catch(e => console.error('Kurslar qo\'shishda xato:', e));

// --- Hamma uchun ochiq buyruqlar ---
bot.start(async (ctx) => {
  const menuButtons = {
    reply_markup: {
      keyboard: [
        [{ text: '📚 Kurs ishi yaratish' }, { text: '🧩 Krosword yaratish' }],
        [{ text: '📝 Quiz/Test yaratish' }, { text: '🆕 Taqdimot yaratish' }],
        [{ text: '🎯 SlidePro — onlayn taqdimot' }, { text: '📁 Mening fayllarim' }],
        [{ text: '📄 Mustaqil ish yaratish' }, { text: '📚 Referat yaratish' }],
        [{ text: '✏️ Tezis yaratish' }, { text: '✅ Maqola yaratish' }],
        [{ text: '🔑 Keys' }, { text: '📝 Rezyume yaratish' }],
        [{ text: '💻 Texnologik xarita' }, { text: '📖 Glossary' }],
        [{ text: '📊 Dashbort' }, { text: '📋 Navbat' }],
        [{ text: '💬 Avto-javoblar' }, { text: '⚙️ Bot sozlash' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };

  if (adminmi(ctx)) {
    return ctx.replyWithHTML('👋 <b>Admin Paneli</b>\n\nTugmalarni bosing!', menuButtons);
  }

  const { qaytdi } = await obunachilar.qoshYokiYangila({
    id: ctx.from.id,
    ism: [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' '),
    username: ctx.from.username || null,
  });

  await ctx.replyWithHTML(
    qaytdi
      ? '✅ Qaytganingizdan xursandmiz! Endi yangiliklar sizga yetib boradi.'
      : `<b>Assalomu alaykum!</b>\n\nObuna bo'ldingiz — yangiliklar shu yerga keladi.\n\n` +
          `Istalgan payt <b>/stop</b> yozib yoki xabar tagidagi tugmani bosib chiqib ketishingiz mumkin.`,
    menuButtons
  );
});

// /stop — chiqib ketish
bot.command('stop', async (ctx) => {
  if (adminmi(ctx)) return;
  await obunachilar.obunaniBekorQil(ctx.from.id);
  await ctx.reply("🔕 Obuna bekor qilindi.");
});

bot.action('obunani_bekor_qil', async (ctx) => {
  await obunachilar.obunaniBekorQil(ctx.from.id);
  await ctx.answerCbQuery('Obuna bekor qilindi');
  await ctx.reply("🔕 Obuna bekor qilindi.");
});

bot.command('id', (ctx) => ctx.reply(`Sizning ID: ${ctx.from.id}`));

// --- Avto-javob (oddiy foydalanuvchilar) ---
bot.on('text', async (ctx, next) => {
  if (adminmi(ctx)) return next();
  if (ctx.message.text.startsWith('/')) return;
  if (ctx.chat.type !== 'private') return;

  const royxat = await javoblar.royxat();
  const topildi = javobTop(royxat, ctx.message.text);

  if (topildi) {
    return ctx.replyWithHTML(topildi.javob);
  }

  await ctx.reply(config.javobTopilmadi);

  const kim = ctx.from.username
    ? `@${ctx.from.username}`
    : `${ctx.from.first_name || 'Nomalum'} (id: ${ctx.from.id})`;

  for (const adminId of config.adminIds) {
    await ctx.telegram
      .sendMessage(adminId, `💬 <b>${kim}</b> savol berdi:\n\n${ctx.message.text}`, {
        parse_mode: 'HTML',
      })
      .catch(() => {});
  }
});

// --- Bundan keyingi hamma buyruq faqat adminlar uchun ---
bot.use(async (ctx, next) => {
  if (!adminmi(ctx)) return;
  return next();
});

// --- Yordam ---
const ADMIN_YORDAM = `<b>Bot buyruqlari</b>

/post &lt;matn&gt; — kanalga hoziroq yuboradi
/qosh &lt;matn&gt; — navbat oxiriga qo'shadi
/navbat — navbatdagi postlar ro'yxati
/rassilka &lt;matn&gt; — obunachilarga yuboradi
/javoblar — savol-javoblar ro'yxati
/javob &lt;kalitlar&gt; | &lt;javob&gt; — yangi qo'shadi
/holat — bot va jadval haqida ma'lumot
/id — Telegram ID raqamingiz`;

bot.help((ctx) => ctx.replyWithHTML(ADMIN_YORDAM));

// --- Kurs Ishi Yaratish ---
bot.hears('📚 Kurs ishi yaratish', async (ctx) => {
  userSessions.set(ctx.from.id, { mode: 'kurs_title' });
  await ctx.reply('📚 Kurs ishining sarlavhasini yozing:');
});

// --- Krosword Yaratish ---
bot.hears('🧩 Krosword yaratish', async (ctx) => {
  userSessions.set(ctx.from.id, { mode: 'krosword_savol' });
  await ctx.reply('🧩 Krosword savollari (vergul bilan ajrating):');
});

// --- Quiz Yaratish ---
bot.hears('📝 Quiz/Test yaratish', async (ctx) => {
  userSessions.set(ctx.from.id, { mode: 'quiz_title' });
  await ctx.reply('📝 Quiz sarlavhasini yozing:');
});

// --- Taqdimot Yaratish ---
bot.hears('🆕 Taqdimot yaratish', async (ctx) => {
  userSessions.set(ctx.from.id, { mode: 'taqdimot_title' });
  await ctx.reply('🆕 Taqdimotning sarlavhasini yozing:');
});

// --- SlidePro ---
bot.hears('🎯 SlidePro — onlayn taqdimot', async (ctx) => {
  userSessions.set(ctx.from.id, { mode: 'slidepro_title' });
  await ctx.reply('🎯 SlidePro taqdimot sarlavhasini yozing:');
});

// --- Mening fayllarim ---
bot.hears('📁 Mening fayllarim', async (ctx) => {
  const fayllar = await features.menyingFayllarim.oqish();
  if (fayllar.length === 0) {
    return ctx.reply('📁 Fayllar yo\'q');
  }
  let text = `📁 <b>Mening fayllarim (${fayllar.length} ta)</b>\n\n`;
  fayllar.forEach((f, i) => {
    text += `${i + 1}. ${f.fayl}\n`;
  });
  await ctx.replyWithHTML(text);
});

// --- Mustaqil Ish Yaratish ---
bot.hears('📄 Mustaqil ish yaratish', async (ctx) => {
  userSessions.set(ctx.from.id, { mode: 'mustaqil_mavzu' });
  await ctx.reply('📄 Mustaqil ish mavzusini yozing:');
});

// --- Referat Yaratish ---
bot.hears('📚 Referat yaratish', async (ctx) => {
  await ctx.replyWithHTML(
    `📚 <b>Referat yaratish</b>\n\n` +
    `${getNarxText('referat')}\n\n` +
    `Mavzuni yozing. AI Uzbek tilida xulosa va mundarija tuzadi.\n\n` +
    `<code>/referat Informatika tarixi</code>`
  );
  userSessions.set(ctx.from.id, { mode: 'refarat_mavzu' });
});

// --- Tezis Yaratish ---
bot.hears('✏️ Tezis yaratish', async (ctx) => {
  userSessions.set(ctx.from.id, { mode: 'tezis_sarlavha' });
  await ctx.reply('✏️ Tezis sarlavhasini yozing:');
});

// --- Maqola Yaratish ---
bot.hears('✅ Maqola yaratish', async (ctx) => {
  userSessions.set(ctx.from.id, { mode: 'maqola_sarlavha' });
  await ctx.reply('✅ Maqola sarlavhasini yozing:');
});

// --- Keys ---
bot.hears('🔑 Keys', async (ctx) => {
  userSessions.set(ctx.from.id, { mode: 'keys_qo' });
  await ctx.reply('🔑 Keys qo\'shish (format: kalit1, kalit2, ...):');
});

// --- Rezyume Yaratish ---
bot.hears('📝 Rezyume yaratish', async (ctx) => {
  userSessions.set(ctx.from.id, { mode: 'rezyume_ism' });
  await ctx.reply('📝 Ism va familiyangizni yozing:');
});

// --- Texnologik Xarita ---
bot.hears('💻 Texnologik xarita', async (ctx) => {
  userSessions.set(ctx.from.id, { mode: 'xarita_sarlavha' });
  await ctx.reply('💻 Xarita sarlavhasini yozing:');
});

// --- Glossary ---
bot.hears('📖 Glossary', async (ctx) => {
  userSessions.set(ctx.from.id, { mode: 'glossary_atama' });
  await ctx.reply('📖 Atama yozing:');
});

// --- Dashbort ---
bot.hears('📊 Dashbort', async (ctx) => {
  const stat = await katalog.statistika();
  const tolStat = await tolash.statistika();
  const obuStat = await obunachilar.sanoq();

  await ctx.replyWithHTML(
    `📊 <b>Dashbort</b>\n\n` +
    `📚 Kurslar: <b>${stat.kurslar_soni}</b>\n` +
    `💰 Jami narx: <b>${stat.jami_summa.toLocaleString('uz-UZ')} so'm</b>\n` +
    `💳 To'lovlar: <b>${tolStat.jami}</b>\n` +
    `✅ Tasdiqlangan: <b>${tolStat.tasdiqlangan}</b>\n` +
    `👥 Obunachilar: <b>${obuStat.faol}</b>`
  );
});

// --- Navbat ---
bot.hears('📋 Navbat', async (ctx) => {
  const postlar = await navbat.royxat();
  if (postlar.length === 0) {
    return ctx.reply("📋 Navbat bo'sh");
  }
  let text = `📋 Navbatda ${postlar.length} ta post:\n\n`;
  postlar.slice(0, 5).forEach((p, i) => {
    const qisqa = (p.matn || '(faqat rasm)').slice(0, 40);
    text += `${i + 1}. ${qisqa}...\n`;
  });
  await ctx.reply(text);
});

// --- Avto-javoblar ---
bot.hears('💬 Avto-javoblar', async (ctx) => {
  const royxat = await javoblar.royxat();
  if (royxat.length === 0) {
    return ctx.reply('💬 Avto-javoblar yo\'q');
  }
  let text = `💬 <b>Avto-javoblar (${royxat.length} ta)</b>\n\n`;
  royxat.slice(0, 5).forEach((y) => {
    text += `<b>${y.kalitlar.join(', ')}</b>\n${y.javob.slice(0, 50)}...\n\n`;
  });
  await ctx.replyWithHTML(text);
});

// --- Bot Sozlash ---
bot.hears('⚙️ Bot sozlash', async (ctx) => {
  const holat = await navbat.royxat();
  const s = await obunachilar.sanoq();

  await ctx.replyWithHTML(
    `⚙️ <b>Bot sozlash</b>\n\n` +
    `🤖 Bot: Ishlayapti\n` +
    `📊 Navbatda: ${holat.length} ta\n` +
    `👥 Obunachilar: ${s.faol}\n\n` +
    `/holat — Bot holati\n` +
    `/help — Buyruqlar`
  );
});

function matniniOl(ctx) {
  const manba = ctx.message?.text || ctx.message?.caption || '';
  return manba.replace(/^\/\w+(@\w+)?\s*/, '').trim();
}

function rasminiOl(ctx) {
  const rasmlar = ctx.message?.photo;
  return rasmlar?.length ? rasmlar[rasmlar.length - 1].file_id : null;
}

const KANAL_YOQ = "Kanal sozlanmagan.";

// --- Darhol yuborish ---
bot.command('post', async (ctx) => {
  if (!config.channelId) return ctx.reply(KANAL_YOQ);

  const matn = matniniOl(ctx);
  const rasm = rasminiOl(ctx);

  if (!matn && !rasm) {
    return ctx.reply("Matn yozing: /post Assalomu alaykum");
  }

  try {
    await kanalgaYubor(ctx.telegram, { matn, rasm });
    await ctx.reply('✅ Kanalga yuborildi.');
  } catch (xato) {
    console.error('Yuborishda xato:', xato);
    await ctx.reply(`❌ Yuborilmadi: ${xato.description || xato.message}`);
  }
});

// --- Navbatga qo'shish ---
bot.command('qosh', async (ctx) => {
  if (!config.channelId) return ctx.reply(KANAL_YOQ);

  const matn = matniniOl(ctx);
  const rasm = rasminiOl(ctx);

  if (!matn && !rasm) {
    return ctx.reply("Matn yozing: /qosh Ertangi e'lon");
  }

  const post = await navbat.qosh({ matn, rasm });
  const soni = (await navbat.royxat()).length;
  await ctx.reply(`📥 Navbatga qo'shildi (id: ${post.id}).\nNavbatda ${soni} ta post bor.`);
});

// --- Navbat ro'yxati ---
bot.command('navbat', async (ctx) => {
  const postlar = await navbat.royxat();
  if (postlar.length === 0) return ctx.reply("Navbat bo'sh.");

  const qator = postlar.map((p, i) => {
    const belgi = p.rasm ? '🖼 ' : '';
    const qisqa = (p.matn || '(faqat rasm)').slice(0, 50);
    return `${i + 1}. ${belgi}${qisqa}${(p.matn || '').length > 50 ? '…' : ''}\n    id: ${p.id}`;
  });

  await ctx.reply(`Navbatda ${postlar.length} ta post:\n\n${qator.join('\n')}`);
});

// --- Obunachilarga rassilka ---
let rassilkaKetyapti = false;

bot.command('rassilka', async (ctx) => {
  const matn = matniniOl(ctx);
  const rasm = rasminiOl(ctx);

  if (!matn && !rasm) {
    return ctx.reply("Matn yozing: /rassilka Salom!");
  }

  if (rassilkaKetyapti) {
    return ctx.reply('⏳ Hozir boshqa rassilka ketyapti. Tugashini kuting.');
  }

  const { faol } = await obunachilar.sanoq();
  if (faol === 0) {
    return ctx.reply("Hali obunachi yo'q.");
  }

  rassilkaKetyapti = true;
  const taxminiyDaqiqa = Math.ceil((faol * 0.05) / 60);
  const holatXabari = await ctx.reply(
    `📤 ${faol} ta obunachiga yuborilmoqda...` +
      (taxminiyDaqiqa > 1 ? `\nTaxminan ${taxminiyDaqiqa} daqiqa oladi.` : ''),
  );

  try {
    const natija = await hammagaYubor(ctx.telegram, { matn, rasm }, async (bajarildi, jami) => {
      await ctx.telegram
        .editMessageText(ctx.chat.id, holatXabari.message_id, undefined, `📤 Yuborilmoqda: ${bajarildi}/${jami}`)
        .catch(() => {});
    });

    await ctx.replyWithHTML(
      `<b>Rassilka tugadi</b>\n\n` +
        `✅ Yetib bordi: <b>${natija.yuborildi}</b>\n` +
        `🚫 Bloklagan: <b>${natija.bloklagan}</b>\n` +
        `⚠️ Xato: <b>${natija.xato}</b>`,
    );
  } catch (xato) {
    console.error('Rassilka xatosi:', xato);
    await ctx.reply(`❌ Rassilkada xato: ${xato.description || xato.message}`);
  } finally {
    rassilkaKetyapti = false;
  }
});

// --- Obunachilar statistikasi ---
bot.command('obunachilar', async (ctx) => {
  const s = await obunachilar.sanoq();
  await ctx.replyWithHTML(
    `<b>Obunachilar</b>\n\n` +
      `✅ Faol: <b>${s.faol}</b>\n` +
      `🔕 Chiqib ketgan: <b>${s.chiqqan}</b>\n` +
      `🚫 Bloklagan: <b>${s.bloklagan}</b>\n` +
      `━━━━━━━━━━\n` +
      `Jami: <b>${s.jami}</b>`,
  );
});

// --- Avto-javoblarni boshqarish ---
bot.command('javoblar', async (ctx) => {
  const royxat = await javoblar.royxat();
  if (royxat.length === 0) return ctx.reply("Avto-javoblar yo'q.\n\n/javob orqali qo'shing.");

  const qator = royxat.map(
    (y) => `<b>#${y.id}</b> — <code>${y.kalitlar.join(', ')}</code>\n${y.javob}`,
  );
  await ctx.replyWithHTML(`<b>Avto-javoblar (${royxat.length} ta)</b>\n\n${qator.join('\n\n')}`);
});

bot.command('javob', async (ctx) => {
  const matn = matniniOl(ctx);
  const [kalitQismi, ...javobQismi] = matn.split('|');

  if (javobQismi.length === 0) {
    return ctx.replyWithHTML(
      "Format:\n<code>/javob kalit1, kalit2 | Javob matni</code>\n\n" +
        "Masalan:\n<code>/javob sertifikat, diplom | Ha, sertifikat beriladi.</code>",
    );
  }

  const kalitlar = kalitQismi
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const javob = javobQismi.join('|').trim();

  if (kalitlar.length === 0 || !javob) {
    return ctx.reply("Kalit so'z ham, javob ham bo'sh bo'lmasligi kerak.");
  }

  const yangi = await javoblar.qosh(kalitlar, javob);
  await ctx.replyWithHTML(
    `✅ Qo'shildi (#${yangi.id})\n\nKalitlar: <code>${kalitlar.join(', ')}</code>\nJavob: ${javob}`,
  );
});

// --- Holat ---
bot.command('holat', async (ctx) => {
  const soni = (await navbat.royxat()).length;
  const s = await obunachilar.sanoq();
  const kanalQismi = config.channelId
    ? `Kanal: <code>${config.channelId}</code>\n` +
      `Jadval: <code>${config.scheduleCron}</code> (${config.timezone})\n` +
      `Navbatda: <b>${soni}</b> ta post\n`
    : `Kanal: <i>sozlanmagan</i>\n`;

  await ctx.replyWithHTML(
    `<b>Bot ishlayapti</b>\n\n` +
      kanalQismi +
      `Faol obunachi: <b>${s.faol}</b>\n` +
      `Avto-javoblar: <b>${(await javoblar.royxat()).length}</b> ta`,
  );
});

// --- AI Referat buyruq ---
bot.command('referat', async (ctx) => {
  const matn = matniniOl(ctx);
  if (!matn) {
    return ctx.replyWithHTML(
      `📚 <b>Referat AI</b>\n\n` +
      `Format: <code>/referat Mavzu nomi</code>\n\n` +
      `${getNarxText('referat')}\n\n` +
      `AI xulosa va mundarija tuzadi. Keyin to'lovni amalga oshiring.`
    );
  }

  const narx = 5000;
  await ctx.replyWithHTML(
    `📚 <b>Referat</b>\n\n` +
    `Mavzu: <b>${matn}</b>\n` +
    `💰 Narx: ${narx.toLocaleString('uz-UZ')} so'm\n\n` +
    `To'lov qiling:\n` +
    `<code>/payclick ${narx} Referat: ${matn}</code>`
  );
});

// --- AI Maqola buyruq ---
bot.command('maqola', async (ctx) => {
  const matn = matniniOl(ctx);
  if (!matn) {
    return ctx.replyWithHTML(
      `✅ <b>Maqola AI</b>\n\n` +
      `Format: <code>/maqola Mavzu nomi</code>\n\n` +
      `💰 Narx: 75 000 so'm\n\n` +
      `AI to'liq maqola yozadi.`
    );
  }

  const narx = 7000;
  await ctx.replyWithHTML(
    `✅ <b>Maqola</b>\n\n` +
    `Mavzu: <b>${matn}</b>\n` +
    `💰 Narx: ${narx.toLocaleString('uz-UZ')} so'm\n\n` +
    `To'lov qiling:\n` +
    `<code>/payclick ${narx} Maqola: ${matn}</code>`
  );
});

// --- AI Tezis buyruq ---
bot.command('tezis', async (ctx) => {
  const matn = matniniOl(ctx);
  if (!matn) {
    return ctx.replyWithHTML(
      `✏️ <b>Tezis AI</b>\n\n` +
      `Format: <code>/tezis Mavzu nomi</code>\n\n` +
      `💰 Narx: 40 000 so'm\n\n` +
      `AI qisqa xulosa yozadi.`
    );
  }

  const narx = 4000;
  await ctx.replyWithHTML(
    `✏️ <b>Tezis</b>\n\n` +
    `Mavzu: <b>${matn}</b>\n` +
    `💰 Narx: ${narx.toLocaleString('uz-UZ')} so'm\n\n` +
    `To'lov qiling:\n` +
    `<code>/payclick ${narx} Tezis: ${matn}</code>`
  );
});

// --- AI Quiz buyruq ---
bot.command('quiz', async (ctx) => {
  const matn = matniniOl(ctx);
  if (!matn) {
    return ctx.replyWithHTML(
      `📝 <b>Quiz AI</b>\n\n` +
      `Format: <code>/quiz Mavzu nomi</code>\n\n` +
      `💰 Narx: 60 000 so'm\n\n` +
      `AI 5 ta savol bilan quiz tuzadi.`
    );
  }

  const narx = 6000;
  await ctx.replyWithHTML(
    `📝 <b>Quiz</b>\n\n` +
    `Mavzu: <b>${matn}</b>\n` +
    `💰 Narx: ${narx.toLocaleString('uz-UZ')} so'm\n\n` +
    `To'lov qiling:\n` +
    `<code>/payclick ${narx} Quiz: ${matn}</code>`
  );
});

// --- To'lov buyruqlari ---
bot.command('pay', async (ctx) => {
  const matn = matniniOl(ctx);
  if (!matn) {
    return ctx.replyWithHTML(
      '💳 <b>To\'lov yaratish</b>\n\n' +
        'Format: <code>/pay summa kurs_nomi</code>\n\n' +
        'Masalan: <code>/pay 500000 Python kursi</code>',
    );
  }

  const [summa, ...kursArray] = matn.split(' ');
  const summaNum = parseInt(summa);
  const kurs = kursArray.join(' ') || 'Kurs';

  if (isNaN(summaNum) || summaNum <= 0) {
    return ctx.reply('❌ Summa noto\'g\'ri. Raqam yozing.');
  }

  const ism = ctx.from.first_name || 'Foydalanuvchi';
  const email = `user_${ctx.from.id}@tolash.uz`;

  const tolav = await tolash.yaratish(ctx.from.id, ism, email, summaNum, kurs);
  const link = tolovLinki(tolav.id);

  await ctx.replyWithHTML(
    `💳 <b>To\'lov yaratildi!</b>\n\n` +
      `ID: <code>${tolav.id}</code>\n` +
      `Summa: <b>${summaNum.toLocaleString('uz-UZ')} so\'m</b>\n` +
      `Kurs: ${kurs}\n` +
      `Status: Kutilmoqda\n\n` +
      `Test mode\'da to\'lov avtomatik tasdiqlash uchun:\n` +
      `<code>/tasdiqlash ${tolav.id}</code>`,
  );
});

// --- To'lovni tasdiqlash (admin) ---
bot.command('tasdiqlash', async (ctx) => {
  const tolavId = parseInt(matniniOl(ctx));
  if (!tolavId) {
    return ctx.reply('To\'lov ID sini yozing: /tasdiqlash 1234567890');
  }

  const tolav = await tolash.tasdiqlash(tolavId);
  if (!tolav) {
    return ctx.reply('❌ To\'lov topilmadi.');
  }

  let aiMatn = '';
  if (tolav.kurs.toLowerCase().includes('referat')) {
    aiMatn = await ai.referatYaratish(tolav.kurs) || 'Referat yaratilmoqda...';
  } else if (tolav.kurs.toLowerCase().includes('maqola')) {
    aiMatn = await ai.referatYaratish(tolav.kurs) || 'Maqola yaratilmoqda...';
  } else if (tolav.kurs.toLowerCase().includes('tezis')) {
    aiMatn = await ai.referatYaratish(tolav.kurs) || 'Tezis yaratilmoqda...';
  } else if (tolav.kurs.toLowerCase().includes('quiz')) {
    const quiz = await ai.quizYaratish(tolav.kurs, 5);
    aiMatn = quiz?.savollar?.length ? `5 ta savol yaratildi!` : 'Quiz yaratilmoqda...';
  }

  await ctx.replyWithHTML(
    `✅ <b>To\'lov tasdiqlandi!</b>\n\n` +
      `ID: <code>${tolav.id}</code>\n` +
      `Summa: <b>${tolav.summa.toLocaleString('uz-UZ')} so\'m</b>\n` +
      `Kurs: ${tolav.kurs}\n` +
      `Status: Tasdiqlandi\n\n` +
      `<b>AI Yaratilgan Matn:</b>\n${aiMatn}`,
  );
});

// --- To'lovlar statistikasi (admin) ---
bot.command('tolashstat', async (ctx) => {
  const stat = await tolash.statistika();

  await ctx.replyWithHTML(
    `<b>💳 To\'lov statistikasi</b>\n\n` +
      `Jami: <b>${stat.jami}</b>\n` +
      `✅ Tasdiqlangan: <b>${stat.tasdiqlangan}</b>\n` +
      `⏳ Kutilmoqda: <b>${stat.kutilmoqda}</b>\n` +
      `❌ Bekor qilindi: <b>${stat.bekor}</b>\n` +
      `━━━━━━━━━━\n` +
      `Jami to\'plangan: <b>${stat.jami_summa.toLocaleString('uz-UZ')} so\'m</b>`,
  );
});

// --- Click to'lov ---
bot.command('payclick', async (ctx) => {
  const matn = matniniOl(ctx);
  if (!matn) {
    return ctx.replyWithHTML(
      '💳 <b>Click orqali to\'lov</b>\n\n' +
        'Format: <code>/payclick summa kurs_nomi</code>\n\n' +
        'Masalan: <code>/payclick 500000 Python kursi</code>',
    );
  }

  const [summa, ...kursArray] = matn.split(' ');
  const summaNum = parseInt(summa);
  const kurs = kursArray.join(' ') || 'Kurs';

  if (isNaN(summaNum) || summaNum <= 0) {
    return ctx.reply('❌ Summa noto\'g\'ri.');
  }

  const clickTolov = await tolovUsullari.clickTolov(ctx, summaNum, kurs);
  const tolav = await tolash.yaratish(ctx.from.id, ctx.from.first_name, `user_${ctx.from.id}@click.uz`, summaNum, kurs);

  await ctx.replyWithHTML(
    `💳 <b>Click to\'lov linki!</b>\n\n` +
      `Summa: <b>${summaNum.toLocaleString('uz-UZ')} so\'m</b>\n` +
      `Kurs: ${kurs}\n` +
      `Status: Kutilmoqda\n\n` +
      `🔗 <b>To\'lov linki:</b>\n` +
      `<code>${clickTolov.payment_url}</code>\n\n` +
      `📌 <i>Test mode - payni bosmasdan, bekor qilish:</i>\n` +
      `<code>/bekorqil ${tolav.id}</code>`,
  );
});

// --- Payme to'lov ---
bot.command('paypayme', async (ctx) => {
  const matn = matniniOl(ctx);
  if (!matn) {
    return ctx.replyWithHTML(
      '💳 <b>Payme orqali to\'lov</b>\n\n' +
        'Format: <code>/paypayme summa kurs_nomi</code>\n\n' +
        'Masalan: <code>/paypayme 500000 Python kursi</code>',
    );
  }

  const [summa, ...kursArray] = matn.split(' ');
  const summaNum = parseInt(summa);
  const kurs = kursArray.join(' ') || 'Kurs';

  if (isNaN(summaNum) || summaNum <= 0) {
    return ctx.reply('❌ Summa noto\'g\'ri.');
  }

  const paymeTolov = await tolovUsullari.paymeTolov(ctx, summaNum, kurs);
  const tolav = await tolash.yaratish(ctx.from.id, ctx.from.first_name, `user_${ctx.from.id}@payme.uz`, summaNum, kurs);

  await ctx.replyWithHTML(
    `💳 <b>Payme to\'lov linki!</b>\n\n` +
      `Summa: <b>${summaNum.toLocaleString('uz-UZ')} so\'m</b>\n` +
      `Kurs: ${kurs}\n` +
      `Status: Kutilmoqda\n\n` +
      `🔗 <b>To\'lov linki:</b>\n` +
      `<code>${paymeTolov.payment_url}</code>\n\n` +
      `📌 <i>Test mode - payni bosmasdan, bekor qilish:</i>\n` +
      `<code>/bekorqil ${tolav.id}</code>`,
  );
});

// --- To'lovni bekor qilish ---
bot.command('bekorqil', async (ctx) => {
  const tolavId = parseInt(matniniOl(ctx));
  if (!tolavId) {
    return ctx.reply('To\'lov ID sini yozing: /bekorqil 1234567890');
  }

  const tolav = await tolash.bekorQil(tolavId);
  if (!tolav) {
    return ctx.reply('❌ To\'lov topilmadi.');
  }

  await ctx.replyWithHTML(
    `❌ <b>To\'lov bekor qilindi</b>\n\n` +
      `ID: <code>${tolav.id}</code>\n` +
      `Summa: ${tolav.summa.toLocaleString('uz-UZ')} so\'m\n` +
      `Status: Bekor qilindi`,
  );
});

// --- User Cabinet ---
bot.command('cabinet', async (ctx) => {
  const userId = ctx.from.id;
  const ism = ctx.from.first_name || 'Foydalanuvchi';

  // Profil yaratish/oqish
  let profil = await userCabinet.profilOqish(userId);
  if (!profil) {
    profil = await userCabinet.profilYaratish(userId, ism, 'N/A', `user_${userId}@test.uz`);
  }

  // Statistika
  const stat = await userCabinet.statistika(userId);
  const cabinetUrl = cabinetLink(userId);

  await ctx.replyWithHTML(
    `👤 <b>Mening Kabinet</b>\n\n` +
      `<b>Profil</b>\n` +
      `Ism: ${profil.ism}\n` +
      `Email: <code>${profil.email}</code>\n\n` +
      `<b>Statistika</b>\n` +
      `📚 O'qigan kurslar: <b>${stat.kurslar_soni}</b>\n` +
      `💳 To'lovlar: <b>${stat.tolavlar_soni}</b>\n` +
      `📜 Sertifikatlar: <b>${stat.sertifikatlar_soni}</b>\n` +
      `💰 Jami to'plangan: <b>${stat.jami_summa.toLocaleString('uz-UZ')} so\'m</b>\n\n` +
      `🔗 <b>Web kabinet:</b>\n` +
      `<code>${cabinetUrl}</code>\n\n` +
      `Batafsil ko\'rish uchun:\n` +
      `/kurslarim — o'qigan kurslar\n` +
      `/tolovlarim — to'lovlar tarixi\n` +
      `/sertifikatlarim — sertifikatlar`,
  );
});

// --- O'qigan kurslar ---
bot.command('kurslarim', async (ctx) => {
  const userId = ctx.from.id;
  const kurslar = await userCabinet.menyingKurslar(userId);

  if (kurslar.length === 0) {
    return ctx.replyWithHTML(
      `📚 <b>O'qigan kurslar</b>\n\n` +
        `Hali hech kurs o'qimagan.\n\n` +
        `Kurs uchun to'lov qiling:\n` +
        `<code>/payclick summa kurs_nomi</code>`,
    );
  }

  let text = `📚 <b>O'qigan kurslar (${kurslar.length} ta)</b>\n\n`;
  kurslar.forEach((k, i) => {
    text += `${i + 1}. <b>${k.kurs}</b>\n`;
    text += `   Summa: ${k.summa.toLocaleString('uz-UZ')} so'm\n`;
    text += `   Sertifikat: <code>/sertifikat ${k.id}</code>\n\n`;
  });

  await ctx.replyWithHTML(text);
});

// --- To'lovlar tarixi ---
bot.command('tolovlarim', async (ctx) => {
  const userId = ctx.from.id;
  const tolavlar = await userCabinet.tolovTarihasi(userId);

  if (tolavlar.length === 0) {
    return ctx.reply('💳 To\'lovlar tarixi bo\'sh.');
  }

  let text = `💳 <b>To'lovlar tarixi (${tolavlar.length} ta)</b>\n\n`;
  tolavlar.forEach((t, i) => {
    const status = t.status === 'tasdiqlandi' ? '✅' : t.status === 'kutilmoqda' ? '⏳' : '❌';
    text += `${i + 1}. ${status} ${t.kurs}\n`;
    text += `   Summa: ${t.summa.toLocaleString('uz-UZ')} so'm\n`;
    text += `   Status: ${t.status}\n\n`;
  });

  await ctx.reply(text);
});

// --- Sertifikatlar ---
bot.command('sertifikatlarim', async (ctx) => {
  const userId = ctx.from.id;
  const kurslar = await userCabinet.menyingKurslar(userId);

  if (kurslar.length === 0) {
    return ctx.reply('📜 Sertifikat yo\'q. Birinchi kurs uchun to\'lov qiling!');
  }

  let text = `📜 <b>Sertifikatlar (${kurslar.length} ta)</b>\n\n`;
  kurslar.forEach((k, i) => {
    text += `${i + 1}. ${k.kurs}\n`;
    text += `   Download: <code>/sertifikat ${k.id}</code>\n\n`;
  });

  await ctx.reply(text);
});

// --- KURS KATALOGI ---
bot.command('kurslar', async (ctx) => {
  const kurslar = await katalog.kurslar();

  if (kurslar.length === 0) {
    return ctx.reply('📚 Hozir hech kurs yo\'q.');
  }

  let text = `📚 <b>KURS KATALOGI (${kurslar.length} ta)</b>\n\n`;

  kurslar.forEach((k, i) => {
    text += `${i + 1}. <b>${k.ism}</b>\n`;
    text += `💰 Narx: ${k.narx.toLocaleString('uz-UZ')} so'm\n`;
    text += `⏱️ Muddat: ${k.muddat} oy\n`;
    text += `📖 Darslar: ${k.darslar_soni} ta\n`;
    text += `👥 O'qiganlar: ${k.oqiganlar}\n`;
    text += `⭐ Reyting: ${k.reyting}/5\n\n`;
    text += `📝 <code>/kurs_info ${k.id}</code> — Batafsil\n`;
    text += `💳 <code>/kurs_sotib_ol ${k.id}</code> — Sotib olish\n`;
    text += `━━━━━━━━━━━━━━━━\n\n`;
  });

  await ctx.replyWithHTML(text);
});

// --- Kurs batafsil ---
bot.command('kurs_info', async (ctx) => {
  const kursId = parseInt(matniniOl(ctx));
  if (!kursId) {
    return ctx.reply('Kurs ID sini yozing: /kurs_info 1234567890');
  }

  const kurs = await katalog.kursOqish(kursId);
  if (!kurs) {
    return ctx.reply('❌ Kurs topilmadi.');
  }

  await ctx.replyWithHTML(
    `📚 <b>${kurs.ism}</b>\n\n` +
      `💰 Narx: <b>${kurs.narx.toLocaleString('uz-UZ')} so'm</b>\n` +
      `⏱️ Muddat: <b>${kurs.muddat} oy</b>\n` +
      `📖 Darslar: <b>${kurs.darslar_soni} ta</b>\n` +
      `👥 O'qiganlar: <b>${kurs.oqiganlar}</b>\n` +
      `⭐ Reyting: <b>${kurs.reyting}/5</b>\n` +
      `🔒 Qiyinlik: <b>${kurs.qiyinlik}</b>\n\n` +
      `📝 <b>Tavsif:</b>\n${kurs.tavsif}\n\n` +
      `💳 <code>/kurs_sotib_ol ${kurs.id}</code> — Sotib olish`
  );
});

// --- Kurs sotib olish ---
bot.command('kurs_sotib_ol', async (ctx) => {
  const kursId = parseInt(matniniOl(ctx));
  if (!kursId) {
    return ctx.reply('Kurs ID sini yozing: /kurs_sotib_ol 1234567890');
  }

  const kurs = await katalog.kursOqish(kursId);
  if (!kurs) {
    return ctx.reply('❌ Kurs topilmadi.');
  }

  await ctx.replyWithHTML(
    `💳 <b>Kurs sotib olish</b>\n\n` +
      `Kurs: ${kurs.ism}\n` +
      `Narx: <b>${kurs.narx.toLocaleString('uz-UZ')} so'm</b>\n\n` +
      `To'lov usuli:\n` +
      `<code>/payclick ${kurs.narx} ${kurs.ism}</code>\n` +
      `yoki\n` +
      `<code>/paypayme ${kurs.narx} ${kurs.ism}</code>`
  );
});

// --- Kurs statistikasi (admin) ---
bot.command('kurslar_stat', async (ctx) => {
  const stat = await katalog.statistika();

  await ctx.replyWithHTML(
    `<b>📚 Kurs Statistikasi</b>\n\n` +
      `Kurslar: <b>${stat.kurslar_soni}</b>\n` +
      `Ortacha narx: <b>${stat.ortacha_narx.toLocaleString('uz-UZ')} so\'m</b>\n` +
      `Jami narx: <b>${stat.jami_summa.toLocaleString('uz-UZ')} so\'m</b>\n` +
      `Jami oqiganlar: <b>${stat.jami_oqiganlar}</b>`
  );
});

// --- Sertifikat yuklab olish ---
bot.command('sertifikat', async (ctx) => {
  const userId = ctx.from.id;
  const kursId = parseInt(matniniOl(ctx));

  if (!kursId) {
    return ctx.reply('Sertifikat ID sini yozing: /sertifikat 1234567890');
  }

  const sert = await userCabinet.sertifikatYuklash(userId, kursId);
  if (!sert) {
    return ctx.reply('❌ Sertifikat topilmadi.');
  }

  await ctx.replyWithHTML(
    `📜 <b>Sertifikat</b>\n\n` +
      `Kurs: ${sert.kurs}\n` +
      `Sana: ${sert.sana}\n` +
      `Kodi: <code>${sert.kodi}</code>\n\n` +
      `🔗 Download: <code>${sert.url}</code>\n\n` +
      `<i>Test mode - PDF fayl yuborilmadi</i>`,
  );
});

// --- Admin menyu tugmalari ---
bot.on('text', async (ctx, next) => {
  const text = ctx.message.text;
  const userId = ctx.from.id;

  // Agar admin emas, avto-javob beradi
  if (!adminmi(ctx)) return next();

  const session = userSessions.get(userId) || {};


  // Input mode handlers
  if (session.mode === 'krosword_savol') {
    const savollar = text.split(',').map(s => s.trim()).filter(Boolean);
    const krosword = await features.krosword.yaratish(userId, savollar);
    await ctx.replyWithHTML(
      `✅ <b>Krosword saqlandi!</b>\n\n` +
      `🧩 Savollar: <b>${savollar.length} ta</b>\n` +
      `🆔 ID: <code>${krosword.id}</code>\n` +
      `📝 Savollar: ${savollar.slice(0, 3).join(', ')}${savollar.length > 3 ? '...' : ''}`
    );
    userSessions.delete(userId);
    return;
  }

  if (session.mode === 'keys_qo') {
    const keys = text.split(',').map(k => k.trim()).filter(Boolean);
    const keysObj = await features.keys.yaratish(userId, keys);
    await ctx.replyWithHTML(
      `✅ <b>Keys saqlandi!</b>\n\n` +
      `🔑 Keys: <b>${keys.length} ta</b>\n` +
      `🆔 ID: <code>${keysObj.id}</code>\n` +
      `📝 Keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`
    );
    userSessions.delete(userId);
    return;
  }

  if (session.mode === 'glossary_atama') {
    userSessions.set(userId, { mode: 'glossary_tarif', atama: text });
    await ctx.reply('📖 Atamaning tarifini yozing:');
    return;
  }

  if (session.mode === 'glossary_tarif') {
    const glossary = await features.glossary.yaratish(userId, session.atama, text);
    await ctx.replyWithHTML(
      `✅ <b>Glossary saqlandi!</b>\n\n` +
      `📖 Atama: <b>${session.atama}</b>\n` +
      `📝 Tarif: ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}\n` +
      `🆔 ID: <code>${glossary.id}</code>`
    );
    userSessions.delete(userId);
    return;
  }

  if (session.mode === 'kurs_title') {
    const kurs = await features.kursIshi.yaratish(userId, text, '');
    await ctx.replyWithHTML(
      `✅ <b>Kurs ishi saqlandi!</b>\n\n` +
      `📚 Sarlavha: <b>${text}</b>\n` +
      `🆔 ID: <code>${kurs.id}</code>\n` +
      `📅 Vaqt: ${new Date(kurs.vaqt).toLocaleString('uz-UZ')}`
    );
    userSessions.delete(userId);
    return;
  }

  if (session.mode === 'quiz_title') {
    const quiz = await features.quiz.yaratish(userId, text, []);
    await ctx.replyWithHTML(
      `✅ <b>Quiz saqlandi!</b>\n\n` +
      `📝 Sarlavha: <b>${text}</b>\n` +
      `🆔 ID: <code>${quiz.id}</code>`
    );
    userSessions.delete(userId);
    return;
  }

  if (session.mode === 'taqdimot_title') {
    const taqdimot = await features.taqdimot.yaratish(userId, text, []);
    await ctx.replyWithHTML(
      `✅ <b>Taqdimot saqlandi!</b>\n\n` +
      `🆕 Sarlavha: <b>${text}</b>\n` +
      `🆔 ID: <code>${taqdimot.id}</code>`
    );
    userSessions.delete(userId);
    return;
  }

  if (session.mode === 'slidepro_title') {
    const slidePro = await features.slidePro.yaratish(userId, text, '');
    await ctx.replyWithHTML(
      `✅ <b>SlidePro saqlandi!</b>\n\n` +
      `🎯 Sarlavha: <b>${text}</b>\n` +
      `🆔 ID: <code>${slidePro.id}</code>`
    );
    userSessions.delete(userId);
    return;
  }

  if (session.mode === 'mustaqil_mavzu') {
    userSessions.set(userId, { mode: 'mustaqil_tafsil', mavzu: text });
    await ctx.reply('📄 Tafsilotlarni yozing:');
    return;
  }

  if (session.mode === 'mustaqil_tafsil') {
    await features.mustaqilIsh.yaratish(userId, session.mavzu, text);
    await ctx.reply(`✅ Mustaqil ish saqlandi`);
    userSessions.delete(userId);
    return;
  }

  if (session.mode === 'refarat_mavzu') {
    userSessions.set(userId, { mode: 'refarat_tafsil', mavzu: text });
    await ctx.reply('📚 Referatning tafsilotlarini yozing:');
    return;
  }

  if (session.mode === 'refarat_tafsil') {
    await features.refarat.yaratish(userId, session.mavzu, text);
    await ctx.reply(`✅ Refarat saqlandi`);
    userSessions.delete(userId);
    return;
  }

  if (session.mode === 'tezis_sarlavha') {
    userSessions.set(userId, { mode: 'tezis_mazmun', sarlavha: text });
    await ctx.reply('✏️ Tezis mazmunini yozing:');
    return;
  }

  if (session.mode === 'tezis_mazmun') {
    await features.tezis.yaratish(userId, session.sarlavha, text);
    await ctx.reply(`✅ Tezis saqlandi`);
    userSessions.delete(userId);
    return;
  }

  if (session.mode === 'maqola_sarlavha') {
    userSessions.set(userId, { mode: 'maqola_mazmun', sarlavha: text });
    await ctx.reply('✅ Maqola mazmunini yozing:');
    return;
  }

  if (session.mode === 'maqola_mazmun') {
    await features.maqola.yaratish(userId, session.sarlavha, text);
    await ctx.reply(`✅ Maqola saqlandi`);
    userSessions.delete(userId);
    return;
  }

  if (session.mode === 'rezyume_ism') {
    userSessions.set(userId, { mode: 'rezyume_malumot', ism: text });
    await ctx.reply('📝 Malumotingizni yozing:');
    return;
  }

  if (session.mode === 'rezyume_malumot') {
    await features.rezyume.yaratish(userId, session.ism, text);
    await ctx.reply(`✅ Rezyume saqlandi`);
    userSessions.delete(userId);
    return;
  }

  if (session.mode === 'xarita_sarlavha') {
    const xarita = await features.texnologikXarita.yaratish(userId, text, []);
    await ctx.replyWithHTML(
      `✅ <b>Texnologik xarita saqlandi!</b>\n\n` +
      `💻 Sarlavha: <b>${text}</b>\n` +
      `🆔 ID: <code>${xarita.id}</code>`
    );
    userSessions.delete(userId);
    return;
  }
});

// --- Jadval bo'yicha yuborish ---
async function navbatdanYubor(telegram) {
  const post = await navbat.keyingisiniOl();
  if (!post) return false;

  try {
    await kanalgaYubor(telegram, post);
    console.log(`Jadval bo'yicha yuborildi (id: ${post.id})`);
    return true;
  } catch (xato) {
    console.error('Jadval xatosi:', xato);
    await navbat.qosh(post);
    for (const adminId of config.adminIds) {
      await telegram
        .sendMessage(adminId, `❌ Jadval bo'yicha post yuborilmadi: ${xato.description || xato.message}`)
        .catch(() => {});
    }
    return false;
  }
}

if (config.channelId) {
  if (!cron.validate(config.scheduleCron)) {
    console.error(`XATO: SCHEDULE_CRON noto'g'ri: "${config.scheduleCron}"`);
    process.exit(1);
  }

  cron.schedule(config.scheduleCron, () => navbatdanYubor(bot.telegram), {
    timezone: config.timezone,
  });
}

// --- Express server (port binding uchun) ---
app.use(express.json());
app.get('/', (req, res) => {
  res.json({ status: 'Bot ishlanmoqda ✅' });
});

// --- Ishga tushirish ---
bot.catch((xato, ctx) => {
  console.error(`Botda xato (${ctx.updateType}):`, xato);
});

bot.launch().then(() => {
  app.listen(PORT, () => {
    console.log('Bot ishga tushdi.');
    console.log(`Server running on port ${PORT}`);
    if (config.channelId) {
      console.log(`Kanal: ${config.channelId}`);
      console.log(`Jadval: ${config.scheduleCron} (${config.timezone})`);
    }
  });
}).catch((xato) => {
  if (xato.response?.error_code === 401) {
    console.error("XATO: BOT_TOKEN noto'g'ri.");
  } else {
    console.error('Bot ishga tushmadi:', xato.description || xato.message);
  }
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
