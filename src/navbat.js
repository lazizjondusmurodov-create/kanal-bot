import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ildiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const FAYL = join(ildiz, 'data', 'navbat.json');

// Bir vaqtning o'zida ikki joydan yozilib fayl buzilmasligi uchun
// har bir yozish oldingisini kutadi.
let yozuvZanjiri = Promise.resolve();

async function oqi() {
  try {
    return JSON.parse(await readFile(FAYL, 'utf8'));
  } catch (xato) {
    if (xato.code === 'ENOENT') return [];
    throw xato;
  }
}

async function yoz(postlar) {
  await mkdir(dirname(FAYL), { recursive: true });
  await writeFile(FAYL, JSON.stringify(postlar, null, 2), 'utf8');
}

// Navbatni o'qib, o'zgartirib, qaytib yozadi. Barcha yozuvlar navbat bilan bajariladi.
function ozgartir(amal) {
  const natija = yozuvZanjiri.then(async () => {
    const postlar = await oqi();
    const { yangiPostlar, qaytar } = amal(postlar);
    await yoz(yangiPostlar);
    return qaytar;
  });
  // Zanjir uzilmasligi uchun xatoni yutamiz — asl xato chaqiruvchiga boradi.
  yozuvZanjiri = natija.catch(() => {});
  return natija;
}

export const navbat = {
  royxat: oqi,

  qosh(post) {
    return ozgartir((postlar) => {
      const yangi = { id: Date.now(), ...post };
      return { yangiPostlar: [...postlar, yangi], qaytar: yangi };
    });
  },

  ochir(id) {
    return ozgartir((postlar) => {
      const qolgan = postlar.filter((p) => p.id !== id);
      return { yangiPostlar: qolgan, qaytar: qolgan.length !== postlar.length };
    });
  },

  tozala() {
    return ozgartir(() => ({ yangiPostlar: [], qaytar: true }));
  },

  // Navbatdagi eng birinchi postni olib tashlab qaytaradi.
  keyingisiniOl() {
    return ozgartir((postlar) => {
      if (postlar.length === 0) return { yangiPostlar: [], qaytar: null };
      const [birinchi, ...qolgan] = postlar;
      return { yangiPostlar: qolgan, qaytar: birinchi };
    });
  },
};
