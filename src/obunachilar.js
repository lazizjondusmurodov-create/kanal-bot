import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ildiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const FAYL = join(ildiz, 'data', 'obunachilar.json');

// navbat.js dagi kabi — bir vaqtda ikki joydan yozilib fayl buzilmasligi uchun.
let yozuvZanjiri = Promise.resolve();

async function oqi() {
  try {
    return JSON.parse(await readFile(FAYL, 'utf8'));
  } catch (xato) {
    if (xato.code === 'ENOENT') return [];
    throw xato;
  }
}

async function yoz(royxat) {
  await mkdir(dirname(FAYL), { recursive: true });
  await writeFile(FAYL, JSON.stringify(royxat, null, 2), 'utf8');
}

function ozgartir(amal) {
  const natija = yozuvZanjiri.then(async () => {
    const royxat = await oqi();
    const { yangiRoyxat, qaytar } = amal(royxat);
    await yoz(yangiRoyxat);
    return qaytar;
  });
  yozuvZanjiri = natija.catch(() => {});
  return natija;
}

export const obunachilar = {
  hammasi: oqi,

  // Rassilka faqat shularga ketadi: obuna bo'lgan va bloklamaganlar.
  async faollar() {
    const royxat = await oqi();
    return royxat.filter((o) => o.obuna && !o.bloklagan);
  },

  async sanoq() {
    const royxat = await oqi();
    return {
      jami: royxat.length,
      faol: royxat.filter((o) => o.obuna && !o.bloklagan).length,
      chiqqan: royxat.filter((o) => !o.obuna && !o.bloklagan).length,
      bloklagan: royxat.filter((o) => o.bloklagan).length,
    };
  },

  // /start bosganda chaqiriladi. Avval chiqib ketgan bo'lsa, qaytadan obuna qiladi.
  qoshYokiYangila(foydalanuvchi) {
    return ozgartir((royxat) => {
      const mavjud = royxat.find((o) => o.id === foydalanuvchi.id);

      if (mavjud) {
        const yangilangan = {
          ...mavjud,
          ism: foydalanuvchi.ism,
          username: foydalanuvchi.username,
          obuna: true,
          bloklagan: false,
        };
        return {
          yangiRoyxat: royxat.map((o) => (o.id === mavjud.id ? yangilangan : o)),
          qaytar: { yangi: false, qaytdi: !mavjud.obuna || mavjud.bloklagan },
        };
      }

      const yangi = {
        id: foydalanuvchi.id,
        ism: foydalanuvchi.ism,
        username: foydalanuvchi.username,
        obuna: true,
        bloklagan: false,
        qoshilgan: new Date().toISOString(),
      };
      return { yangiRoyxat: [...royxat, yangi], qaytar: { yangi: true, qaytdi: false } };
    });
  },

  // Foydalanuvchi "Obunani bekor qilish" tugmasini bosganda.
  // Yozuvni o'chirmaymiz — qaytib kelsa tarixi saqlanib qolsin.
  obunaniBekorQil(id) {
    return ozgartir((royxat) => ({
      yangiRoyxat: royxat.map((o) => (o.id === id ? { ...o, obuna: false } : o)),
      qaytar: royxat.some((o) => o.id === id),
    }));
  },

  // Telegram 403 qaytarsa — foydalanuvchi botni bloklagan.
  bloklaganDebBelgila(id) {
    return ozgartir((royxat) => ({
      yangiRoyxat: royxat.map((o) => (o.id === id ? { ...o, bloklagan: true } : o)),
      qaytar: true,
    }));
  },
};
