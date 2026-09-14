import { config } from './config.js';

// Telegram "juda tez yuboryapsan" desa, shuncha soniya kutib qayta urinamiz.
const QAYTA_URINISH = 3;

export async function kanalgaYubor(telegram, post) {
  for (let urinish = 1; urinish <= QAYTA_URINISH; urinish++) {
    try {
      if (post.rasm) {
        return await telegram.sendPhoto(config.channelId, post.rasm, {
          caption: post.matn || undefined,
          parse_mode: 'HTML',
        });
      }
      return await telegram.sendMessage(config.channelId, post.matn, {
        parse_mode: 'HTML',
      });
    } catch (xato) {
      const kutish = xato?.parameters?.retry_after;
      if (kutish && urinish < QAYTA_URINISH) {
        console.warn(`Limit: ${kutish} soniya kutilmoqda...`);
        await new Promise((r) => setTimeout(r, (kutish + 1) * 1000));
        continue;
      }
      throw xato;
    }
  }
}
