import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = 'data/cabinet';

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

// --- User profili ---
export const userCabinet = {
  async profilYaratish(userId, ism, tel, email) {
    await ensureDir();
    const profil = {
      userId,
      ism,
      tel,
      email,
      registratsiya: new Date(),
      oxirgi_kirish: new Date(),
    };

    const fayl = path.join(DATA_DIR, `profil_${userId}.json`);
    await fs.writeFile(fayl, JSON.stringify(profil, null, 2));
    return profil;
  },

  async profilOqish(userId) {
    await ensureDir();
    const fayl = path.join(DATA_DIR, `profil_${userId}.json`);

    try {
      const mazmun = await fs.readFile(fayl, 'utf-8');
      return JSON.parse(mazmun);
    } catch {
      return null;
    }
  },

  // Kurs ro'yxati (tasdiqlangan to'lovlar)
  async menyingKurslar(userId) {
    try {
      const tolashDir = 'data/tolash';
      const fayllar = await fs.readdir(tolashDir);
      const kurslar = [];

      for (const fayl of fayllar) {
        if (fayl.startsWith('tolav_')) {
          const faylPath = path.join(tolashDir, fayl);
          const mazmun = await fs.readFile(faylPath, 'utf-8');
          const tolav = JSON.parse(mazmun);

          if (tolav.userId === userId && tolav.status === 'tasdiqlandi') {
            kurslar.push({
              id: tolav.id,
              kurs: tolav.kurs,
              summa: tolav.summa,
              vaqt: tolav.vaqt,
              sertifikat: true,
            });
          }
        }
      }
      return kurslar;
    } catch (e) {
      console.log('Kurslar oqishda xato:', e.message);
      return [];
    }
  },

  // To'lovlar tarixi
  async tolovTarihasi(userId) {
    try {
      const tolashDir = 'data/tolash';
      const fayllar = await fs.readdir(tolashDir);
      const tolavlar = [];

      for (const fayl of fayllar) {
        if (fayl.startsWith('tolav_')) {
          const faylPath = path.join(tolashDir, fayl);
          const mazmun = await fs.readFile(faylPath, 'utf-8');
          const tolav = JSON.parse(mazmun);

          if (tolav.userId === userId) {
            tolavlar.push({
              id: tolav.id,
              kurs: tolav.kurs,
              summa: tolav.summa,
              status: tolav.status,
              vaqt: tolav.vaqt,
            });
          }
        }
      }
      return tolavlar.sort((a, b) => new Date(b.vaqt) - new Date(a.vaqt));
    } catch (e) {
      console.log('To\'lovlar oqishda xato:', e.message);
      return [];
    }
  },

  // Statistika
  async statistika(userId) {
    const kurslar = await this.menyingKurslar(userId);
    const tolavlar = await this.tolovTarihasi(userId);

    const jami_summa = kurslar.reduce((sum, k) => sum + k.summa, 0);

    return {
      kurslar_soni: kurslar.length,
      tolavlar_soni: tolavlar.length,
      sertifikatlar_soni: kurslar.length,
      jami_summa,
    };
  },

  // Sertifikat yuklab olish
  async sertifikatYuklash(userId, kursId) {
    try {
      const kurslar = await this.menyingKurslar(userId);
      const kurs = kurslar.find(k => k.id === kursId);

      if (!kurs) {
        console.log(`Kurs topilmadi: userId=${userId}, kursId=${kursId}`);
        return null;
      }

      return {
        kurs: kurs.kurs,
        ism: 'Foydalanuvchi',
        sana: new Date().toLocaleDateString('uz-UZ'),
        kodi: `SERT-${kursId}`,
        fayl: `sertifikat_${kursId}.pdf`,
        url: `https://cabinet.test/download/sertifikat_${kursId}.pdf`,
      };
    } catch (e) {
      console.log('Sertifikat oqishda xato:', e.message);
      return null;
    }
  },
};

// --- Cabinet link ---
export function cabinetLink(userId) {
  return `https://cabinet.test.uz/${userId}`;
}
