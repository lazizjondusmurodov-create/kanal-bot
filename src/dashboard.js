import express from 'express';
import { katalog } from './katalog.js';
import { tolash } from './tolash.js';
import { obunachilar } from './obunachilar.js';

export function startDashboard(port = 3000) {
  const app = express();

  app.use(express.static('public'));
  app.use(express.json());

  // Admin tugmalari ro'yxati
  const adminTugmalari = [
    { id: 'kurs_ishi', ikon: '📚', nom: 'Kurs ishi yaratish', faol: true },
    { id: 'krosword', ikon: '🧩', nom: 'Krosword yaratish', faol: true },
    { id: 'quiz', ikon: '📝', nom: 'Quiz/Test yaratish', faol: true },
    { id: 'taqdimot', ikon: '🆕', nom: 'Taqdimot yaratish', faol: true },
    { id: 'slidepro', ikon: '🎯', nom: 'SlidePro onlayn taqdimot', faol: true },
    { id: 'fayllar', ikon: '📁', nom: 'Mening fayllarim', faol: true },
    { id: 'mustaqil', ikon: '📄', nom: 'Mustaqil ish yaratish', faol: true },
    { id: 'refarat', ikon: '📚', nom: 'Refarat yaratish', faol: true },
    { id: 'tezis', ikon: '✏️', nom: 'Tezis yaratish', faol: true },
    { id: 'maqola', ikon: '✅', nom: 'Maqola yaratish', faol: true },
    { id: 'keys', ikon: '🔑', nom: 'Keys', faol: true },
    { id: 'rezyume', ikon: '📝', nom: 'Rezyume yaratish', faol: true },
    { id: 'xarita', ikon: '💻', nom: 'Texnologik xarita', faol: true },
    { id: 'glossary', ikon: '📖', nom: 'Glossary', faol: true },
    { id: 'dashbort', ikon: '📊', nom: 'Dashbort', faol: true },
    { id: 'navbat', ikon: '📋', nom: 'Navbat', faol: true },
    { id: 'javoblar', ikon: '💬', nom: 'Avto-javoblar', faol: true },
    { id: 'sozlash', ikon: '⚙️', nom: 'Bot sozlash', faol: true },
  ];

  // --- HTML Dashboard ---
  app.get('/', async (req, res) => {
    const stat_kurs = await katalog.statistika();
    const stat_tolash = await tolash.statistika();
    const stat_obuna = await obunachilar.sanoq();

    const html = `
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>📊 Admin Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { text-align: center; color: #333; margin-bottom: 30px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .card h3 { color: #666; font-size: 14px; margin-bottom: 10px; }
    .card .value { font-size: 32px; font-weight: bold; color: #007bff; }
    .card .unit { color: #999; font-size: 12px; margin-left: 5px; }
    .section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .section h2 { color: #333; margin-bottom: 15px; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 1px solid #ddd; font-weight: 600; color: #666; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    tr:hover { background: #f9f9f9; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-danger { background: #f8d7da; color: #721c24; }
    .footer { text-align: center; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Admin Dashboard</h1>

    <div class="stats">
      <div class="card">
        <h3>📚 Kurslar</h3>
        <div class="value">${stat_kurs.kurslar_soni}</div>
      </div>
      <div class="card">
        <h3>💰 Jami narx</h3>
        <div class="value">${(stat_kurs.jami_summa / 1000000).toFixed(1)}<span class="unit">M</span></div>
      </div>
      <div class="card">
        <h3>💳 To'lovlar</h3>
        <div class="value">${stat_tolash.jami}</div>
      </div>
      <div class="card">
        <h3>✅ Tasdiqlangan</h3>
        <div class="value">${stat_tolash.tasdiqlangan}</div>
      </div>
      <div class="card">
        <h3>👥 Obunachilari</h3>
        <div class="value">${stat_obuna.faol}</div>
      </div>
      <div class="card">
        <h3>💰 To'plangan</h3>
        <div class="value">${(stat_tolash.jami_summa / 1000000).toFixed(1)}<span class="unit">M</span></div>
      </div>
    </div>

    <div class="section">
      <h2>📚 Top 5 Kurslar</h2>
      <table>
        <thead>
          <tr>
            <th>Kurs</th>
            <th>Narx</th>
            <th>Muddat</th>
            <th>O'qiganlar</th>
            <th>Reyting</th>
          </tr>
        </thead>
        <tbody id="kurslar-table">
          <tr><td colspan="5" style="text-align: center; color: #999;">Yuklanmoqda...</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>💳 So'nggi To'lovlar</h2>
      <table>
        <thead>
          <tr>
            <th>Kurs</th>
            <th>Summa</th>
            <th>Status</th>
            <th>Vaqt</th>
          </tr>
        </thead>
        <tbody id="tolovlar-table">
          <tr><td colspan="4" style="text-align: center; color: #999;">Yuklanmoqda...</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>⚙️ Admin Panel Tugmalari</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;" id="tugmalar-container">
        <!-- Tugmalar shu yerga chiqadi -->
      </div>
    </div>

    <div class="footer">
      <p>🤖 Kanal-Bot Admin Dashboard | Last updated: <span id="update-time">now</span></p>
    </div>
  </div>

  <script>
    async function loadData() {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();

        // Kurslar
        const kurslarHtml = data.kurslar.slice(0, 5).map(k => \`
          <tr>
            <td><strong>\${k.ism}</strong></td>
            <td>\${k.narx.toLocaleString('uz-UZ')} so'm</td>
            <td>\${k.muddat} oy</td>
            <td>\${k.oqiganlar}</td>
            <td>⭐ \${k.reyting}</td>
          </tr>
        \`).join('');
        document.getElementById('kurslar-table').innerHTML = kurslarHtml || '<tr><td colspan="5" style="text-align: center; color: #999;">Hech kurs yo\\'q</td></tr>';

        // To'lovlar
        const tolovlarHtml = data.tolovlar.slice(0, 5).map(t => \`
          <tr>
            <td>\${t.kurs}</td>
            <td>\${t.summa.toLocaleString('uz-UZ')} so'm</td>
            <td><span class="badge \${t.status === 'tasdiqlandi' ? 'badge-success' : t.status === 'kutilmoqda' ? 'badge-warning' : 'badge-danger'}">\${t.status}</span></td>
            <td>\${new Date(t.vaqt).toLocaleDateString('uz-UZ')}</td>
          </tr>
        \`).join('');
        document.getElementById('tolovlar-table').innerHTML = tolovlarHtml || '<tr><td colspan="4" style="text-align: center; color: #999;">Hech to\\'lov yo\\'q</td></tr>';

        document.getElementById('update-time').textContent = new Date().toLocaleTimeString('uz-UZ');
      } catch (e) {
        console.error('Xato:', e);
      }
    }

    loadData();
    setInterval(loadData, 5000); // Har 5 soniya yangilash
  </script>
</body>
</html>
    `;

    res.send(html);
  });

  // --- API ---
  app.get('/api/data', async (req, res) => {
    const kurslar = await katalog.kurslar();
    const tolovlar = await tolash.oqish();

    res.json({
      kurslar: kurslar.slice(0, 5),
      tolovlar: tolovlar.slice(0, 5),
    });
  });

  app.listen(port, () => {
    console.log(`📊 Dashboard: http://localhost:${port}`);
  });
}
