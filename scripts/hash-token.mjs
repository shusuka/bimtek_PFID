/* Membuat sidik jari SHA-256 untuk token admin.
   Pakai:  node scripts/hash-token.mjs "TOKEN-BARU-ANDA"
   Tempel hasilnya ke  assets/konfig.js  pada baris  hashAdmin. */
import { createHash } from 'node:crypto';

const token = process.argv.slice(2).join(' ').trim();
if (!token) {
  console.error('Pakai: node scripts/hash-token.mjs "TOKEN-BARU-ANDA"');
  process.exit(1);
}

const cap = createHash('sha256').update(token, 'utf8').digest('hex');
console.log('\n  token     : ' + token);
console.log('  hashAdmin : "' + cap + '"\n');
