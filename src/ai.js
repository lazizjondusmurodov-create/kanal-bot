import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';

let model = null;

if (config.geminiApiKey) {
  try {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  } catch (error) {
    console.error('Gemini initializing xatosi:', error.message);
  }
}

async function generateWithRetry(prompt, maxRetries = 3) {
  if (!model) return null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 30000)
        )
      ]);

      const text = result.response?.text?.();
      if (text && text.length > 20) return text;
    } catch (error) {
      console.error(`AI urinish ${i + 1}/${maxRetries} xatosi:`, error.message);
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 2000));
    }
  }
  return null;
}

export const ai = {
  async slaydYaratish(mavzu, qisqa_tavsif) {
    const prompt = `${mavzu} mavzusi uchun qisqa tavsif yozing. 2-3 qator.`;
    const text = await generateWithRetry(prompt);

    return {
      slaydlar: [
        { sarlavha: mavzu, matn: text || `${mavzu} - qiziqarli mavzu` }
      ]
    };
  },

  async mustaqilIshYaratish(mavzu) {
    const prompt = `"${mavzu}" mavzusida mustaqil ish: qanday tashkil qilish, bajarish muddati, natija, baho.`;
    const text = await generateWithRetry(prompt);
    return text || `${mavzu} mustaqil ishi: Tashkil, Bajarish, Natija`;
  },

  async kursTavsifiYaratish(kurs_nomi) {
    const prompt = `"${kurs_nomi}" kurs: nima o'retiladi, kim uchun, asosiy mavzular.`;
    const text = await generateWithRetry(prompt);
    return text || `${kurs_nomi} - professional kurs. Asosiy tushunchalar, amaliy ishlash.`;
  },

  async quizYaratish(mavzu, soni = 5) {
    const prompt = `"${mavzu}" mavzusida ${soni} ta savol. JSON: {"savollar":[{"savol":"...","variantlar":["A)...","B)...","C)...","D)..."],"togrisi":"A"}]}`;
    const text = await generateWithRetry(prompt);

    if (text) {
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('JSON parse xatosi:', e.message);
      }
    }

    return { savollar: [] };
  },

  async taqdimotYaratish(mavzu) {
    const prompt = `"${mavzu}" mavzusida 5 slayd: sarlavha va 2-3 punkt. JSON: {"taqdimot":[{"sarlavha":"...","nuqtalar":["...","",...]}]}`;
    const text = await generateWithRetry(prompt);

    if (text) {
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('JSON parse xatosi:', e.message);
      }
    }

    return { taqdimot: [] };
  },

  async referatYaratish(mavzu) {
    const prompt = `Siz Uzbek tilida referat yozuvchisiz. "${mavzu}" mavzusida to'liq, batafsil referat tayyorlab bering.

TUZILISH:
1. KIRISH (2-3 paragraf) - Mavzu haqida umumiy ma'lumot va ahamiyati
2. ASOSIY QO'LLANILGAN MAVZULAR (4-5 paragraf) - Batafsil tahlil va ma'lumotlar
3. XULOSA (2-3 paragraf) - Umumiy xulosa va ahamiyati

Talabalar:
- O'zbek tilida
- Sodda, tushunarli uslub
- Minimal 2000 so'z
- Har bir paragraf 3-4 gapdan iborat bo'lsin`;
    const text = await generateWithRetry(prompt);
    return text || `${mavzu} referat: Kirish, Asosiy qismlar, Xulosa - To'liq referat yaratilmoqda...`;
  },
};
