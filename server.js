// Serveur local sécurisé (https) pour "Musique Magasin".
// Tourne sur le PC. L'iPad s'y connecte par le Wi-Fi du magasin.
// Le https (avec certificat valide pour iOS) est nécessaire pour le micro.

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const ROOT = __dirname;
const MUSIC_DIR = path.join(ROOT, 'music');
const PORT = 8443;        // https (l'app)
const CERT_PORT = 8080;   // http (page pour installer le certificat)

// --- Adresses IP locales du PC (priorise le Wi-Fi, relègue le virtuel) ---
function score(a) {
  if (a.startsWith('192.168.')) return 0;
  if (/^10\./.test(a)) return 1;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(a)) return 3;   // souvent Hyper-V/Docker/WSL
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

// --- Certificat local valide pour iOS (durée < 825 j + EKU serverAuth) ---
const CERT = path.join(ROOT, 'cert.pem');
const KEY = path.join(ROOT, 'key.pem');
const CRT_IPAD = path.join(ROOT, 'iPad-certificat.crt');
const IP_MARK = path.join(ROOT, '.cert-ip');

function certNeedsRegen() {
  try {
    const x = new crypto.X509Certificate(fs.readFileSync(CERT));
    const days = (new Date(x.validTo).getTime() - new Date(x.validFrom).getTime()) / 86400000;
    if (days > 825) return true;                                         // ancien cert trop long -> invalide iOS
    if ((new Date(x.validTo).getTime() - Date.now()) < 30 * 86400000) return true; // expire bientôt
    return false;
  } catch (e) { return true; }
}
function ensureCert() {
  const sig = ALL.map(x => x.addr).sort().join(',');
  const prev = fs.existsSync(IP_MARK) ? fs.readFileSync(IP_MARK, 'utf8').trim() : '';
  const have = fs.existsSync(CERT) && fs.existsSync(KEY);
  if (have && prev === sig && !certNeedsRegen()) return false;   // OK, on réutilise

  const selfsigned = require('selfsigned');
  const altNames = [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' },
  ];
  for (const x of ALL) altNames.push({ type: 7, ip: x.addr });

  const pems = selfsigned.generate([{ name: 'commonName', value: IP }], {
    days: 730,                       // < 825 j : limite iOS pour cert non-système
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [
      { name: 'basicConstraints', cA: true },                          // trust-anchor
      { name: 'keyUsage', digitalSignature: true, keyEncipherment: true, keyCertSign: true },
      { name: 'extKeyUsage', serverAuth: true },                       // REQUIS iOS 13+
      { name: 'subjectAltName', altNames },                            // ce que valide iOS
    ],
  });
  fs.writeFileSync(KEY, pems.private);
  fs.writeFileSync(CERT, pems.cert);
  fs.writeFileSync(CRT_IPAD, pems.cert);
  fs.writeFileSync(IP_MARK, sig);
  return true;   // (re)généré
}
const regenerated = ensureCert();

// --- Types de fichiers ---
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
  '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.aac': 'audio/aac', '.flac': 'audio/flac',
  '.crt': 'application/x-x509-ca-cert', '.pem': 'application/x-pem-file',
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
      if (start >= st.size || start > end) {   // Range invalide -> 416
        res.writeHead(416, { 'Content-Range': `bytes */${st.size}` });
        return res.end();
      }
      res.writeHead(206, {
        'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`,
        'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1,
      });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(file).pipe(res);
    }
  });
}

const appHandler = (req, res) => {
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
  if (p === '/certificat' || p === '/cert' || p.endsWith('.crt')) {
    try { return send(res, 200, MIME['.crt'], fs.readFileSync(CRT_IPAD)); }
    catch (e) { return send(res, 404, 'text/plain', 'Certificat introuvable'); }
  }
  if (p === '/') p = '/index.html';
  const safe = path.normalize(p).replace(/^(\.\.[\\/])+/, '');
  const file = path.join(ROOT, safe);
  if (!file.startsWith(ROOT)) return send(res, 403, 'text/plain', 'Interdit');
  serveFile(req, res, file);
};

// --- Petit serveur HTTP : page pour installer le certificat sur l'iPad ---
const certPage = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Installer le certificat</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:540px;margin:0 auto;padding:24px;background:#0d1117;color:#e6edf3;line-height:1.6">
<h2>🔐 Installer le certificat (1 seule fois)</h2>
<p>Indispensable pour que le <b>micro</b> fonctionne sur l'iPad.</p>
<p><a href="/certificat" style="display:block;text-align:center;background:#3b82f6;color:#fff;padding:18px;border-radius:14px;font-size:19px;font-weight:700;text-decoration:none">1) Télécharger le certificat</a></p>
<ol>
<li>Touche le bouton bleu → <b>Autoriser</b> le téléchargement du profil.</li>
<li>Ouvre <b>Réglages</b> → en haut « <b>Profil téléchargé</b> » → <b>Installer</b>.</li>
<li><b style="color:#f59e0b">ÉTAPE CLÉ</b> : Réglages → Général → Informations → tout en bas
<b>Réglages de confiance des certificats</b> → <b>active l'interrupteur</b>.</li>
<li>Ouvre l'app : <b>https://${IP}:${PORT}</b></li>
</ol>
<p style="color:#8b97a7;font-size:14px">Si tu avais déjà installé un ancien certificat, supprime-le d'abord
(Réglages → Général → VPN et gestion de l'appareil → supprime l'ancien profil), puis refais ces étapes.</p>
</body></html>`;
const certHandler = (req, res) => {
  const p = (req.url.split('?')[0]) || '/';
  if (p === '/certificat' || p === '/cert' || p.endsWith('.crt')) {
    try { return send(res, 200, MIME['.crt'], fs.readFileSync(CRT_IPAD)); }
    catch (e) { return send(res, 404, 'text/plain', 'Certificat introuvable'); }
  }
  send(res, 200, 'text/html; charset=utf-8', certPage);
};

https.createServer({ key: fs.readFileSync(KEY), cert: fs.readFileSync(CERT) }, appHandler)
  .listen(PORT, '0.0.0.0', () => {
    http.createServer(certHandler).listen(CERT_PORT, '0.0.0.0', () => {});
    console.log('=========================================================');
    console.log('  🎵  Musique Magasin — serveur local démarré');
    if (regenerated) {
      console.log('');
      console.log('  ⚠️  CERTIFICAT (RE)GÉNÉRÉ — tu DOIS le réinstaller sur l\'iPad.');
    }
    console.log('');
    console.log('  1) Installer le certificat sur l\'iPad, ouvre dans Safari :');
    console.log('         http://' + IP + ':' + CERT_PORT);
    console.log('');
    console.log('  2) Puis ouvre l\'app (AVEC https://) :');
    console.log('         https://' + IP + ':' + PORT);
    if (ALL.length > 1) {
      console.log('');
      console.log('  Autres adresses possibles de ce PC :');
      for (const x of ALL.slice(1)) console.log('         https://' + x.addr + ':' + PORT + '   (' + x.name + ')');
    }
    console.log('');
    console.log('  Rappels : iPad + PC sur le MÊME Wi-Fi · laisse cette fenêtre ouverte.');
    console.log('=========================================================');
  });
