import fs from 'fs/promises';
import path from 'path';
import { ai } from './ai.js';

const DATA_DIR = 'data/features';

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

// --- Kurs ishi yaratish ---
export const kursIshi = {
  async yaratish(userId, sarlavha, tafsiloti) {
    await ensureDir();
    const id = Date.now();
    const kurs = { id, userId, sarlavha, tafsiloti, vaqt: new Date() };

    const fayl = path.join(DATA_DIR, `kurs_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(kurs, null, 2));
    return kurs;
  },

  async oqish() {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const kurslar = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('kurs_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        kurslar.push(JSON.parse(mazmun));
      }
    }
    return kurslar;
  },
};

// --- Krosword yaratish ---
export const krosword = {
  async yaratish(userId, savollar) {
    await ensureDir();
    const id = Date.now();
    const krosword = { id, userId, savollar, vaqt: new Date() };

    const fayl = path.join(DATA_DIR, `krosword_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(krosword, null, 2));
    return krosword;
  },

  async oqish() {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const kroswordlar = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('krosword_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        kroswordlar.push(JSON.parse(mazmun));
      }
    }
    return kroswordlar;
  },
};

// --- Quiz/Test yaratish (AI bilan) ---
export const quiz = {
  async yaratish(userId, sarlavha, savollar) {
    await ensureDir();
    const id = Date.now();
    const aiSavollar = await ai.quizYaratish(sarlavha, 5);
    const quizTestimony = { id, userId, sarlavha, savollar: aiSavollar?.savollar || savollar, vaqt: new Date() };

    const fayl = path.join(DATA_DIR, `quiz_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(quizTestimony, null, 2));
    return quizTestimony;
  },

  async oqish() {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const quizlar = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('quiz_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        quizlar.push(JSON.parse(mazmun));
      }
    }
    return quizlar;
  },
};

// --- Taqdimot yaratish (AI bilan) ---
export const taqdimot = {
  async yaratish(userId, sarlavha, slaydlar) {
    await ensureDir();
    const id = Date.now();
    const aiSlaydlar = await ai.taqdimotYaratish(sarlavha);
    const taqdimot = { id, userId, sarlavha, slaydlar: aiSlaydlar?.taqdimot || slaydlar, vaqt: new Date() };

    const fayl = path.join(DATA_DIR, `taqdimot_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(taqdimot, null, 2));
    return taqdimot;
  },

  async oqish() {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const taqdimotlar = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('taqdimot_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        taqdimotlar.push(JSON.parse(mazmun));
      }
    }
    return taqdimotlar;
  },
};

// --- SlidePro onlayn taqdimot ---
export const slidePro = {
  async yaratish(userId, sarlavha, havola) {
    await ensureDir();
    const id = Date.now();
    const slidePro = { id, userId, sarlavha, havola, vaqt: new Date() };

    const fayl = path.join(DATA_DIR, `slidepro_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(slidePro, null, 2));
    return slidePro;
  },

  async oqish() {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const slideProlar = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('slidepro_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        slideProlar.push(JSON.parse(mazmun));
      }
    }
    return slideProlar;
  },
};

// --- Mening fayllarim ---
export const menyingFayllarim = {
  async qosh(userId, fayl) {
    await ensureDir();
    const id = Date.now();
    const yozuv = { id, userId, fayl, vaqt: new Date() };

    const faylPath = path.join(DATA_DIR, `fayl_${id}.json`);
    await fs.writeFile(faylPath, JSON.stringify(yozuv, null, 2));
    return yozuv;
  },

  async oqish(userId) {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const userFayllar = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('fayl_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        const yozuv = JSON.parse(mazmun);
        if (yozuv.userId === userId) {
          userFayllar.push(yozuv);
        }
      }
    }
    return userFayllar;
  },
};

// --- Mustaqil ish (AI bilan) ---
export const mustaqilIsh = {
  async yaratish(userId, mavzu, tafsili) {
    await ensureDir();
    const id = Date.now();
    const aiMazmun = await ai.mustaqilIshYaratish(mavzu);
    const ish = { id, userId, mavzu, tafsili, aiMazmun: aiMazmun || tafsili, vaqt: new Date() };

    const fayl = path.join(DATA_DIR, `mustaqil_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(ish, null, 2));
    return ish;
  },

  async oqish() {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const ishlar = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('mustaqil_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        ishlar.push(JSON.parse(mazmun));
      }
    }
    return ishlar;
  },
};

// --- Refarat yaratish (AI bilan) ---
export const refarat = {
  async yaratish(userId, mavzu, tafsiloti) {
    await ensureDir();
    const id = Date.now();
    const aiMazmun = await ai.referatYaratish(mavzu);
    const refarat = { id, userId, mavzu, tafsiloti, aiMazmun: aiMazmun || tafsiloti, vaqt: new Date() };

    const fayl = path.join(DATA_DIR, `refarat_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(refarat, null, 2));
    return refarat;
  },

  async oqish() {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const referatlar = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('refarat_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        referatlar.push(JSON.parse(mazmun));
      }
    }
    return referatlar;
  },
};

// --- Tezis yaratish (AI bilan) ---
export const tezis = {
  async yaratish(userId, sarlavha, mazmun) {
    await ensureDir();
    const id = Date.now();
    const aiMazmun = await ai.referatYaratish(sarlavha);
    const tezis = { id, userId, sarlavha, mazmun, aiMazmun: aiMazmun || mazmun, vaqt: new Date() };

    const fayl = path.join(DATA_DIR, `tezis_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(tezis, null, 2));
    return tezis;
  },

  async oqish() {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const tezislar = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('tezis_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        tezislar.push(JSON.parse(mazmun));
      }
    }
    return tezislar;
  },
};

// --- Maqola yaratish (AI bilan) ---
export const maqola = {
  async yaratish(userId, sarlavha, mazmun) {
    await ensureDir();
    const id = Date.now();
    const aiMazmun = await ai.referatYaratish(sarlavha);
    const maqola = { id, userId, sarlavha, mazmun, aiMazmun: aiMazmun || mazmun, vaqt: new Date() };

    const fayl = path.join(DATA_DIR, `maqola_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(maqola, null, 2));
    return maqola;
  },

  async oqish() {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const maqolalar = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('maqola_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        maqolalar.push(JSON.parse(mazmun));
      }
    }
    return maqolalar;
  },
};

// --- Keys ---
export const keys = {
  async yaratish(userId, mavzu, kalitSozlar) {
    await ensureDir();
    const id = Date.now();
    const keys = { id, userId, mavzu, kalitSozlar, vaqt: new Date() };

    const fayl = path.join(DATA_DIR, `keys_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(keys, null, 2));
    return keys;
  },

  async oqish() {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const keysList = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('keys_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        keysList.push(JSON.parse(mazmun));
      }
    }
    return keysList;
  },
};

// --- Rezyume yaratish (AI bilan) ---
export const rezyume = {
  async yaratish(userId, ism, malumot) {
    await ensureDir();
    const id = Date.now();
    const aiMazmun = await ai.kursTavsifiYaratish(`${ism} rezyumesi`);
    const rezyume = { id, userId, ism, malumot, aiMazmun: aiMazmun || malumot, vaqt: new Date() };

    const fayl = path.join(DATA_DIR, `rezyume_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(rezyume, null, 2));
    return rezyume;
  },

  async oqish() {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const rezyumeler = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('rezyume_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        rezyumeler.push(JSON.parse(mazmun));
      }
    }
    return rezyumeler;
  },
};

// --- Texnologik xarita ---
export const texnologikXarita = {
  async yaratish(userId, sarlavha, tugunlar) {
    await ensureDir();
    const id = Date.now();
    const xarita = { id, userId, sarlavha, tugunlar, vaqt: new Date() };

    const fayl = path.join(DATA_DIR, `xarita_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(xarita, null, 2));
    return xarita;
  },

  async oqish() {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const xaritalar = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('xarita_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        xaritalar.push(JSON.parse(mazmun));
      }
    }
    return xaritalar;
  },
};

// --- Glossary ---
export const glossary = {
  async yaratish(userId, atamalar) {
    await ensureDir();
    const id = Date.now();
    const glossary = { id, userId, atamalar, vaqt: new Date() };

    const fayl = path.join(DATA_DIR, `glossary_${id}.json`);
    await fs.writeFile(fayl, JSON.stringify(glossary, null, 2));
    return glossary;
  },

  async oqish() {
    await ensureDir();
    const fayllar = await fs.readdir(DATA_DIR);
    const glossarylar = [];

    for (const fayl of fayllar) {
      if (fayl.startsWith('glossary_')) {
        const mazmun = await fs.readFile(path.join(DATA_DIR, fayl), 'utf-8');
        glossarylar.push(JSON.parse(mazmun));
      }
    }
    return glossarylar;
  },
};
