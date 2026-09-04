/* ══════════════════════════════════════════════════════════════════
   PEMBACA BERKAS SOAL

   Dipakai Ruang Admin → "Bank soal" untuk memasukkan soal baru tanpa
   perlu deploy ulang. Tiga sumber yang dikenali:

     .docx   dokumen Word dari penyelenggara — dibongkar langsung di
             peramban (ZIP + inflate bawaan browser), tidak ada berkas
             yang dikirim ke mana pun
     .json   cadangan bank soal yang pernah diunduh dari aplikasi ini
     teks    disalin-tempel dari mana saja (.txt, .csv, atau diketik)

   Dua tata tulis soal yang dipahami — keduanya ada pada dokumen
   penyelenggara, dan boleh bercampur dalam satu berkas:

     Bagaimana cara mengakses aplikasi eMonitoring DAK?
     [✔] A. Lewat Portal FID > eMonDAK
     [ ] B. Lewat Portal FID > SIPDJD

     1. Dasar hukum korupsi
     UU Tipikor yang menjadi rujukan utama adalah…
     A. UU 31/1999 jo. UU 20/2001
     B. UU 5/2014
     Jawaban benar: A

   Pilihan yang menyatu dalam satu baris ("A. satu B. dua C. tiga")
   ikut dipecah, karena Word kerap menggabungkannya saat teks disalin.

   Keluarannya sengaja BELUM langsung disimpan: app.js menampilkannya
   dulu sebagai pratinjau yang bisa dibetulkan panitia (kunci jawaban,
   penanda soal kembar, pembahasan) sebelum masuk ke Firestore.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const HURUF = ['A', 'B', 'C', 'D'];

  /* ── Perapian teks ───────────────────────────────────────────── */

  // Spasi tak-putus, bulatan daftar Word, dan pindah baris ganda
  // dirapikan supaya pola di bawah tidak meleset.
  function rapikan(teks) {
    return String(teks || '')
      .replace(/\r\n?/g, '\n')
      .replace(/[   ]/g, ' ')
      .replace(/[•●▪]/g, ' ')
      .replace(/[ \t]+/g, ' ');
  }

  const kosongkan = (s) => String(s || '').replace(/\s+/g, ' ').trim();

  // Sidik jari pertanyaan: dipakai mencocokkan soal impor dengan butir
  // yang sudah ada di bank, supaya id (dan rujukan nilai yang sudah
  // masuk) tidak putus.
  const sidik = (s) => String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 160);

  /* ── Penanda pilihan A/B/C/D ─────────────────────────────────── */

  // Huruf pilihan boleh didahului kotak centang Word ("[✔] A.", "( ) B)")
  // dan boleh menempel pada karakter sebelumnya ("…Tahun 2001B. UU…"),
  // karena Word menghapus pindah barisnya saat teks disalin.
  //
  // Penanda PERTAMA pada satu baris tidak boleh didahului huruf, supaya
  // "PT." atau "…dokumen DED. Selanjutnya…" tidak terbaca sebagai pilihan.
  // Penanda LANJUTANNYA boleh — di situ huruf yang dicari sudah tertentu
  // dan harus urut, jadi "…Kontrak dan DEDB. Nota dinas" tetap terpecah
  // dengan benar.
  //
  // Penanda lanjutan juga wajib diikuti spasi lalu teks, supaya penggalan
  // seperti "Word (.doc)" tidak dikira penanda pilihan C.
  const AWALAN = '(^|[^A-Za-z])(\\[[^\\]]{0,4}\\]|\\([^)]{0,4}\\))?\\s*';
  const AWALAN_LANJUT = '(^|[\\s\\S])(\\[[^\\]]{0,4}\\]|\\([^)]{0,4}\\))?\\s*';
  const DICENTANG = /[✔✓√☑xXvV]/;

  function cariSatu(baris, huruf, dari, lanjutan) {
    const pola = new RegExp(
      (lanjutan ? AWALAN_LANJUT : AWALAN) +
      '[' + huruf + huruf.toLowerCase() + ']\\s*[.)]' + (lanjutan ? '\\s+' : '\\s*'),
      'g');
    pola.lastIndex = dari;
    const c = pola.exec(baris);
    if (!c) return null;
    return {
      huruf,
      awal: c.index + c[1].length,
      isi: c.index + c[0].length,
      dicentang: DICENTANG.test(c[2] || '')
    };
  }

  /* Mencari penanda pilihan pada satu baris. Huruf pertama boleh apa
     saja (baris yang hanya berisi "C. …" tetap terbaca), tetapi
     sesudahnya harus URUT — itulah yang menjaga huruf yang kebetulan
     muncul di tengah kalimat tidak ikut terbaca sebagai pilihan. */
  function tandaPilihan(baris) {
    let mulai = -1, pertama = null;
    for (let k = 0; k < HURUF.length; k++) {
      const c = cariSatu(baris, HURUF[k], 0);
      if (c && (!pertama || c.awal < pertama.awal)) { pertama = c; mulai = k; }
    }
    if (!pertama) return [];

    const tanda = [pertama];
    let dari = pertama.isi;
    for (let k = mulai + 1; k < HURUF.length; k++) {
      const c = cariSatu(baris, HURUF[k], dari, true);
      if (!c) break;
      tanda.push(c);
      dari = c.isi;
    }
    // Penanda paling belakang yang tidak diikuti teks apa pun bukan pilihan,
    // melainkan kebetulan pada ujung kalimat.
    while (tanda.length && !baris.slice(tanda[tanda.length - 1].isi).trim()) tanda.pop();
    return tanda;
  }

  // Satu baris → satu pilihan. Baris yang memuat beberapa pilihan
  // sekaligus dipecah; baris biasa dikembalikan sebagai null.
  function pecahBaris(baris) {
    const tanda = tandaPilihan(baris);
    if (!tanda.length) return null;
    // Satu penanda tunggal di tengah kalimat hampir selalu kebetulan,
    // bukan pilihan jawaban.
    if (tanda.length < 2 && tanda[0].awal > 0) return null;

    const hasil = [];
    const kepala = baris.slice(0, tanda[0].awal).trim();
    if (kepala) hasil.push({ jenis: 'teks', teks: kepala });
    tanda.forEach((t, n) => {
      const habis = n + 1 < tanda.length ? tanda[n + 1].awal : baris.length;
      hasil.push({
        jenis: 'pilihan',
        huruf: t.huruf,
        dicentang: t.dicentang,
        teks: baris.slice(t.isi, habis).trim().replace(/[;,]\s*$/, '')
      });
    });
    return hasil;
  }

  const POLA_KUNCI = /^\s*(?:kunci(?:\s*jawaban)?|jawaban(?:\s*(?:yang)?\s*benar)?)\s*[:=–-]?\s*\(?\s*([A-Da-d])\s*\)?\s*\.?\s*$/i;

  // Judul bagian ("PERTANYAAN SOAL ANTI KORUPSI") dan label bernomor
  // ("1. Dasar hukum korupsi") ikut terbawa dari Word tetapi bukan
  // bagian dari pertanyaan, jadi disingkirkan.
  const judulBagian = (baris) =>
    baris.length >= 6 &&
    !/\?\s*$/.test(baris) &&
    baris === baris.toUpperCase() &&
    /[A-Z]/.test(baris);

  const labelBernomor = (baris) =>
    /^\d+\s*[.)]\s*\S/.test(baris) &&
    baris.length <= 70 &&
    !/[?…:]\s*$/.test(baris);

  const akhirPertanyaan = (baris) => /[?…:]\s*$/.test(baris);

  /* ── Pembaca utama ───────────────────────────────────────────── */

  /* Membaca teks mentah menjadi daftar butir soal.
     Kembaliannya { soal, catatan } — catatan berisi keterangan butir
     yang dilewati, supaya panitia tahu apa yang tidak terbaca alih-alih
     gagal diam-diam. */
  function dariTeks(teks) {
    const baris = rapikan(teks).split('\n').map(b => b.trim()).filter(Boolean);

    const soal = [];
    const catatan = [];
    let tampung = [];   // baris calon pertanyaan
    let kini = null;    // butir yang sedang dikumpulkan pilihannya

    const susunPertanyaan = () => {
      let calon = tampung.filter(b => !judulBagian(b));
      tampung = [];
      if (calon.length > 1) {
        const tanpaLabel = calon.filter(b => !labelBernomor(b));
        if (tanpaLabel.length) calon = tanpaLabel;
      }
      // Kalimat pengantar bagian sering menempel di atas pertanyaan.
      // Bila baris terakhir sudah berupa pertanyaan utuh, itu saja yang
      // dipakai.
      if (calon.length > 1 && akhirPertanyaan(calon[calon.length - 1])) {
        calon = [calon[calon.length - 1]];
      }
      return kosongkan(calon.join(' ')).replace(/^\d+\s*[.)]\s*/, '');
    };

    const tutup = () => {
      if (!kini) return;
      const butir = kini;
      kini = null;
      if (!butir.q) { catatan.push('Ada pilihan jawaban tanpa pertanyaan — dilewati.'); return; }
      if (butir.o.length < 2) {
        catatan.push(`"${butir.q.slice(0, 60)}…" hanya punya ${butir.o.length} pilihan — dilewati.`);
        return;
      }
      if (butir.o.length > 4) {
        catatan.push(`"${butir.q.slice(0, 60)}…" punya ${butir.o.length} pilihan; hanya 4 yang pertama dipakai.`);
        butir.o = butir.o.slice(0, 4);
        if (butir.a > 3) butir.a = -1;
      }
      soal.push(butir);
    };

    for (const b of baris) {
      const kunci = POLA_KUNCI.exec(b);
      if (kunci && kini && kini.o.length) {
        kini.a = HURUF.indexOf(kunci[1].toUpperCase());
        continue;
      }

      const pecah = pecahBaris(b);
      if (!pecah) { tampung.push(b); continue; }

      for (const bagian of pecah) {
        if (bagian.jenis === 'teks') { tampung.push(bagian.teks); continue; }
        // Pilihan A selalu berarti "soal baru dimulai".
        if (bagian.huruf === 'A' || !kini) {
          tutup();
          kini = { q: susunPertanyaan(), o: [], a: -1, bahas: '', grup: '' };
        }
        if (bagian.dicentang) kini.a = kini.o.length;
        kini.o.push(bagian.teks);
      }
    }
    tutup();

    for (const s of soal) {
      if (!(s.a >= 0 && s.a < s.o.length)) {
        s.a = -1;
        catatan.push(`Kunci jawaban "${s.q.slice(0, 60)}…" tidak terbaca — pilih sendiri pada pratinjau.`);
      }
    }

    return { soal, catatan };
  }

  /* ── Pemberian id ────────────────────────────────────────────── */

  /* Soal yang teksnya sama dengan butir lama tetap memakai id lama,
     supaya rekap butir dan pembahasan nilai yang sudah masuk tidak
     kehilangan rujukan. Selain itu dibuatkan id baru yang tetap. */
  function berikanId(daftar, bankLama) {
    const peta = new Map((bankLama || []).map(s => [sidik(s.q), s]));
    const dipakai = new Set();
    return daftar.map(s => {
      const lama = peta.get(sidik(s.q));
      let id = (lama && lama.id) || '';
      if (!id) {
        let h = 5381;
        const dasar = sidik(s.q) || String(Math.random());
        for (let i = 0; i < dasar.length; i++) h = ((h * 33) ^ dasar.charCodeAt(i)) >>> 0;
        id = 'i' + h.toString(36);
      }
      while (dipakai.has(id)) id += 'x';
      dipakai.add(id);
      return {
        id,
        q: s.q,
        o: s.o.slice(),
        a: s.a,
        bahas: s.bahas || (lama && lama.bahas) || '',
        grup: s.grup || (lama && lama.grup) || '',
        baru: !lama
      };
    });
  }

  /* ── Pembongkar .docx ────────────────────────────────────────── */

  const teksDari = (buf, dari, panjang) =>
    new TextDecoder('utf-8').decode(new Uint8Array(buf, dari, panjang));

  /* .docx sebenarnya berkas ZIP. Yang diperlukan hanya satu berkas di
     dalamnya, word/document.xml, jadi cukup dibaca daftar isinya lalu
     berkas itu dikembangkan dengan DecompressionStream bawaan peramban
     — tanpa pustaka tambahan dan tanpa mengunggah apa pun. */
  async function ambilDocumentXml(bufer) {
    const dv = new DataView(bufer);
    const n = bufer.byteLength;

    // Cari End of Central Directory dari belakang.
    let eocd = -1;
    for (let i = n - 22; i >= Math.max(0, n - 66000); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Berkas ini bukan .docx yang sah — daftar isi ZIP tidak ditemukan.');

    const jumlah = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);

    let masuk = null;
    for (let i = 0; i < jumlah && p + 46 <= n; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const panjangNama = dv.getUint16(p + 28, true);
      const panjangExtra = dv.getUint16(p + 30, true);
      const panjangKet = dv.getUint16(p + 32, true);
      if (teksDari(bufer, p + 46, panjangNama) === 'word/document.xml') {
        masuk = {
          metode: dv.getUint16(p + 10, true),
          ukuran: dv.getUint32(p + 20, true),
          offset: dv.getUint32(p + 42, true)
        };
        break;
      }
      p += 46 + panjangNama + panjangExtra + panjangKet;
    }
    if (!masuk) throw new Error('word/document.xml tidak ada di dalam berkas — pastikan ini .docx, bukan .doc lama.');

    const lokal = masuk.offset;
    if (dv.getUint32(lokal, true) !== 0x04034b50) throw new Error('Susunan berkas .docx tidak dikenali.');
    const mulai = lokal + 30 + dv.getUint16(lokal + 26, true) + dv.getUint16(lokal + 28, true);
    const isi = bufer.slice(mulai, mulai + masuk.ukuran);

    if (masuk.metode === 0) return new TextDecoder('utf-8').decode(isi);
    if (masuk.metode !== 8) throw new Error('Pemampatan di dalam .docx tidak dikenali (metode ' + masuk.metode + ').');
    if (typeof DecompressionStream !== 'function') {
      throw new Error('Peramban ini belum bisa membuka .docx sendiri. Pakai Chrome/Edge terbaru, ' +
        'atau salin isi dokumen lalu tempel pada kotak teks di bawah.');
    }
    const aliran = new Blob([isi]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(aliran).text();
  }

  // XML Word → teks polos. Pindah baris di dalam paragraf ikut dijaga,
  // karena di situlah pilihan A/B/C/D biasanya dipisah. Kotak centang
  // Wingdings diterjemahkan kembali menjadi "[✔]" dan "[ ]".
  function xmlKeTeks(xml) {
    return String(xml)
      .replace(/<w:instrText[\s\S]*?<\/w:instrText>/g, ' ')
      .replace(/<w:sym[^>]*w:char="[0-9A-Fa-f]{0,2}F0(?:FE|FC)"[^>]*\/>/gi, '[✔]')
      .replace(/<w:sym[^>]*\/>/g, '[ ]')
      .replace(/<w:tab[^>]*\/>/g, ' ')
      .replace(/<w:br[^>]*\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  /* ── Pintu masuk dari <input type="file"> ────────────────────── */

  /* Mengembalikan { soal, catatan, sumber }. Berkas .json dianggap
     cadangan bank soal dan dipakai apa adanya; selebihnya dibaca
     sebagai teks. */
  async function dariBerkas(berkas) {
    const nama = String(berkas.name || '').toLowerCase();

    if (nama.endsWith('.json')) {
      const isi = JSON.parse(await berkas.text());
      const daftar = Array.isArray(isi) ? isi : (isi.soal || []);
      const soal = [];
      const catatan = [];
      for (const s of daftar) {
        const pilihan = Array.isArray(s.o) ? s.o.map(kosongkan).filter(Boolean).slice(0, 4) : [];
        const tanya = kosongkan(s.q);
        if (!tanya || pilihan.length < 2) {
          catatan.push('Satu butir pada berkas JSON tidak lengkap — dilewati.');
          continue;
        }
        soal.push({
          q: tanya,
          o: pilihan,
          a: Number.isInteger(s.a) && s.a >= 0 && s.a < pilihan.length ? s.a : -1,
          bahas: kosongkan(s.bahas),
          grup: kosongkan(s.grup)
        });
      }
      return { soal, catatan, sumber: berkas.name };
    }

    if (nama.endsWith('.docx')) {
      const xml = await ambilDocumentXml(await berkas.arrayBuffer());
      return { ...dariTeks(xmlKeTeks(xml)), sumber: berkas.name };
    }

    if (nama.endsWith('.doc')) {
      throw new Error('Format .doc lama tidak bisa dibaca. Buka di Word lalu simpan ulang sebagai .docx.');
    }

    return { ...dariTeks(await berkas.text()), sumber: berkas.name };
  }

  window.ImporSoal = { dariTeks, dariBerkas, berikanId, xmlKeTeks, sidik };
})();
