import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = 'data/katalog';

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

// --- Kurs katalogi ---
export const katalog = {
  // Kurs qo'shish
  async kursQosh(ism, narx, tavsif, muddat) {
    await ensureDir();
    const id = Date.now();
    const kurs = {
      id,
      ism,
      narx, // so'mlarda
      tavsif,
      muddat, // oyda
      darslar_soni: 5,
      qiyinlik: 'medium', // easy, medium, hard
      reyting: 4.5,
      oqiganlar: 0,
      vaqt: new Date(),
    };

    const fayl = path.join(DATA_DIR, `kurs_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(kurs, null, 2));
    return kurs;
  },

  // Barcha kurslar
  async kurslar() {
    try {
      await ensureDir();
      const fayllar = await fs.readdir(DATA_DIR);
      const kurslar = [];

      for (const fayl of fayllar) {
        if (fayl.startsWith('kurs_')) {
          const faylPath = path.join(DATA_DIR, fayl);
          const mazmun = await fs.readFile(faylPath, 'utf-8');
          kurslar.push(JSON.parse(mazmun));
        }
      }
      return kurslar.sort((a, b) => new Date(b.vaqt) - new Date(a.vaqt));
    } catch (e) {
      console.log('Kurslar oqishda xato:', e.message);
      return [];
    }
  },

  // Bitta kurs
  async kursOqish(kursId) {
    try {
      await ensureDir();
      const faylPath = path.join(DATA_DIR, `kurs_${kursId}.json`);
      const mazmun = await fs.readFile(faylPath, 'utf-8');
      return JSON.parse(mazmun);
    } catch (e) {
      console.log('Kurs oqishda xato:', e.message);
      return null;
    }
  },

  // Kurs yangilash
  async kursYangilash(kursId, ism, narx, tavsif, muddat) {
    try {
      await ensureDir();
      const kurs = await this.kursOqish(kursId);
      if (!kurs) return null;

      const updated = {
        ...kurs,
        ism,
        narx,
        tavsif,
        muddat,
      };

      const faylPath = path.join(DATA_DIR, `kurs_${kursId}.json`);
      await fs.writeFile(faylPath, JSON.stringify(updated, null, 2));
      return updated;
    } catch (e) {
      console.log('Kurs yangilashda xato:', e.message);
      return null;
    }
  },

  // Kurs o'chirish
  async kursOchir(kursId) {
    try {
      await ensureDir();
      const faylPath = path.join(DATA_DIR, `kurs_${kursId}.json`);
      await fs.unlink(faylPath);
      return true;
    } catch (e) {
      console.log('Kurs o\'chirishda xato:', e.message);
      return false;
    }
  },

  // Statistika
  async statistika() {
    const kurslar = await this.kurslar();
    const jami_summa = kurslar.reduce((sum, k) => sum + k.narx, 0);
    const jami_oqiganlar = kurslar.reduce((sum, k) => sum + k.oqiganlar, 0);

    return {
      kurslar_soni: kurslar.length,
      jami_summa,
      jami_oqiganlar,
      ortacha_narx: kurslar.length > 0 ? Math.round(jami_summa / kurslar.length) : 0,
    };
  },
};

// --- Default kurslar ---
export async function defaultKurslarQosh() {
  const katalog_kurslar = await katalog.kurslar();

  // Agar kurs yo'q bo'lsa, default qo'shish
  if (katalog_kurslar.length === 0) {
    await katalog.kursQosh(
      'Python Programmalashtirish',
      500000,
      'Python fundamentals, OOP, Web development. Boshlangicha undan so\'ngra o\'rta darajada o\'qitish.',
      3
    );

    await katalog.kursQosh(
      'Web Dizayn',
      400000,
      'HTML, CSS, JavaScript. Responsive design, UI/UX principles. Modern web qaratish.',
      2
    );

    await katalog.kursQosh(
      'Data Science',
      600000,
      'Pandas, NumPy, Matplotlib. Data analysis va visualization. Machine learning asoslari.',
      4
    );

    await katalog.kursQosh(
      'Mobile App (React Native)',
      550000,
      'React Native bilan iOS va Android app yaratish. State management, Navigation.',
      3
    );

    await katalog.kursQosh(
      'Database & SQL',
      350000,
      'SQL, PostgreSQL, Database design. CRUD operatsiyalari, Transactions.',
      2
    );
  }
}
