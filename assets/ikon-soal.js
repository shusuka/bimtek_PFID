/* ══════════════════════════════════════════════════════════════════
   IKON SOAL — ilustrasi kecil yang mewakili topik tiap pertanyaan
   Digambar sendiri sebagai SVG garis (viewBox 96×96), tanpa pustaka
   atau CDN. Saat soal muncul, garisnya "tergambar" lalu satu bagian
   kecil bergerak beberapa kali (jarum jam berputar, palu mengetuk,
   kamera berkilat) sebelum diam; gerakannya diatur tampilan-baru.css
   dan dimatikan bila pengguna memilih kurangi gerakan.

   Topik ditebak dari teks pertanyaan, jadi butir hasil impor panitia
   ikut mendapat ikon tanpa perlu diberi penanda. Bila satu butir perlu
   ikon tertentu, isi kolom `ikon` pada butir itu dengan nama kuncinya.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Urutan penting: aturan yang lebih khusus diletakkan lebih dulu.
  // Contoh: soal suap menyebut "tender", soal Menu Data OPD menyebut "login".
  const ATURAN = [
    [/menawarkan uang|\bsuap\b|menyuap/, 'suap'],
    [/kado|pernikahan/, 'kado'],
    [/ulang tahun/, 'kue'],
    [/tujuh kelompok|tindak pidana/, 'peringatan'],
    [/tipikor|dasar hukum|undang-undang|\buu\b/, 'timbangan'],
    [/pada menu data opd|nama petugas|operator.*wajib di ?isi/, 'operator'],
    [/pertama kali|data opd/, 'gedung'],
    [/keamanan akun|kata sandi|password/, 'sandi'],
    [/login|credentials|username/, 'login'],
    [/cara mengakses|mengakses aplikasi|portal/, 'portal'],
    [/tender|pelelangan|status pbj|pengadaan/, 'tender'],
    [/helpdesk|kendala|error|bantuan/, 'chat'],
    [/batas waktu|deadline|tenggat/, 'kalender'],
    [/ukuran maksimal|\bmb\b|kompres/, 'unggah'],
    [/foto/, 'kamera'],
    [/format file|\bpdf\b/, 'pdf'],
    [/realisasi|penyerapan|sp2d|keuangan|pencairan/, 'uang'],
    [/adendum|perubahan desain|justifikasi/, 'cetakbiru'],
    [/manfaat|fungsi infrastruktur|outcome/, 'jembatan'],
    [/swakelola/, 'helm'],
    [/simpan|save/, 'simpan'],
    [/nilai kontrak|format penulisan angka|penulisan angka/, 'angka'],
    [/bertanggung jawab|keabsahan/, 'stempel'],
    [/selesai 100|\bpho\b|\bbast\b|serah terima/, 'serah'],
    [/tenaga kerja|pekerja/, 'pekerja']
  ];

  function kunci(soal) {
    if (!soal) return 'umum';
    if (soal.ikon && GAMBAR[soal.ikon]) return soal.ikon;
    const t = String(soal.q || '').toLowerCase();
    for (const [pola, k] of ATURAN) if (pola.test(t)) return k;
    return 'umum';
  }

  /* Bahan gambar. Tiap pemanggilan g()/k() memberi nomor urut --d, dipakai
     CSS untuk menggambar garis satu per satu. */
  function bahan() {
    let n = 0;
    const d = () => `style="--d:${n++}"`;
    return {
      // garis yang tergambar (boleh berisi warna lembut di dalamnya)
      g: (tag, atr, isi) => `<${tag} class="ik-garis${isi ? ' ik-' + isi : ''}" pathLength="1" ${d()} ${atr}/>`,
      // bidang berwarna yang muncul sesudah garis
      k: (tag, atr, warna) => `<${tag} class="ik-bidang ik-${warna || 'lembut'}" ${d()} ${atr}/>`
    };
  }

  const GAMBAR = {
    portal({ g, k }) {
      return `
        ${g('rect', 'x="12" y="20" width="72" height="52" rx="8"', 'putih')}
        ${g('path', 'd="M12 32H84"')}
        ${k('circle', 'cx="20" cy="26" r="2"', 'merah')}
        ${k('circle', 'cx="27" cy="26" r="2"', 'emas')}
        ${k('circle', 'cx="34" cy="26" r="2"', 'hijau')}
        ${k('rect', 'x="21" y="41" width="26" height="22" rx="3"')}
        ${g('path', 'd="M54 44H74M54 52H70M54 60H64"')}
        <g class="ik-gerak g-kursor">
          <path class="ik-bidang ik-putih ik-tepi" d="M62 56v17l4.6-4.4 3.6 7.6 3.2-1.5-3.6-7.6h6.4z"/>
        </g>`;
    },
    login({ g, k }) {
      return `
        ${g('rect', 'x="20" y="10" width="56" height="76" rx="10"', 'putih')}
        ${g('circle', 'cx="48" cy="30" r="9"', 'lembut')}
        ${g('rect', 'x="30" y="48" width="36" height="9" rx="3"')}
        ${g('rect', 'x="30" y="63" width="36" height="9" rx="3"')}
        ${k('path', 'd="M34 52.5h18"', 'garis-tipis')}
        ${k('circle', 'cx="36" cy="67.5" r="1.8"', 'tinta')}
        ${k('circle', 'cx="41" cy="67.5" r="1.8"', 'tinta')}
        ${k('circle', 'cx="46" cy="67.5" r="1.8"', 'tinta')}
        <g class="ik-gerak g-kedip"><rect class="ik-biru-isi" x="50.5" y="64.5" width="2" height="6" rx="1"/></g>`;
    },
    tender({ g }) {
      return `
        ${g('rect', 'x="14" y="72" width="44" height="9" rx="3"', 'lembut')}
        <g class="ik-gerak g-ketuk">
          <g transform="rotate(-38 58 66)">
            ${g('rect', 'x="42" y="20" width="32" height="15" rx="4"', 'emas')}
            ${g('rect', 'x="55" y="35" width="6" height="34" rx="3"', 'putih')}
          </g>
        </g>
        <g class="ik-gerak g-hentak">
          <path class="ik-garis-emas" d="M14 62l-6-3M20 57l-3-7M28 56l1-7"/>
        </g>`;
    },
    sandi({ g, k }) {
      return `
        ${g('path', 'd="M48 10l30 10v24c0 19-13 33-30 40-17-7-30-21-30-40V20z"', 'lembut')}
        <g class="ik-gerak g-gembok">
          ${g('path', 'd="M39 46v-7a9 9 0 0 1 18 0v7"')}
        </g>
        ${k('rect', 'x="34" y="45" width="28" height="22" rx="4"', 'tinta')}
        ${k('circle', 'cx="48" cy="54" r="3"', 'putih')}
        ${k('path', 'd="M46.8 55.5h2.4v5h-2.4z"', 'putih')}`;
    },
    gedung({ g, k }) {
      return `
        ${g('path', 'd="M14 42L48 22l34 20z"', 'lembut')}
        ${g('path', 'd="M18 46H78"')}
        ${g('path', 'd="M26 50v22M40 50v22M56 50v22M70 50v22"')}
        ${g('rect', 'x="14" y="74" width="68" height="8" rx="2"', 'putih')}
        ${g('path', 'd="M48 22V6"')}
        <g class="ik-gerak g-kibar">${k('path', 'd="M48 6h15l-4 4.5 4 4.5H48z"', 'emas')}</g>`;
    },
    chat({ g, k }) {
      return `
        ${g('path', 'd="M22 14h28a12 12 0 0 1 12 12v10a12 12 0 0 1-12 12H30l-10 9v-9a12 12 0 0 1-10-12V26a12 12 0 0 1 12-12z"', 'lembut')}
        ${g('path', 'd="M22 27h28M22 36h18"')}
        ${g('path', 'd="M50 44h24a12 12 0 0 1 12 12v6a12 12 0 0 1-12 12h-2v9l-10-9H50a12 12 0 0 1-12-12v-6a12 12 0 0 1 12-12z"', 'hijau')}
        <g class="ik-gerak g-ketik">
          ${k('circle', 'cx="52" cy="59" r="3"', 'putih')}
          ${k('circle', 'cx="62" cy="59" r="3"', 'putih')}
          ${k('circle', 'cx="72" cy="59" r="3"', 'putih')}
        </g>`;
    },
    operator({ g, k }) {
      return `
        ${g('rect', 'x="10" y="22" width="74" height="54" rx="8"', 'putih')}
        ${g('rect', 'x="39" y="14" width="16" height="11" rx="3"', 'lembut')}
        ${g('circle', 'cx="31" cy="44" r="8"', 'lembut')}
        ${g('path', 'd="M19 66c2-9 22-9 24 0"')}
        ${g('path', 'd="M52 40h22M52 50h18M52 60h12"')}
        <g class="ik-gerak g-letup">
          ${k('circle', 'cx="76" cy="70" r="11"', 'hijau')}
          <path class="ik-centang" d="M70.5 70.5l4 4 7-7.5"/>
        </g>`;
    },
    kalender({ g, k }) {
      return `
        ${g('rect', 'x="10" y="18" width="62" height="58" rx="8"', 'putih')}
        ${g('path', 'd="M10 32H72"')}
        ${g('path', 'd="M25 11v13M57 11v13"')}
        ${k('rect', 'x="19" y="40" width="8" height="8" rx="2"')}
        ${k('rect', 'x="31" y="40" width="8" height="8" rx="2"')}
        ${k('rect', 'x="43" y="40" width="8" height="8" rx="2"', 'emas')}
        ${k('rect', 'x="19" y="53" width="8" height="8" rx="2"')}
        ${k('rect', 'x="31" y="53" width="8" height="8" rx="2"')}
        ${g('circle', 'cx="68" cy="66" r="17"', 'putih')}
        ${k('path', 'd="M68 66h7"', 'jarum')}
        <g class="ik-gerak g-putar">${k('path', 'd="M68 66V55"', 'jarum')}</g>
        ${k('circle', 'cx="68" cy="66" r="2.2"', 'tinta')}`;
    },
    unggah({ g, k }) {
      return `
        ${g('rect', 'x="10" y="18" width="60" height="48" rx="6"', 'putih')}
        ${g('path', 'd="M14 60l15-17 10 10 8-8 19 15"', 'lembut')}
        ${k('circle', 'cx="54" cy="31" r="5"', 'emas')}
        ${k('circle', 'cx="70" cy="68" r="16"', 'biru')}
        <g class="ik-gerak g-naik"><path class="ik-panah" d="M70 76V60M63 66.5l7-7 7 7"/></g>`;
    },
    kamera({ g, k }) {
      return `
        ${g('path', 'd="M22 30h10l6-10h20l6 10h10a10 10 0 0 1 10 10v30a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10V40a10 10 0 0 1 10-10z"', 'lembut')}
        ${g('circle', 'cx="48" cy="55" r="15"', 'putih')}
        ${k('circle', 'cx="48" cy="55" r="7"', 'biru')}
        ${k('rect', 'x="68" y="37" width="8" height="5" rx="2"', 'emas')}
        <g class="ik-gerak g-kilat"><path class="ik-garis-emas" d="M80 18l4-7M86 25l8-2M74 14V6"/></g>`;
    },
    pdf({ g, k }) {
      return `
        ${g('path', 'd="M26 8h32l16 16v62a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z"', 'putih')}
        ${g('path', 'd="M58 8v16h16"')}
        ${g('path', 'd="M32 72h34M32 80h22"')}
        <g class="ik-gerak g-letup">
          ${k('rect', 'x="12" y="42" width="44" height="20" rx="4"', 'merah')}
          <text class="ik-teks" x="34" y="56.5" text-anchor="middle">PDF</text>
        </g>`;
    },
    uang({ g, k }) {
      return `
        ${g('rect', 'x="8" y="24" width="62" height="36" rx="5"', 'hijau-lembut')}
        ${g('circle', 'cx="39" cy="42" r="8"')}
        ${g('path', 'd="M17 32v20M61 32v20"')}
        ${k('rect', 'x="56" y="74" width="30" height="8" rx="4"', 'emas')}
        ${k('rect', 'x="56" y="65" width="30" height="8" rx="4"', 'emas')}
        <g class="ik-gerak g-jatuh">${k('rect', 'x="56" y="56" width="30" height="8" rx="4"', 'emas')}</g>`;
    },
    cetakbiru({ g, k }) {
      return `
        ${g('rect', 'x="8" y="12" width="64" height="72" rx="4"', 'lembut')}
        ${g('path', 'd="M18 24h44v48H18z"')}
        ${g('path', 'd="M18 48h20v24M38 36h24"')}
        <g class="ik-gerak g-tulis">
          ${k('path', 'd="M64 80l18-31 7 4-18 31z"', 'emas')}
          ${k('path', 'd="M64 80l-2 9 9-5z"', 'tinta')}
        </g>`;
    },
    jembatan({ g, k }) {
      return `
        ${g('path', 'd="M6 76c8-4 16 4 24 0s16 4 24 0 16 4 24 0 12 4 16 0"', 'air')}
        ${g('path', 'd="M14 54Q48 16 82 54"')}
        ${g('path', 'd="M8 54H88"')}
        ${g('path', 'd="M31 54V40M48 54V35M65 54V40M20 54v16M76 54v16"')}
        <g class="ik-gerak g-lintas">
          ${k('rect', 'x="40" y="44" width="16" height="8" rx="3"', 'emas')}
          ${k('circle', 'cx="44" cy="53" r="2"', 'tinta')}
          ${k('circle', 'cx="52" cy="53" r="2"', 'tinta')}
        </g>`;
    },
    helm({ g, k }) {
      return `
        <g class="ik-gerak g-angguk">
          ${g('path', 'd="M22 54a26 26 0 0 1 52 0z"', 'emas')}
          ${g('path', 'd="M16 54h64v6a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3z"', 'emas')}
          ${g('path', 'd="M48 28v26M39 31v20M57 31v20"')}
        </g>
        ${g('circle', 'cx="14" cy="76" r="5"', 'lembut')}
        ${g('path', 'd="M5 90c1-7 17-7 18 0"')}
        ${g('circle', 'cx="82" cy="76" r="5"', 'lembut')}
        ${g('path', 'd="M73 90c1-7 17-7 18 0"')}
        ${k('path', 'd="M34 78h28"', 'garis-tipis')}`;
    },
    simpan({ g, k }) {
      return `
        ${g('path', 'd="M16 12h48l16 16v52a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z"', 'lembut')}
        ${g('rect', 'x="28" y="12" width="32" height="20" rx="2"', 'putih')}
        ${k('rect', 'x="48" y="16" width="6" height="12" rx="1"', 'tinta')}
        ${g('rect', 'x="24" y="48" width="44" height="30" rx="3"', 'putih')}
        <g class="ik-gerak g-letup">
          ${k('circle', 'cx="74" cy="74" r="13"', 'hijau')}
          <path class="ik-centang" d="M68 74l4.5 4.5 8-8.5"/>
        </g>`;
    },
    angka({ g, k }) {
      return `
        ${g('rect', 'x="20" y="8" width="56" height="80" rx="10"', 'putih')}
        ${g('rect', 'x="28" y="16" width="40" height="16" rx="3"', 'lembut')}
        <text class="ik-teks-kecil" x="61" y="27.5" text-anchor="end">1500000</text>
        <g class="ik-gerak g-kedip"><rect class="ik-biru-isi" x="62.5" y="20" width="1.8" height="9" rx=".9"/></g>
        ${[40, 53, 66].map(y => [28, 43, 58].map((x, i) =>
          k('rect', `x="${x}" y="${y}" width="10" height="9" rx="2"`, y === 66 && i === 2 ? 'emas' : 'lembut')).join('')).join('')}
        ${k('rect', 'x="28" y="79" width="40" height="3" rx="1.5"', 'tinta-samar')}`;
    },
    stempel({ g, k }) {
      return `
        ${g('rect', 'x="12" y="62" width="72" height="24" rx="3"', 'putih')}
        <g class="ik-gerak g-bekas">${k('ellipse', 'cx="48" cy="74" rx="15" ry="6"', 'merah-samar')}</g>
        <g class="ik-gerak g-cap">
          ${g('circle', 'cx="48" cy="14" r="8"', 'emas')}
          ${g('rect', 'x="44" y="21" width="8" height="15" rx="2"', 'putih')}
          ${k('rect', 'x="30" y="36" width="36" height="11" rx="3"', 'tinta')}
          ${k('rect', 'x="32" y="47" width="32" height="4" rx="1"', 'merah')}
        </g>`;
    },
    serah({ g, k }) {
      return `
        ${g('rect', 'x="16" y="16" width="64" height="72" rx="8"', 'lembut')}
        ${k('rect', 'x="36" y="10" width="24" height="12" rx="4"', 'tinta')}
        ${g('rect', 'x="25" y="27" width="46" height="53" rx="3"', 'putih')}
        <text class="ik-teks-biru" x="48" y="42" text-anchor="middle">100%</text>
        <path class="ik-garis ik-garis-hijau" pathLength="1" style="--d:9" d="M34 58l9 9 19-20"/>`;
    },
    pekerja({ g, k }) {
      return `
        <g class="ik-gerak g-angguk" style="animation-delay:1.25s">
          ${g('circle', 'cx="21" cy="46" r="7"', 'lembut')}
          ${g('path', 'd="M7 80c1-13 27-13 28 0"')}
        </g>
        <g class="ik-gerak g-angguk" style="animation-delay:1.45s">
          ${g('circle', 'cx="75" cy="46" r="7"', 'lembut')}
          ${g('path', 'd="M61 80c1-13 27-13 28 0"')}
        </g>
        <g class="ik-gerak g-angguk">
          ${g('circle', 'cx="48" cy="38" r="10"', 'putih')}
          ${g('path', 'd="M36 34a12 12 0 0 1 24 0z"', 'emas')}
          ${g('path', 'd="M33 34.5h30"')}
          ${g('path', 'd="M27 82c2-19 40-19 42 0"', 'lembut')}
        </g>`;
    },
    timbangan({ g, k }) {
      return `
        ${g('path', 'd="M48 20v58M32 82h32"')}
        ${k('circle', 'cx="48" cy="17" r="3.5"', 'emas')}
        <g class="ik-gerak g-timbang">
          ${g('path', 'd="M16 26h64"')}
          ${g('path', 'd="M22 26l-9 20M22 26l9 20M74 26l-9 20M74 26l9 20"')}
          ${g('path', 'd="M11 46a11 6 0 0 0 22 0z"', 'emas')}
          ${g('path', 'd="M63 46a11 6 0 0 0 22 0z"', 'emas')}
        </g>`;
    },
    peringatan({ g, k }) {
      return `
        ${g('rect', 'x="10" y="12" width="50" height="70" rx="6"', 'putih')}
        ${k('circle', 'cx="21" cy="28" r="2.6"', 'merah')}
        ${k('circle', 'cx="21" cy="42" r="2.6"', 'merah')}
        ${k('circle', 'cx="21" cy="56" r="2.6"', 'merah')}
        ${g('path', 'd="M29 28h22M29 42h18M29 56h20M29 70h14"')}
        <g class="ik-gerak g-goyang">
          ${g('path', 'd="M69 40l21 38H48z"', 'emas')}
          <path class="ik-seru" d="M69 53v12"/>
          ${k('circle', 'cx="69" cy="71.5" r="2.3"', 'tinta')}
        </g>`;
    },
    suap({ g, k }) {
      return `
        ${k('rect', 'x="20" y="18" width="38" height="22" rx="2"', 'hijau-lembut ik-tepi')}
        <text class="ik-teks-kecil" x="39" y="30" text-anchor="middle">Rp</text>
        ${g('rect', 'x="10" y="30" width="58" height="40" rx="5"', 'putih')}
        ${g('path', 'd="M10 35l29 19 29-19"')}
        <g class="ik-gerak g-letup">
          <circle class="ik-garis ik-garis-merah" pathLength="1" style="--d:5" cx="68" cy="64" r="18"/>
          <path class="ik-garis ik-garis-merah" pathLength="1" style="--d:7" d="M55.3 51.3l25.4 25.4"/>
        </g>`;
    },
    kado({ g, k }) {
      return `
        ${g('rect', 'x="18" y="46" width="60" height="40" rx="4"', 'lembut')}
        ${k('rect', 'x="44" y="46" width="8" height="40"', 'emas')}
        <g class="ik-gerak g-naik">
          ${g('rect', 'x="14" y="35" width="68" height="12" rx="3"', 'putih')}
          ${k('rect', 'x="44" y="35" width="8" height="12"', 'emas')}
          ${g('path', 'd="M48 35c-6-14-22-9-13-1zM48 35c6-14 22-9 13-1z"', 'emas')}
        </g>
        <circle class="ik-garis ik-garis-emas" pathLength="1" style="--d:8" cx="74" cy="16" r="6.5"/>
        <circle class="ik-garis ik-garis-emas" pathLength="1" style="--d:9" cx="83" cy="20" r="6.5"/>`;
    },
    kue({ g, k }) {
      return `
        ${g('rect', 'x="14" y="56" width="68" height="28" rx="5"', 'lembut')}
        ${g('path', 'd="M14 64q8.5 8 17 0t17 0 17 0 17 0"')}
        ${g('rect', 'x="27" y="40" width="42" height="16" rx="4"', 'putih')}
        ${k('rect', 'x="45" y="23" width="6" height="17" rx="2"', 'biru')}
        <g class="ik-gerak g-api">${g('path', 'd="M48 7c6 6 6 11 0 14-6-3-6-8 0-14z"', 'emas')}</g>`;
    },
    umum({ g, k }) {
      return `
        ${g('path', 'd="M48 12a22 22 0 0 1 13 40v8H35v-8a22 22 0 0 1 13-40z"', 'lembut')}
        ${g('path', 'd="M37 66h22M39 73h18M44 80h8"')}
        <g class="ik-gerak g-kedip"><path class="ik-garis-emas" d="M20 30l-8-3M76 30l8-3M27 12l-6-6M69 12l6-6"/></g>`;
    }
  };

  /* svg(soal, { statis, ukuran }) — statis = tanpa animasi (daftar
     pembahasan, tabel); ukuran = lebar/tinggi dalam piksel. */
  function svg(soalAtauKunci, opsi) {
    const o = opsi || {};
    const k = typeof soalAtauKunci === 'string'
      ? (GAMBAR[soalAtauKunci] ? soalAtauKunci : 'umum')
      : kunci(soalAtauKunci);
    const u = o.ukuran ? ` width="${o.ukuran}" height="${o.ukuran}"` : '';
    return `<svg class="ikon-soal ikon-${k}${o.statis ? ' ikon-statis' : ''}" viewBox="0 0 96 96"${u}
      fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${GAMBAR[k](bahan())}</svg>`;
  }

  window.IkonSoal = { kunci, svg, daftar: Object.keys(GAMBAR) };
})();
