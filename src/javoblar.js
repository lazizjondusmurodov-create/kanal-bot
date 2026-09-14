import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ildiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const FAYL = join(ildiz, 'data', 'javoblar.json');

let yozuvZanjiri = Promise.resolve();

// Bot birinchi marta ishga tushganda shular yoziladi — namuna sifatida.
const BOSHLANGICH = [
  {
    id: 1,
    kalitlar: ['narx', 'narxi', 'qancha', 'pul', 'tolov', "to'lov"],
    javob: "Kurs narxi: <b>500 000 so'm</b>\n\nTo'lovni bo'lib to'lash ham mumkin.",
  },
  {
    id: 2,
    kalitlar: ['manzil', 'qayerda', 'joylashuv', 'adres'],
    javob: 'Manzil: <b>Toshkent sh., Chilonzor 5-kvartal</b>',
  },
  {
    id: 3,
    kalitlar: ['vaqt', 'jadval', 'qachon', 'soat'],
    javob: "Darslar: <b>Dushanba, Chorshanba, Juma</b>\nSoat: <b>18:00 - 20:00</b>",
  },
  {
    id: 4,
    kalitlar: ['aloqa', 'telefon', 'raqam', 'boglanish', "bog'lanish"],
    javob: 'Telefon: <b>+998 90 123 45 67</b>',
  },
];

async function oqi() {
  try {
    return JSON.parse(await readFile(FAYL, 'utf8'));
  } catch (xato) {
    if (xato.code === 'ENOENT') {
      await yoz(BOSHLANGICH);
      return BOSHLANGICH;
    }
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

// Turli yozuvlar bir xil hisoblanishi uchun matnni soddalashtiramiz:
// katta-kichik harf, apostrof turlari, ortiqcha belgilar.
function soddalashtir(matn) {
  return matn
    .toLowerCase()
    .replace(/[''`´]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Foydalanuvchi xabariga mos javobni topadi.
 * Kalit so'z butun so'z sifatida uchrashi kerak — "narx" so'zi
 * "narxlar" ichida topiladi, lekin tasodifiy bo'lak sifatida emas.
 * Eng ko'p kalit so'zi mos kelgan javob tanlanadi.
 */
export function javobTop(royxat, xabar) {
  const sodda = soddalashtir(xabar);
  if (!sodda) return null;

  const sozlar = new Set(sodda.split(' '));
  let engYaxshi = null;
  let engKopMos = 0;

  for (const yozuv of royxat) {
    let mos = 0;
    for (const kalit of yozuv.kalitlar) {
      const kalitSodda = soddalashtir(kalit);
      if (!kalitSodda) continue;

      // Bir so'zli kalit: xabardagi biror so'z shu bilan boshlansa yetarli
      // ("narx" -> "narxlar", "narxi").
      if (!kalitSodda.includes(' ')) {
        for (const soz of sozlar) {
          if (soz === kalitSodda || soz.startsWith(kalitSodda)) {
            mos++;
            break;
          }
        }
      } else if (sodda.includes(kalitSodda)) {
        // Ko'p so'zli kalit: to'liq ibora sifatida qidiriladi.
        mos++;
      }
    }

    if (mos > engKopMos) {
      engKopMos = mos;
      engYaxshi = yozuv;
    }
  }

  return engYaxshi;
}

export const javoblar = {
  royxat: oqi,

  qosh(kalitlar, javob) {
    return ozgartir((royxat) => {
      const yangi = {
        id: royxat.length ? Math.max(...royxat.map((y) => y.id)) + 1 : 1,
        kalitlar,
        javob,
      };
      return { yangiRoyxat: [...royxat, yangi], qaytar: yangi };
    });
  },

  ochir(id) {
    return ozgartir((royxat) => {
      const qolgan = royxat.filter((y) => y.id !== id);
      return { yangiRoyxat: qolgan, qaytar: qolgan.length !== royxat.length };
    });
  },
};
