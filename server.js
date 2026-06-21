// Serveur local pour "Musique Magasin" — version SIMPLE (HTTP, sans certificat).
// Tourne sur le PC. L'iPad ouvre http://<ip-du-PC>:8080 par le Wi-Fi.
// Musique + annonce auto fonctionnent ainsi sans aucun certificat.
// (Le micro "parler" se fait via une petite app dédiée de l'App Store.)

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const MUSIC_DIR = path.join(ROOT, 'music');
const PORT = 8080;

// --- Adresses IP locales du PC (priorise le Wi-Fi) ---
function score(a) {
  if (a.startsWith('192.168.')) return 0;
  if (/^10\./.test(a)) return 1;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(a)) return 3;   // souvent virtuel (Hyper-V/Docker/WSL)
  return 2;
}
function lanIPs() {
  const ifs = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(ifs)) {
    for (const i of ifs[name]) {
      if (i.family === 'IPv4' && !i.internal) out.push({ name, addr: i.address });
    }
  }
  out.sort((a, b) => score(a.addr) - score(b.addr));
  return out;
}
const ALL = lanIPs();
const IP = (ALL[0] && ALL[0].addr) || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
  '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.aac': 'audio/aac', '.flac': 'audio/flac',
};
function send(res, code, type, body) { res.writeHead(code, { 'Content-Type': type }); res.end(body); }

// Sert un fichier avec support du "Range" (lecture/pause audio fluide)
function serveFile(req, res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'text/plain', 'Introuvable');
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const range = req.headers.range;
    if (range && /^bytes=/.test(range)) {
      let [s, e] = range.replace('bytes=', '').split('-');
      let start = parseInt(s, 10); if (isNaN(start)) start = 0;
      let end = e ? parseInt(e, 10) : st.size - 1; if (isNaN(end)) end = st.size - 1;
      if (start >= st.size || start > end) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      const rs = fs.createReadStream(file, { start, end });
      rs.on('error', () => { try { res.destroy(); } catch (e) {} });
      res.on('close', () => rs.destroy());   // le client a coupé/seek -> on stoppe la lecture du fichier
      rs.pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
      const rs = fs.createReadStream(file);
      rs.on('error', () => { try { res.destroy(); } catch (e) {} });
      res.on('close', () => rs.destroy());
      rs.pipe(res);
    }
  });
}

const handler = (req, res) => {
  let p = decodeURIComponent((req.url.split('?')[0]) || '/');
  if (p === '/api/tracks') {
    let list = [];
    try {
      list = fs.readdirSync(MUSIC_DIR)
        .filter(f => /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(f)).sort()
        .map(f => ({ name: f, url: '/music/' + encodeURIComponent(f) }));
    } catch (e) {}
    return send(res, 200, 'application/json', JSON.stringify(list));
  }
  if (p === '/') p = '/index.html';
  const safe = path.normalize(p).replace(/^(\.\.[\\/])+/, '');
  const file = path.join(ROOT, safe);
  if (!file.startsWith(ROOT)) return send(res, 403, 'text/plain', 'Interdit');
  serveFile(req, res, file);
};

http.createServer(handler).listen(PORT, '0.0.0.0', () => {
  console.log('=========================================================');
  console.log('  🎵  Musique Magasin — serveur local démarré (sans certificat)');
  console.log('');
  console.log('  Sur l\'iPad (Safari), ouvre :');
  console.log('         http://' + IP + ':' + PORT);
  if (ALL.length > 1) {
    console.log('');
    console.log('  Si ça ne marche pas, essaie une autre adresse de ce PC :');
    for (const x of ALL.slice(1)) console.log('         http://' + x.addr + ':' + PORT + '   (' + x.name + ')');
  }
  console.log('');
  console.log('  - iPad + PC sur le MÊME Wi-Fi · laisse cette fenêtre ouverte.');
  console.log('  - Pour parler au micro : app « Good Mic » (gratuite, App Store).');
  console.log('=========================================================');
});

// filet anti-crash : un EPIPE/erreur réseau ne doit PAS tuer le serveur (sinon toute la musique coupe)
process.on('uncaughtException', (e) => { console.error('[non-fatal]', e && e.message); });
