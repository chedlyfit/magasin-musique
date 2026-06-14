// Télécharge ~13 h de musique libre de droits (Kevin MacLeod, CC-BY)
// dans le dossier "music". Aucune dépendance (Node intégré).
const https = require('https');
const fs = require('fs');
const path = require('path');

const LIST = path.join(__dirname, 'musique-liste.json');
const DIR = path.join(__dirname, 'music');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);
const items = JSON.parse(fs.readFileSync(LIST, 'utf8'));

function get(url) {
  return new Promise((res, rej) => {
    https.get(url, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        r.resume(); return get(r.headers.location).then(res, rej);
      }
      if (r.statusCode !== 200) { r.resume(); return rej(new Error('HTTP ' + r.statusCode)); }
      const chunks = []; r.on('data', c => chunks.push(c)); r.on('end', () => res(Buffer.concat(chunks)));
    }).on('error', rej);
  });
}

(async () => {
  console.log('Téléchargement de ' + items.length + ' morceaux (~13 h, ~1,5 Go)...');
  console.log('Laisse cette fenêtre ouverte, ça prend quelques minutes.\n');
  let i = 0, ok = 0, skip = 0, fail = 0;
  for (const it of items) {
    i++;
    const dest = path.join(DIR, it.filename);
    try {
      if (fs.existsSync(dest) && fs.statSync(dest).size > 100000) { skip++; }
      else {
        const buf = await get(it.url);
        if (buf.length > 100000) { fs.writeFileSync(dest, buf); ok++; } else { fail++; }
      }
    } catch (e) { fail++; }
    process.stdout.write('\r[' + i + '/' + items.length + '] ok=' + ok + ' déjà=' + skip + ' échecs=' + fail + '   ');
  }
  // Fichier d'attribution (obligatoire pour la licence CC-BY)
  const lines = ['CRÉDITS MUSIQUE — Creative Commons BY 4.0',
    'Musique : Kevin MacLeod (incompetech.com) — https://creativecommons.org/licenses/by/4.0/',
    'Libre pour usage commercial (diffusion en magasin) avec ce crédit conservé.',
    '='.repeat(60)];
  for (const it of items) lines.push('- ' + it.filename.replace(/\.mp3$/i, '') + ' — Kevin MacLeod (incompetech.com) — CC BY 4.0');
  fs.writeFileSync(path.join(DIR, 'CREDITS.txt'), lines.join('\n'));
  console.log('\n\nTerminé : ' + ok + ' téléchargés, ' + skip + ' déjà présents, ' + fail + ' échecs.');
  console.log('La musique est dans le dossier « music ». Recharge l\'app sur l\'iPad.');
})();
