/* ══════════════════════════════════════════════════════════════════
   PRE-TEST BIMTEK eMonDAK — logika aplikasi

   Susunan berkas ini:
     1. Perkakas kecil (escape, acak, waktu, SHA-256)
     2. Latar video hero
     3. Penyimpanan sesi peserta (tahan muat ulang halaman)
     4. Perute halaman (#/…)
     5. Halaman: Cara Ikut, Masuk, Ujian, Hasil, Peringkat, Admin, Bantuan
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const K = window.KONFIG || {};
  const BANK = window.SOAL_PRETEST || [];
  const VIDEO_HERO = 'https://cdn.sceneai.art/Hero%20section%20video%20file%20(2)/1aafa16f-30a9-48c5-8964-78cffbad914e.mp4';

  const $ = (sel, induk) => (induk || document).querySelector(sel);
  const halaman = $('#halaman');
  const hero = $('#beranda');

  /* ── 1. Perkakas ─────────────────────────────────────────────── */

  const aman = (t) => String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function acak(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const HURUF = ['A', 'B', 'C', 'D', 'E', 'F'];

  function mmss(detik) {
    const d = Math.max(0, Math.round(detik));
    const m = Math.floor(d / 60);
    return String(m).padStart(2, '0') + ':' + String(d % 60).padStart(2, '0');
  }

  function tanggalIndo(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // SHA-256: pakai Web Crypto bila tersedia; bila tidak (mis. halaman
  // dibuka lewat file://), jatuh ke penghitungan murni JavaScript.
  async function sha256(teks) {
    if (window.crypto && window.crypto.subtle) {
      try {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(teks));
        return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) { /* lanjut ke cadangan */ }
    }
    return sha256Murni(teks);
  }

  function sha256Murni(pesan) {
    const K256 = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];

    const byte = [];
    for (const ch of unescape(encodeURIComponent(pesan))) byte.push(ch.charCodeAt(0));
    const bitLen = byte.length * 8;
    byte.push(0x80);
    while (byte.length % 64 !== 56) byte.push(0);
    for (let i = 7; i >= 0; i--) byte.push(Math.floor(bitLen / Math.pow(2, i * 8)) & 0xff);

    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    const w = new Array(64);

    for (let p = 0; p < byte.length; p += 64) {
      for (let i = 0; i < 16; i++) {
        w[i] = (byte[p + i * 4] << 24) | (byte[p + i * 4 + 1] << 16)
             | (byte[p + i * 4 + 2] << 8) | byte[p + i * 4 + 3];
      }
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K256[i] + w[i]) | 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0;
        d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H = H.map((x, i) => (x + [a, b, c, d, e, f, g, h][i]) | 0);
    }
    return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }

  /* ── 2. Latar video hero ─────────────────────────────────────── */

  (function nyalakanVideo() {
    const v = $('.hero-video');
    if (!v) return;
    v.muted = true;
    v.src = VIDEO_HERO;
    const jalan = () => v.play().catch(() => {});
    jalan();
    v.addEventListener('pause', jalan);
    window.addEventListener('load', jalan);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) jalan(); });
  })();

  /* ── 3. Sesi peserta ─────────────────────────────────────────── */

  const KUNCI_SESI = 'pretest_sesi_v1';
  const KUNCI_HASIL = 'pretest_hasil_v1';
  let sesi = null;   // { peserta, butir[], jawaban{}, mulai }
  let hasil = null;  // { skor, benar, total, durasiDetik, rincian[], peserta }
  let jamId = null;

  function muatSesi() {
    try { sesi = JSON.parse(sessionStorage.getItem(KUNCI_SESI)) || null; } catch { sesi = null; }
    try { hasil = JSON.parse(sessionStorage.getItem(KUNCI_HASIL)) || null; } catch { hasil = null; }
  }
  function simpanSesi() {
    if (sesi) sessionStorage.setItem(KUNCI_SESI, JSON.stringify(sesi));
    else sessionStorage.removeItem(KUNCI_SESI);
  }
  function simpanHasilSesi() {
    if (hasil) sessionStorage.setItem(KUNCI_HASIL, JSON.stringify(hasil));
    else sessionStorage.removeItem(KUNCI_HASIL);
  }

  function soalDari(id) { return BANK.find(s => s.id === id); }

  // Undi butir: satu wakil per grup, lalu diacak dan dipotong sebanyak
  // jumlahSoal. Urutan opsi tiap butir ikut diacak bila diminta.
  function undiButir() {
    const perGrup = new Map();
    for (const s of BANK) {
      const g = s.grup || s.id;
      if (!perGrup.has(g)) perGrup.set(g, []);
      perGrup.get(g).push(s);
    }
    const wakil = [...perGrup.values()].map(daftar => daftar[Math.floor(Math.random() * daftar.length)]);
    const jumlah = Math.min(K.jumlahSoal || 20, wakil.length);
    return acak(wakil).slice(0, jumlah).map(s => ({
      id: s.id,
      urut: K.acakOpsi === false ? s.o.map((_, i) => i) : acak(s.o.map((_, i) => i))
    }));
  }

  /* ── 4. Perute ───────────────────────────────────────────────── */

  const RUTE = {
    '#/': null,               // beranda = hero
    '#/cara': halamanCara,
    '#/masuk': halamanMasuk,
    '#/tes': halamanTes,
    '#/hasil': halamanHasil,
    '#/peringkat': halamanPeringkat,
    '#/admin': halamanAdmin,
    '#/bantuan': halamanBantuan
  };

  function ke(rute) {
    if (location.hash === rute) render();
    else location.hash = rute;
  }

  function render() {
    if (jamId) { clearInterval(jamId); jamId = null; }
    const rute = location.hash || '#/';
    const fn = RUTE[rute];

    if (!fn) {
      hero.hidden = false;
      halaman.hidden = true;
      halaman.innerHTML = '';
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    hero.hidden = true;
    halaman.hidden = false;
    halaman.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'auto' });
    fn();
  }

  function kop(judul) {
    return `
      <header class="kop">
        <a class="merek" href="#/">
          <span class="merek-teks">
            <strong>eMon<span class="kuning">DAK</span></strong>
            <small>${aman(judul || 'Pre-Test BIMTEK')}</small>
          </span>
        </a>
        <div class="nav-kanan">
          <a href="#/cara">Cara Ikut</a>
          <a href="#/peringkat">Peringkat</a>
          <a href="#/admin">Admin</a>
          <a href="#/bantuan">Bantuan</a>
          <a class="tombol-kaca" href="#/">Beranda</a>
        </div>
      </header>`;
  }

  /* ── 5a. Halaman: Cara Ikut ──────────────────────────────────── */

  function halamanCara() {
    halaman.innerHTML = kop('Cara Ikut') + `
      <div class="wadah">
        <div class="label-sudut">Panduan Peserta</div>
        <h1 class="judul-halaman">Empat langkah, <em>selesai dalam ${K.batasMenit || 25} menit</em></h1>
        <p class="ket-halaman">
          Pre-test ini mengukur pemahaman awal Anda tentang aplikasi eMonitoring DAK
          sebelum materi bimtek dimulai. Tidak ada nilai minimal kelulusan — hasilnya
          dipakai penyelenggara untuk menakar titik berat pembahasan di kelas.
        </p>
        <ol class="langkah">
          <li><strong>Siapkan token</strong>Token dibagikan panitia di kelas atau lewat grup WhatsApp angkatan. Tanpa token, halaman ujian tidak terbuka.</li>
          <li><strong>Isi identitas</strong>Nama lengkap, email aktif, dan instansi asal. Tidak ada kata sandi — email Anda sekaligus menjadi penanda peserta.</li>
          <li><strong>Kerjakan ${K.jumlahSoal || 20} soal</strong>Pilihan ganda, ${K.batasMenit ? 'berbatas waktu ' + K.batasMenit + ' menit' : 'tanpa batas waktu'}. Jawaban tersimpan otomatis, jadi halaman boleh dimuat ulang tanpa kehilangan progres.</li>
          <li><strong>Lihat nilai &amp; peringkat</strong>Nilai, pembahasan, dan posisi Anda di papan peringkat muncul segera setelah lembar jawaban dikirim.</li>
        </ol>
        <p class="ket-halaman" style="margin-top:22px">
          Satu email hanya dapat mengerjakan <b>satu kali</b>. Bila terjadi kendala,
          hubungi panitia lewat halaman <a href="#/bantuan">Bantuan</a>.
        </p>
        <a class="btn btn-kuning" href="#/masuk">Mulai sekarang</a>
      </div>`;
  }

  /* ── 5b. Halaman: Masuk ──────────────────────────────────────── */

  function halamanMasuk() {
    halaman.innerHTML = kop('Masuk Peserta') + `
      <div class="wadah wadah-sempit">
        <div class="label-sudut">Identitas Peserta</div>
        <h1 class="judul-halaman">Masuk tanpa <em>kata sandi</em></h1>
        <p class="ket-halaman">
          Cukup nama, email, instansi asal, dan token dari panitia.
        </p>
        <div class="kartu">
          <form class="formulir" id="formMasuk" novalidate>
            <div class="kolom">
              <label for="fNama">Nama lengkap</label>
              <input id="fNama" name="nama" type="text" autocomplete="name" placeholder="mis. Budi Santoso, S.T." required />
            </div>
            <div class="kolom">
              <label for="fEmail">Email aktif</label>
              <input id="fEmail" name="email" type="email" autocomplete="email" placeholder="nama@instansi.go.id" required />
              <span class="petunjuk">Dipakai sebagai penanda peserta — satu email satu kali kerjakan.</span>
            </div>
            <div class="kolom">
              <label for="fInstansi">Instansi asal</label>
              <input id="fInstansi" name="instansi" type="text" placeholder="mis. Dinas PUPR Kab. Deli Serdang" required />
            </div>
            <div class="kolom">
              <label for="fToken">Token bimtek</label>
              <input id="fToken" name="token" type="text" autocapitalize="characters" spellcheck="false" placeholder="mis. BIMTEK2026" required />
              <span class="petunjuk">Dibagikan panitia di kelas.</span>
            </div>
            <button class="btn btn-biru btn-blok" type="submit" id="btnMasuk">Masuk &amp; mulai mengerjakan</button>
          </form>
          <div id="pesanMasuk"></div>
        </div>
      </div>`;

    const form = $('#formMasuk');
    const kotakPesan = $('#pesanMasuk');
    const tombol = $('#btnMasuk');

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      kotakPesan.innerHTML = '';

      const nama = form.nama.value.trim();
      const email = form.email.value.trim();
      const instansi = form.instansi.value.trim();
      const token = form.token.value.trim();

      const galat = (t) => {
        kotakPesan.innerHTML = `<div class="pesan pesan-galat">${t}</div>`;
        tombol.disabled = false;
        tombol.textContent = 'Masuk & mulai mengerjakan';
      };

      if (nama.length < 3) return galat('Nama lengkap belum diisi dengan benar.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return galat('Alamat email belum benar.');
      if (instansi.length < 3) return galat('Instansi asal belum diisi.');

      const daftarToken = (K.tokenPeserta || []).map(t => String(t).trim().toLowerCase());
      if (!daftarToken.includes(token.toLowerCase())) {
        return galat('Token tidak dikenali. Periksa kembali token yang dibagikan panitia.');
      }

      tombol.disabled = true;
      tombol.textContent = 'Memeriksa…';

      try {
        if (await window.DB.emailSudahIkut(email)) {
          return galat('Email ini sudah pernah mengerjakan pre-test. ' +
            'Lihat posisi Anda di <a href="#/peringkat">papan peringkat</a>.');
        }
      } catch (e) {
        console.warn('[masuk] gagal memeriksa email:', e);
      }

      sesi = {
        peserta: { nama, email, instansi, token },
        butir: undiButir(),
        jawaban: {},
        indeks: 0,
        mulai: Date.now()
      };
      hasil = null;
      simpanHasilSesi();
      simpanSesi();
      ke('#/tes');
    });
  }

  /* ── 5c. Halaman: Ujian ──────────────────────────────────────── */

  function halamanTes() {
    if (!sesi) { ke('#/masuk'); return; }

    halaman.innerHTML = kop('Lembar Ujian') + `
      <div class="wadah">
        <div class="bilah-ujian">
          <div>
            <div class="label-sudut" style="margin-bottom:4px">${aman(K.namaSesi || 'Pre-Test')}</div>
            <div style="font-size:14px;color:var(--teks-lembut)">
              ${aman(sesi.peserta.nama)} — ${aman(sesi.peserta.instansi)}
            </div>
          </div>
          <div class="jam" id="jam">${K.batasMenit ? '--:--' : '00:00'}</div>
        </div>
        <div class="rel"><span id="rel" style="width:0%"></span></div>
        <div class="kartu" id="kartuSoal"></div>
        <div class="peta-soal" id="petaSoal"></div>
      </div>`;

    gambarSoal();
    jalankanJam();
  }

  function gambarSoal() {
    const total = sesi.butir.length;
    const i = Math.min(sesi.indeks, total - 1);
    const butir = sesi.butir[i];
    const s = soalDari(butir.id);
    const dijawab = Object.keys(sesi.jawaban).length;
    const pilihSekarang = sesi.jawaban[butir.id];

    $('#rel').style.width = Math.round((dijawab / total) * 100) + '%';

    $('#kartuSoal').innerHTML = `
      <div class="nomor-soal">Soal ${i + 1} dari ${total} &nbsp;·&nbsp; terjawab ${dijawab}</div>
      <p class="teks-soal">${aman(s.q)}</p>
      <div class="opsi-daftar" id="opsiDaftar">
        ${butir.urut.map((asli, n) => `
          <button type="button" class="opsi${pilihSekarang === asli ? ' terpilih' : ''}" data-asli="${asli}">
            <span class="huruf">${HURUF[n]}</span>
            <span>${aman(s.o[asli])}</span>
          </button>`).join('')}
      </div>
      <div class="navigasi-soal">
        <button class="btn btn-hantu" id="btnMundur"${i === 0 ? ' disabled' : ''}>← Sebelumnya</button>
        ${i === total - 1
          ? `<button class="btn btn-kuning" id="btnKirim">Kumpulkan lembar jawaban</button>`
          : `<button class="btn btn-biru" id="btnMaju">Berikutnya →</button>`}
      </div>`;

    $('#opsiDaftar').addEventListener('click', (ev) => {
      const tombol = ev.target.closest('.opsi');
      if (!tombol) return;
      sesi.jawaban[butir.id] = Number(tombol.dataset.asli);
      simpanSesi();
      if (i < sesi.butir.length - 1) { sesi.indeks = i + 1; simpanSesi(); gambarSoal(); }
      else gambarSoal();
    });

    const mundur = $('#btnMundur');
    if (mundur) mundur.onclick = () => { sesi.indeks = i - 1; simpanSesi(); gambarSoal(); };
    const maju = $('#btnMaju');
    if (maju) maju.onclick = () => { sesi.indeks = i + 1; simpanSesi(); gambarSoal(); };
    const kirim = $('#btnKirim');
    if (kirim) kirim.onclick = () => mintaKumpulkan(false);

    $('#petaSoal').innerHTML = sesi.butir.map((b, n) => `
      <button type="button" data-n="${n}"
        class="${n === i ? 'kini' : (sesi.jawaban[b.id] != null ? 'isi' : '')}"
        title="Soal ${n + 1}">${n + 1}</button>`).join('');
    $('#petaSoal').onclick = (ev) => {
      const t = ev.target.closest('button');
      if (!t) return;
      sesi.indeks = Number(t.dataset.n);
      simpanSesi();
      gambarSoal();
    };
  }

  function jalankanJam() {
    const kotak = $('#jam');
    if (!kotak) return;
    const batasDetik = (K.batasMenit || 0) * 60;

    const tik = () => {
      const lewat = (Date.now() - sesi.mulai) / 1000;
      if (batasDetik > 0) {
        const sisa = batasDetik - lewat;
        kotak.textContent = mmss(sisa);
        kotak.classList.toggle('mepet', sisa <= 120);
        if (sisa <= 0) {
          clearInterval(jamId); jamId = null;
          mintaKumpulkan(true);
        }
      } else {
        kotak.textContent = mmss(lewat);
      }
    };
    tik();
    jamId = setInterval(tik, 1000);
  }

  function mintaKumpulkan(otomatis) {
    const belum = sesi.butir.filter(b => sesi.jawaban[b.id] == null).length;
    if (!otomatis && belum > 0) {
      const lanjut = confirm(`Masih ada ${belum} soal yang belum dijawab.\n` +
        'Soal yang kosong dihitung salah. Tetap kumpulkan sekarang?');
      if (!lanjut) return;
    }
    kumpulkan(otomatis);
  }

  async function kumpulkan(otomatis) {
    if (jamId) { clearInterval(jamId); jamId = null; }
    const tombol = $('#btnKirim');
    if (tombol) { tombol.disabled = true; tombol.textContent = 'Mengirim…'; }

    const rincian = sesi.butir.map(b => {
      const s = soalDari(b.id);
      const pilih = sesi.jawaban[b.id];
      return {
        id: b.id,
        pilih: pilih == null ? -1 : pilih,
        benar: pilih === s.a
      };
    });
    const benar = rincian.filter(r => r.benar).length;
    const total = rincian.length;
    const skor = Math.round((benar / total) * 100);
    const durasiDetik = Math.round((Date.now() - sesi.mulai) / 1000);
    const p = sesi.peserta;

    const rekaman = {
      nama: p.nama,
      email: p.email,
      emailKunci: p.email.trim().toLowerCase(),
      instansi: p.instansi,
      token: p.token.toUpperCase(),
      sesiNama: K.namaSesi || 'Pre-Test',
      tahun: K.tahun || new Date().getFullYear(),
      skor, benar, total, durasiDetik,
      otomatis: !!otomatis,
      waktuSelesai: new Date().toISOString(),
      jawaban: rincian
    };

    let tersimpan = true;
    try {
      await window.DB.simpan(rekaman);
    } catch (e) {
      console.error('[kumpulkan] gagal menyimpan:', e);
      tersimpan = false;
    }

    hasil = { ...rekaman, tersimpan, otomatis: !!otomatis };
    simpanHasilSesi();
    sesi = null;
    simpanSesi();
    ke('#/hasil');
  }

  /* ── 5d. Halaman: Hasil ──────────────────────────────────────── */

  function halamanHasil() {
    if (!hasil) { ke('#/masuk'); return; }
    const h = hasil;
    const salah = h.total - h.benar;

    halaman.innerHTML = kop('Hasil Pre-Test') + `
      <div class="wadah">
        <div class="label-sudut">Lembar Jawaban Terkirim</div>
        <h1 class="judul-halaman">Terima kasih, <em>${aman(h.nama.split(' ')[0])}</em></h1>
        <p class="ket-halaman">${aman(h.instansi)} · ${aman(tanggalIndo(h.waktuSelesai))}</p>

        ${h.otomatis ? '<div class="pesan pesan-info" style="margin-bottom:18px">Waktu habis — lembar jawaban dikumpulkan otomatis.</div>' : ''}
        ${h.tersimpan ? '' : '<div class="pesan pesan-galat" style="margin-bottom:18px">Nilai Anda gagal dikirim ke server (jaringan bermasalah). Tunjukkan layar ini ke panitia sebelum menutup halaman.</div>'}

        <div class="kartu" style="text-align:center">
          <div class="skor-besar">${h.skor}</div>
          <div class="skor-ket">nilai akhir dari 100</div>
          <div class="grid-statistik">
            <div class="statistik"><div class="angka">${h.benar}</div><div class="nama">Jawaban benar</div></div>
            <div class="statistik"><div class="angka">${salah}</div><div class="nama">Jawaban salah</div></div>
            <div class="statistik"><div class="angka">${h.total}</div><div class="nama">Total soal</div></div>
            <div class="statistik"><div class="angka">${mmss(h.durasiDetik)}</div><div class="nama">Waktu kerja</div></div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
            <a class="btn btn-kuning" href="#/peringkat">Lihat papan peringkat</a>
            <button class="btn btn-hantu" onclick="window.print()">Cetak / simpan PDF</button>
          </div>
        </div>

        <h2 class="judul-halaman" style="font-size:20px;margin:34px 0 14px">Pembahasan</h2>
        <div class="bahasan">
          ${h.jawaban.map((r, n) => {
            const s = soalDari(r.id);
            if (!s) return '';
            const jawabTeks = r.pilih >= 0 ? s.o[r.pilih] : 'Tidak dijawab';
            return `
              <div class="butir${r.benar ? ' tepat' : ''}">
                <div class="tanya">${n + 1}. ${aman(s.q)}</div>
                <div class="baris kunci">Kunci: <b>${aman(s.o[s.a])}</b></div>
                ${r.benar ? '' : `<div class="baris jawab-salah">Jawaban Anda: <b>${aman(jawabTeks)}</b></div>`}
                <div class="catatan">${aman(s.bahas || '')}</div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  /* ── 5e. Papan peringkat ─────────────────────────────────────── */

  function urutkan(daftar) {
    return daftar.slice().sort((a, b) =>
      (b.skor - a.skor) ||
      (a.durasiDetik - b.durasiDetik) ||
      String(a.waktuSelesai).localeCompare(String(b.waktuSelesai)));
  }

  function svgTropi(jenis) {
    const warna = {
      emas:     ['#ffe487', '#ffc72c', '#b8860b'],
      perak:    ['#ffffff', '#d6dee8', '#8d9aab'],
      perunggu: ['#f3c197', '#cd7f32', '#7d4318']
    }[jenis] || ['#ffffff', '#d6dee8', '#8d9aab'];
    const id = 'grad-' + jenis;
    return `
      <svg class="tropi" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${warna[0]}"/>
            <stop offset="55%" stop-color="${warna[1]}"/>
            <stop offset="100%" stop-color="${warna[2]}"/>
          </linearGradient>
        </defs>
        <path d="M20 8h24v14c0 7.2-5.4 13-12 13S20 29.2 20 22V8z" fill="url(#${id})"/>
        <path d="M20 12h-6a8 8 0 0 0 8 8" stroke="url(#${id})" stroke-width="3" stroke-linecap="round"/>
        <path d="M44 12h6a8 8 0 0 1-8 8" stroke="url(#${id})" stroke-width="3" stroke-linecap="round"/>
        <path d="M29 35h6v7h-6z" fill="url(#${id})"/>
        <path d="M20 42h24v5H20z" fill="url(#${id})"/>
        <path d="M16 47h32v6H16z" fill="url(#${id})"/>
        <path d="m32 14 2.1 4.4 4.9.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.9-.7L32 14z" fill="#06121f" opacity=".45"/>
      </svg>`;
  }

  async function halamanPeringkat() {
    halaman.innerHTML = kop('Papan Peringkat') + `
      <div class="wadah">
        <div class="label-sudut">Papan Peringkat</div>
        <h1 class="judul-halaman">Juara <em>pre-test</em> ${aman(String(K.tahun || ''))}</h1>
        <p class="ket-halaman">Urutan disusun dari nilai tertinggi; bila nilai sama, waktu pengerjaan tercepat yang unggul.</p>
        <div id="isiPeringkat" class="kosong">Memuat data…</div>
      </div>`;

    if (K.peringkatTerbuka === false && sessionStorage.getItem('pretest_admin') !== 'ya') {
      $('#isiPeringkat').outerHTML =
        '<div class="pesan pesan-info">Papan peringkat baru dibuka oleh penyelenggara.</div>';
      return;
    }

    let daftar = [];
    try { daftar = urutkan(await window.DB.ambilSemua()); }
    catch (e) {
      $('#isiPeringkat').outerHTML =
        '<div class="pesan pesan-galat">Data peringkat gagal dimuat. Periksa sambungan internet lalu muat ulang halaman.</div>';
      return;
    }

    if (!daftar.length) {
      $('#isiPeringkat').outerHTML =
        '<div class="kartu"><div class="kosong">Belum ada peserta yang mengumpulkan lembar jawaban.</div></div>';
      return;
    }

    const medali = K.medali || ['emas', 'perak', 'perunggu'];
    const tigaBesar = daftar.slice(0, 3);

    // Urutan DOM tetap juara 1-2-3 supaya di ponsel terbaca berurutan; di layar
    // lebar CSS yang menggeser juara 1 ke tengah (lihat .podium .juara1).
    const mimbar = tigaBesar.map((p, i) => {
      if (!p) return '';
      const jenis = medali[i] || 'perak';
      return `
        <div class="mimbar juara${i + 1} ${jenis}">
          ${svgTropi(jenis)}
          <div class="nama-juara">${aman(p.nama)}</div>
          <div class="instansi-juara">${aman(p.instansi)}</div>
          <div class="nilai-juara">${p.skor}</div>
          <div class="sebutan">Juara ${i + 1} · tropi ${jenis}</div>
        </div>`;
    }).join('');

    $('#isiPeringkat').outerHTML = `
      <div class="podium">${mimbar}</div>
      <div class="tabel-bungkus">
        <table class="tabel">
          <thead>
            <tr><th>#</th><th>Nama</th><th>Instansi</th><th class="angka">Nilai</th><th class="angka">Benar</th><th class="angka">Waktu</th><th>Dikumpulkan</th></tr>
          </thead>
          <tbody>
            ${daftar.map((p, n) => `
              <tr>
                <td class="peringkat-nomor">${n + 1}</td>
                <td class="bebas">${aman(p.nama)}</td>
                <td class="bebas">${aman(p.instansi)}</td>
                <td class="angka">${p.skor}</td>
                <td class="angka">${p.benar}/${p.total}</td>
                <td class="angka">${mmss(p.durasiDetik)}</td>
                <td>${aman(tanggalIndo(p.waktuSelesai))}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <p class="ket-halaman" style="margin-top:14px">${daftar.length} peserta telah mengerjakan.</p>`;
  }

  /* ── 5f. Halaman: Admin ──────────────────────────────────────── */

  function halamanAdmin() {
    if (sessionStorage.getItem('pretest_admin') === 'ya') { papanAdmin(); return; }

    halaman.innerHTML = kop('Ruang Admin') + `
      <div class="wadah wadah-sempit">
        <div class="label-sudut">Khusus Penyelenggara</div>
        <h1 class="judul-halaman">Masuk <em>ruang admin</em></h1>
        <p class="ket-halaman">Masukkan token admin untuk melihat jumlah peserta, rekap nilai, dan analisis butir soal.</p>
        <div class="kartu">
          <form class="formulir" id="formAdmin" novalidate>
            <div class="kolom">
              <label for="fTokenAdmin">Token admin</label>
              <input id="fTokenAdmin" type="password" autocomplete="off" placeholder="••••••••••" required />
            </div>
            <button class="btn btn-biru btn-blok" type="submit">Buka papan admin</button>
          </form>
          <div id="pesanAdmin"></div>
        </div>
      </div>`;

    $('#formAdmin').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const isi = $('#fTokenAdmin').value.trim();
      const cap = await sha256(isi);
      if (cap === (K.hashAdmin || '').toLowerCase()) {
        sessionStorage.setItem('pretest_admin', 'ya');
        papanAdmin();
      } else {
        $('#pesanAdmin').innerHTML = '<div class="pesan pesan-galat">Token admin salah.</div>';
      }
    });
  }

  async function papanAdmin() {
    halaman.innerHTML = kop('Ruang Admin') + `
      <div class="wadah">
        <div class="bilah-ujian">
          <div>
            <div class="label-sudut" style="margin-bottom:4px">Ruang Admin</div>
            <h1 class="judul-halaman" style="margin:0">Rekap <em>${aman(K.namaSesi || 'Pre-Test')}</em></h1>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-hantu" id="btnMuatUlang">Muat ulang</button>
            <button class="btn btn-kuning" id="btnUnduh">Unduh CSV</button>
            <button class="btn btn-hantu" id="btnKeluarAdmin">Keluar</button>
          </div>
        </div>
        <div id="isiAdmin" class="kosong">Memuat data…</div>
      </div>`;

    $('#btnKeluarAdmin').onclick = () => { sessionStorage.removeItem('pretest_admin'); ke('#/'); };
    $('#btnMuatUlang').onclick = () => papanAdmin();

    let daftar = [];
    try { daftar = urutkan(await window.DB.ambilSemua()); }
    catch (e) {
      $('#isiAdmin').outerHTML = '<div class="pesan pesan-galat">Data gagal dimuat: ' + aman(e.message) + '</div>';
      return;
    }

    $('#btnUnduh').onclick = () => unduhCsv(daftar);

    if (!daftar.length) {
      $('#isiAdmin').outerHTML = '<div class="kartu"><div class="kosong">Belum ada peserta yang mengumpulkan lembar jawaban.</div></div>';
      return;
    }

    const jumlah = daftar.length;
    const instansi = new Set(daftar.map(p => (p.instansi || '').trim().toLowerCase())).size;
    const rata = Math.round(daftar.reduce((t, p) => t + (p.skor || 0), 0) / jumlah);
    const tertinggi = Math.max(...daftar.map(p => p.skor || 0));
    const terendah = Math.min(...daftar.map(p => p.skor || 0));
    const rataDurasi = Math.round(daftar.reduce((t, p) => t + (p.durasiDetik || 0), 0) / jumlah);

    // analisis butir: berapa persen peserta menjawab benar tiap soal
    const butir = BANK.map(s => {
      let muncul = 0, tepat = 0;
      for (const p of daftar) {
        const r = (p.jawaban || []).find(x => x.id === s.id);
        if (!r) continue;
        muncul++;
        if (r.benar) tepat++;
      }
      return { id: s.id, q: s.q, muncul, tepat, persen: muncul ? Math.round((tepat / muncul) * 100) : null };
    }).filter(b => b.muncul > 0).sort((a, b) => a.persen - b.persen);

    $('#isiAdmin').outerHTML = `
      <div class="grid-statistik">
        <div class="statistik"><div class="angka">${jumlah}</div><div class="nama">Peserta mengisi</div></div>
        <div class="statistik"><div class="angka">${instansi}</div><div class="nama">Instansi</div></div>
        <div class="statistik"><div class="angka">${rata}</div><div class="nama">Rata-rata nilai</div></div>
        <div class="statistik"><div class="angka">${tertinggi}</div><div class="nama">Nilai tertinggi</div></div>
        <div class="statistik"><div class="angka">${terendah}</div><div class="nama">Nilai terendah</div></div>
        <div class="statistik"><div class="angka">${mmss(rataDurasi)}</div><div class="nama">Rata-rata waktu</div></div>
      </div>

      <div class="kolom" style="max-width:340px;margin:22px 0 12px">
        <label for="cari">Cari nama / instansi / email</label>
        <input id="cari" type="search" placeholder="ketik untuk menyaring…" />
      </div>

      <div class="tabel-bungkus">
        <table class="tabel" id="tabelAdmin">
          <thead>
            <tr><th>#</th><th>Nama</th><th>Email</th><th>Instansi</th><th>Token</th>
                <th class="angka">Nilai</th><th class="angka">Benar</th><th class="angka">Waktu</th><th>Dikumpulkan</th></tr>
          </thead>
          <tbody>
            ${daftar.map((p, n) => `
              <tr data-cari="${aman(((p.nama || '') + ' ' + (p.instansi || '') + ' ' + (p.email || '')).toLowerCase())}">
                <td class="peringkat-nomor">${n + 1}</td>
                <td class="bebas">${aman(p.nama)}</td>
                <td>${aman(p.email)}</td>
                <td class="bebas">${aman(p.instansi)}</td>
                <td>${aman(p.token)}</td>
                <td class="angka">${p.skor}</td>
                <td class="angka">${p.benar}/${p.total}</td>
                <td class="angka">${mmss(p.durasiDetik)}</td>
                <td>${aman(tanggalIndo(p.waktuSelesai))}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <h2 class="judul-halaman" style="font-size:20px;margin:34px 0 6px">Analisis butir soal</h2>
      <p class="ket-halaman">Diurutkan dari yang paling banyak dijawab salah — bahan penekanan materi di kelas.</p>
      <div class="tabel-bungkus">
        <table class="tabel">
          <thead><tr><th>Kode</th><th>Pertanyaan</th><th class="angka">Muncul</th><th class="angka">Benar</th><th class="angka">% Benar</th></tr></thead>
          <tbody>
            ${butir.map(b => `
              <tr>
                <td>${aman(b.id)}</td>
                <td class="bebas">${aman(b.q)}</td>
                <td class="angka">${b.muncul}</td>
                <td class="angka">${b.tepat}</td>
                <td class="angka" style="color:${b.persen < 50 ? 'var(--salah)' : 'var(--benar)'}">${b.persen}%</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>

      ${window.DB.mode === 'lokal'
        ? `<div class="pesan pesan-info" style="margin-top:22px">
             Aplikasi sedang berjalan dalam mode lokal — data di atas hanya milik peramban ini.
             <button class="btn btn-hantu" id="btnBersih" style="margin-left:10px">Bersihkan data lokal</button>
           </div>`
        : ''}`;

    const cari = $('#cari');
    if (cari) {
      cari.oninput = () => {
        const kata = cari.value.trim().toLowerCase();
        for (const tr of document.querySelectorAll('#tabelAdmin tbody tr')) {
          tr.style.display = !kata || tr.dataset.cari.includes(kata) ? '' : 'none';
        }
      };
    }
    const bersih = $('#btnBersih');
    if (bersih) bersih.onclick = () => {
      if (confirm('Hapus seluruh data pre-test yang tersimpan di peramban ini?')) {
        window.DB.kosongkanLokal();
        papanAdmin();
      }
    };
  }

  function unduhCsv(daftar) {
    const baris = [[
      'Peringkat', 'Nama', 'Email', 'Instansi', 'Token',
      'Nilai', 'Benar', 'Total', 'Durasi (detik)', 'Durasi', 'Waktu Selesai'
    ]];
    daftar.forEach((p, n) => baris.push([
      n + 1, p.nama, p.email, p.instansi, p.token,
      p.skor, p.benar, p.total, p.durasiDetik, mmss(p.durasiDetik),
      tanggalIndo(p.waktuSelesai)
    ]));

    const csv = baris.map(r => r.map(sel => {
      const t = String(sel == null ? '' : sel);
      return /[",;\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    }).join(';')).join('\r\n');

    // BOM supaya huruf beraksen tampil benar saat dibuka di Excel
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stempel = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `rekap-pretest-bimtek-${stempel}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ── 5g. Halaman: Bantuan ────────────────────────────────────── */

  function halamanBantuan() {
    const wa = String(K.waPanitia || '').replace(/\D/g, '');
    halaman.innerHTML = kop('Bantuan') + `
      <div class="wadah wadah-sempit">
        <div class="label-sudut">Bantuan</div>
        <h1 class="judul-halaman">Ada kendala saat <em>mengerjakan</em>?</h1>
        <div class="kartu">
          <div class="langkah-tanya">
            <p class="ket-halaman"><b style="color:#fff">Token ditolak.</b><br>
              Pastikan tidak ada spasi di awal atau akhir. Token tidak membedakan huruf besar dan kecil.
              Bila masih ditolak, mintakan token yang berlaku ke panitia kelas.</p>
            <p class="ket-halaman"><b style="color:#fff">Email saya disebut sudah mengerjakan.</b><br>
              Satu email hanya bisa satu kali. Bila Anda merasa belum pernah mengisi, laporkan ke panitia
              agar datanya diperiksa.</p>
            <p class="ket-halaman"><b style="color:#fff">Halaman tertutup di tengah ujian.</b><br>
              Buka kembali alamat yang sama di peramban dan perangkat yang sama — jawaban serta sisa
              waktu Anda dipulihkan otomatis.</p>
            <p class="ket-halaman"><b style="color:#fff">Nilai gagal terkirim.</b><br>
              Layar hasil akan memberi tahu bila pengiriman gagal. Jangan tutup halaman; tunjukkan
              layar tersebut ke panitia.</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
            ${wa ? `<a class="btn btn-kuning" href="https://wa.me/${wa}" target="_blank" rel="noopener">Hubungi panitia via WhatsApp</a>` : ''}
            ${K.emailPanitia ? `<a class="btn btn-hantu" href="mailto:${aman(K.emailPanitia)}">Kirim email</a>` : ''}
          </div>
        </div>
        <p class="ket-halaman" style="margin-top:20px">
          ${aman(K.penyelenggara || '')}
        </p>
      </div>`;
  }

  /* ── Jalankan ────────────────────────────────────────────────── */

  muatSesi();
  window.addEventListener('hashchange', render);

  window.DB.init().then(mode => {
    const pita = $('#pitaLokal');
    if (pita) pita.hidden = mode !== 'lokal';
    render();
  });
})();
