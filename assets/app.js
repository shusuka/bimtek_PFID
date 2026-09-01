/* ══════════════════════════════════════════════════════════════════
   PRE-TEST BIMTEK eMonDAK — logika aplikasi

   Alurnya:
     akun  →  lobi (token sesi + hitung mundur)  →  ujian  →  hasil
   Ujian dikerjakan serentak dalam jendela waktu yang dibuka admin,
   satu butir satu layar dengan hitung mundur dan poin kecepatan.

   Susunan berkas ini:
     1. Perkakas kecil (escape, acak, waktu, SHA-256, suara)
     2. Latar video hero
     3. Keadaan aplikasi (akun, sesi ujian) — tahan muat ulang halaman
     4. Perute halaman (#/…)
     5. Halaman: Cara Ikut, Akun, Lobi, Ujian, Hasil, Peringkat,
        Admin, Bantuan
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

  /* ── Daftar pemda seluruh Indonesia (assets/wilayah.js) ───────── */

  const WILAYAH = window.WILAYAH || {};
  const PEMDA = Object.entries(WILAYAH)
    .flatMap(([prov, daftar]) => daftar.map(nama => ({ nama, prov })));
  const PETA_PEMDA = new Map(PEMDA.map(p => [p.nama.toLowerCase(), p]));

  const pemdaSah = (nama) => PETA_PEMDA.has(String(nama || '').trim().toLowerCase());
  const provinsiDari = (nama) => {
    const p = PETA_PEMDA.get(String(nama || '').trim().toLowerCase());
    return p ? p.prov : '';
  };

  /* Kotak isian pemda yang bisa diketik lalu dipilih dari daftar.
     Dipakai di formulir akun; 552 pilihan terlalu banyak untuk <select>
     biasa, jadi daftarnya disaring sambil mengetik. */
  function pasangPilihPemda(kotakId, daftarId) {
    const kotak = document.getElementById(kotakId);
    const daftar = document.getElementById(daftarId);
    if (!kotak || !daftar) return;
    let sorot = -1;
    let tampil = [];

    const tutup = () => { daftar.hidden = true; sorot = -1; kotak.setAttribute('aria-expanded', 'false'); };

    const gambar = () => {
      const kata = kotak.value.trim().toLowerCase();
      tampil = (kata
        ? PEMDA.filter(p => p.nama.toLowerCase().includes(kata) || p.prov.toLowerCase().includes(kata))
        : PEMDA).slice(0, 60);
      if (!tampil.length) {
        daftar.innerHTML = '<div class="pilih-kosong">Tidak ada pemda yang cocok</div>';
      } else {
        daftar.innerHTML = tampil.map((p, i) => `
          <div class="pilih-item${i === sorot ? ' sorot' : ''}" data-i="${i}" role="option">
            ${aman(p.nama)}<small>${aman(p.prov)}</small>
          </div>`).join('');
      }
      daftar.hidden = false;
      kotak.setAttribute('aria-expanded', 'true');
    };

    const pilih = (i) => {
      if (!tampil[i]) return;
      kotak.value = tampil[i].nama;
      kotak.dataset.prov = tampil[i].prov;
      tutup();
    };

    kotak.addEventListener('focus', gambar);
    kotak.addEventListener('input', () => { sorot = -1; gambar(); });
    kotak.addEventListener('keydown', (ev) => {
      if (daftar.hidden) return;
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        sorot = Math.max(0, Math.min(tampil.length - 1, sorot + (ev.key === 'ArrowDown' ? 1 : -1)));
        gambar();
        const el = daftar.querySelector('.sorot');
        if (el) el.scrollIntoView({ block: 'nearest' });
      } else if (ev.key === 'Enter' && sorot >= 0) {
        ev.preventDefault();
        pilih(sorot);
      } else if (ev.key === 'Escape') {
        tutup();
      }
    });
    daftar.addEventListener('mousedown', (ev) => {
      const item = ev.target.closest('.pilih-item');
      if (!item) return;
      ev.preventDefault();
      pilih(Number(item.dataset.i));
    });
    kotak.addEventListener('blur', () => setTimeout(tutup, 120));
  }

  const BENTUK = ['▲', '◆', '●', '■'];
  const WARNA_UBIN = ['merah', 'biru', 'kuning', 'hijau'];

  function mmss(detik) {
    const d = Math.max(0, Math.round(detik));
    const m = Math.floor(d / 60);
    return String(m).padStart(2, '0') + ':' + String(d % 60).padStart(2, '0');
  }

  function hitungMundurPanjang(ms) {
    const d = Math.max(0, Math.round(ms / 1000));
    const jam = Math.floor(d / 3600);
    return (jam > 0 ? jam + ' jam ' : '') + mmss(d % 3600);
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

  // ISO → nilai untuk <input type="datetime-local"> (waktu setempat)
  function keInputWaktu(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  const angkaRapi = (n) => Number(n || 0).toLocaleString('id-ID');

  // Token peserta: 6 karakter huruf & angka, tanpa I O 0 1 supaya tidak salah
  // dibaca saat dituliskan di papan tulis atau dibacakan ke kelas.
  function tokenAcak(panjang) {
    const abjad = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const n = panjang || 6;
    const acakan = new Uint32Array(n);
    (window.crypto || {}).getRandomValues
      ? crypto.getRandomValues(acakan)
      : acakan.forEach((_, i) => { acakan[i] = Math.floor(Math.random() * 4294967296); });
    return Array.from(acakan, x => abjad[x % abjad.length]).join('');
  }

  /* ── Suara (mati secara bawaan) ──────────────────────────────── */

  const Suara = {
    get nyala() { return localStorage.getItem('pretest_suara') === '1'; },
    set nyala(v) { localStorage.setItem('pretest_suara', v ? '1' : '0'); },
    _ctx: null,
    nada(frek, lama, jenis) {
      if (!this.nyala) return;
      try {
        this._ctx = this._ctx || new (window.AudioContext || window.webkitAudioContext)();
        const o = this._ctx.createOscillator();
        const g = this._ctx.createGain();
        o.type = jenis || 'triangle';
        o.frequency.value = frek;
        g.gain.setValueAtTime(0.0001, this._ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.16, this._ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, this._ctx.currentTime + lama);
        o.connect(g).connect(this._ctx.destination);
        o.start();
        o.stop(this._ctx.currentTime + lama);
      } catch { /* peramban menolak audio — abaikan */ }
    },
    benar() { this.nada(880, .18); setTimeout(() => this.nada(1320, .22), 90); },
    salah() { this.nada(220, .3, 'sawtooth'); },
    tik()   { this.nada(1500, .05, 'square'); }
  };

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

  /* ── 3. Keadaan aplikasi ─────────────────────────────────────── */

  const KUNCI_AKUN_SAYA = 'pretest_akun_saya';
  const KUNCI_MAIN = 'pretest_main_v2';
  const KUNCI_HASIL_SESI = 'pretest_hasil_v2';

  let akun = null;    // { nama, email, instansi, jabatan }
  let main = null;    // keadaan ujian yang sedang berjalan
  let hasil = null;   // hasil terakhir
  let sesi = null;    // dokumen sesi dari Firestore
  let adminMasuk = null;  // akun panitia yang sedang masuk (Firebase Auth)
  let lepasPantau = null; // penghenti langganan onSnapshot halaman aktif
  let jamId = null;

  function muatKeadaan() {
    try { akun = JSON.parse(localStorage.getItem(KUNCI_AKUN_SAYA)) || null; } catch { akun = null; }
    try { main = JSON.parse(sessionStorage.getItem(KUNCI_MAIN)) || null; } catch { main = null; }
    try { hasil = JSON.parse(sessionStorage.getItem(KUNCI_HASIL_SESI)) || null; } catch { hasil = null; }
  }
  const simpanAkunLokal = () => akun
    ? localStorage.setItem(KUNCI_AKUN_SAYA, JSON.stringify(akun))
    : localStorage.removeItem(KUNCI_AKUN_SAYA);
  const simpanMain = () => main
    ? sessionStorage.setItem(KUNCI_MAIN, JSON.stringify(main))
    : sessionStorage.removeItem(KUNCI_MAIN);
  const simpanHasilSesi = () => hasil
    ? sessionStorage.setItem(KUNCI_HASIL_SESI, JSON.stringify(hasil))
    : sessionStorage.removeItem(KUNCI_HASIL_SESI);

  const soalDari = (id) => BANK.find(s => s.id === id);

  // Undi butir: satu wakil per grup soal kembar, lalu diacak dan dipotong.
  function undiButir(jumlah) {
    const perGrup = new Map();
    for (const s of BANK) {
      const g = s.grup || s.id;
      if (!perGrup.has(g)) perGrup.set(g, []);
      perGrup.get(g).push(s);
    }
    const wakil = [...perGrup.values()].map(d => d[Math.floor(Math.random() * d.length)]);
    return acak(wakil).slice(0, Math.min(jumlah || 20, wakil.length)).map(s => ({
      id: s.id,
      urut: acak(s.o.map((_, i) => i))
    }));
  }

  /* Keadaan sesi terhadap waktu sekarang. */
  function statusSesi(s) {
    if (!s) return { keadaan: 'kosong', teks: 'Belum ada sesi yang dijadwalkan panitia.' };
    const kini = Date.now();
    const mulai = s.mulai ? new Date(s.mulai).getTime() : null;
    const selesai = s.selesai ? new Date(s.selesai).getTime() : null;
    if (!s.aktif) return { keadaan: 'tutup', teks: 'Sesi belum dibuka panitia.' };
    if (mulai && kini < mulai) return { keadaan: 'menunggu', mulai, selesai, sisaMulai: mulai - kini };
    if (selesai && kini > selesai) return { keadaan: 'lewat', teks: 'Waktu sesi sudah berakhir.' };
    return { keadaan: 'buka', mulai, selesai, sisaTutup: selesai ? selesai - kini : null };
  }

  /* ── 4. Perute ───────────────────────────────────────────────── */

  const RUTE = {
    '#/': null,
    '#/cara': halamanCara,
    '#/akun': halamanAkun,
    '#/lobi': halamanLobi,
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
    if (lepasPantau) { lepasPantau(); lepasPantau = null; }

    const fn = RUTE[location.hash || '#/'];
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (!fn) {
      hero.hidden = false;
      halaman.hidden = true;
      halaman.innerHTML = '';
      return;
    }
    hero.hidden = true;
    halaman.hidden = false;
    halaman.innerHTML = '';
    fn();
  }

  function kop(judul, ringkas) {
    return `
      <header class="kop">
        <a class="merek" href="#/">
          <span class="merek-teks">
            <strong>eMon<span class="kuning">DAK</span></strong>
            <small>${aman(judul || 'Pre-Test BIMTEK')}</small>
          </span>
        </a>
        ${ringkas ? '' : `
        <div class="nav-kanan">
          <a href="#/cara">Cara Ikut</a>
          <a href="#/peringkat">Peringkat</a>
          <a href="#/admin">Admin</a>
          <a href="#/bantuan">Bantuan</a>
          ${akun
            ? `<a class="tombol-kaca" href="#/lobi">${aman(akun.nama.split(' ')[0])}</a>`
            : `<a class="tombol-kaca" href="#/akun">Masuk</a>`}
        </div>`}
      </header>`;
  }

  /* ── 5a. Cara Ikut ───────────────────────────────────────────── */

  function halamanCara() {
    halaman.innerHTML = kop('Cara Ikut') + `
      <div class="wadah">
        <div class="label-sudut">Panduan Peserta</div>
        <h1 class="judul-halaman">Empat langkah, <em>dikerjakan serentak</em></h1>
        <p class="ket-halaman">
          Pre-test ini mengukur pemahaman awal Anda tentang aplikasi eMonitoring DAK
          sebelum materi bimtek dimulai. Tidak ada nilai minimal kelulusan — hasilnya
          dipakai penyelenggara untuk menakar titik berat pembahasan di kelas.
        </p>
        <ol class="langkah">
          <li><strong>Buat akun daerah</strong>Sekali saja: nama, email, dan instansi asal. Tanpa kata sandi — email Anda yang menjadi penanda peserta, dan akun itu dipakai lagi pada post-test nanti.</li>
          <li><strong>Tunggu di lobi</strong>Masukkan token sesi yang dibagikan panitia. Token hanya berlaku pada jendela waktu yang dibuka admin, jadi seluruh kelas mulai bersama-sama.</li>
          <li><strong>Jawab secepat mungkin</strong>Satu layar satu soal dengan hitung mundur. Jawaban benar bernilai poin, dan makin cepat menjawab makin besar poinnya — jawaban beruntun dapat bonus.</li>
          <li><strong>Lihat papan juara</strong>Nilai, poin, pembahasan, dan posisi Anda muncul begitu soal terakhir lewat. Tiga besar naik podium.</li>
        </ol>
        <p class="ket-halaman" style="margin-top:22px">
          Satu email hanya dapat mengerjakan <b>satu kali per sesi</b>. Bila terjadi kendala,
          hubungi panitia lewat halaman <a href="#/bantuan">Bantuan</a>.
        </p>
        <a class="btn btn-kuning" href="#/akun">${akun ? 'Lanjut ke lobi' : 'Buat akun sekarang'}</a>
      </div>`;
  }

  /* ── 5b. Akun peserta ────────────────────────────────────────── */

  function halamanAkun() {
    halaman.innerHTML = kop('Akun Peserta') + `
      <div class="wadah wadah-sempit">
        <div class="label-sudut">Akun Daerah</div>
        <h1 class="judul-halaman">Masuk tanpa <em>kata sandi</em></h1>
        <p class="ket-halaman">
          Ketik email Anda. Bila sudah pernah terdaftar, datanya langsung dikenali;
          bila belum, isi sekali dan akun itu tersimpan untuk pre-test maupun post-test.
        </p>

        ${akun ? `
          <div class="kartu kartu-akun" style="margin-bottom:18px">
            <div class="label-sudut" style="margin:0 0 8px">Akun tersimpan di perangkat ini</div>
            <div class="akun-nama">${aman(akun.nama)}</div>
            <div class="akun-rinci">${aman(akun.instansi)}<br>${aman(akun.email)}</div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
              <a class="btn btn-kuning" href="#/lobi">Lanjut ke lobi ujian</a>
              <button class="btn btn-hantu" id="btnGanti">Ganti akun</button>
            </div>
          </div>` : ''}

        <div class="kartu" id="kartuForm"${akun ? ' hidden' : ''}>
          <form class="formulir" id="formAkun" novalidate>
            <div class="kolom">
              <label for="fEmail">Email aktif</label>
              <input id="fEmail" name="email" type="email" autocomplete="email" placeholder="nama@instansi.go.id" required />
              <span class="petunjuk">Penanda peserta — dipakai lagi pada post-test.</span>
            </div>
            <div id="isianBaru" hidden>
              <div class="kolom">
                <label for="fNama">Nama lengkap</label>
                <input id="fNama" name="nama" type="text" autocomplete="name" placeholder="mis. Budi Santoso, S.T." />
              </div>
              <div class="kolom kolom-pilih" style="margin-top:16px">
                <label for="fInstansi">Pemerintah daerah</label>
                <div class="pilih-bungkus">
                  <input id="fInstansi" name="instansi" type="text" autocomplete="off" spellcheck="false"
                         role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="daftarPemda"
                         placeholder="ketik nama kabupaten/kota, mis. Karo" />
                  <div class="pilih-daftar" id="daftarPemda" role="listbox" hidden></div>
                </div>
                <span class="petunjuk">Pilih dari daftar — 514 kabupaten/kota dan 38 provinsi se-Indonesia.</span>
              </div>
              <div class="kolom" style="margin-top:16px">
                <label for="fJabatan">Jabatan <span style="text-transform:none;letter-spacing:0">(boleh dikosongkan)</span></label>
                <input id="fJabatan" name="jabatan" type="text" placeholder="mis. Operator eMonDAK" />
              </div>
            </div>
            <button class="btn btn-biru btn-blok" type="submit" id="btnAkun">Lanjut</button>
          </form>
          <div id="pesanAkun"></div>
        </div>
      </div>`;

    const ganti = $('#btnGanti');
    if (ganti) ganti.onclick = () => {
      akun = null; simpanAkunLokal();
      main = null; simpanMain();
      render();
    };

    const form = $('#formAkun');
    if (!form) return;
    const kotak = $('#pesanAkun');
    const tombol = $('#btnAkun');
    let tahapDua = false;

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      kotak.innerHTML = '';
      const email = form.email.value.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        kotak.innerHTML = '<div class="pesan pesan-galat">Alamat email belum benar.</div>';
        return;
      }

      if (!tahapDua) {
        tombol.disabled = true; tombol.textContent = 'Memeriksa…';
        let ada = null;
        try { ada = await window.DB.ambilAkun(email); }
        catch (e) { console.warn('[akun] gagal memeriksa:', e); }
        tombol.disabled = false;

        if (ada) {
          akun = {
            nama: ada.nama, email: ada.email, instansi: ada.instansi,
            provinsi: ada.provinsi || provinsiDari(ada.instansi), jabatan: ada.jabatan || ''
          };
          simpanAkunLokal();
          ke('#/lobi');
          return;
        }
        tahapDua = true;
        $('#isianBaru').hidden = false;
        tombol.textContent = 'Daftarkan akun';
        kotak.innerHTML = '<div class="pesan pesan-info">Email ini belum terdaftar. Lengkapi nama dan instansi untuk membuat akun.</div>';
        $('#fNama').focus();
        return;
      }

      const nama = form.nama.value.trim();
      const instansi = form.instansi.value.trim();
      const jabatan = form.jabatan.value.trim();
      if (nama.length < 3) { kotak.innerHTML = '<div class="pesan pesan-galat">Nama lengkap belum diisi dengan benar.</div>'; return; }
      if (!pemdaSah(instansi)) {
        kotak.innerHTML = '<div class="pesan pesan-galat">Pemerintah daerah harus dipilih dari daftar. ' +
          'Ketik sebagian namanya, lalu klik pilihan yang muncul.</div>';
        $('#fInstansi').focus();
        return;
      }
      const provinsi = provinsiDari(instansi);

      tombol.disabled = true; tombol.textContent = 'Menyimpan…';
      try {
        await window.DB.simpanAkun({ nama, email, instansi, provinsi, jabatan });
      } catch (e) {
        console.warn('[akun] gagal menyimpan:', e);
        kotak.innerHTML = '<div class="pesan pesan-galat">Akun gagal disimpan ke server. Periksa sambungan internet lalu coba lagi.</div>';
        tombol.disabled = false; tombol.textContent = 'Daftarkan akun';
        return;
      }
      akun = { nama, email, instansi, provinsi, jabatan };
      simpanAkunLokal();
      ke('#/lobi');
    });

    pasangPilihPemda('fInstansi', 'daftarPemda');
  }

  /* ── 5c. Lobi ────────────────────────────────────────────────── */

  function halamanLobi() {
    if (!akun) { ke('#/akun'); return; }

    halaman.innerHTML = kop('Lobi Ujian') + `
      <div class="wadah wadah-sempit">
        <div class="label-sudut">Lobi</div>
        <h1 class="judul-halaman">Halo, <em>${aman(akun.nama.split(' ')[0])}</em></h1>
        <p class="ket-halaman">${aman(akun.instansi)}</p>
        <div class="kartu" id="kartuLobi">
          <div class="kosong">Menghubungi ruang sesi…</div>
        </div>
      </div>`;

    // Sesi dipantau langsung: begitu admin menekan "Buka", layar ini ikut
    // berubah tanpa perlu dimuat ulang.
    lobiTergambar = null;
    lepasPantau = window.DB.pantauSesi((dok) => { sesi = dok; gambarLobi(); });
    jamId = setInterval(() => { if (location.hash === '#/lobi') gambarLobi(); }, 1000);
  }

  // Lobi berdenyut tiap detik. Supaya kotak token tidak dibangun ulang terus
  // (ketikan peserta akan hilang), isi kartu hanya digambar ulang bila keadaan
  // sesinya berubah; selebihnya cukup angka hitung mundurnya yang diperbarui.
  let lobiTergambar = null;

  function gambarLobi() {
    const kotak = $('#kartuLobi');
    if (!kotak) return;
    const st = statusSesi(sesi);

    const tanda = st.keadaan + '|' + JSON.stringify(sesi ? [
      sesi.judul, sesi.token, sesi.jumlahSoal, sesi.detikPerSoal,
      sesi.mulai, sesi.selesai, sesi.aktif
    ] : null);

    if (tanda === lobiTergambar) {
      const mundur = $('#lobiMundur');
      if (mundur && st.sisaMulai != null) mundur.textContent = hitungMundurPanjang(st.sisaMulai);
      const tutup = $('#lobiTutup');
      if (tutup && st.sisaTutup != null) tutup.textContent = 'Ditutup dalam ' + hitungMundurPanjang(st.sisaTutup);
      return;
    }
    lobiTergambar = tanda;

    const kepala = sesi ? `
      <div class="sesi-judul">${aman(sesi.judul || K.namaSesi)}</div>
      <div class="sesi-rinci">
        ${sesi.jumlahSoal || 20} soal · ${sesi.detikPerSoal || 30} detik per soal
        ${sesi.mulai ? ' · mulai ' + aman(tanggalIndo(sesi.mulai)) : ''}
      </div>` : '';

    if (st.keadaan === 'kosong' || st.keadaan === 'tutup') {
      kotak.innerHTML = kepala + `
        <div class="lampu lampu-tutup"><span></span> ${aman(st.teks)}</div>
        <p class="ket-halaman" style="margin:14px 0 0">
          Biarkan halaman ini terbuka — begitu panitia membuka sesi, layar akan berubah sendiri.
        </p>`;
      return;
    }

    if (st.keadaan === 'lewat') {
      kotak.innerHTML = kepala + `
        <div class="lampu lampu-tutup"><span></span> Waktu sesi sudah berakhir.</div>
        <div style="margin-top:14px"><a class="btn btn-hantu" href="#/peringkat">Lihat papan peringkat</a></div>`;
      return;
    }

    if (st.keadaan === 'menunggu') {
      kotak.innerHTML = kepala + `
        <div class="lampu lampu-tunggu"><span></span> Sesi dibuka sebentar lagi</div>
        <div class="mundur-besar" id="lobiMundur">${hitungMundurPanjang(st.sisaMulai)}</div>
        <p class="ket-halaman" style="margin:6px 0 0">Bersiap — layar ujian terbuka otomatis.</p>`;
      return;
    }

    // terbuka: minta token
    kotak.innerHTML = kepala + `
      <div class="lampu lampu-buka"><span></span> Sesi sedang dibuka</div>
      <div class="sesi-rinci" id="lobiTutup" style="margin:10px 0 0">${
        st.sisaTutup != null ? 'Ditutup dalam ' + hitungMundurPanjang(st.sisaTutup) : ''}</div>
      <form class="formulir" id="formToken" style="margin-top:18px" novalidate>
        <div class="kolom">
          <label for="fToken">Token sesi</label>
          <input id="fToken" class="masukan-token" type="text" autocapitalize="characters"
                 spellcheck="false" placeholder="TOKEN" required />
          <span class="petunjuk">Dibagikan panitia di kelas.</span>
        </div>
        <button class="btn btn-kuning btn-blok" type="submit">Masuk ruang ujian</button>
      </form>
      <div id="pesanToken"></div>`;

    $('#formToken').onsubmit = async (ev) => {
      ev.preventDefault();
      const isi = $('#fToken').value.trim();
      const kotakPesan = $('#pesanToken');
      if (isi.toLowerCase() !== String(sesi.token || '').trim().toLowerCase()) {
        kotakPesan.innerHTML = '<div class="pesan pesan-galat">Token tidak cocok dengan sesi yang sedang dibuka.</div>';
        return;
      }
      kotakPesan.innerHTML = '';
      try {
        if (await window.DB.emailSudahIkut(akun.email, sesi.kode)) {
          kotakPesan.innerHTML = '<div class="pesan pesan-galat">Akun ini sudah mengerjakan sesi tersebut. ' +
            'Lihat posisi Anda di <a href="#/peringkat">papan peringkat</a>.</div>';
          return;
        }
      } catch (e) { console.warn('[lobi] gagal memeriksa peserta:', e); }

      main = {
        akun,
        sesiKode: sesi.kode || 'sesi',
        sesiJudul: sesi.judul || K.namaSesi,
        detikPerSoal: sesi.detikPerSoal || 30,
        poinCepat: sesi.poinCepat !== false,
        batasSesi: sesi.selesai || null,
        butir: undiButir(sesi.jumlahSoal || 20),
        indeks: 0,
        jawaban: {},
        poin: 0,
        beruntun: 0,
        beruntunMaks: 0,
        mulai: Date.now(),
        mulaiSoal: Date.now()
      };
      hasil = null; simpanHasilSesi();
      simpanMain();
      ke('#/tes');
    };
  }

  /* ── 5d. Ujian ala Kahoot ────────────────────────────────────── */

  function halamanTes() {
    if (!main) { ke(akun ? '#/lobi' : '#/akun'); return; }

    halaman.innerHTML = kop('Ruang Ujian', true) + `
      <div class="wadah">
        <div class="bilah-main">
          <div class="bilah-kiri">
            <span class="lencana-soal" id="lencanaSoal">Soal 1/${main.butir.length}</span>
            <span class="beruntun" id="beruntun" hidden></span>
          </div>
          <div class="bilah-kanan">
            <button class="tombol-suara" id="btnSuara" title="Nyalakan/matikan suara"></button>
            <span class="poin-kini" id="poinKini">0 poin</span>
            <span class="jam-bulat" id="jamSoal">--</span>
          </div>
        </div>
        <div class="rel"><span id="relWaktu" style="width:100%"></span></div>
        <div id="panggung"></div>
      </div>
      <div id="kilat" class="kilat" hidden></div>`;

    const tSuara = $('#btnSuara');
    const perbaruiSuara = () => { tSuara.textContent = Suara.nyala ? '🔊' : '🔇'; };
    perbaruiSuara();
    tSuara.onclick = () => { Suara.nyala = !Suara.nyala; perbaruiSuara(); Suara.tik(); };

    gambarSoal();
  }

  function gambarSoal() {
    const total = main.butir.length;
    const i = Math.min(main.indeks, total - 1);
    const butir = main.butir[i];
    const s = soalDari(butir.id);

    $('#lencanaSoal').textContent = `Soal ${i + 1}/${total}`;
    $('#poinKini').textContent = angkaRapi(main.poin) + ' poin';
    perbaruiBeruntun();

    $('#panggung').innerHTML = `
      <div class="kartu kartu-soal" id="kartuSoal">
        <p class="teks-soal">${aman(s.q)}</p>
      </div>
      <div class="ubin-daftar" id="ubinDaftar">
        ${butir.urut.map((asli, n) => `
          <button type="button" class="ubin ${WARNA_UBIN[n]}" data-asli="${asli}" style="--i:${n}">
            <span class="bentuk">${BENTUK[n]}</span>
            <span class="ubin-teks">${aman(s.o[asli])}</span>
          </button>`).join('')}
      </div>`;

    $('#ubinDaftar').onclick = (ev) => {
      const ubin = ev.target.closest('.ubin');
      if (!ubin || $('#ubinDaftar').classList.contains('terkunci')) return;
      jawab(Number(ubin.dataset.asli));
    };

    jalankanJamSoal();
  }

  function perbaruiBeruntun() {
    const el = $('#beruntun');
    if (!el) return;
    if (main.beruntun >= 2) {
      el.hidden = false;
      el.textContent = `🔥 Beruntun ${main.beruntun}`;
      el.classList.remove('denyut');
      void el.offsetWidth;      // paksa animasi mengulang
      el.classList.add('denyut');
    } else {
      el.hidden = true;
    }
  }

  function jalankanJamSoal() {
    if (jamId) { clearInterval(jamId); jamId = null; }
    const batas = (main.detikPerSoal || 30) * 1000;
    const jam = $('#jamSoal');
    const rel = $('#relWaktu');
    let terakhirTik = null;

    const tik = () => {
      // jendela sesi habis → kumpulkan apa adanya
      if (main.batasSesi && Date.now() > new Date(main.batasSesi).getTime()) {
        clearInterval(jamId); jamId = null;
        selesaikan('waktu-sesi');
        return;
      }
      const sisa = batas - (Date.now() - main.mulaiSoal);
      const detik = Math.max(0, Math.ceil(sisa / 1000));
      if (jam) {
        jam.textContent = detik;
        jam.classList.toggle('mepet', detik <= 5);
      }
      if (rel) rel.style.width = Math.max(0, (sisa / batas) * 100) + '%';
      if (detik <= 5 && detik > 0 && detik !== terakhirTik) { terakhirTik = detik; Suara.tik(); }
      if (sisa <= 0) {
        clearInterval(jamId); jamId = null;
        jawab(-1);
      }
    };
    tik();
    jamId = setInterval(tik, 100);
  }

  function jawab(pilih) {
    if (jamId) { clearInterval(jamId); jamId = null; }
    const daftar = $('#ubinDaftar');
    if (daftar) daftar.classList.add('terkunci');

    const i = main.indeks;
    const butir = main.butir[i];
    const s = soalDari(butir.id);
    const benar = pilih === s.a;
    const batas = (main.detikPerSoal || 30) * 1000;
    const sisa = Math.max(0, batas - (Date.now() - main.mulaiSoal));

    let poin = 0;
    if (benar) {
      const cepat = main.poinCepat ? Math.round((K.poinCepatMaks || 400) * (sisa / batas)) : (K.poinCepatMaks || 400);
      main.beruntun += 1;
      main.beruntunMaks = Math.max(main.beruntunMaks, main.beruntun);
      const bonus = main.beruntun >= 3
        ? (K.bonusBeruntun || 50) * Math.min(main.beruntun - 2, 5)
        : 0;
      poin = (K.poinDasar || 600) + cepat + bonus;
    } else {
      main.beruntun = 0;
    }

    main.poin += poin;
    main.jawaban[butir.id] = { pilih, benar, poin, detik: Math.round((batas - sisa) / 1000) };
    simpanMain();

    // ── tampilan umpan balik ──
    if (daftar) {
      for (const ubin of daftar.querySelectorAll('.ubin')) {
        const asli = Number(ubin.dataset.asli);
        if (asli === s.a) ubin.classList.add('kunci');
        else ubin.classList.add('redup');
        if (asli === pilih && !benar) ubin.classList.add('keliru');
      }
    }
    $('#poinKini').textContent = angkaRapi(main.poin) + ' poin';
    perbaruiBeruntun();
    benar ? Suara.benar() : Suara.salah();
    kilat(benar, poin, pilih === -1);
    if (benar) taburKonfeti();

    setTimeout(() => {
      if (main.indeks >= main.butir.length - 1) { selesaikan('tuntas'); return; }
      main.indeks += 1;
      main.mulaiSoal = Date.now();
      simpanMain();
      gambarSoal();
    }, 1900);
  }

  function kilat(benar, poin, habisWaktu) {
    const el = $('#kilat');
    if (!el) return;
    el.className = 'kilat ' + (benar ? 'kilat-benar' : 'kilat-salah');
    el.hidden = false;
    el.innerHTML = `
      <div class="kilat-isi">
        <div class="kilat-ikon">${benar ? '✔' : (habisWaktu ? '⏱' : '✕')}</div>
        <div class="kilat-teks">${benar ? 'Tepat!' : (habisWaktu ? 'Waktu habis' : 'Belum tepat')}</div>
        ${benar ? `<div class="kilat-poin">+${angkaRapi(poin)} poin</div>` : ''}
      </div>`;
    setTimeout(() => { el.hidden = true; el.innerHTML = ''; }, 1500);
  }

  function taburKonfeti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const wadah = document.createElement('div');
    wadah.className = 'konfeti';
    const warna = ['#ffc72c', '#3fa9ff', '#29d17c', '#ff5d6c', '#ffffff'];
    for (let n = 0; n < 26; n++) {
      const k = document.createElement('i');
      k.style.left = Math.random() * 100 + '%';
      k.style.background = warna[n % warna.length];
      k.style.animationDelay = (Math.random() * 0.25) + 's';
      k.style.transform = `rotate(${Math.random() * 360}deg)`;
      wadah.appendChild(k);
    }
    document.body.appendChild(wadah);
    setTimeout(() => wadah.remove(), 1800);
  }

  async function selesaikan(sebab) {
    if (jamId) { clearInterval(jamId); jamId = null; }

    const rincian = main.butir.map(b => {
      const j = main.jawaban[b.id];
      return {
        id: b.id,
        pilih: j ? j.pilih : -1,
        benar: j ? !!j.benar : false,
        poin: j ? j.poin : 0,
        detik: j ? j.detik : null
      };
    });
    const benar = rincian.filter(r => r.benar).length;
    const total = rincian.length;
    const a = main.akun;

    const rekaman = {
      nama: a.nama,
      email: a.email,
      emailKunci: String(a.email).trim().toLowerCase(),
      instansi: a.instansi,
      provinsi: a.provinsi || provinsiDari(a.instansi),
      jabatan: a.jabatan || '',
      sesiKode: main.sesiKode,
      sesiJudul: main.sesiJudul,
      tahun: K.tahun || new Date().getFullYear(),
      skor: Math.round((benar / total) * 100),
      poin: main.poin,
      benar, total,
      beruntunMaks: main.beruntunMaks,
      durasiDetik: Math.round((Date.now() - main.mulai) / 1000),
      sebabSelesai: sebab,
      waktuSelesai: new Date().toISOString(),
      jawaban: rincian
    };

    let tersimpan = true;
    try { await window.DB.simpan(rekaman); }
    catch (e) { console.error('[selesai] gagal menyimpan:', e); tersimpan = false; }

    hasil = { ...rekaman, tersimpan };
    simpanHasilSesi();
    main = null; simpanMain();
    ke('#/hasil');
  }

  /* ── 5e. Hasil ───────────────────────────────────────────────── */

  function halamanHasil() {
    if (!hasil) { ke(akun ? '#/lobi' : '#/akun'); return; }
    const h = hasil;
    const salah = h.total - h.benar;

    halaman.innerHTML = kop('Hasil Pre-Test') + `
      <div class="wadah">
        <div class="label-sudut">Lembar Jawaban Terkirim</div>
        <h1 class="judul-halaman">Kerja bagus, <em>${aman(h.nama.split(' ')[0])}</em></h1>
        <p class="ket-halaman">${aman(h.instansi)} · ${aman(h.sesiJudul || '')} · ${aman(tanggalIndo(h.waktuSelesai))}</p>

        ${h.sebabSelesai === 'waktu-sesi' ? '<div class="pesan pesan-info" style="margin-bottom:18px">Jendela waktu sesi berakhir — lembar jawaban dikumpulkan otomatis.</div>' : ''}
        ${h.tersimpan ? '' : '<div class="pesan pesan-galat" style="margin-bottom:18px">Nilai Anda gagal dikirim ke server (jaringan bermasalah). Tunjukkan layar ini ke panitia sebelum menutup halaman.</div>'}

        <div class="kartu" style="text-align:center">
          <div class="poin-besar">${angkaRapi(h.poin)}</div>
          <div class="skor-ket">poin terkumpul</div>
          <div class="grid-statistik">
            <div class="statistik"><div class="angka">${h.skor}</div><div class="nama">Nilai (0–100)</div></div>
            <div class="statistik"><div class="angka">${h.benar}</div><div class="nama">Jawaban benar</div></div>
            <div class="statistik"><div class="angka">${salah}</div><div class="nama">Jawaban salah</div></div>
            <div class="statistik"><div class="angka">${h.beruntunMaks || 0}</div><div class="nama">Beruntun terpanjang</div></div>
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
            const jawabTeks = r.pilih >= 0 ? s.o[r.pilih] : 'Tidak dijawab / waktu habis';
            return `
              <div class="butir${r.benar ? ' tepat' : ''}">
                <div class="tanya">${n + 1}. ${aman(s.q)}</div>
                <div class="baris kunci">Kunci: <b>${aman(s.o[s.a])}</b></div>
                ${r.benar
                  ? `<div class="baris">Poin: <b>+${angkaRapi(r.poin)}</b>${r.detik != null ? ` · dijawab dalam ${r.detik} detik` : ''}</div>`
                  : `<div class="baris jawab-salah">Jawaban Anda: <b>${aman(jawabTeks)}</b></div>`}
                <div class="catatan">${aman(s.bahas || '')}</div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  /* ── 5f. Papan peringkat ─────────────────────────────────────── */

  function urutkan(daftar) {
    return daftar.slice().sort((a, b) =>
      ((b.poin || 0) - (a.poin || 0)) ||
      ((b.skor || 0) - (a.skor || 0)) ||
      ((a.durasiDetik || 0) - (b.durasiDetik || 0)) ||
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

  function halamanPeringkat() {
    halaman.innerHTML = kop('Papan Peringkat') + `
      <div class="wadah">
        <div class="label-sudut">Papan Peringkat</div>
        <h1 class="judul-halaman">Juara <em>pre-test</em> ${aman(String(K.tahun || ''))}</h1>
        <p class="ket-halaman">Urutan disusun dari poin tertinggi — jawaban benar yang cepat dan beruntun naik lebih tinggi.</p>
        <div id="isiPeringkat" class="kosong">Memuat data…</div>
      </div>`;

    if (K.peringkatTerbuka === false && !adminMasuk) {
      $('#isiPeringkat').outerHTML =
        '<div class="pesan pesan-info">Papan peringkat baru dibuka oleh penyelenggara.</div>';
      return;
    }

    // Papan ikut hidup: peserta yang baru selesai langsung muncul.
    // Yang ditampilkan hanya sesi yang sedang berjalan, supaya nilai angkatan
    // lama tidak bercampur dengan angkatan yang sedang diuji.
    let kodeSesi = null;
    window.DB.ambilSesi()
      .then(dok => { sesi = dok; kodeSesi = dok && dok.kode ? dok.kode : null; gambar(); })
      .catch(() => gambar());

    let terakhir = null;
    const gambar = () => {
      const kotak = $('#isiPeringkat');
      if (!kotak || !terakhir) return;
      const saring = kodeSesi ? terakhir.filter(p => p.sesiKode === kodeSesi) : terakhir;
      kotak.innerHTML = isiPapan(urutkan(saring), sesi);
    };

    lepasPantau = window.DB.pantauHasil((daftar) => { terakhir = daftar; gambar(); });
  }

  function isiPapan(daftar, sesiIni) {
    const judulSesi = sesiIni && sesiIni.judul
      ? `<p class="ket-halaman" style="margin:-14px 0 20px">Sesi: <b style="color:#fff">${aman(sesiIni.judul)}</b></p>`
      : '';
    if (!daftar.length) {
      return judulSesi + '<div class="kartu"><div class="kosong">Belum ada peserta yang menyelesaikan ujian.</div></div>';
    }
    const medali = K.medali || ['emas', 'perak', 'perunggu'];
    const tigaBesar = daftar.slice(0, 3);

    // Urutan DOM tetap juara 1-2-3 supaya di ponsel terbaca berurutan; di layar
    // lebar CSS yang menggeser juara 1 ke tengah (lihat .podium .juara1).
    const mimbar = tigaBesar.map((p, i) => {
      const jenis = medali[i] || 'perak';
      return `
        <div class="mimbar juara${i + 1} ${jenis}">
          ${svgTropi(jenis)}
          <div class="nama-juara">${aman(p.nama)}</div>
          <div class="instansi-juara">${aman(p.instansi)}</div>
          <div class="nilai-juara">${angkaRapi(p.poin || 0)}</div>
          <div class="sebutan">Juara ${i + 1} · tropi ${jenis}</div>
        </div>`;
    }).join('');

    return judulSesi + `
      <div class="podium">${mimbar}</div>
      <div class="tabel-bungkus">
        <table class="tabel">
          <thead>
            <tr><th>#</th><th>Nama</th><th>Instansi</th><th class="angka">Poin</th>
                <th class="angka">Nilai</th><th class="angka">Benar</th><th class="angka">Beruntun</th><th>Selesai</th></tr>
          </thead>
          <tbody>
            ${daftar.map((p, n) => `
              <tr>
                <td class="peringkat-nomor">${n + 1}</td>
                <td class="bebas">${aman(p.nama)}</td>
                <td class="bebas">${aman(p.instansi)}</td>
                <td class="angka" style="color:var(--kuning);font-weight:700">${angkaRapi(p.poin || 0)}</td>
                <td class="angka">${p.skor}</td>
                <td class="angka">${p.benar}/${p.total}</td>
                <td class="angka">${p.beruntunMaks || 0}</td>
                <td>${aman(tanggalIndo(p.waktuSelesai))}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <p class="ket-halaman" style="margin-top:14px">${daftar.length} peserta telah menyelesaikan ujian.</p>`;
  }

  /* ── 5g. Ruang admin ─────────────────────────────────────────── */

  function halamanAdmin() {
    // Panitia memakai akun Firebase Authentication yang dibuat langsung di
    // Firebase Console. Firebase memulihkan sendiri keadaan masuk sesudah
    // halaman dimuat ulang, jadi papan langsung terbuka bila masih masuk.
    if (adminMasuk) { papanAdmin(); return; }

    halaman.innerHTML = kop('Ruang Admin') + `
      <div class="wadah wadah-sempit">
        <div class="label-sudut">Khusus Penyelenggara</div>
        <h1 class="judul-halaman">Masuk <em>ruang admin</em></h1>
        <p class="ket-halaman">
          Akun panitia dibuat di Firebase Console. Masuk untuk mengendalikan sesi,
          memantau peserta, dan mengunduh rekap.
        </p>
        <div class="kartu">
          <form class="formulir" id="formAdmin" novalidate>
            <div class="kolom">
              <label for="fEmailAdmin">Email panitia</label>
              <input id="fEmailAdmin" type="email" autocomplete="username" placeholder="panitia@instansi.go.id" required />
            </div>
            <div class="kolom">
              <label for="fSandiAdmin">Kata sandi</label>
              <input id="fSandiAdmin" type="password" autocomplete="current-password" placeholder="••••••••" required />
            </div>
            <button class="btn btn-biru btn-blok" type="submit" id="btnMasukAdmin">Masuk</button>
          </form>
          <div id="pesanAdmin"></div>
        </div>
      </div>`;

    $('#formAdmin').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const tombol = $('#btnMasukAdmin');
      tombol.disabled = true; tombol.textContent = 'Memeriksa…';
      try {
        adminMasuk = await window.DB.masukAdmin($('#fEmailAdmin').value.trim(), $('#fSandiAdmin').value);
        papanAdmin();
      } catch (e) {
        const pesan = {
          'auth/invalid-credential': 'Email atau kata sandi salah.',
          'auth/invalid-email': 'Alamat email tidak sah.',
          'auth/user-not-found': 'Akun itu belum ada di Firebase Authentication.',
          'auth/wrong-password': 'Kata sandi salah.',
          'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu sebentar lalu ulangi.',
          'auth/network-request-failed': 'Jaringan bermasalah.',
          'auth/operation-not-allowed': 'Metode Email/Password belum diaktifkan di Firebase Console → Authentication → Sign-in method.'
        }[e.code] || ('Gagal masuk: ' + (e.code || e.message));
        $('#pesanAdmin').innerHTML = '<div class="pesan pesan-galat">' + aman(pesan) + '</div>';
        tombol.disabled = false; tombol.textContent = 'Masuk';
      }
    });
  }

  function papanAdmin() {
    halaman.innerHTML = kop('Ruang Admin') + `
      <div class="wadah">
        <div class="bilah-ujian">
          <div>
            <div class="label-sudut" style="margin-bottom:4px">Ruang Admin</div>
            <h1 class="judul-halaman" style="margin:0">Kendali <em>sesi ujian</em></h1>
            <div style="font-size:13px;color:var(--teks-samar);margin-top:6px">
              Masuk sebagai ${aman((adminMasuk && adminMasuk.email) || 'panitia')}
            </div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-kuning" id="btnUnduh">Unduh CSV</button>
            <button class="btn btn-hantu" id="btnKeluarAdmin">Keluar</button>
          </div>
        </div>

        <div class="kartu" id="kartuSesi"><div class="kosong">Memuat pengaturan sesi…</div></div>
        <div id="pesanSesi"></div>

        <h2 class="judul-halaman" style="font-size:20px;margin:32px 0 6px">Pemantauan langsung</h2>
        <p class="ket-halaman">Angka di bawah ikut berubah sendiri saat peserta mengumpulkan jawaban.</p>
        <div id="isiAdmin" class="kosong">Memuat data…</div>
      </div>`;

    $('#btnKeluarAdmin').onclick = () => {
      window.DB.keluarAdmin();
      adminMasuk = null;
      ke('#/');
    };

    // ── kendali sesi ──
    sesiTergambar = null;
    lepasPantau = window.DB.pantauSesi((dok) => {
      sesi = dok || { ...(K.sesiBawaan || {}) };
      gambarKendaliSesi();
    });

    // ── pemantauan hasil ──
    let daftarKini = [];
    const lepasHasil = window.DB.pantauHasil((daftar) => {
      daftarKini = urutkan(daftar);
      gambarPantauan(daftarKini);
    });
    const lepasSesi = lepasPantau;
    lepasPantau = () => { lepasSesi(); lepasHasil(); };

    $('#btnUnduh').onclick = () => unduhCsv(daftarKini);
  }

  // Sidik isi sesi yang sedang tergambar. Pemantauan sesi berdenyut tiap
  // beberapa detik; tanpa penjaga ini formulir akan dibangun ulang terus dan
  // menghapus ketikan admin.
  let sesiTergambar = null;

  function gambarKendaliSesi() {
    const kotak = $('#kartuSesi');
    if (!kotak) return;
    const cap = JSON.stringify(sesi || null);
    if (cap === sesiTergambar) return;
    sesiTergambar = cap;
    const s = sesi || {};
    const st = statusSesi(s);
    const lampu = { buka: 'lampu-buka', menunggu: 'lampu-tunggu' }[st.keadaan] || 'lampu-tutup';
    const ket = {
      buka: 'Sesi TERBUKA — peserta bisa masuk dengan token',
      menunggu: 'Terjadwal — menunggu waktu mulai',
      lewat: 'Waktu sesi sudah lewat',
      tutup: 'Sesi tertutup',
      kosong: 'Belum ada sesi'
    }[st.keadaan];

    kotak.innerHTML = `
      <div class="lampu ${lampu}"><span></span> ${aman(ket)}</div>
      <form class="formulir kisi-dua" id="formSesi" style="margin-top:18px">
        <div class="kolom">
          <label for="sKode">Kode sesi</label>
          <input id="sKode" type="text" value="${aman(s.kode || '')}" placeholder="BIMTEK-01" />
          <span class="petunjuk">Pembeda rekap antar angkatan. Ubah kode = mulai daftar peserta baru.</span>
        </div>
        <div class="kolom">
          <label for="sToken">Token peserta</label>
          <div class="baris-token">
            <input id="sToken" class="masukan-token" type="text" maxlength="12" autocapitalize="characters"
                   spellcheck="false" value="${aman(s.token || '')}" placeholder="A7K2M9" />
            <button class="btn btn-hantu" id="btnAcakToken" type="button" title="Buat token acak 6 karakter">Acak</button>
          </div>
          <span class="petunjuk">6 karakter huruf &amp; angka, dibacakan ke kelas. Tidak peka huruf besar/kecil.</span>
        </div>
        <div class="kolom kolom-lebar">
          <label for="sJudul">Judul sesi</label>
          <input id="sJudul" type="text" value="${aman(s.judul || '')}" placeholder="Pre-Test BIMTEK eMonDAK Angkatan 1" />
        </div>
        <div class="kolom">
          <label for="sMulai">Dibuka mulai</label>
          <input id="sMulai" type="datetime-local" value="${keInputWaktu(s.mulai)}" />
        </div>
        <div class="kolom">
          <label for="sSelesai">Ditutup pukul</label>
          <input id="sSelesai" type="datetime-local" value="${keInputWaktu(s.selesai)}" />
        </div>
        <div class="kolom">
          <label for="sJumlah">Jumlah soal (maks. 21)</label>
          <input id="sJumlah" type="number" min="5" max="21" value="${Number(s.jumlahSoal || 20)}" />
        </div>
        <div class="kolom">
          <label for="sDetik">Detik per soal</label>
          <input id="sDetik" type="number" min="10" max="120" value="${Number(s.detikPerSoal || 30)}" />
        </div>
        <div class="kolom kolom-lebar">
          <label class="centang">
            <input id="sPoinCepat" type="checkbox" ${s.poinCepat !== false ? 'checked' : ''} />
            <span>Poin kecepatan — makin cepat menjawab, makin besar poinnya</span>
          </label>
        </div>
        <div class="kolom-lebar baris-tombol">
          <button class="btn btn-biru" type="submit">Simpan pengaturan</button>
          ${st.keadaan === 'buka'
            ? '<button class="btn btn-hantu" id="btnTutup" type="button">Tutup sesi sekarang</button>'
            : '<button class="btn btn-kuning" id="btnBuka" type="button">Buka sesi sekarang</button>'}
        </div>
      </form>`;

    const bacaForm = () => ({
      kode: $('#sKode').value.trim() || 'sesi',
      token: $('#sToken').value.trim(),
      judul: $('#sJudul').value.trim(),
      mulai: $('#sMulai').value ? new Date($('#sMulai').value).toISOString() : null,
      selesai: $('#sSelesai').value ? new Date($('#sSelesai').value).toISOString() : null,
      jumlahSoal: Math.min(21, Math.max(5, Number($('#sJumlah').value) || 20)),
      detikPerSoal: Math.min(120, Math.max(10, Number($('#sDetik').value) || 30)),
      poinCepat: $('#sPoinCepat').checked,
      aktif: !!(sesi && sesi.aktif)
    });

    const simpan = async (ubah) => {
      const isi = { ...bacaForm(), ...(ubah || {}) };
      if (!isi.token) {
        $('#pesanSesi').innerHTML = '<div class="pesan pesan-galat">Token peserta belum diisi.</div>';
        return;
      }
      try {
        await window.DB.simpanSesi(isi);
        $('#pesanSesi').innerHTML = '<div class="pesan pesan-info">Pengaturan sesi tersimpan.</div>';
      } catch (e) {
        console.error('[admin] gagal menyimpan sesi:', e);
        $('#pesanSesi').innerHTML = '<div class="pesan pesan-galat">Gagal menyimpan: ' + aman(e.message) +
          '<br>Bila pesannya soal izin, periksa apakah email akun panitia ini sudah terdaftar pada fungsi ' +
          '<b>emailAdmin()</b> di firestore.rules.</div>';
      }
    };

    $('#btnAcakToken').onclick = () => { $('#sToken').value = tokenAcak(); };

    $('#formSesi').onsubmit = (ev) => { ev.preventDefault(); simpan(); };
    const buka = $('#btnBuka');
    if (buka) buka.onclick = () => {
      const kini = new Date();
      const isi = bacaForm();
      // Membuka "sekarang": bila jadwal belum diisi, sesi dibuka seketika
      // selama 60 menit ke depan.
      simpan({
        aktif: true,
        mulai: isi.mulai && new Date(isi.mulai) > kini ? isi.mulai : kini.toISOString(),
        selesai: isi.selesai && new Date(isi.selesai) > kini
          ? isi.selesai
          : new Date(kini.getTime() + 60 * 60000).toISOString()
      });
    };
    const tutup = $('#btnTutup');
    if (tutup) tutup.onclick = () => simpan({ aktif: false, selesai: new Date().toISOString() });
  }

  async function gambarPantauan(daftar) {
    const kotak = $('#isiAdmin');
    if (!kotak) return;

    const kode = (sesi && sesi.kode) || null;
    const sesiIni = kode ? daftar.filter(p => p.sesiKode === kode) : daftar;
    let jumlahAkun = '—';
    try { jumlahAkun = await window.DB.jumlahAkun(); } catch { /* biarkan */ }

    const n = sesiIni.length;
    const instansi = new Set(sesiIni.map(p => (p.instansi || '').trim().toLowerCase())).size;
    const rata = n ? Math.round(sesiIni.reduce((t, p) => t + (p.skor || 0), 0) / n) : 0;
    const rataPoin = n ? Math.round(sesiIni.reduce((t, p) => t + (p.poin || 0), 0) / n) : 0;
    const tertinggi = n ? Math.max(...sesiIni.map(p => p.skor || 0)) : 0;
    const terendah = n ? Math.min(...sesiIni.map(p => p.skor || 0)) : 0;

    const butir = BANK.map(s => {
      let muncul = 0, tepat = 0;
      for (const p of sesiIni) {
        const r = (p.jawaban || []).find(x => x.id === s.id);
        if (!r) continue;
        muncul++;
        if (r.benar) tepat++;
      }
      return { id: s.id, q: s.q, muncul, tepat, persen: muncul ? Math.round((tepat / muncul) * 100) : null };
    }).filter(b => b.muncul > 0).sort((a, b) => a.persen - b.persen);

    kotak.innerHTML = `
      <div class="grid-statistik">
        <div class="statistik sorot"><div class="angka">${n}</div><div class="nama">Sudah mengisi${kode ? ' (sesi ' + aman(kode) + ')' : ''}</div></div>
        <div class="statistik"><div class="angka">${jumlahAkun}</div><div class="nama">Akun terdaftar</div></div>
        <div class="statistik"><div class="angka">${instansi}</div><div class="nama">Instansi</div></div>
        <div class="statistik"><div class="angka">${angkaRapi(rataPoin)}</div><div class="nama">Rata-rata poin</div></div>
        <div class="statistik"><div class="angka">${rata}</div><div class="nama">Rata-rata nilai</div></div>
        <div class="statistik"><div class="angka">${tertinggi}</div><div class="nama">Nilai tertinggi</div></div>
        <div class="statistik"><div class="angka">${terendah}</div><div class="nama">Nilai terendah</div></div>
      </div>

      ${n === 0 ? '<div class="kartu" style="margin-top:18px"><div class="kosong">Belum ada peserta yang menyelesaikan ujian pada sesi ini.</div></div>' : `
      <div class="kolom" style="max-width:340px;margin:22px 0 12px">
        <label for="cari">Cari nama / instansi / email</label>
        <input id="cari" type="search" placeholder="ketik untuk menyaring…" />
      </div>

      <div class="tabel-bungkus">
        <table class="tabel" id="tabelAdmin">
          <thead>
            <tr><th>#</th><th>Nama</th><th>Email</th><th>Pemda</th><th>Provinsi</th>
                <th class="angka">Poin</th><th class="angka">Nilai</th><th class="angka">Benar</th>
                <th class="angka">Waktu</th><th>Selesai</th><th></th></tr>
          </thead>
          <tbody>
            ${sesiIni.map((p, i) => `
              <tr data-cari="${aman(((p.nama || '') + ' ' + (p.instansi || '') + ' ' + (p.email || '')).toLowerCase())}">
                <td class="peringkat-nomor">${i + 1}</td>
                <td class="bebas">${aman(p.nama)}</td>
                <td>${aman(p.email)}</td>
                <td class="bebas">${aman(p.instansi)}</td>
                <td>${aman(p.provinsi || provinsiDari(p.instansi))}</td>
                <td class="angka" style="color:var(--kuning);font-weight:700">${angkaRapi(p.poin || 0)}</td>
                <td class="angka">${p.skor}</td>
                <td class="angka">${p.benar}/${p.total}</td>
                <td class="angka">${mmss(p.durasiDetik)}</td>
                <td>${aman(tanggalIndo(p.waktuSelesai))}</td>
                <td><button class="tombol-hapus" data-hapus="${aman(p.id)}" data-nama="${aman(p.nama)}"
                        title="Hapus rekaman ini">✕</button></td>
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
      </div>`}

      ${window.DB.mode === 'lokal'
        ? `<div class="pesan pesan-info" style="margin-top:22px">
             Aplikasi sedang berjalan dalam mode lokal — data di atas hanya milik peramban ini.
             <button class="btn btn-hantu" id="btnBersih" style="margin-left:10px">Bersihkan data lokal</button>
           </div>`
        : ''}`;

    const tabel = $('#tabelAdmin');
    if (tabel) tabel.addEventListener('click', async (ev) => {
      const tombol = ev.target.closest('[data-hapus]');
      if (!tombol) return;
      if (!confirm(`Hapus rekaman nilai atas nama ${tombol.dataset.nama}?\n` +
        'Rekaman yang dihapus tidak bisa dikembalikan.')) return;
      tombol.disabled = true;
      try {
        await window.DB.hapusHasil(tombol.dataset.hapus);
        tombol.closest('tr').remove();
      } catch (e) {
        tombol.disabled = false;
        alert('Gagal menghapus: ' + (e.code || e.message));
      }
    });

    const cari = $('#cari');
    if (cari) cari.oninput = () => {
      const kata = cari.value.trim().toLowerCase();
      for (const tr of document.querySelectorAll('#tabelAdmin tbody tr')) {
        tr.style.display = !kata || tr.dataset.cari.includes(kata) ? '' : 'none';
      }
    };
    const bersih = $('#btnBersih');
    if (bersih) bersih.onclick = () => {
      if (confirm('Hapus seluruh data pre-test yang tersimpan di peramban ini?')) {
        window.DB.kosongkanLokal();
        ke('#/admin');
      }
    };
  }

  function unduhCsv(daftar) {
    const baris = [[
      'Peringkat', 'Nama', 'Email', 'Pemda', 'Provinsi', 'Jabatan', 'Sesi',
      'Poin', 'Nilai', 'Benar', 'Total', 'Beruntun', 'Durasi (detik)', 'Durasi', 'Waktu Selesai'
    ]];
    daftar.forEach((p, n) => baris.push([
      n + 1, p.nama, p.email, p.instansi,
      p.provinsi || provinsiDari(p.instansi), p.jabatan || '', p.sesiKode || '',
      p.poin || 0, p.skor, p.benar, p.total, p.beruntunMaks || 0,
      p.durasiDetik, mmss(p.durasiDetik), tanggalIndo(p.waktuSelesai)
    ]));

    const csv = baris.map(r => r.map(sel => {
      const t = String(sel == null ? '' : sel);
      return /[",;\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    }).join(';')).join('\r\n');

    // BOM supaya huruf beraksen tampil benar saat dibuka di Excel
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-pretest-bimtek-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ── 5h. Bantuan ─────────────────────────────────────────────── */

  function halamanBantuan() {
    const wa = String(K.waPanitia || '').replace(/\D/g, '');
    halaman.innerHTML = kop('Bantuan') + `
      <div class="wadah wadah-sempit">
        <div class="label-sudut">Bantuan</div>
        <h1 class="judul-halaman">Ada kendala saat <em>mengerjakan</em>?</h1>
        <div class="kartu">
          <p class="ket-halaman"><b style="color:#fff">Token ditolak.</b><br>
            Token hanya berlaku pada sesi yang sedang dibuka panitia. Pastikan tidak ada spasi
            di awal atau akhir; huruf besar/kecil tidak berpengaruh.</p>
          <p class="ket-halaman"><b style="color:#fff">Layar lobi belum berubah.</b><br>
            Biarkan halaman terbuka. Begitu panitia menekan tombol buka, layar berganti sendiri
            tanpa perlu dimuat ulang.</p>
          <p class="ket-halaman"><b style="color:#fff">Akun ini disebut sudah mengerjakan.</b><br>
            Satu akun hanya bisa satu kali per sesi. Bila Anda merasa belum pernah mengisi,
            laporkan ke panitia agar datanya diperiksa.</p>
          <p class="ket-halaman"><b style="color:#fff">Halaman tertutup di tengah ujian.</b><br>
            Buka kembali alamat yang sama di peramban dan perangkat yang sama — soal yang sudah
            dijawab beserta poinnya dipulihkan. Hitung mundur tetap berjalan selama itu.</p>
          <p class="ket-halaman"><b style="color:#fff">Nilai gagal terkirim.</b><br>
            Layar hasil akan memberi tahu bila pengiriman gagal. Jangan tutup halaman; tunjukkan
            layar tersebut ke panitia.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
            ${wa ? `<a class="btn btn-kuning" href="https://wa.me/${wa}" target="_blank" rel="noopener">Hubungi panitia via WhatsApp</a>` : ''}
            ${K.emailPanitia ? `<a class="btn btn-hantu" href="mailto:${aman(K.emailPanitia)}">Kirim email</a>` : ''}
          </div>
        </div>
        <p class="ket-halaman" style="margin-top:20px">${aman(K.penyelenggara || '')}</p>
      </div>`;
  }

  /* ── Jalankan ────────────────────────────────────────────────── */

  muatKeadaan();
  window.addEventListener('hashchange', render);

  // Firebase memulihkan sendiri keadaan masuk panitia sesudah halaman dimuat
  // ulang; halaman admin digambar ulang begitu pemulihan itu selesai.
  window.DB.pantauAdmin((pengguna) => {
    const berubah = !!pengguna !== !!adminMasuk;
    adminMasuk = pengguna;
    if (berubah && location.hash === '#/admin') render();
  });

  window.DB.init().then(mode => {
    const pita = $('#pitaLokal');
    if (pita) pita.hidden = mode !== 'lokal';
    render();
  });
})();
