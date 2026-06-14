// Serveur local sécurisé (https) pour "Musique Magasin".
// Tourne sur le PC. L'iPad s'y connecte par le Wi-Fi du magasin.
// Le https est nécessaire pour que le micro de l'iPad fonctionne.

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const MUSIC_DIR = path.join(ROOT, 'music');
const PORT = 8443;

// --- Trouver l'adresse IP locale du PC (réseau Wi-Fi) ---
function lanIP() {
  const ifs = os.networkInterfaces();
  for (const name of Object.keys(ifs)) {
    for (const i of ifs[name]) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return '127.0.0.1';
}
const IP = lanIP();

// --- Générer un certificat local (1re fois, ou si l'IP a changé) ---
const CERT = path.join(ROOT, 'cert.pem');
const KEY = path.join(ROOT, 'key.pem');
const IP_MARK = path.join(ROOT, '.cert-ip');
function ensureCert() {
  const prevIP = fs.existsSync(IP_MARK) ? fs.readFileSync(IP_MARK, 'utf8').trim() : '';
  if (fs.existsSync(CERT) && fs.existsSync(KEY) && prevIP === IP) return;
  const selfsigned = require('selfsigned');
  const pems = selfsigned.generate([{ name: 'commonName', value: IP }], {
    days: 3650,
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [
      { name: 'basicConstraints', cA: true },
      { name: 'subjectAltName', altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
        { type: 7, ip: IP },
      ]},
    ],
  });
  fs.writeFileSync(KEY, pems.private);
  fs.writeFileSync(CERT, pems.cert);
  // Copie .crt à installer sur l'iPad (Safari propose l'installation du profil)
  fs.writeFileSync(path.join(ROOT, 'iPad-certificat.crt'), pems.cert);
  fs.writeFileSync(IP_MARK, IP);
  console.log('Certificat (re)généré pour ' + IP);
}
ensureCert();

// --- Types de fichiers ---
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
  '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.aac': 'audio/aac', '.flac': 'audio/flac',
  '.crt': 'application/x-x509-ca-cert', '.pem': 'application/x-pem-file',
};

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type });
  res.end(body);
}

// Sert un fichier avec support du "Range" (lecture/pause audio fluide)
function serveFile(req, res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'text/plain', 'Introuvable');
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const range = req.headers.range;
    if (range && /^bytes=/.test(range)) {
      const [s, e] = range.replace('bytes=', '').split('-');
      const start = parseInt(s, 10) || 0;
      const end = e ? parseInt(e, 10) : st.size - 1;
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Range': `bytes ${start}-${end}/${st.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
      });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(file).pipe(res);
    }
  });
}

const handler = (req, res) => {
  let p = decodeURIComponent((req.url.split('?')[0]) || '/');

  // Liste des musiques présentes sur le PC (dossier /music)
  if (p === '/api/tracks') {
    let list = [];
    try {
      list = fs.readdirSync(MUSIC_DIR)
        .filter(f => /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(f))
        .sort()
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

https.createServer({ key: fs.readFileSync(KEY), cert: fs.readFileSync(CERT) }, handler)
  .listen(PORT, '0.0.0.0', () => {
    console.log('=========================================================');
    console.log('  🎵  Musique Magasin — serveur local démarré');
    console.log('');
    console.log('  Sur l\'iPad, ouvre dans Safari :');
    console.log('      https://' + IP + ':' + PORT);
    console.log('');
    console.log('  (1re fois) installe le certificat sur l\'iPad :');
    console.log('      fichier  iPad-certificat.crt');
    console.log('=========================================================');
  });
