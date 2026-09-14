import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = 'data/tolash';

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

// --- To'lovlar ro'yxati ---
export const tolash = {
  // To'lov yaratish
  async yaratish(userId, ism, email, summa, kurs) {
    await ensureDir();
    const id = Date.now();
    const tolav = {
      id,
      userId,
      ism,
      email,
      summa, // so'mlarda
      kurs, // kurs nomi
      status: 'kutilmoqda', // kutilmoqda, tasdiqlandi, bekor_qilindi
      tip: 'test', // test yoki real
      vaqt: new Date(),
      tasdiqlash_vaqti: null,
    };

    const fayl = path.join(DATA_DIR, `tolav_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(tolav, null, 2));
    return tolav;
  },

  // To'lovlarni oqish
  async oqish() {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const tolavlar = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('tolav_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        tolavlar.push(JSON.parse(mazmun));
      }
    }
    return tolavlar.sort((a, b) => b.vaqt - a.vaqt);
  },

  // Foydalanuvchining to'lovlari
  async userTolavlari(userId) {
    const hamma = await this.oqish();
    return hamma.filter(t => t.userId === userId);
  },

  // To'lovni tasdiqlash (test mode)
  async tasdiqlash(tolavId) {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);

    for (const fayl of fayllar) {
      if (fayl.startsWith('tolav_')) {
        const faylPath = path.join(DATA_DIR, fayl);
        const mazmun = await fs.readFile(faylPath, 'utf-8');
        const tolav = JSON.parse(mazmun);

        if (tolav.id === tolavId) {
          tolav.status = 'tasdiqlandi';
          tolav.tasdiqlash_vaqti = new Date();
          await fs.writeFile(faylPath, JSON.stringify(tolav, null, 2));
          return tolav;
        }
      }
    }
    return null;
  },

  // To'lovni bekor qilish
  async bekorQil(tolavId) {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);

    for (const fayl of fayllar) {
      if (fayl.startsWith('tolav_')) {
        const faylPath = path.join(DATA_DIR, fayl);
        const mazmun = await fs.readFile(faylPath, 'utf-8');
        const tolav = JSON.parse(mazmun);

        if (tolav.id === tolavId) {
          tolav.status = 'bekor_qilindi';
          await fs.writeFile(faylPath, JSON.stringify(tolav, null, 2));
          return tolav;
        }
      }
    }
    return null;
  },

  // Statistika
  async statistika() {
    const tolavlar = await this.oqish();
    const tasdiqlangan = tolavlar.filter(t => t.status === 'tasdiqlandi').length;
    const kutilmoqda = tolavlar.filter(t => t.status === 'kutilmoqda').length;
    const bekor = tolavlar.filter(t => t.status === 'bekor_qilindi').length;
    const jami_summa = tolavlar
      .filter(t => t.status === 'tasdiqlandi')
      .reduce((sum, t) => sum + t.summa, 0);

    return {
      jami: tolavlar.length,
      tasdiqlangan,
      kutilmoqda,
      bekor,
      jami_summa,
    };
  },

  // Sertifikat yaratish
  async sertifikatYaratish(userId, kurs, ism) {
    await ensureDir();
    const id = Date.now();
    const sertifikat = {
      id,
      userId,
      kurs,
      ism,
      sana: new Date().toLocaleDateString('uz-UZ'),
      kodi: `SERT-${Date.now()}`,
    };

    const fayl = path.join(DATA_DIR, `sertifikat_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(sertifikat, null, 2));
    return sertifikat;
  },
};

// --- To'lov link'i (test mode) ---
export function tolovLinki(tolavId) {
  // Test mode'da bu faqat demo link
  return `https://test.tolash.uz/pay/${tolavId}`;
}

// --- Click API (test mode) ---
export const clickAPI = {
  async tolovYaratish(summa, ism, email) {
    const orderId = Date.now();
    return {
      order_id: orderId,
      merchant_id: 'TEST_MERCHANT_ID',
      status: 'pending',
      amount: summa,
      currency: 'UZS',
      description: `${ism} - Kurs to\'lovi`,
      return_url: `https://example.com/return/${orderId}`,
      notify_url: `https://example.com/notify/${orderId}`,
      // Test mode link
      payment_url: `https://test.click.uz/pay?order_id=${orderId}&amount=${summa}`,
      test_mode: true,
    };
  },

  async checkPayment(orderId) {
    // Test mode - demo natija
    return {
      order_id: orderId,
      status: 'completed',
      amount: 500000,
      transaction_id: `CLICK-${Date.now()}`,
    };
  },
};

// --- Payme API (test mode) ---
export const paymeAPI = {
  async tolovYaratish(summa, ism, email) {
    const orderId = Date.now();
    return {
      order_id: orderId,
      merchant_id: 'TEST_MERCHANT_ID',
      status: 'pending',
      amount: summa * 100, // Payme tiyn'da
      currency: 'UZS',
      description: `${ism} - Kurs to\'lovi`,
      return_url: `https://example.com/return/${orderId}`,
      // Test mode link
      payment_url: `https://checkout.paymeuz.com/?m=TEST_MERCHANT_ID&t=${orderId}`,
      test_mode: true,
    };
  },

  async checkPayment(orderId) {
    // Test mode - demo natija
    return {
      order_id: orderId,
      status: 'completed',
      amount: 50000000, // 500000 tiyn
      transaction_id: `PAYME-${Date.now()}`,
    };
  },
};

// --- To'lov usuları (Click va Payme) ---
export const tolovUsullari = {
  async clickTolov(ctx, summa, kurs) {
    const result = await clickAPI.tolovYaratish(summa, ctx.from.first_name, `user_${ctx.from.id}@test.uz`);
    return {
      tip: 'click',
      ...result,
    };
  },

  async paymeTolov(ctx, summa, kurs) {
    const result = await paymeAPI.tolovYaratish(summa, ctx.from.first_name, `user_${ctx.from.id}@test.uz`);
    return {
      tip: 'payme',
      ...result,
    };
  },
};
