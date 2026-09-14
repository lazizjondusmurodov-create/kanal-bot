// AI feature'lar uchun narxlar (so'm)
export const pricing = {
  referat: 5000,        // Referat yaratish
  maqola: 7000,         // Maqola yaratish
  tezis: 4000,          // Tezis yaratish
  quiz: 6000,           // Quiz yaratish (5 savol)
  taqdimot: 9000,       // Taqdimot yaratish (5 slayd)
  mustaqilIsh: 5000,    // Mustaqil ish yaratish
  rezyume: 4000,        // Rezyume yaratish
  texnologikXarita: 6000,   // Xarita yaratish
  glossary: 2500,       // Glossary yaratish
  krosword: 4000,       // Krosword yaratish
};

export function getNarx(feature) {
  return pricing[feature] || 0;
}

export function getNarxText(feature) {
  const narx = getNarx(feature);
  return narx > 0 ? `💰 Narx: ${narx.toLocaleString('uz-UZ')} so'm` : 'Bepul';
}
