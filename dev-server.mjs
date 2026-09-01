/* Peladen statis untuk pratinjau lokal.
   Jalankan:  node dev-server.mjs  lalu buka http://localhost:3900
   Dipakai supaya halaman terbuka lewat http:// (bukan file://) sehingga
   Firebase ikut aktif.

   Vercel tidak memakai berkas ini. Namanya sengaja BUKAN server.mjs dan ikut
   disebut di .vercelignore: dengan nama itu Vercel mengira proyeknya aplikasi
   Node, menjalankannya sebagai fungsi, lalu seluruh halaman balas 404 karena
   berkas statisnya tidak ikut dalam bundel. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT || 3900);

const TIPE = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let jalur = decodeURIComponent(url.pathname);
    if (jalur === '/' || jalur === '') jalur = '/index.html';

    const berkas = join(AKAR, normalize(jalur).replace(/^(\.\.[/\\])+/, ''));
    if (!berkas.startsWith(AKAR)) { res.writeHead(403).end('Terlarang'); return; }

    const isi = await readFile(berkas);
    res.writeHead(200, {
      'content-type': TIPE[extname(berkas).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    res.end(isi);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('404 — berkas tidak ditemukan');
  }
}).listen(PORT, () => {
  console.log(`Pre-Test BIMTEK eMonDAK → http://localhost:${PORT}`);
});
