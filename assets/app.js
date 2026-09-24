/* ══════════════════════════════════════════════════════════════════
   EVALUASI PEMAHAMAN OPERATOR eMonitoring DAK — logika aplikasi

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
  // Bank soal punya dua lapis: yang ikut ter-deploy (assets/soal.js) dan
  // yang diimpor panitia dari Ruang Admin (Firestore pretestBank/aktif).
  // Selama ada hasil impor, itulah yang dipakai seluruh peserta.
  const BANK_BAWAAN = window.SOAL_PRETEST || [];
  let BANK = BANK_BAWAAN.slice();
  let bankInfo = null;

  function pakaiBank(dok) {
    bankInfo = dok && Array.isArray(dok.soal) && dok.soal.length ? dok : null;
    BANK = bankInfo ? bankInfo.soal : BANK_BAWAAN.slice();
  }

  // Soal terbanyak yang bisa diundikan untuk satu peserta: satu wakil per
  // grup soal kembar, supaya tidak ada soal kembar dalam satu lembar.
  //
  // Ditahan pula pada BATAS_SOAL, angka yang sama dengan batas "total" pada
  // firestore.rules. Tanpa penahan ini, mengimpor bank soal yang sangat besar
  // membuat panitia bisa menyetel sesi yang nilainya justru ditolak aturan
  // Firestore saat peserta mengumpulkan jawaban.
  const BATAS_SOAL = 60;
  const maksButir = () => Math.min(new Set(BANK.map(s => s.grup || s.id)).size, BATAS_SOAL);
  // Latar beranda kini digambar CSS. Isi KONFIG.videoHero bila ingin
  // memakai video lagi.
  const VIDEO_HERO = K.videoHero || '';

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

  // "120 detik" lebih enak dibaca sebagai "2 menit"
  function lamaSoal(detik) {
    const d = Number(detik) || 0;
    return d >= 60 && d % 60 === 0 ? (d / 60) + ' menit' : d + ' detik';
  }

  function hitungMundurPanjang(ms) {
    const d = Math.max(0, Math.round(ms / 1000));
    const jam = Math.floor(d / 3600);
    return (jam > 0 ? jam + ' jam ' : '') + mmss(d % 3600);
  }

  function tanggalIndo(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d)) return '-';
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

  // Nomor ponsel Indonesia dirapikan ke bentuk 08…; +62/62 di depan diganti
  // 0. Mengembalikan '' bila bukan nomor yang masuk akal (9–14 angka).
  function rapikanTelepon(t) {
    let d = String(t || '').replace(/[^\d+]/g, '');
    if (d.startsWith('+')) d = d.slice(1);
    if (d.startsWith('62')) d = '0' + d.slice(2);
    return /^0\d{8,13}$/.test(d) ? d : '';
  }

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
    if (!v || !VIDEO_HERO) return;   // tanpa alamat video, latar CSS yang dipakai
    v.hidden = false;
    v.muted = true;
    v.autoplay = true;
    v.src = VIDEO_HERO;
    const jalan = () => v.play().catch(() => {});
    jalan();
    v.addEventListener('pause', jalan);
    window.addEventListener('load', jalan);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) jalan(); });
  })();

  /* ── Jenis tes: pre-test dan post-test memakai bank soal yang sama ─ */

  const JENIS = K.jenisTes || {
    pre:  { label: 'Pre-Test',  panjang: 'Pre-Test',  ket: '' },
    post: { label: 'Post-Test', panjang: 'Post-Test', ket: '' }
  };
  const jenisSah = (j) => (j === 'post' ? 'post' : 'pre');
  const infoJenis = (j) => JENIS[jenisSah(j)] || JENIS.pre;

  // Satu "sesi" pada rekap = kode sesi + jenis tes + token. Panitia bisa
  // memakai kode yang sama untuk pre dan post, atau mengacak token baru
  // tiap kelas; ketiganya bersama-sama membedakan satu pelaksanaan.
  // Dipakai juga sebagai kunci peta di Firestore, jadi hanya huruf, angka,
  // - dan _ yang dibiarkan.
  const kunciSesi = (kode, jenis, token) =>
    [kode || 'sesi', jenisSah(jenis), String(token || '').trim().toUpperCase() || 'TANPA-TOKEN']
      .map(x => String(x).replace(/[^A-Za-z0-9_-]+/g, '-')).join('__');

  /* ── 3. Keadaan aplikasi ─────────────────────────────────────── */

  const KUNCI_AKUN_SAYA = 'pretest_akun_saya';
  const KUNCI_MAIN = 'pretest_main_v2';
  const KUNCI_HASIL_SESI = 'pretest_hasil_v2';
  const KUNCI_ISI_EMAIL = 'pretest_isi_email';

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
    // Wakil tiap grup dipilih acak, urutan soal diacak, lalu urutan pilihan
    // A–D tiap soal ikut diacak — dua peserta yang duduk bersebelahan tidak
    // pernah mendapat lembar yang sama.
    const wakil = [...perGrup.values()].map(d => d[Math.floor(Math.random() * d.length)]);
    return acak(wakil).slice(0, Math.min(jumlah || 25, wakil.length)).map(s => ({
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
    '#/siap': halamanSiap,
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
    hentikanDemo();

    // Tombol tampilan disembunyikan selama ujian supaya tidak menutupi
    // ubin jawaban di layar ponsel.
    const pilih = $('#pilihTampilan');
    if (pilih) pilih.hidden = ['#/tes', '#/siap'].includes(location.hash);

    if (!fn) {
      hero.hidden = false;
      halaman.hidden = true;
      halaman.innerHTML = '';
      hidupkanBeranda();
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
        <a class="merek" href="#/" title="${aman(judul || 'Beranda')}">
          <img class="merek-lambang" src="assets/lambang-pu.png" width="256" height="256"
               alt="Lambang Kementerian Pekerjaan Umum" />
          <span class="merek-teks">
            <b>Pusat Fasilitasi Infrastruktur Daerah</b>
            <i>Kementerian Pekerjaan Umum</i>
          </span>
        </a>
        ${ringkas ? '' : `
        <div class="nav-kanan">
          ${[['#/cara', 'Cara Ikut'], ['#/peringkat', 'Peringkat'], ['#/admin', 'Admin'], ['#/bantuan', 'Bantuan']]
            .map(([h, t]) => `<a href="${h}"${location.hash === h ? ' class="aktif" aria-current="page"' : ''}>${t}</a>`).join('')}
          ${akun
            ? `<a class="tombol-kaca" href="#/lobi">${aman(akun.nama.split(' ')[0])}</a>`
            : `<a class="tombol-kaca" href="#/akun">Masuk</a>`}
        </div>`}
      </header>`;
  }

  /* ── Pilihan tampilan: baru (bawaan) atau klasik ──────────────────
     Tampilan baru = assets/tampilan-baru.css yang ditumpuk di atas
     style.css. Memilih "Klasik" cukup mematikan lembar gaya itu, jadi
     tampilan lama tetap utuh. Pilihan diingat per perangkat. */

  const KUNCI_TAMPILAN = 'pretest_tampilan';

  function pakaiTampilan(t) {
    const nilai = t === 'klasik' ? 'klasik' : 'baru';
    document.documentElement.setAttribute('data-tampilan', nilai);
    const css = document.getElementById('cssBaru');
    if (css) css.disabled = nilai === 'klasik';
    try { localStorage.setItem(KUNCI_TAMPILAN, nilai); } catch { /* mode privat */ }
    for (const b of document.querySelectorAll('#pilihTampilan [data-tampilan]')) {
      b.setAttribute('aria-pressed', String(b.dataset.tampilan === nilai));
    }
  }

  (function pasangPilihTampilan() {
    const kotak = $('#pilihTampilan');
    if (!kotak) return;
    pakaiTampilan(document.documentElement.getAttribute('data-tampilan'));
    kotak.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-tampilan]');
      if (b) pakaiTampilan(b.dataset.tampilan);
    });
  })();

  const kurangiGerak = () => !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ── Beranda: status sesi + kartu contoh soal ─────────────────────
     Kartu di sisi kanan beranda memutar soal PENGETAHUAN UMUM dari
     KONFIG.soalContohBeranda, supaya calon peserta tahu bentuk ujiannya
     tanpa melihat soal ujian yang sesungguhnya. Jangan diganti ke BANK:
     halaman ini terbuka untuk siapa saja sebelum sesi dimulai.
     Hanya berjalan selama beranda terbuka dan tab terlihat. */

  let demoId = null;

  function hentikanDemo() {
    if (demoId) { clearInterval(demoId); demoId = null; }
  }

  function hidupkanBeranda() {
    const status = $('#heroStatus');
    if (status) {
      window.DB.ambilSesi().then((s) => {
        const st = statusSesi(s);
        const info = s ? infoJenis(s.jenis) : null;
        const rinci = s
          ? `${Math.min(s.jumlahSoal || 25, maksButir())} soal · ${lamaSoal(s.detikPerSoal || 30)} per soal`
          : '';
        const teks = {
          buka: info ? `${aman(info.label)} sedang dibuka` : '',
          menunggu: info ? `${aman(info.label)} dibuka ${aman(tanggalIndo(s.mulai))}` : ''
        }[st.keadaan] || 'Belum ada sesi yang dibuka. Tunggu aba-aba panitia.';
        status.innerHTML = `
          <span class="hb-titik${st.keadaan === 'buka' ? ' buka' : ''}"></span>
          <span><b>${teks}</b>${rinci ? `<small>${aman(rinci)}</small>` : ''}</span>`;
      }).catch(() => { status.innerHTML = ''; });
    }

    const kartu = $('#demoKartu');
    if (!kartu || !window.IkonSoal) return;
    const contoh = acak((K.soalContohBeranda || []).filter(s => s && s.q && Array.isArray(s.o)));
    if (!contoh.length) { kartu.closest('.hb-demo').hidden = true; return; }

    let n = 0;
    const poin = $('#demoPoin');
    const tampil = () => {
      const s = contoh[n % contoh.length];
      n += 1;
      // Posisi jawaban benar diacak seperti di ujian sungguhan.
      const urut = acak(s.o.map((_, i) => i));
      kartu.innerHTML = `
        <div class="demo-kepala"><span>Contoh soal</span><span class="demo-jam">2:00</span></div>
        <div class="demo-ikon">${window.IkonSoal.svg(s)}</div>
        <p class="demo-tanya">${aman(s.q)}</p>
        <div class="demo-ubin">
          ${urut.map((asli, i) => `<span class="ubin-mini ${WARNA_UBIN[i]}${asli === s.a ? ' benar' : ''}" style="--i:${i}">
              <i>${BENTUK[i]}</i><em>${aman(s.o[asli])}</em></span>`).join('')}
        </div>`;
      if (poin) { poin.classList.remove('muncul'); void poin.offsetWidth; poin.classList.add('muncul'); }
    };
    tampil();
    if (kurangiGerak()) return;
    demoId = setInterval(() => { if (!document.hidden) tampil(); }, 5200);
  }

  /* ── 5a. Cara Ikut ───────────────────────────────────────────── */

  function halamanCara() {
    halaman.innerHTML = kop('Cara Ikut') + `
      <div class="wadah">
        <div class="label-sudut">Panduan Peserta</div>
        <h1 class="judul-halaman">Empat langkah, <em>dikerjakan serentak</em></h1>
        <p class="ket-halaman">
          Tes ini mengukur pemahaman Anda tentang aplikasi eMonitoring DAK. Ada dua kali
          pengambilan dengan bank soal yang sama: <b>pre-test</b> sebelum materi bimtek dan
          <b>post-test</b> sesudahnya, supaya perubahan pemahaman satu kelas terlihat.
          Tidak ada nilai minimal kelulusan.
        </p>

        <div id="aturanSesi" class="kartu kartu-aturan">
          <div class="kosong">Memuat aturan sesi…</div>
        </div>

        <ol class="langkah" style="margin-top:22px">
          <li><strong>Buat akun daerah</strong>Sekali saja: nama, email, dan instansi asal. Tanpa kata sandi: email Anda yang menjadi penanda peserta, dan akun yang sama dipakai lagi pada post-test.
            <span class="catatan-hadiah">Pastikan alamat email yang diisi sudah benar dan aktif, karena akan ada voucher menarik bagi 3 besar pemenang.</span></li>
          <li><strong>Tunggu di lobi</strong>Masukkan token sesi yang dibagikan panitia, lalu tunggu sampai seluruh peserta masuk. Token hanya berlaku pada jendela waktu yang dibuka admin.</li>
          <li><strong>Tekan Kerjakan bersama-sama</strong>Sesudah aba-aba panitia, tekan tombol Kerjakan. Ada hitung mundur ${Number(K.detikAbaAba || 5)} detik supaya satu kelas mulai pada detik yang sama.</li>
          <li><strong>Jawab secepat mungkin</strong>Satu layar satu soal dengan hitung mundur sendiri. Jawaban benar bernilai poin, makin cepat makin besar, dan jawaban beruntun dapat bonus. Nilai, pembahasan, serta posisi Anda muncul begitu soal terakhir lewat.</li>
        </ol>

        <p class="ket-halaman" style="margin-top:22px">
          Satu email hanya dapat mengerjakan <b>satu kali per sesi untuk tiap jenis tes</b>.
          Sudah ikut pre-test tidak menghalangi Anda ikut post-test. Bila terjadi kendala,
          hubungi panitia lewat halaman <a href="#/bantuan">Bantuan</a>.
        </p>
        <a class="btn btn-kuning" href="#/akun">${akun ? 'Lanjut ke lobi' : 'Buat akun sekarang'}</a>
      </div>`;

    // Aturan yang ditampilkan diambil dari sesi yang sedang disiapkan panitia,
    // jadi angkanya selalu sama dengan yang nanti benar-benar dikerjakan.
    window.DB.ambilSesi()
      .then(dok => gambarAturanSesi(dok || K.sesiBawaan || {}))
      .catch(() => gambarAturanSesi(K.sesiBawaan || {}));
  }

  function gambarAturanSesi(s) {
    const kotak = $('#aturanSesi');
    if (!kotak) return;
    const jumlah = Number(s.jumlahSoal) || 20;
    const detik = Number(s.detikPerSoal) || 30;
    const info = infoJenis(s.jenis);
    const perSoal = lamaSoal(detik);
    const total = jumlah * detik;

    kotak.innerHTML = `
      <div class="label-sudut" style="margin:0 0 10px">Aturan Pengerjaan</div>
      <p class="ket-halaman" style="margin:0 0 16px">
        Sesi yang sedang disiapkan panitia: <b>${aman(info.panjang)}</b>${
          s.judul ? ' (' + aman(s.judul) + ')' : ''}. ${aman(info.ket || '')}
      </p>
      <div class="grid-statistik" style="margin:0">
        <div class="statistik sorot"><div class="angka">${jumlah}</div><div class="nama">Jumlah soal</div></div>
        <div class="statistik"><div class="angka">${perSoal}</div><div class="nama">Waktu per soal</div></div>
        <div class="statistik"><div class="angka">${mmss(total)}</div><div class="nama">Total maksimal</div></div>
      </div>
      <p class="ket-halaman" style="margin:16px 0 0">
        Setiap soal punya hitung mundurnya sendiri selama <b>${aman(perSoal)}</b>. Begitu waktu satu
        soal habis, layar berpindah sendiri ke soal berikutnya dan soal itu dihitung tidak dijawab,
        jadi seluruh ${jumlah} soal selesai paling lama ${mmss(total)}.
      </p>`;
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
            <div class="akun-rinci">${aman(akun.instansi)}<br>${aman(akun.email)}${
              akun.telepon ? ' · ' + aman(akun.telepon) : ''}</div>
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
              <span class="petunjuk">Penanda peserta, dipakai lagi pada post-test.</span>
              <span class="catatan-hadiah">Pastikan alamat email yang diisi sudah benar dan aktif, karena akan ada voucher menarik bagi 3 besar pemenang.</span>
            </div>
            <div id="isianBaru" hidden>
              <div class="kolom" id="kolomNama">
                <label for="fNama">Nama lengkap</label>
                <input id="fNama" name="nama" type="text" autocomplete="name" placeholder="mis. Budi Santoso, S.T." />
              </div>
              <div class="kolom" style="margin-top:16px">
                <label for="fTelepon">No. telepon / WhatsApp</label>
                <input id="fTelepon" name="telepon" type="tel" inputmode="tel" autocomplete="tel"
                       placeholder="mis. 0812 3456 7890" />
                <span class="petunjuk">Dipakai panitia untuk menghubungi Anda, termasuk bila masuk 3 besar.</span>
              </div>
              <div class="kolom kolom-pilih" id="kolomInstansi" style="margin-top:16px">
                <label for="fInstansi">Pemerintah daerah</label>
                <div class="pilih-bungkus">
                  <input id="fInstansi" name="instansi" type="text" autocomplete="off" spellcheck="false"
                         role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="daftarPemda"
                         placeholder="ketik nama kabupaten/kota, mis. Karo" />
                  <div class="pilih-daftar" id="daftarPemda" role="listbox" hidden></div>
                </div>
                <span class="petunjuk">Pilih dari daftar: 514 kabupaten/kota dan 38 provinsi se-Indonesia.</span>
              </div>
              <div class="kolom" id="kolomJabatan" style="margin-top:16px">
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
    // tahap: 'email' → 'baru' (daftar lengkap) atau 'lengkapi' (akun lama
    // yang belum punya nomor telepon — cukup nomor itu saja yang diminta)
    let tahap = 'email';
    let akunLama = null;

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      kotak.innerHTML = '';
      const email = form.email.value.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        kotak.innerHTML = '<div class="pesan pesan-galat">Alamat email belum benar.</div>';
        return;
      }

      if (tahap === 'email') {
        tombol.disabled = true; tombol.textContent = 'Memeriksa…';
        let ada = null;
        try { ada = await window.DB.ambilAkun(email); }
        catch (e) { console.warn('[akun] gagal memeriksa:', e); }
        tombol.disabled = false;

        if (ada && ada.telepon) {
          akun = {
            nama: ada.nama, email: ada.email, instansi: ada.instansi,
            provinsi: ada.provinsi || provinsiDari(ada.instansi), jabatan: ada.jabatan || '',
            telepon: ada.telepon
          };
          simpanAkunLokal();
          ke('#/lobi');
          return;
        }
        if (ada) {
          // Akun dibuat sebelum kolom telepon ada: minta nomornya sekali.
          tahap = 'lengkapi';
          akunLama = ada;
          $('#isianBaru').hidden = false;
          for (const id of ['#kolomNama', '#kolomInstansi', '#kolomJabatan']) $(id).hidden = true;
          tombol.textContent = 'Simpan & lanjut';
          kotak.innerHTML = '<div class="pesan pesan-info">Akun <b>' + aman(ada.nama) + '</b> ditemukan. ' +
            'Lengkapi nomor telepon/WhatsApp sekali saja untuk melanjutkan.</div>';
          $('#fTelepon').focus();
          return;
        }
        tahap = 'baru';
        $('#isianBaru').hidden = false;
        tombol.textContent = 'Daftarkan akun';
        kotak.innerHTML = '<div class="pesan pesan-info">Email ini belum terdaftar. Lengkapi nama, nomor telepon, dan instansi untuk membuat akun.</div>';
        $('#fNama').focus();
        return;
      }

      const telepon = rapikanTelepon(form.telepon.value);
      if (!telepon) {
        kotak.innerHTML = '<div class="pesan pesan-galat">Nomor telepon belum benar. ' +
          'Tulis nomor ponsel aktif, mis. 0812 3456 7890 atau +62 812 3456 7890.</div>';
        $('#fTelepon').focus();
        return;
      }

      if (tahap === 'lengkapi') {
        const a = akunLama;
        const isi = {
          nama: a.nama, email: a.email, instansi: a.instansi,
          provinsi: a.provinsi || provinsiDari(a.instansi), jabatan: a.jabatan || '',
          telepon, dibuat: a.dibuat
        };
        tombol.disabled = true; tombol.textContent = 'Menyimpan…';
        try { await window.DB.simpanAkun(isi); }
        catch (e) {
          console.warn('[akun] gagal menyimpan telepon:', e);
          kotak.innerHTML = '<div class="pesan pesan-galat">Nomor gagal disimpan ke server. Periksa sambungan internet lalu coba lagi.</div>';
          tombol.disabled = false; tombol.textContent = 'Simpan & lanjut';
          return;
        }
        akun = { nama: isi.nama, email: isi.email, instansi: isi.instansi,
                 provinsi: isi.provinsi, jabatan: isi.jabatan, telepon };
        simpanAkunLokal();
        ke('#/lobi');
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
        await window.DB.simpanAkun({ nama, email, instansi, provinsi, jabatan, telepon });
      } catch (e) {
        console.warn('[akun] gagal menyimpan:', e);
        kotak.innerHTML = '<div class="pesan pesan-galat">Akun gagal disimpan ke server. Periksa sambungan internet lalu coba lagi.</div>';
        tombol.disabled = false; tombol.textContent = 'Daftarkan akun';
        return;
      }
      akun = { nama, email, instansi, provinsi, jabatan, telepon };
      simpanAkunLokal();
      ke('#/lobi');
    });

    pasangPilihPemda('fInstansi', 'daftarPemda');

    const isiEmail = sessionStorage.getItem(KUNCI_ISI_EMAIL);
    if (isiEmail) {
      sessionStorage.removeItem(KUNCI_ISI_EMAIL);
      form.email.value = isiEmail;
      form.requestSubmit();
    }
  }

  /* ── 5c. Lobi ────────────────────────────────────────────────── */

  function halamanLobi() {
    if (!akun) { ke('#/akun'); return; }
    // Akun yang tersimpan di perangkat sebelum kolom telepon ada: kembali ke
    // formulir akun dengan email terisi, supaya nomornya diminta sekali.
    if (!akun.telepon) {
      sessionStorage.setItem(KUNCI_ISI_EMAIL, akun.email);
      akun = null; simpanAkunLokal();
      ke('#/akun');
      return;
    }

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
      sesi.judul, sesi.jenis, sesi.token, sesi.jumlahSoal, sesi.detikPerSoal,
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
      <div class="lencana-jenis ${jenisSah(sesi.jenis)}">${aman(infoJenis(sesi.jenis).label)}</div>
      <div class="sesi-judul">${aman(sesi.judul || K.namaSesi)}</div>
      <div class="sesi-rinci">
        ${Math.min(sesi.jumlahSoal || 25, maksButir())} soal · ${lamaSoal(sesi.detikPerSoal || 30)} per soal
        ${sesi.mulai ? ' · mulai ' + aman(tanggalIndo(sesi.mulai)) : ''}
      </div>` : '';

    if (st.keadaan === 'kosong' || st.keadaan === 'tutup') {
      kotak.innerHTML = kepala + `
        <div class="lampu lampu-tutup"><span></span> ${aman(st.teks)}</div>
        <p class="ket-halaman" style="margin:14px 0 0">
          Biarkan halaman ini terbuka. Begitu panitia membuka sesi, layar akan berubah sendiri.
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
        <p class="ket-halaman" style="margin:6px 0 0">Bersiap, layar ujian terbuka otomatis.</p>`;
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
        if (await window.DB.emailSudahIkut(akun.email, sesi.kode, sesi.jenis)) {
          kotakPesan.innerHTML = '<div class="pesan pesan-galat">Akun ini sudah mengerjakan ' +
            aman(infoJenis(sesi.jenis).label) + ' pada sesi tersebut. ' +
            'Lihat posisi Anda di <a href="#/peringkat">papan peringkat</a>.</div>';
          return;
        }
      } catch (e) { console.warn('[lobi] gagal memeriksa peserta:', e); }

      // Panitia bisa mengimpor soal baru sesudah halaman ini terbuka, jadi
      // bank disegarkan sekali di sini supaya lembar yang diundi memakai
      // bank yang paling akhir disimpan.
      try { pakaiBank(await window.DB.ambilBank()); }
      catch (e) { console.warn('[lobi] gagal menyegarkan bank soal:', e); }

      main = {
        akun,
        sesiKode: sesi.kode || 'sesi',
        sesiJudul: sesi.judul || K.namaSesi,
        sesiToken: sesi.token || '',
        jenisTes: jenisSah(sesi.jenis),
        detikPerSoal: sesi.detikPerSoal || 30,
        poinCepat: sesi.poinCepat !== false,
        batasSesi: sesi.selesai || null,
        butir: undiButir(sesi.jumlahSoal || 25),
        indeks: 0,
        jawaban: {},
        poin: 0,
        beruntun: 0,
        beruntunMaks: 0,
        dimulai: false,       // baru true sesudah hitung mundur aba-aba
        mulai: null,
        mulaiSoal: null
      };
      hasil = null; simpanHasilSesi();
      simpanMain();

      // Catat kehadiran untuk rekap per sesi. Tidak ditunggu lama: bila
      // gagal, peserta tetap bisa mengerjakan — nilainya sendiri yang
      // menjadi bukti ikut.
      window.DB.catatIkut(akun, kunciSesi(main.sesiKode, main.jenisTes, main.sesiToken), {
        judul: main.sesiJudul || '', kode: main.sesiKode, jenis: main.jenisTes,
        token: String(main.sesiToken || '').trim().toUpperCase()
      }).catch(e => console.warn('[lobi] gagal mencatat kehadiran:', e));

      ke('#/siap');
    };
  }

  /* ── 5c-2. Persiapan & aba-aba ───────────────────────────────────
     Peserta yang tokennya diterima berhenti di layar ini sampai panitia
     memberi aba-aba. Menekan "Kerjakan" memulai hitung mundur pendek
     supaya seisi kelas membuka soal pertama pada detik yang sama. */

  function halamanSiap() {
    if (!main) { ke(akun ? '#/lobi' : '#/akun'); return; }
    if (main.dimulai) { ke('#/tes'); return; }

    const jumlah = main.butir.length;
    const perSoal = lamaSoal(main.detikPerSoal || 30);
    const info = infoJenis(main.jenisTes);

    halaman.innerHTML = kop('Persiapan', true) + `
      <div class="wadah wadah-sempit">
        <div class="label-sudut">Bersiap</div>
        <h1 class="judul-halaman">Siap, <em>${aman(main.akun.nama.split(' ')[0])}</em>?</h1>
        <div class="kartu kartu-siap">
          <div class="lencana-jenis ${jenisSah(main.jenisTes)}">${aman(info.label)}</div>
          <div class="sesi-judul">${aman(main.sesiJudul || K.namaSesi)}</div>
          <div class="grid-statistik">
            <div class="statistik sorot"><div class="angka">${jumlah}</div><div class="nama">Soal</div></div>
            <div class="statistik"><div class="angka">${perSoal}</div><div class="nama">Waktu per soal</div></div>
            <div class="statistik"><div class="angka">${mmss(jumlah * (main.detikPerSoal || 30))}</div><div class="nama">Total maksimal</div></div>
          </div>
          <ul class="daftar-siap">
            <li>Satu layar satu soal. Jawaban tidak bisa diubah setelah dipilih.</li>
            <li>Makin cepat menjawab benar, makin besar poinnya.</li>
            <li>Jangan tutup halaman; bila tertutup, buka lagi alamat yang sama.</li>
          </ul>
          <p class="ket-halaman" style="margin:0 0 18px">
            Tunggu aba-aba panitia, lalu tekan tombol di bawah bersama-sama.
          </p>
          <button class="btn btn-kuning btn-blok btn-besar" id="btnKerjakan">Kerjakan</button>
        </div>
      </div>
      <div id="abaAba" class="aba-aba" hidden></div>`;

    $('#btnKerjakan').onclick = () => {
      $('#btnKerjakan').disabled = true;
      jalankanAbaAba();
    };
  }

  function jalankanAbaAba() {
    const layar = $('#abaAba');
    const total = Math.max(1, Number(K.detikAbaAba) || 5);
    let sisa = total;

    const gambar = () => {
      layar.hidden = false;
      layar.innerHTML = sisa > 0
        ? `<div class="aba-angka" key="${sisa}">${sisa}</div>
           <div class="aba-teks">Bersiap…</div>`
        : `<div class="aba-go">GO!</div>`;
      Suara.tik();
    };

    gambar();
    if (jamId) { clearInterval(jamId); jamId = null; }
    jamId = setInterval(() => {
      sisa -= 1;
      if (sisa < 0) {
        clearInterval(jamId); jamId = null;
        main.dimulai = true;
        main.mulai = Date.now();
        main.mulaiSoal = Date.now();
        simpanMain();
        ke('#/tes');
        return;
      }
      gambar();
    }, 1000);
  }

  /* ── 5d. Ujian ala Kahoot ────────────────────────────────────── */

  function halamanTes() {
    if (!main) { ke(akun ? '#/lobi' : '#/akun'); return; }
    if (!main.dimulai) { ke('#/siap'); return; }

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
        <div class="jejak-soal hanya-baru" id="jejakSoal" aria-hidden="true"></div>
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

    gambarJejak();

    $('#panggung').innerHTML = `
      <div class="kartu kartu-soal" id="kartuSoal">
        ${window.IkonSoal ? `<div class="soal-ikon hanya-baru">${window.IkonSoal.svg(s)}</div>` : ''}
        <div class="soal-isi">
          <p class="teks-soal">${aman(s.q)}</p>
        </div>
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

  /* Jejak soal (tampilan baru): satu ruas per butir, hijau bila benar,
     merah bila salah atau habis waktu, dan ruas yang sedang dikerjakan
     ditandai. Peserta tahu posisinya tanpa membaca angka. */
  function gambarJejak() {
    const el = $('#jejakSoal');
    if (!el) return;
    el.innerHTML = main.butir.map((b, n) => {
      const j = main.jawaban[b.id];
      const kelas = j ? (j.benar ? 'benar' : 'salah') : (n === main.indeks ? 'kini' : '');
      return `<i class="${kelas}"></i>`;
    }).join('');
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
        jam.style.setProperty('--sisa', Math.max(0, sisa / batas).toFixed(4));
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
    gambarJejak();
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

    // "detik" = lama peserta memikirkan butir itu; null bila soal tidak
    // sempat tampil karena jendela sesi keburu ditutup panitia.
    const rincian = main.butir.map((b, n) => {
      const j = main.jawaban[b.id];
      return {
        id: b.id,
        urut: n + 1,
        pilih: j ? j.pilih : -1,
        benar: j ? !!j.benar : false,
        poin: j ? j.poin : 0,
        detik: j ? j.detik : null,
        habisWaktu: j ? j.pilih === -1 : false
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
      telepon: a.telepon || '',
      sesiKode: main.sesiKode,
      sesiJudul: main.sesiJudul,
      sesiToken: main.sesiToken || '',
      jenisTes: jenisSah(main.jenisTes),
      tahun: K.tahun || new Date().getFullYear(),
      skor: Math.round((benar / total) * 100),
      poin: main.poin,
      benar, total,
      beruntunMaks: main.beruntunMaks,
      durasiDetik: main.mulai ? Math.round((Date.now() - main.mulai) / 1000) : 0,
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

    const infoH = infoJenis(h.jenisTes);

    halaman.innerHTML = kop('Hasil ' + infoH.label) + `
      <div class="wadah">
        <div class="label-sudut">Lembar Jawaban Terkirim</div>
        <h1 class="judul-halaman">Kerja bagus, <em>${aman(h.nama.split(' ')[0])}</em></h1>
        <p class="ket-halaman">
          <span class="lencana-jenis kecil ${jenisSah(h.jenisTes)}">${aman(infoH.label)}</span>
          ${aman(h.instansi)} · ${aman(h.sesiJudul || '')} · ${aman(tanggalIndo(h.waktuSelesai))}
        </p>

        ${h.sebabSelesai === 'waktu-sesi' ? '<div class="pesan pesan-info" style="margin-bottom:18px">Jendela waktu sesi berakhir, jadi lembar jawaban dikumpulkan otomatis.</div>' : ''}
        ${h.tersimpan ? '' : '<div class="pesan pesan-galat" style="margin-bottom:18px">Nilai Anda gagal dikirim ke server (jaringan bermasalah). Tunjukkan layar ini ke panitia sebelum menutup halaman.</div>'}

        <div class="kartu" style="text-align:center">
          <div class="poin-besar" data-hitung="${Number(h.poin) || 0}">${angkaRapi(h.poin)}</div>
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

        <h2 class="judul-halaman" style="font-size:20px;margin:34px 0 6px">Waktu penyelesaian tiap soal</h2>
        <p class="ket-halaman">Lama Anda memikirkan tiap butir, dari soal pertama sampai terakhir.</p>
        ${tabelWaktuPeserta(h)}

        <h2 class="judul-halaman" style="font-size:20px;margin:34px 0 14px">Pembahasan</h2>
        <div class="bahasan">
          ${h.jawaban.map((r, n) => {
            const s = soalDari(r.id);
            if (!s) return '';
            const jawabTeks = r.pilih >= 0 ? s.o[r.pilih] : 'Tidak dijawab / waktu habis';
            const waktu = r.detik != null ? ` · ${r.detik} detik` : '';
            return `
              <div class="butir${r.benar ? ' tepat' : ''}">
                ${window.IkonSoal ? `<div class="butir-ikon hanya-baru">${window.IkonSoal.svg(s, { statis: true })}</div>` : ''}
                <div class="tanya">${n + 1}. ${aman(s.q)}</div>
                <div class="baris kunci">Kunci: <b>${aman(s.o[s.a])}</b></div>
                ${r.benar
                  ? `<div class="baris">Poin: <b>+${angkaRapi(r.poin)}</b>${waktu}</div>`
                  : `<div class="baris jawab-salah">Jawaban Anda: <b>${aman(jawabTeks)}</b>${waktu}</div>`}
                <div class="catatan">${aman(s.bahas || '')}</div>
              </div>`;
          }).join('')}
        </div>
      </div>`;

    hitungNaik($('.poin-besar[data-hitung]'));
  }

  /* Angka poin naik dari nol saat halaman hasil terbuka. Sekali saja per
     kunjungan; dilewati bila pengguna memilih kurangi gerakan. */
  function hitungNaik(el) {
    if (!el || kurangiGerak()) return;
    const akhir = Number(el.dataset.hitung) || 0;
    const lama = 1100;
    const mulai = performance.now();
    const langkah = (t) => {
      const p = Math.min(1, (t - mulai) / lama);
      const lunak = 1 - Math.pow(1 - p, 3);
      el.textContent = angkaRapi(Math.round(akhir * lunak));
      if (p < 1 && document.body.contains(el)) requestAnimationFrame(langkah);
    };
    requestAnimationFrame(langkah);
  }

  /* Rekap waktu tiap butir untuk satu peserta. Batang di kolom terakhir
     dibandingkan terhadap butir yang paling lama dikerjakan, jadi butir
     yang bikin tersendat langsung kelihatan. */
  function tabelWaktuPeserta(h) {
    const daftar = h.jawaban || [];
    const terpakai = daftar.filter(r => r.detik != null).map(r => r.detik);
    if (!terpakai.length) return '<div class="kartu"><div class="kosong">Tidak ada soal yang sempat dikerjakan.</div></div>';
    const maks = Math.max(...terpakai, 1);
    const jumlah = terpakai.reduce((t, d) => t + d, 0);
    const rata = Math.round(jumlah / terpakai.length);

    return `
      <div class="tabel-bungkus">
        <table class="tabel">
          <thead><tr><th>#</th><th>Kode</th><th>Pertanyaan</th><th class="angka">Waktu</th><th>Hasil</th><th class="lebar">Perbandingan</th></tr></thead>
          <tbody>
            ${daftar.map((r, n) => {
              const s = soalDari(r.id);
              const d = r.detik;
              return `
                <tr>
                  <td class="peringkat-nomor">${n + 1}</td>
                  <td>${aman(r.id)}</td>
                  <td class="bebas">${aman(s ? s.q : '-')}</td>
                  <td class="angka">${d == null ? '-' : d + ' dtk'}</td>
                  <td>${r.benar
                    ? '<span class="tanda benar">Benar</span>'
                    : (r.pilih < 0 ? '<span class="tanda habis">Waktu habis</span>' : '<span class="tanda salah">Salah</span>')}</td>
                  <td><span class="batang"><i style="width:${d == null ? 0 : Math.round((d / maks) * 100)}%" class="${r.benar ? 'ok' : 'no'}"></i></span></td>
                </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr><td colspan="3">Rata-rata per soal · total waktu kerja</td>
                <td class="angka">${rata} dtk</td><td colspan="2">${mmss(h.durasiDetik)}</td></tr>
          </tfoot>
        </table>
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
        <h1 class="judul-halaman">Papan <em>juara</em> ${aman(String(K.tahun || ''))}</h1>
        <p class="ket-halaman">Urutan disusun dari poin tertinggi: jawaban benar yang cepat dan beruntun naik lebih tinggi.</p>
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
    let jenisSesi = null;
    window.DB.ambilSesi()
      .then(dok => {
        sesi = dok;
        kodeSesi = dok && dok.kode ? dok.kode : null;
        jenisSesi = dok ? jenisSah(dok.jenis) : null;
        gambar();
      })
      .catch(() => gambar());

    let terakhir = null;
    const gambar = () => {
      const kotak = $('#isiPeringkat');
      if (!kotak || !terakhir) return;
      // Pre-test dan post-test punya papan sendiri walaupun kode sesinya sama.
      const saring = kodeSesi
        ? terakhir.filter(p => p.sesiKode === kodeSesi &&
            (!jenisSesi || jenisSah(p.jenisTes) === jenisSesi))
        : terakhir;
      kotak.classList.remove('kosong');
      kotak.innerHTML = isiPapan(urutkan(saring), sesi);
    };

    lepasPantau = window.DB.pantauHasil((daftar) => { terakhir = daftar; gambar(); });
  }

  function isiPapan(daftar, sesiIni) {
    const judulSesi = sesiIni && sesiIni.judul
      ? `<p class="ket-halaman" style="margin:-14px 0 20px">
           <span class="lencana-jenis kecil ${jenisSah(sesiIni.jenis)}">${aman(infoJenis(sesiIni.jenis).label)}</span>
           Sesi: <b class="tegas">${aman(sesiIni.judul)}</b>
           ${sesiIni.token ? ' · token <b class="tegas">' + aman(sesiIni.token) + '</b>' : ''}
         </p>`
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
      <div class="podium isi-${tigaBesar.length}">${mimbar}</div>
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
            <button class="btn btn-kuning" id="btnUnduhXlsx" title="Satu berkas berisi semua sesi; Excel per sesi ada di bagian Rekap per sesi">Unduh Excel semua sesi</button>
            <button class="btn btn-hantu" id="btnUnduh">Unduh CSV</button>
            <button class="btn btn-hantu" id="btnKeluarAdmin">Keluar</button>
          </div>
        </div>

        <div class="kartu" id="kartuSesi"><div class="kosong">Memuat pengaturan sesi…</div></div>
        <div id="pesanSesi"></div>

        <h2 class="judul-halaman" id="judulRekapSesi" style="font-size:20px;margin:34px 0 6px">Rekap per sesi</h2>
        <p class="ket-halaman">
          Satu kartu untuk tiap pelaksanaan; pre-test dan post-test selalu terpisah. Begitu sesi
          diakhiri, jumlah peserta yang masuk dan yang mengumpulkan langsung tampil di sini, dan
          Excel-nya bisa diunduh per sesi.
        </p>
        <div id="rekapSesi"><div class="kosong">Memuat rekap…</div></div>

        <h2 class="judul-halaman" style="font-size:20px;margin:34px 0 6px">Bank soal</h2>
        <p class="ket-halaman">
          Soal yang diundikan ke peserta. Bila penyelenggara mengirim revisi, masukkan di sini.
          Berlaku seketika untuk semua peserta, tanpa perlu memasang ulang aplikasi.
        </p>
        <div class="kartu" id="kartuBank"><div class="kosong">Memuat bank soal…</div></div>

        <h2 class="judul-halaman" style="font-size:20px;margin:38px 0 6px">Pemantauan langsung</h2>
        <p class="ket-halaman">Angka di bawah ikut berubah sendiri saat peserta mengumpulkan jawaban.</p>
        <div id="isiAdmin" class="kosong">Memuat data…</div>

        <h2 class="judul-halaman" style="font-size:20px;margin:38px 0 6px">Pembersihan data</h2>
        <p class="ket-halaman">
          Dipakai saat menyiapkan angkatan berikutnya. Semua tindakan di bawah
          <b>tidak bisa dibatalkan</b>.
        </p>
        <div class="kartu kartu-bahaya" id="kartuBahaya">
          <div class="baris-tombol">
            <button class="btn btn-bahaya" id="btnResetUji">Reset masa uji coba: hapus semua pendaftar &amp; nilai</button>
          </div>
          <p class="ket-halaman" style="margin:12px 0 18px">
            Dipakai selama uji coba: seluruh akun yang sudah mendaftar dan seluruh nilai dibuang
            sekaligus, sehingga orang yang sama bisa mendaftar dan mengerjakan lagi dari nol.
            Konfirmasinya diketik <b class="tegas">saya akan lawan</b>.
          </p>
          <div class="baris-tombol">
            <button class="btn btn-hantu" id="btnHapusAkun">Hapus akun peserta saja</button>
            <button class="btn btn-hantu" id="btnHapusHasilSesi">Hapus hasil sesi ini</button>
            <button class="btn btn-hantu" id="btnHapusHasilSemua">Hapus seluruh riwayat hasil</button>
          </div>
          <p class="ket-halaman" style="margin:14px 0 0">
            Tiga tombol di atas bekerja sendiri-sendiri: menghapus akun tidak menghapus nilai yang
            sudah masuk, dan sebaliknya. Peserta yang akunnya dihapus cukup mendaftar ulang dengan
            email yang sama.
          </p>
          <div id="pesanBahaya"></div>
        </div>
      </div>`;

    $('#btnKeluarAdmin').onclick = () => {
      window.DB.keluarAdmin();
      adminMasuk = null;
      ke('#/');
    };

    rekapTergambar = null;

    // ── bank soal ──
    imporKini = null;
    gambarBank();

    // ── kendali sesi ──
    let daftarKini = [];
    let sidikSesi = null;
    sesiTergambar = null;
    lepasPantau = window.DB.pantauSesi((dok) => {
      sesi = dok || { ...(K.sesiBawaan || {}) };
      gambarKendaliSesi();
      // Kode dan token sesi ikut menentukan isi tabel pemantauan beserta
      // daftar pilihan penyaringnya, jadi tabel digambar ulang begitu salah
      // satunya berubah. Tanpa ini, sesi yang baru dibuat tidak muncul di
      // kotak "Tampilkan" sampai ada peserta pertama yang mengumpulkan.
      const sidik = (sesi.kode || '') + '|' + (sesi.token || '');
      if (sidik !== sidikSesi) { sidikSesi = sidik; gambarPantauan(daftarKini); }
      gambarRekapSesi();
    });

    // Penunjuk lama sesi berdenyut sendiri tiap detik. Hanya isi teksnya yang
    // ditulis ulang, jadi ketikan admin di formulir sesi tidak ikut hilang.
    if (jamId) clearInterval(jamId);
    jamId = setInterval(perbaruiJamSesi, 1000);

    // ── pemantauan hasil ──
    const lepasHasil = window.DB.pantauHasil((daftar) => {
      daftarKini = urutkan(daftar);
      rekapHasil = daftarKini;
      gambarPantauan(daftarKini);
      gambarRekapSesi();
    });
    // Akun ikut dipantau: peta `ikut` di tiap akun adalah catatan siapa saja
    // yang memasukkan token sesi, dasar hitungan "masuk sesi" pada rekap.
    const lepasAkun = window.DB.pantauAkun((daftar) => {
      rekapAkun = daftar;
      teleponAkun = new Map(daftar.filter(a => a.telepon)
        .map(a => [String(a.emailKunci || a.email || '').trim().toLowerCase(), a.telepon]));
      gambarRekapSesi();
    });
    const lepasSesi = lepasPantau;
    lepasPantau = () => { lepasSesi(); lepasHasil(); lepasAkun(); };

    $('#btnUnduh').onclick = () => unduhCsv(saringTampil(daftarKini));
    $('#btnUnduhXlsx').onclick = () => unduhExcel(daftarKini);

    pasangTombolBahaya(() => daftarKini);
  }

  /* ── tombol pembersihan data ─────────────────────────────────────
     Sengaja meminta pengetikan ulang kata kunci, bukan sekadar OK,
     karena satu klik keliru menghapus seluruh daftar peserta.

     Tindakan yang menyentuh akun peserta memakai kata kunci "saya akan
     lawan" atas permintaan penyelenggara — kalimatnya panjang dan tidak
     mungkin terketik tanpa sengaja. */

  const KATA_PESERTA = 'saya akan lawan';

  function pasangTombolBahaya(ambilDaftar) {
    const pesan = $('#pesanBahaya');
    if (!pesan) return;

    // Perbandingan tidak peka huruf besar/kecil maupun spasi berlebih,
    // supaya panitia tidak gagal hanya karena mengetik "Saya Akan Lawan".
    const samakan = (t) => String(t == null ? '' : t).trim().replace(/\s+/g, ' ').toLowerCase();

    const kerjakan = async (tombol, kataKunci, tanya, aksi, sesudah) => {
      if (!confirm(tanya)) return;
      const ketik = prompt('Ketik "' + kataKunci + '" untuk memastikan:');
      if (ketik === null) return;
      if (samakan(ketik) !== samakan(kataKunci)) {
        pesan.innerHTML = '<div class="pesan pesan-info">Dibatalkan, kata kuncinya tidak cocok.</div>';
        return;
      }
      const teksAsli = tombol.textContent;
      tombol.disabled = true; tombol.textContent = 'Menghapus…';
      try {
        const n = await aksi();
        pesan.innerHTML = '<div class="pesan pesan-info">' + aman(sesudah(n)) + '</div>';
      } catch (e) {
        console.error('[admin] gagal menghapus:', e);
        pesan.innerHTML = '<div class="pesan pesan-galat">Gagal menghapus: ' + aman(e.code || e.message) +
          '<br>Bila pesannya soal izin, pastikan email panitia ini terdaftar pada <b>emailAdmin()</b> ' +
          'di firestore.rules dan aturan terbaru sudah dipublikasikan.</div>';
      }
      tombol.disabled = false; tombol.textContent = teksAsli;
    };

    // Reset masa uji coba: akun DAN nilai dibuang sekaligus, supaya orang
    // yang sama bisa mendaftar lagi lalu mengerjakan lagi dari nol.
    const tReset = $('#btnResetUji');
    if (tReset) tReset.onclick = () => kerjakan(tReset, KATA_PESERTA,
      'RESET MASA UJI COBA\n\n' +
      'Seluruh akun peserta yang sudah mendaftar DAN seluruh nilai yang pernah masuk ' +
      'akan dihapus, dari semua sesi dan semua angkatan.\n\n' +
      'Sesudah ini semua orang bisa mendaftar ulang dan mengerjakan lagi dari nol. Lanjutkan?',
      async () => {
        const akun = await window.DB.hapusSemuaAkun();
        const nilai = await window.DB.hapusSemuaHasil(null);
        return { akun, nilai };
      },
      n => n.akun + ' akun peserta dan ' + n.nilai + ' rekaman nilai terhapus. ' +
           'Pendaftaran sekarang benar-benar kosong.');

    const tAkun = $('#btnHapusAkun');
    if (tAkun) tAkun.onclick = () => kerjakan(tAkun, KATA_PESERTA,
      'Hapus SELURUH akun peserta yang pernah mendaftar?\n' +
      'Nilai yang sudah masuk TIDAK ikut terhapus.',
      () => window.DB.hapusSemuaAkun(),
      n => n + ' akun peserta terhapus.');

    const tSesi = $('#btnHapusHasilSesi');
    if (tSesi) tSesi.onclick = () => {
      const kode = (sesi && sesi.kode) || '';
      if (!kode) { pesan.innerHTML = '<div class="pesan pesan-galat">Belum ada kode sesi yang aktif.</div>'; return; }
      kerjakan(tSesi, 'HAPUS',
        'Hapus seluruh hasil pada sesi "' + kode + '"?',
        () => window.DB.hapusSemuaHasil(kode),
        n => n + ' rekaman nilai sesi ' + kode + ' terhapus.');
    };

    const tSemua = $('#btnHapusHasilSemua');
    if (tSemua) tSemua.onclick = () => kerjakan(tSemua, 'HAPUS SEMUA',
      'Hapus SELURUH riwayat hasil dari semua sesi dan semua angkatan?',
      () => window.DB.hapusSemuaHasil(null),
      n => n + ' rekaman nilai terhapus.');
  }

  /* Penunjuk "sesi sudah berjalan berapa lama" di kepala kartu sesi. */
  function perbaruiJamSesi() {
    const el = $('#jamSesiAdmin');
    if (!el || !sesi) return;
    const st = statusSesi(sesi);
    if (st.keadaan === 'buka' && st.mulai) {
      const berjalan = hitungMundurPanjang(Date.now() - st.mulai);
      el.textContent = st.sisaTutup != null
        ? `Berjalan ${berjalan} · sisa ${hitungMundurPanjang(st.sisaTutup)}`
        : `Berjalan ${berjalan}`;
    } else if (st.keadaan === 'menunggu') {
      el.textContent = `Mulai dalam ${hitungMundurPanjang(st.sisaMulai)}`;
    } else if (st.keadaan === 'lewat' && sesi.selesai) {
      el.textContent = `Berakhir ${tanggalIndo(sesi.selesai)}`;
    } else {
      el.textContent = '';
    }
  }

  // Sidik isi sesi yang sedang tergambar. Pemantauan sesi berdenyut tiap
  // beberapa detik; tanpa penjaga ini formulir akan dibangun ulang terus dan
  // menghapus ketikan admin.
  let sesiTergambar = null;

  /* Penyaring tabel pemantauan admin.
       ''        → hanya sesi yang sedang berjalan (kode di kartu sesi)
       '*'       → seluruh riwayat, semua angkatan
       'A7K2M9'  → hanya peserta yang masuk dengan token itu */
  let saringToken = '';

  const tokenDari = (p) => String(p.sesiToken || '').trim().toUpperCase();

  function saringTampil(daftar) {
    if (saringToken === '*') return daftar;
    if (saringToken) return daftar.filter(p => tokenDari(p) === saringToken);
    const kode = (sesi && sesi.kode) || null;
    return kode ? daftar.filter(p => p.sesiKode === kode) : daftar;
  }

  function gambarKendaliSesi() {
    const kotak = $('#kartuSesi');
    if (!kotak) return;
    // Isi bank ikut disidik: mengimpor soal mengubah batas "jumlah soal",
    // jadi formulirnya perlu digambar ulang.
    const cap = JSON.stringify([sesi || null, BANK.length, maksButir()]);
    if (cap === sesiTergambar) return;
    sesiTergambar = cap;
    const s = sesi || {};
    const st = statusSesi(s);
    const maks = maksButir();
    const lampu = { buka: 'lampu-buka', menunggu: 'lampu-tunggu' }[st.keadaan] || 'lampu-tutup';
    const ket = {
      buka: 'Sesi TERBUKA, peserta bisa masuk dengan token',
      menunggu: 'Terjadwal, menunggu waktu mulai',
      lewat: 'Waktu sesi sudah lewat',
      tutup: 'Sesi tertutup',
      kosong: 'Belum ada sesi'
    }[st.keadaan];

    kotak.innerHTML = `
      <div class="bilah-lampu">
        <div class="lampu ${lampu}"><span></span> ${aman(ket)}</div>
        <div class="jam-sesi" id="jamSesiAdmin"></div>
      </div>
      <form class="formulir kisi-dua" id="formSesi" style="margin-top:18px">
        <div class="kolom kolom-lebar">
          <label>Jenis tes</label>
          <div class="pilih-jenis">
            ${['pre', 'post'].map(j => `
              <label class="jenis-opsi ${jenisSah(s.jenis) === j ? 'terpilih' : ''}">
                <input type="radio" name="sJenis" value="${j}" ${jenisSah(s.jenis) === j ? 'checked' : ''} />
                <b>${aman(infoJenis(j).label)}</b>
                <small>${aman(infoJenis(j).ket)}</small>
              </label>`).join('')}
          </div>
          <span class="petunjuk">
            Bank soalnya sama persis; yang berbeda hanya judul, sebutan di layar, dan pemisahan rekap.
            Satu peserta boleh mengerjakan pre-test dan post-test walaupun kode sesinya tidak diubah.
          </span>
        </div>
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
          <label for="sJumlah">Jumlah soal (maks. ${maks})</label>
          <input id="sJumlah" type="number" min="5" max="${maks}" value="${Math.min(Number(s.jumlahSoal || 25), maks)}" />
          <span class="petunjuk">Batasnya ${maks}, sebanyak grup soal unik di bank.
            Tambah butir lewat "Bank soal" di bawah bila perlu lebih banyak.</span>
        </div>
        <div class="kolom">
          <label for="sDetik">Detik per soal</label>
          <input id="sDetik" type="number" min="10" max="600" value="${Number(s.detikPerSoal || 30)}" />
          <span class="petunjuk">120 = 2 menit per soal. Total maksimal
            ${mmss(Math.min(Number(s.jumlahSoal || 25), maks) * Number(s.detikPerSoal || 30))}.</span>
        </div>
        <div class="kolom kolom-lebar">
          <label class="centang">
            <input id="sPoinCepat" type="checkbox" ${s.poinCepat !== false ? 'checked' : ''} />
            <span>Poin kecepatan: makin cepat menjawab, makin besar poinnya</span>
          </label>
        </div>
        <div class="kolom-lebar baris-tombol">
          <button class="btn btn-biru" type="submit">Simpan pengaturan</button>
          ${st.keadaan === 'buka'
            ? '<button class="btn btn-kuning" id="btnAkhiri" type="button">Akhiri sesi sekarang</button>'
            : '<button class="btn btn-kuning" id="btnBuka" type="button">Buka sesi sekarang</button>'}
          ${st.keadaan !== 'buka' && (s.aktif || st.keadaan === 'menunggu')
            ? '<button class="btn btn-hantu" id="btnAkhiri2" type="button">Batalkan jadwal</button>'
            : ''}
        </div>
      </form>`;

    const bacaForm = () => ({
      kode: $('#sKode').value.trim() || 'sesi',
      jenis: (document.querySelector('input[name="sJenis"]:checked') || {}).value === 'post' ? 'post' : 'pre',
      token: $('#sToken').value.trim(),
      judul: $('#sJudul').value.trim(),
      mulai: $('#sMulai').value ? new Date($('#sMulai').value).toISOString() : null,
      selesai: $('#sSelesai').value ? new Date($('#sSelesai').value).toISOString() : null,
      jumlahSoal: Math.min(maksButir(), Math.max(5, Number($('#sJumlah').value) || 25)),
      detikPerSoal: Math.min(600, Math.max(10, Number($('#sDetik').value) || 30)),
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

    // Mengganti jenis tes ikut menyesuaikan judul bawaan, selama judulnya
    // belum diubah sendiri oleh panitia.
    for (const radio of kotak.querySelectorAll('input[name="sJenis"]')) {
      radio.onchange = () => {
        for (const opsi of kotak.querySelectorAll('.jenis-opsi')) {
          opsi.classList.toggle('terpilih', opsi.contains(radio) && radio.checked);
        }
        const judul = $('#sJudul');
        const lawan = infoJenis(radio.value === 'post' ? 'pre' : 'post');
        const kini = infoJenis(radio.value);
        if (!judul.value.trim()) judul.value = kini.panjang;
        else if (judul.value.includes(lawan.label)) judul.value = judul.value.replace(lawan.label, kini.label);
      };
    }

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
    // Mengakhiri sesi: pintu ditutup seketika. Peserta yang sedang
    // mengerjakan tetap dikumpulkan lembar jawabannya oleh jalankanJamSoal(),
    // tetapi tidak ada peserta baru yang bisa masuk dengan token itu lagi.
    const akhiri = () => {
      if (!confirm('Akhiri sesi sekarang?\n' +
        'Peserta yang belum masuk tidak dapat lagi memakai token ini, dan lembar jawaban ' +
        'yang sedang dikerjakan langsung dikumpulkan.')) return;
      // Kartu rekap sesi yang baru dihentikan disorot dan digulir ke layar,
      // supaya panitia langsung melihat berapa yang masuk dan mengumpulkan.
      const isi = bacaForm();
      sorotRekap = kunciSesi(isi.kode, isi.jenis, isi.token);
      simpan({ aktif: false, selesai: new Date().toISOString() }).then(() => {
        gambarRekapSesi();
        const kartu = document.querySelector('.kartu-rekap.disorot');
        if (kartu) kartu.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    };
    const tAkhiri = $('#btnAkhiri');
    if (tAkhiri) tAkhiri.onclick = akhiri;
    const tAkhiri2 = $('#btnAkhiri2');
    if (tAkhiri2) tAkhiri2.onclick = () => simpan({ aktif: false });

    perbaruiJamSesi();
  }

  /* Urutan tabel rekap butir: 'lama' = paling menyita waktu di atas,
     'salah' = paling banyak dijawab keliru di atas. */
  let urutButir = 'lama';

  async function gambarPantauan(daftar) {
    const kotak = $('#isiAdmin');
    if (!kotak) return;
    // kelas .kosong hanya untuk teks "Memuat data…"; kalau dibiarkan, seluruh
    // isi pemantauan ikut rata tengah
    kotak.classList.remove('kosong');

    const kode = (sesi && sesi.kode) || null;
    const tampil = saringTampil(daftar);

    // Daftar token yang pernah dipakai peserta, untuk kotak penyaring.
    const hitungToken = new Map();
    for (const p of daftar) {
      const t = tokenDari(p);
      if (!t) continue;
      hitungToken.set(t, (hitungToken.get(t) || 0) + 1);
    }
    // Token sesi yang baru dibuat belum punya satu peserta pun. Kalau hanya
    // token milik peserta yang didaftar, sesi baru itu tidak muncul sama
    // sekali di kotak penyaring dan panitia mengira sesinya gagal dibuat.
    const tokenSesi = String((sesi && sesi.token) || '').trim().toUpperCase();
    if (tokenSesi && !hitungToken.has(tokenSesi)) hitungToken.set(tokenSesi, 0);
    if (saringToken && saringToken !== '*' && !hitungToken.has(saringToken)) hitungToken.set(saringToken, 0);
    const pilihanToken = [...hitungToken.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    let jumlahAkun = rekapAkun ? rekapAkun.length : '-';
    if (!rekapAkun) {
      try { jumlahAkun = await window.DB.jumlahAkun(); } catch { /* biarkan */ }
    }

    const n = tampil.length;
    const instansi = new Set(tampil.map(p => (p.instansi || '').trim().toLowerCase())).size;
    const rata = n ? Math.round(tampil.reduce((t, p) => t + (p.skor || 0), 0) / n) : 0;
    const rataPoin = n ? Math.round(tampil.reduce((t, p) => t + (p.poin || 0), 0) / n) : 0;
    const rataDurasi = n ? Math.round(tampil.reduce((t, p) => t + (p.durasiDetik || 0), 0) / n) : 0;
    const tertinggi = n ? Math.max(...tampil.map(p => p.skor || 0)) : 0;
    const terendah = n ? Math.min(...tampil.map(p => p.skor || 0)) : 0;

    const judulSaring = saringToken === '*'
      ? 'seluruh riwayat'
      : (saringToken ? 'token ' + saringToken : (kode ? 'sesi ' + kode : 'semua'));

    kotak.innerHTML = `
      <div class="baris-saring">
        <div class="kolom" style="max-width:320px;margin:0">
          <label for="saringSesi">Tampilkan</label>
          <select id="saringSesi">
            <option value=""${saringToken === '' ? ' selected' : ''}>Sesi berjalan${kode ? ' (' + aman(kode) + ')' : ''}</option>
            <option value="*"${saringToken === '*' ? ' selected' : ''}>Seluruh riwayat (semua angkatan)</option>
            ${pilihanToken.map(([t, j]) => `
              <option value="${aman(t)}"${saringToken === t ? ' selected' : ''}>Token ${aman(t)}${
                  t === tokenSesi ? ' (sesi berjalan)' : ''}: ${j ? j + ' peserta' : 'belum ada peserta'}</option>`).join('')}
          </select>
          <span class="petunjuk">Rekap Excel selalu memisahkan tiap token menjadi sheet sendiri.</span>
        </div>
      </div>

      <div class="grid-statistik">
        <div class="statistik sorot"><div class="angka">${n}</div><div class="nama">Sudah mengisi (${aman(judulSaring)})</div></div>
        <div class="statistik"><div class="angka">${jumlahAkun}</div><div class="nama">Akun terdaftar</div></div>
        <div class="statistik"><div class="angka">${instansi}</div><div class="nama">Instansi</div></div>
        <div class="statistik"><div class="angka">${angkaRapi(rataPoin)}</div><div class="nama">Rata-rata poin</div></div>
        <div class="statistik"><div class="angka">${rata}</div><div class="nama">Rata-rata nilai</div></div>
        <div class="statistik"><div class="angka">${tertinggi}</div><div class="nama">Nilai tertinggi</div></div>
        <div class="statistik"><div class="angka">${terendah}</div><div class="nama">Nilai terendah</div></div>
        <div class="statistik"><div class="angka">${mmss(rataDurasi)}</div><div class="nama">Rata-rata waktu kerja</div></div>
      </div>

      ${n === 0 ? '<div class="kartu" style="margin-top:18px"><div class="kosong">Belum ada peserta yang menyelesaikan ujian pada pilihan ini.</div></div>' : `
      <div class="kolom" style="max-width:340px;margin:22px 0 12px">
        <label for="cari">Cari nama / instansi / email</label>
        <input id="cari" type="search" placeholder="ketik untuk menyaring…" />
      </div>

      <div class="tabel-bungkus">
        <table class="tabel" id="tabelAdmin">
          <thead>
            <tr><th>#</th><th>Nama</th><th>Email</th><th>No. telepon</th><th>Pemda</th><th>Provinsi</th>
                <th>Jenis</th><th>Token</th>
                <th class="angka">Poin</th><th class="angka">Nilai</th><th class="angka">Benar</th>
                <th class="angka">Waktu</th><th class="angka">Rata/soal</th><th>Selesai</th><th></th></tr>
          </thead>
          <tbody>
            ${tampil.map((p, i) => `
              <tr data-cari="${aman(((p.nama || '') + ' ' + (p.instansi || '') + ' ' + (p.email || '')).toLowerCase())}">
                <td class="peringkat-nomor">${i + 1}</td>
                <td class="bebas">${aman(p.nama)}</td>
                <td>${aman(p.email)}</td>
                <td class="mono">${aman(p.telepon || teleponAkun.get(emailKunciDari(p)) || '-')}</td>
                <td class="bebas">${aman(p.instansi)}</td>
                <td>${aman(p.provinsi || provinsiDari(p.instansi))}</td>
                <td><span class="lencana-jenis kecil ${jenisSah(p.jenisTes)}">${aman(infoJenis(p.jenisTes).label)}</span></td>
                <td class="mono">${aman(tokenDari(p) || '-')}</td>
                <td class="angka tegas-kuning">${angkaRapi(p.poin || 0)}</td>
                <td class="angka">${p.skor}</td>
                <td class="angka">${p.benar}/${p.total}</td>
                <td class="angka">${mmss(p.durasiDetik)}</td>
                <td class="angka">${p.total ? Math.round((p.durasiDetik || 0) / p.total) + ' dtk' : '-'}</td>
                <td>${aman(tanggalIndo(p.waktuSelesai))}</td>
                <td><button class="tombol-hapus" data-hapus="${aman(p.id)}" data-nama="${aman(p.nama)}"
                        title="Hapus rekaman ini">✕</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <h2 class="judul-halaman" style="font-size:20px;margin:34px 0 6px">Rekap waktu penyelesaian tiap soal</h2>
      <p class="ket-halaman">
        Lama peserta memikirkan tiap butir pada ${aman(judulSaring)}. Butir yang menyita waktu paling
        banyak biasanya butir yang paling perlu diperjelas di kelas.
      </p>
      <div class="baris-tombol" style="margin-bottom:12px">
        <button class="btn btn-kecil ${urutButir === 'lama' ? 'btn-biru' : 'btn-hantu'}" data-urut="lama">Urutkan: paling lama</button>
        <button class="btn btn-kecil ${urutButir === 'salah' ? 'btn-biru' : 'btn-hantu'}" data-urut="salah">Urutkan: paling banyak salah</button>
      </div>
      ${tabelRekapButir(tampil)}`}

      ${window.DB.mode === 'lokal'
        ? `<div class="pesan pesan-info" style="margin-top:22px">
             Aplikasi sedang berjalan dalam mode lokal, data di atas hanya milik peramban ini.
             <button class="btn btn-hantu" id="btnBersih" style="margin-left:10px">Bersihkan data lokal</button>
           </div>`
        : ''}`;

    const saring = $('#saringSesi');
    if (saring) saring.onchange = () => { saringToken = saring.value; gambarPantauan(daftar); };

    for (const t of kotak.querySelectorAll('[data-urut]')) {
      t.onclick = () => { urutButir = t.dataset.urut; gambarPantauan(daftar); };
    }

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
      if (confirm('Hapus seluruh data tes yang tersimpan di peramban ini?')) {
        window.DB.kosongkanLokal();
        ke('#/admin');
      }
    };
  }

  /* Hitung, untuk tiap butir yang pernah tampil: berapa kali muncul, berapa
     yang benar, dan berapa lama peserta memikirkannya. */
  function rekapButir(daftar) {
    return BANK.map(s => {
      let muncul = 0, tepat = 0, habis = 0, jumlah = 0, berwaktu = 0;
      let tercepat = null, terlama = null;
      for (const p of daftar) {
        const r = (p.jawaban || []).find(x => x.id === s.id);
        if (!r) continue;
        muncul++;
        if (r.benar) tepat++;
        if (r.pilih < 0) habis++;
        if (r.detik != null) {
          berwaktu++;
          jumlah += r.detik;
          if (tercepat == null || r.detik < tercepat) tercepat = r.detik;
          if (terlama == null || r.detik > terlama) terlama = r.detik;
        }
      }
      return {
        id: s.id, q: s.q, muncul, tepat, habis,
        persen: muncul ? Math.round((tepat / muncul) * 100) : null,
        rata: berwaktu ? Math.round(jumlah / berwaktu) : null,
        tercepat, terlama
      };
    }).filter(b => b.muncul > 0);
  }

  function tabelRekapButir(daftar) {
    const butir = rekapButir(daftar);
    if (!butir.length) return '<div class="kartu"><div class="kosong">Belum ada butir soal yang dikerjakan.</div></div>';

    butir.sort(urutButir === 'salah'
      ? (a, b) => (a.persen - b.persen) || ((b.rata || 0) - (a.rata || 0))
      : (a, b) => ((b.rata || 0) - (a.rata || 0)) || (a.persen - b.persen));

    const maks = Math.max(...butir.map(b => b.rata || 0), 1);

    return `
      <div class="tabel-bungkus">
        <table class="tabel">
          <thead>
            <tr><th>Kode</th><th>Pertanyaan</th><th class="angka">Muncul</th>
                <th class="angka">Benar</th><th class="angka">% Benar</th>
                <th class="angka">Rata-rata</th><th class="angka">Tercepat</th><th class="angka">Terlama</th>
                <th class="angka">Habis waktu</th><th class="lebar">Perbandingan waktu</th></tr>
          </thead>
          <tbody>
            ${butir.map(b => `
              <tr>
                <td>${aman(b.id)}</td>
                <td class="bebas">${aman(b.q)}</td>
                <td class="angka">${b.muncul}</td>
                <td class="angka">${b.tepat}</td>
                <td class="angka ${b.persen < 50 ? 'buruk' : 'baik'}">${b.persen}%</td>
                <td class="angka tegas">${b.rata == null ? '-' : b.rata + ' dtk'}</td>
                <td class="angka">${b.tercepat == null ? '-' : b.tercepat + ' dtk'}</td>
                <td class="angka">${b.terlama == null ? '-' : b.terlama + ' dtk'}</td>
                <td class="angka">${b.habis}</td>
                <td><span class="batang"><i style="width:${Math.round(((b.rata || 0) / maks) * 100)}%" class="${b.persen < 50 ? 'no' : 'ok'}"></i></span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }


  /* ── Rekap per sesi ──────────────────────────────────────────────
     Satu kartu = satu pelaksanaan (kode + jenis tes + token). "Masuk sesi"
     dihitung dari catatan `ikut` di akun peserta ditambah siapa pun yang
     nilainya masuk (rekaman lama belum punya catatan ikut), "mengumpulkan"
     dari rekaman nilai. Selisihnya = peserta yang masuk dengan token tetapi
     tidak sampai mengumpulkan. */

  let rekapHasil = [];
  let rekapAkun = null;
  let teleponAkun = new Map();
  let saringJenisRekap = 'semua';
  let sorotRekap = null;
  let rekapTergambar = null;

  const emailKunciDari = (x) => String(x.emailKunci || x.email || '').trim().toLowerCase();

  function susunRekapSesi() {
    const grup = new Map();
    const ambil = (kunci, dasar) => {
      if (!grup.has(kunci)) {
        grup.set(kunci, {
          kunci, kode: dasar.kode || 'sesi', jenis: jenisSah(dasar.jenis),
          token: String(dasar.token || '').trim().toUpperCase(), judul: dasar.judul || '',
          hadir: new Map(), hasil: [], terakhir: ''
        });
      }
      const g = grup.get(kunci);
      if (!g.judul && dasar.judul) g.judul = dasar.judul;
      return g;
    };
    const catatWaktu = (g, w) => { if (w && w > g.terakhir) g.terakhir = w; };

    for (const a of rekapAkun || []) {
      for (const [kunci, info] of Object.entries(a.ikut || {})) {
        const g = ambil(kunci, info || {});
        g.hadir.set(emailKunciDari(a), {
          nama: a.nama, email: a.email, instansi: a.instansi,
          provinsi: a.provinsi || provinsiDari(a.instansi), telepon: a.telepon || '',
          masuk: (info && info.waktu) || ''
        });
        catatWaktu(g, info && info.waktu);
      }
    }
    for (const p of rekapHasil) {
      const g = ambil(kunciSesi(p.sesiKode, p.jenisTes, p.sesiToken), {
        kode: p.sesiKode, jenis: p.jenisTes, token: p.sesiToken, judul: p.sesiJudul
      });
      g.hasil.push(p);
      const e = emailKunciDari(p);
      if (!g.hadir.has(e)) {
        g.hadir.set(e, {
          nama: p.nama, email: p.email, instansi: p.instansi,
          provinsi: p.provinsi || provinsiDari(p.instansi),
          telepon: p.telepon || teleponAkun.get(e) || '', masuk: ''
        });
      }
      catatWaktu(g, p.waktuSelesai);
    }

    // Sesi yang sedang diatur panitia selalu tampil, walau belum ada peserta.
    const kini = sesi && sesi.token ? kunciSesi(sesi.kode, sesi.jenis, sesi.token) : null;
    if (kini) {
      const g = ambil(kini, { kode: sesi.kode, jenis: sesi.jenis, token: sesi.token, judul: sesi.judul });
      g.kini = true;
      catatWaktu(g, sesi.mulai || sesi.diubah);
    }

    return [...grup.values()].sort((a, b) =>
      (b.kini ? 1 : 0) - (a.kini ? 1 : 0) || String(b.terakhir).localeCompare(String(a.terakhir)));
  }

  function angkaRekap(g) {
    const pengumpul = new Set(g.hasil.map(emailKunciDari));
    const n = g.hasil.length;
    return {
      masuk: g.hadir.size,
      kumpul: pengumpul.size,
      belum: [...g.hadir.keys()].filter(e => !pengumpul.has(e)).length,
      rata: n ? Math.round(g.hasil.reduce((t, p) => t + (p.skor || 0), 0) / n) : null,
      rataPoin: n ? Math.round(g.hasil.reduce((t, p) => t + (p.poin || 0), 0) / n) : null
    };
  }

  function gambarRekapSesi() {
    const kotak = $('#rekapSesi');
    if (!kotak) return;
    const daftar = susunRekapSesi();
    const st = statusSesi(sesi);
    const cap = JSON.stringify([saringJenisRekap, sorotRekap, st.keadaan,
      daftar.map(g => [g.kunci, g.judul, g.hadir.size, g.hasil.length, g.kini || false])]);
    if (cap === rekapTergambar) return;
    rekapTergambar = cap;

    const tampil = daftar.filter(g => saringJenisRekap === 'semua' || g.jenis === saringJenisRekap);
    const jumlahJenis = (j) => daftar.filter(g => g.jenis === j).length;

    const kartu = tampil.map(g => {
      const a = angkaRekap(g);
      const berjalan = g.kini && st.keadaan === 'buka';
      const label = berjalan ? 'Sedang berjalan'
        : (g.kini && st.keadaan === 'menunggu' ? 'Terjadwal' : 'Selesai');
      return `
        <article class="kartu kartu-rekap${g.kunci === sorotRekap ? ' disorot' : ''}" data-kunci="${aman(g.kunci)}">
          <div class="rekap-kepala">
            <div>
              <span class="lencana-jenis kecil ${g.jenis}">${aman(infoJenis(g.jenis).label)}</span>
              <span class="rekap-status ${berjalan ? 'jalan' : ''}">${label}</span>
              <div class="rekap-judul">${aman(g.judul || 'Tanpa judul')}</div>
              <div class="rekap-rinci">Kode <b>${aman(g.kode)}</b> · token <b class="mono">${aman(g.token || '-')}</b>${
                g.terakhir ? ' · ' + aman(tanggalIndo(g.terakhir)) : ''}</div>
            </div>
            <button class="btn btn-kecil btn-kuning" data-unduh-sesi="${aman(g.kunci)}"
                    ${a.masuk ? '' : 'disabled'}>Unduh Excel sesi ini</button>
          </div>
          <div class="rekap-angka">
            <div><b>${a.masuk}</b><span>Masuk sesi</span></div>
            <div class="sorot"><b>${a.kumpul}</b><span>Mengumpulkan</span></div>
            <div${a.belum ? ' class="waspada"' : ''}><b>${a.belum}</b><span>Belum mengumpulkan</span></div>
            <div><b>${a.rata == null ? '-' : a.rata}</b><span>Rata-rata nilai</span></div>
            <div><b>${a.rataPoin == null ? '-' : angkaRapi(a.rataPoin)}</b><span>Rata-rata poin</span></div>
          </div>
        </article>`;
    }).join('');

    kotak.innerHTML = `
      <div class="saring-rekap" role="group" aria-label="Saring jenis tes">
        ${[['semua', 'Semua', daftar.length], ['pre', infoJenis('pre').label, jumlahJenis('pre')],
           ['post', infoJenis('post').label, jumlahJenis('post')]].map(([v, t, n]) => `
          <button type="button" class="chip${saringJenisRekap === v ? ' aktif' : ''}" data-saring-rekap="${v}">
            ${aman(t)} <small>${n}</small></button>`).join('')}
      </div>
      ${tampil.length ? `<div class="daftar-rekap">${kartu}</div>`
        : '<div class="kartu"><div class="kosong">Belum ada sesi pada pilihan ini.</div></div>'}`;

    for (const t of kotak.querySelectorAll('[data-saring-rekap]')) {
      t.onclick = () => { saringJenisRekap = t.dataset.saringRekap; gambarRekapSesi(); };
    }
    for (const t of kotak.querySelectorAll('[data-unduh-sesi]')) {
      t.onclick = () => {
        const g = susunRekapSesi().find(x => x.kunci === t.dataset.unduhSesi);
        if (g) unduhExcelSesi(g);
      };
    }
  }

  /* Excel untuk SATU sesi: ringkasan, peringkat peserta, daftar kehadiran
     (siapa yang masuk tapi tidak mengumpulkan), waktu per soal, dan
     rincian jawaban. */
  function unduhExcelSesi(g) {
    const hasilUrut = urutkan(g.hasil);
    const a = angkaRekap(g);
    const info = infoJenis(g.jenis);

    const ringkas = [
      ['Rekap', info.label + ': ' + (g.judul || 'tanpa judul')],
      ['Jenis Tes', info.label],
      ['Kode Sesi', g.kode],
      ['Token', g.token || ''],
      ['Masuk sesi', a.masuk],
      ['Mengumpulkan', a.kumpul],
      ['Belum mengumpulkan', a.belum],
      ['Rata-rata nilai', a.rata == null ? '' : a.rata],
      ['Rata-rata poin', a.rataPoin == null ? '' : a.rataPoin],
      ['Nilai tertinggi', hasilUrut.length ? Math.max(...hasilUrut.map(p => p.skor || 0)) : ''],
      ['Nilai terendah', hasilUrut.length ? Math.min(...hasilUrut.map(p => p.skor || 0)) : ''],
      ['Diunduh', tanggalIndo(new Date().toISOString())]
    ];

    const peserta = [KEPALA_PESERTA];
    hasilUrut.forEach((p, n) => peserta.push(barisPeserta(p, n)));

    const pengumpul = new Map(g.hasil.map(p => [emailKunciDari(p), p]));
    const hadir = [['No', 'Nama', 'Email', 'No. Telepon', 'Pemda', 'Provinsi', 'Masuk Sesi', 'Status', 'Nilai', 'Poin']];
    [...g.hadir.entries()]
      .sort((x, y) => String(x[1].nama || '').localeCompare(String(y[1].nama || ''), 'id'))
      .forEach(([e, h], n) => {
        const p = pengumpul.get(e);
        hadir.push([n + 1, h.nama || '', h.email || '', h.telepon || teleponAkun.get(e) || '',
          h.instansi || '', h.provinsi || '', h.masuk ? tanggalIndo(h.masuk) : '',
          p ? 'Mengumpulkan' : 'Belum mengumpulkan', p ? p.skor : '', p ? (p.poin || 0) : '']);
      });

    const waktu = [['Kode Soal', 'Pertanyaan', 'Muncul', 'Benar', '% Benar',
      'Rata-rata (detik)', 'Tercepat (detik)', 'Terlama (detik)', 'Habis Waktu']];
    for (const b of rekapButir(g.hasil).sort((x, y) => (y.rata || 0) - (x.rata || 0))) {
      waktu.push([b.id, b.q, b.muncul, b.tepat, b.persen, b.rata, b.tercepat, b.terlama, b.habis]);
    }

    const sheets = [
      { nama: 'Ringkasan', baris: ringkas },
      { nama: 'Peserta', baris: peserta },
      { nama: 'Kehadiran', baris: hadir },
      { nama: 'Waktu Soal', baris: waktu },
      { nama: 'Rincian Jawaban', baris: barisRincian(hasilUrut) }
    ];
    const bersih = (t) => String(t || '').replace(/[^A-Za-z0-9-]+/g, '-').replace(/^-|-$/g, '');
    window.XLSX.unduh(`rekap-${g.jenis}-${bersih(g.kode)}-${bersih(g.token) || 'tanpa-token'}-` +
      `${new Date().toISOString().slice(0, 10)}.xlsx`, sheets);
  }

  /* Baris peserta yang dipakai bersama oleh CSV dan Excel. */
  const KEPALA_PESERTA = [
    'Peringkat', 'Nama', 'Email', 'No. Telepon', 'Pemda', 'Provinsi', 'Jabatan',
    'Jenis Tes', 'Kode Sesi', 'Token', 'Judul Sesi',
    'Poin', 'Nilai', 'Benar', 'Total Soal', 'Beruntun',
    'Durasi (detik)', 'Durasi', 'Rata-rata per Soal (detik)', 'Waktu Selesai'
  ];

  const barisPeserta = (p, n) => [
    n + 1, p.nama, p.email, p.telepon || teleponAkun.get(emailKunciDari(p)) || '', p.instansi,
    p.provinsi || provinsiDari(p.instansi), p.jabatan || '',
    infoJenis(p.jenisTes).label, p.sesiKode || '', tokenDari(p) || '', p.sesiJudul || '',
    p.poin || 0, p.skor, p.benar, p.total, p.beruntunMaks || 0,
    p.durasiDetik || 0, mmss(p.durasiDetik),
    p.total ? Math.round((p.durasiDetik || 0) / p.total) : '',
    tanggalIndo(p.waktuSelesai)
  ];

  function barisRincian(daftar) {
    const rinci = [[
      'Token', 'Jenis Tes', 'Nama', 'Email', 'Pemda',
      'Nomor Soal', 'Kode Soal', 'Pertanyaan', 'Jawaban Peserta', 'Kunci', 'Hasil',
      'Waktu (detik)', 'Poin'
    ]];
    for (const p of daftar) {
      (p.jawaban || []).forEach((r, i) => {
        const s = soalDari(r.id);
        rinci.push([
          tokenDari(p) || '', infoJenis(p.jenisTes).label, p.nama, p.email, p.instansi,
          r.urut || (i + 1), r.id, s ? s.q : '',
          s && r.pilih >= 0 ? s.o[r.pilih] : (r.pilih < 0 ? '(tidak dijawab)' : ''),
          s ? s.o[s.a] : '',
          r.benar ? 'Benar' : (r.pilih < 0 ? 'Habis waktu' : 'Salah'),
          r.detik == null ? '' : r.detik,
          r.poin || 0
        ]);
      });
    }
    return rinci;
  }

  function unduhCsv(daftar) {
    const baris = [KEPALA_PESERTA];
    daftar.forEach((p, n) => baris.push(barisPeserta(p, n)));

    const csv = baris.map(r => r.map(sel => {
      const t = String(sel == null ? '' : sel);
      return /[",;\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    }).join(';')).join('\r\n');

    // BOM supaya huruf beraksen tampil benar saat dibuka di Excel
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-tes-emondak-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ── Rekap Excel, dipisah per token ──────────────────────────────
     Panitia memakai satu token untuk satu kelas/angkatan, jadi tiap
     token mendapat sheet pesertanya sendiri ditambah sheet rekap waktu
     per soal. Satu sheet ringkasan di depan menyatukan semuanya. */

  function unduhExcel(daftar) {
    const semua = urutkan(daftar || []);
    if (!semua.length) { alert('Belum ada data yang bisa diunduh.'); return; }

    // kelompokkan per token; rekaman lama yang belum menyimpan token
    // dikumpulkan pada satu kelompok tersendiri
    const kelompok = new Map();
    for (const p of semua) {
      const t = tokenDari(p) || 'TANPA TOKEN';
      if (!kelompok.has(t)) kelompok.set(t, []);
      kelompok.get(t).push(p);
    }
    const token = [...kelompok.keys()].sort();

    const sheets = [];

    // 1. Ringkasan seluruh token
    const ringkas = [[
      'Token', 'Jenis Tes', 'Kode Sesi', 'Judul Sesi', 'Jumlah Peserta', 'Jumlah Instansi',
      'Rata-rata Poin', 'Rata-rata Nilai', 'Nilai Tertinggi', 'Nilai Terendah',
      'Rata-rata Waktu Kerja (detik)', 'Rata-rata Waktu per Soal (detik)', 'Selesai Pertama', 'Selesai Terakhir'
    ]];
    for (const t of token) {
      const g = kelompok.get(t);
      const n = g.length;
      const jenis = [...new Set(g.map(p => infoJenis(p.jenisTes).label))].join(' + ');
      const kode = [...new Set(g.map(p => p.sesiKode || ''))].filter(Boolean).join(' + ');
      const judul = [...new Set(g.map(p => p.sesiJudul || ''))].filter(Boolean).join(' + ');
      const durasi = g.reduce((a, p) => a + (p.durasiDetik || 0), 0);
      const butirTotal = g.reduce((a, p) => a + (p.total || 0), 0);
      const waktu = g.map(p => p.waktuSelesai).filter(Boolean).sort();
      ringkas.push([
        t, jenis, kode, judul, n,
        new Set(g.map(p => (p.instansi || '').trim().toLowerCase())).size,
        Math.round(g.reduce((a, p) => a + (p.poin || 0), 0) / n),
        Math.round(g.reduce((a, p) => a + (p.skor || 0), 0) / n),
        Math.max(...g.map(p => p.skor || 0)),
        Math.min(...g.map(p => p.skor || 0)),
        Math.round(durasi / n),
        butirTotal ? Math.round(durasi / butirTotal) : '',
        tanggalIndo(waktu[0]), tanggalIndo(waktu[waktu.length - 1])
      ]);
    }
    sheets.push({ nama: 'Ringkasan', baris: ringkas });

    // 2. Per token: daftar peserta + rekap waktu tiap soal
    for (const t of token) {
      const g = kelompok.get(t);

      const peserta = [KEPALA_PESERTA];
      g.forEach((p, n) => peserta.push(barisPeserta(p, n)));
      sheets.push({ nama: 'Peserta ' + t, baris: peserta });

      const waktu = [[
        'Kode Soal', 'Pertanyaan', 'Muncul', 'Benar', '% Benar',
        'Rata-rata (detik)', 'Tercepat (detik)', 'Terlama (detik)', 'Habis Waktu'
      ]];
      for (const b of rekapButir(g).sort((x, y) => (y.rata || 0) - (x.rata || 0))) {
        waktu.push([b.id, b.q, b.muncul, b.tepat, b.persen, b.rata, b.tercepat, b.terlama, b.habis]);
      }
      sheets.push({ nama: 'Waktu Soal ' + t, baris: waktu });
    }

    // 3. Satu sheet panjang: waktu tiap peserta pada tiap soal
    sheets.push({ nama: 'Rincian Jawaban', baris: barisRincian(semua) });

    window.XLSX.unduh(`rekap-tes-emondak-${new Date().toISOString().slice(0, 10)}.xlsx`, sheets);
  }

  /* ── 5g-2. Bank soal: impor tanpa deploy ulang ───────────────────
     Bank bawaan ikut ter-deploy, tetapi penyelenggara kerap mengirim
     revisi soal beberapa jam sebelum kelas dimulai. Bagian ini
     memasukkannya lewat Ruang Admin: berkas dibaca di peramban panitia,
     ditampilkan dulu sebagai pratinjau yang masih bisa dibetulkan
     (kunci jawaban, penanda soal kembar, pembahasan), baru disimpan ke
     Firestore dan langsung dipakai peserta berikutnya. */

  let imporKini = null;   // hasil baca yang sedang dipratinjau

  function gambarBank() {
    const kotak = $('#kartuBank');
    if (!kotak) return;
    const maks = maksButir();
    const asal = bankInfo
      ? 'Hasil impor panitia: ' + (bankInfo.sumber || 'tanpa nama berkas') +
        (bankInfo.diubah ? ' · ' + tanggalIndo(bankInfo.diubah) : '')
      : 'Bank bawaan aplikasi (assets/soal.js)';

    kotak.innerHTML = `
      <div class="grid-statistik">
        <div class="statistik sorot"><div class="angka">${BANK.length}</div><div class="nama">Butir tersimpan</div></div>
        <div class="statistik"><div class="angka">${maks}</div><div class="nama">Maks soal per peserta</div></div>
        <div class="statistik"><div class="angka">${BANK.length - maks}</div><div class="nama">Butir kembar (digrup)</div></div>
      </div>
      <p class="ket-halaman" style="margin:4px 0 18px">
        Sumber sekarang: <b class="tegas">${aman(asal)}</b>
      </p>
      <form class="formulir" id="formImpor">
        <div class="kolom">
          <label for="fBerkasSoal">Berkas soal</label>
          <input id="fBerkasSoal" type="file" accept=".docx,.json,.txt,.csv,.md" />
          <span class="petunjuk">
            .docx kiriman penyelenggara, .json cadangan aplikasi ini, atau .txt biasa.
            Berkas dibaca di peramban ini saja, tidak diunggah ke mana pun.
          </span>
        </div>
        <div class="kolom">
          <label for="fTempelSoal">…atau tempel teks soalnya</label>
          <textarea id="fTempelSoal" rows="5"
            placeholder="Bagaimana cara mengakses eMonDAK?&#10;[✔] A. Lewat Portal FID&#10;[ ] B. Lewat Play Store"></textarea>
          <span class="petunjuk">
            Tandai kunci dengan [✔] di depan pilihan, atau tulis baris
            “Jawaban benar: A” sesudah pilihan terakhir. Kunci yang tidak terbaca
            masih bisa dipilih sendiri pada pratinjau.
          </span>
        </div>
        <div class="baris-tombol">
          <button class="btn btn-biru" type="submit">Baca &amp; pratinjau</button>
          <button class="btn btn-hantu" type="button" id="btnUnduhBank">Unduh cadangan (JSON)</button>
          ${bankInfo ? '<button class="btn btn-hantu" type="button" id="btnBankBawaan">Kembalikan ke bank bawaan</button>' : ''}
        </div>
      </form>
      <div id="pesanBank"></div>
      <div id="pratinjauBank"></div>`;

    const pesan = $('#pesanBank');

    $('#formImpor').onsubmit = async (ev) => {
      ev.preventDefault();
      const berkas = $('#fBerkasSoal').files[0];
      const tempel = $('#fTempelSoal').value.trim();
      if (!berkas && !tempel) {
        pesan.innerHTML = '<div class="pesan pesan-galat">Pilih berkasnya dulu, atau tempel teks soal pada kotak di atas.</div>';
        return;
      }
      pesan.innerHTML = '<div class="pesan pesan-info">Membaca soal…</div>';
      try {
        const dibaca = berkas
          ? await window.ImporSoal.dariBerkas(berkas)
          : { ...window.ImporSoal.dariTeks(tempel), sumber: 'teks yang ditempel' };
        if (!dibaca.soal.length) {
          pesan.innerHTML = '<div class="pesan pesan-galat">Tidak ada soal yang terbaca dari sumber itu. ' +
            'Pastikan tiap pertanyaan diikuti pilihan yang diawali A. B. C. D.</div>';
          return;
        }
        imporKini = {
          sumber: dibaca.sumber,
          catatan: dibaca.catatan,
          soal: window.ImporSoal.berikanId(dibaca.soal, BANK)
        };
        pesan.innerHTML = '';
        gambarPratinjauImpor();
        $('#pratinjauBank').scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) {
        console.error('[bank] gagal membaca berkas soal:', e);
        pesan.innerHTML = '<div class="pesan pesan-galat">' + aman(e.message || String(e)) + '</div>';
      }
    };

    // Cadangan dipakai dua arah: sebagai arsip, dan sebagai berkas yang
    // bisa diimpor kembali bila suatu saat perlu dikembalikan.
    $('#btnUnduhBank').onclick = () => {
      const isi = JSON.stringify({
        namaSesi: K.namaSesi || '',
        diunduh: new Date().toISOString(),
        soal: BANK.map(s => ({ id: s.id, q: s.q, o: s.o, a: s.a, bahas: s.bahas || '', grup: s.grup || '' }))
      }, null, 2);
      const blob = new Blob([isi], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bank-soal-emondak-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const tBawaan = $('#btnBankBawaan');
    if (tBawaan) tBawaan.onclick = async () => {
      if (!confirm('Buang bank soal hasil impor dan kembali memakai bank bawaan aplikasi?\n' +
        'Soal yang pernah diimpor akan hilang kecuali cadangannya sudah diunduh.')) return;
      tBawaan.disabled = true;
      try {
        await window.DB.hapusBank();
        pakaiBank(null);
        imporKini = null;
        gambarBank();
        sesiTergambar = null;
        gambarKendaliSesi();
        $('#pesanBank').innerHTML = '<div class="pesan pesan-info">Bank bawaan aplikasi dipakai kembali.</div>';
      } catch (e) {
        tBawaan.disabled = false;
        $('#pesanBank').innerHTML = '<div class="pesan pesan-galat">Gagal: ' + aman(e.code || e.message) + '</div>';
      }
    };
  }

  /* Pratinjau hasil baca. Sengaja bisa disunting: dokumen Word tidak
     selalu memuat kunci jawaban, dan penanda soal kembar memang harus
     ditentukan manusia. */
  function gambarPratinjauImpor() {
    const kotak = $('#pratinjauBank');
    if (!kotak) return;
    if (!imporKini) { kotak.innerHTML = ''; return; }

    const d = imporKini.soal;
    const baru = d.filter(s => s.baru).length;
    const tanpaKunci = d.filter(s => !(s.a >= 0)).length;

    kotak.innerHTML = `
      <h3 class="judul-halaman" style="font-size:17px;margin:30px 0 6px">
        Pratinjau: ${d.length} butir dari ${aman(imporKini.sumber || 'sumber tanpa nama')}
      </h3>
      <p class="ket-halaman">
        ${baru} butir baru, ${d.length - baru} butir sudah ada di bank (id lamanya dipakai lagi
        supaya rekap nilai yang telanjur masuk tidak putus).
        ${tanpaKunci ? `<b class="tegas">${tanpaKunci} butir belum punya kunci</b>. Pilih dulu pada kolom Kunci.` : ''}
      </p>
      ${imporKini.catatan.length ? `
        <div class="pesan pesan-info">
          <b>Catatan pembacaan:</b>
          <ul style="margin:8px 0 0 18px;padding:0">
            ${imporKini.catatan.slice(0, 12).map(c => `<li>${aman(c)}</li>`).join('')}
            ${imporKini.catatan.length > 12 ? `<li>…dan ${imporKini.catatan.length - 12} catatan lain.</li>` : ''}
          </ul>
        </div>` : ''}

      <div class="kolom" style="max-width:430px;margin:16px 0 14px">
        <label for="modeImpor">Cara memasukkan</label>
        <select id="modeImpor">
          <option value="tambah">Tambah / perbarui (butir lain tetap ada)</option>
          <option value="ganti">Ganti seluruh bank soal dengan daftar ini</option>
        </select>
      </div>

      <div class="tabel-bungkus">
        <table class="tabel tabel-impor">
          <thead>
            <tr><th>#</th><th>Pertanyaan &amp; pilihan</th><th>Kunci</th>
                <th>Grup kembar</th><th>Pembahasan</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${d.map((s, i) => `
              <tr>
                <td class="peringkat-nomor">${i + 1}</td>
                <td class="bebas">
                  <div class="impor-tanya">${aman(s.q)}</div>
                  <ol class="impor-opsi">${s.o.map(o => `<li>${aman(o)}</li>`).join('')}</ol>
                </td>
                <td>
                  <select class="impor-kunci${s.a >= 0 ? '' : ' perlu-isi'}" data-n="${i}">
                    <option value="-1"${s.a >= 0 ? '' : ' selected'}>pilih kunci</option>
                    ${s.o.map((o, n) => `<option value="${n}"${s.a === n ? ' selected' : ''}>${BENTUK[n]} ${'ABCD'[n]}</option>`).join('')}
                  </select>
                </td>
                <td><input class="impor-grup" data-n="${i}" value="${aman(s.grup)}" placeholder="-" /></td>
                <td class="bebas"><input class="impor-bahas" data-n="${i}" value="${aman(s.bahas)}" placeholder="opsional" /></td>
                <td>${s.baru ? '<span class="tanda-baru">baru</span>' : 'sudah ada'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <p class="ket-halaman" style="margin-top:10px">
        Isi <b>Grup kembar</b> dengan kata yang sama pada dua butir yang menanyakan hal serupa
        (mis. <span class="mono">format-pdf</span>); pengundian hanya memakai satu di antaranya,
        jadi peserta tidak menemui soal kembar dalam satu lembar.
      </p>
      <div class="baris-tombol" style="margin-top:16px">
        <button class="btn btn-biru" type="button" id="btnSimpanBank">Simpan ke bank soal</button>
        <button class="btn btn-hantu" type="button" id="btnBatalImpor">Batal</button>
      </div>`;

    for (const el of kotak.querySelectorAll('.impor-kunci')) {
      el.onchange = () => el.classList.toggle('perlu-isi', Number(el.value) < 0);
    }

    $('#btnBatalImpor').onclick = () => { imporKini = null; gambarPratinjauImpor(); };
    $('#btnSimpanBank').onclick = () => simpanImpor();
  }

  async function simpanImpor() {
    const kotak = $('#pratinjauBank');
    const pesan = $('#pesanBank');
    if (!imporKini || !kotak || !pesan) return;
    const d = imporKini.soal;

    // Suntingan panitia dibaca lebih dulu dari formulir pratinjau.
    for (const el of kotak.querySelectorAll('.impor-kunci')) d[Number(el.dataset.n)].a = Number(el.value);
    for (const el of kotak.querySelectorAll('.impor-grup')) d[Number(el.dataset.n)].grup = el.value.trim();
    for (const el of kotak.querySelectorAll('.impor-bahas')) d[Number(el.dataset.n)].bahas = el.value.trim();

    const belum = d.filter(s => !(s.a >= 0 && s.a < s.o.length));
    if (belum.length) {
      pesan.innerHTML = '<div class="pesan pesan-galat">Masih ada ' + belum.length +
        ' butir tanpa kunci jawaban. Isi dulu kolom Kunci yang bertanda merah.</div>';
      const pertama = kotak.querySelector('.impor-kunci.perlu-isi');
      if (pertama) { pertama.scrollIntoView({ behavior: 'smooth', block: 'center' }); pertama.focus(); }
      return;
    }

    const mode = ($('#modeImpor') || {}).value === 'ganti' ? 'ganti' : 'tambah';
    const rapi = (s) => ({ id: s.id, q: s.q, o: s.o, a: s.a, bahas: s.bahas || '', grup: s.grup || '' });

    let baru;
    if (mode === 'ganti') {
      baru = d.map(rapi);
    } else {
      // Butir dengan id yang sama ditimpa di tempatnya; sisanya ditambahkan
      // di belakang, jadi urutan bank lama tidak berubah-ubah.
      const dari = new Map(d.map(s => [s.id, rapi(s)]));
      baru = BANK.map(s => dari.get(s.id) || rapi(s));
      for (const s of d) if (!BANK.some(x => x.id === s.id)) baru.push(rapi(s));
    }

    const grup = new Set(baru.map(s => s.grup || s.id)).size;
    if (grup < 5) {
      pesan.innerHTML = '<div class="pesan pesan-galat">Bank soal minimal berisi 5 grup soal unik; ' +
        'daftar ini hanya ' + grup + '. Pakai "Tambah / perbarui" alih-alih "Ganti".</div>';
      return;
    }
    if (baru.length > 300) {
      pesan.innerHTML = '<div class="pesan pesan-galat">Bank soal dibatasi 300 butir supaya ' +
        'tetap muat dalam satu dokumen Firestore.</div>';
      return;
    }

    const tombol = $('#btnSimpanBank');
    tombol.disabled = true; tombol.textContent = 'Menyimpan…';
    try {
      const dok = await window.DB.simpanBank(baru, imporKini.sumber || 'impor');
      pakaiBank(dok);
      imporKini = null;
      gambarBank();
      sesiTergambar = null;
      gambarKendaliSesi();
      $('#pesanBank').innerHTML = '<div class="pesan pesan-info">Bank soal tersimpan: ' +
        baru.length + ' butir, ' + grup + ' grup unik. Peserta yang masuk sesudah ini langsung memakainya.</div>';
    } catch (e) {
      console.error('[bank] gagal menyimpan bank soal:', e);
      tombol.disabled = false; tombol.textContent = 'Simpan ke bank soal';
      pesan.innerHTML = '<div class="pesan pesan-galat">Gagal menyimpan: ' + aman(e.code || e.message) +
        '<br>Bila pesannya soal izin, pastikan blok <b>pretestBank</b> pada firestore.rules ' +
        'sudah ditempel dan dipublikasikan di Firebase Console.</div>';
    }
  }

  /* ── 5h. Bantuan ─────────────────────────────────────────────── */

  function halamanBantuan() {
    const wa = String(K.waPanitia || '').replace(/\D/g, '');
    halaman.innerHTML = kop('Bantuan') + `
      <div class="wadah wadah-sempit">
        <div class="label-sudut">Bantuan</div>
        <h1 class="judul-halaman">Ada kendala saat <em>mengerjakan</em>?</h1>
        <div class="kartu">
          <p class="ket-halaman"><b class="tegas">Token ditolak.</b><br>
            Token hanya berlaku pada sesi yang sedang dibuka panitia. Pastikan tidak ada spasi
            di awal atau akhir; huruf besar/kecil tidak berpengaruh.</p>
          <p class="ket-halaman"><b class="tegas">Layar lobi belum berubah.</b><br>
            Biarkan halaman terbuka. Begitu panitia menekan tombol buka, layar berganti sendiri
            tanpa perlu dimuat ulang.</p>
          <p class="ket-halaman"><b class="tegas">Akun ini disebut sudah mengerjakan.</b><br>
            Satu akun hanya bisa satu kali per sesi. Bila Anda merasa belum pernah mengisi,
            laporkan ke panitia agar datanya diperiksa.</p>
          <p class="ket-halaman"><b class="tegas">Halaman tertutup di tengah ujian.</b><br>
            Buka kembali alamat yang sama di peramban dan perangkat yang sama. Soal yang sudah
            dijawab beserta poinnya dipulihkan. Hitung mundur tetap berjalan selama itu.</p>
          <p class="ket-halaman"><b class="tegas">Nilai gagal terkirim.</b><br>
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

  window.DB.init()
    .then(mode => {
      const pita = $('#pitaLokal');
      if (pita) pita.hidden = mode !== 'lokal';
      // Bank soal hasil impor panitia dibaca sekali di awal; bila tidak ada
      // (atau gagal dibaca), bank bawaan assets/soal.js yang dipakai.
      return window.DB.ambilBank().catch(e => {
        console.warn('[bank] gagal memuat bank soal impor:', e);
        return null;
      });
    })
    .then(dok => { pakaiBank(dok); render(); });
})();
