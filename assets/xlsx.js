/* ══════════════════════════════════════════════════════════════════
   PENULIS BERKAS EXCEL (.xlsx) — tanpa pustaka luar

   Panitia meminta rekap bisa diunduh sebagai Excel, dan dipisah per
   token menjadi beberapa sheet. Situs ini statis tanpa proses build,
   jadi daripada menarik pustaka dari CDN, berkas .xlsx dirakit
   sendiri di sini.

   .xlsx sebenarnya arsip ZIP berisi XML. ZIP-nya ditulis dengan
   metode "stored" (tanpa kompresi) supaya tidak perlu deflate —
   Excel, LibreOffice, dan Google Sheets menerimanya apa adanya.

   Pemakaian:
     XLSX.unduh('rekap.xlsx', [
       { nama: 'Sesi A7K2M9', baris: [['Nama','Poin'], ['Budi', 900]] },
       { nama: 'Sesi B3F8Q1', baris: [...] }
     ]);
   Angka ditulis sebagai angka, selebihnya sebagai teks.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── CRC-32, dibutuhkan tiap entri ZIP ─────────────────────────── */
  const TABEL_CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = TABEL_CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  const utf8 = (teks) => new TextEncoder().encode(teks);

  /* ── ZIP sederhana (semua entri "stored") ──────────────────────── */
  function zip(berkas) {
    const potongan = [];
    const pusat = [];
    let geser = 0;

    for (const b of berkas) {
      const nama = utf8(b.nama);
      const isi = b.isi;
      const crc = crc32(isi);

      const lokal = new Uint8Array(30 + nama.length);
      const dv = new DataView(lokal.buffer);
      dv.setUint32(0, 0x04034b50, true);   // tanda header lokal
      dv.setUint16(4, 20, true);           // versi minimal
      dv.setUint16(6, 0x0800, true);       // bendera: nama berkas UTF-8
      dv.setUint16(8, 0, true);            // metode 0 = stored
      dv.setUint16(10, 0, true);           // waktu
      dv.setUint16(12, 0x21, true);        // tanggal (1 Jan 1980)
      dv.setUint32(14, crc, true);
      dv.setUint32(18, isi.length, true);  // ukuran termampat
      dv.setUint32(22, isi.length, true);  // ukuran asli
      dv.setUint16(26, nama.length, true);
      dv.setUint16(28, 0, true);           // panjang extra
      lokal.set(nama, 30);

      potongan.push(lokal, isi);

      const cd = new Uint8Array(46 + nama.length);
      const dc = new DataView(cd.buffer);
      dc.setUint32(0, 0x02014b50, true);   // tanda direktori pusat
      dc.setUint16(4, 20, true);           // versi pembuat
      dc.setUint16(6, 20, true);           // versi minimal
      dc.setUint16(8, 0x0800, true);
      dc.setUint16(10, 0, true);
      dc.setUint16(12, 0, true);
      dc.setUint16(14, 0x21, true);
      dc.setUint32(16, crc, true);
      dc.setUint32(20, isi.length, true);
      dc.setUint32(24, isi.length, true);
      dc.setUint16(28, nama.length, true);
      dc.setUint32(42, geser, true);       // posisi header lokal
      cd.set(nama, 46);
      pusat.push(cd);

      geser += lokal.length + isi.length;
    }

    const panjangPusat = pusat.reduce((t, c) => t + c.length, 0);
    const akhir = new Uint8Array(22);
    const da = new DataView(akhir.buffer);
    da.setUint32(0, 0x06054b50, true);     // tanda akhir direktori
    da.setUint16(8, berkas.length, true);
    da.setUint16(10, berkas.length, true);
    da.setUint32(12, panjangPusat, true);
    da.setUint32(16, geser, true);

    return new Blob([...potongan, ...pusat, akhir],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /* ── perkakas XML ──────────────────────────────────────────────── */

  const lolos = (t) => String(t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // Excel menolak berkas yang memuat aksara kendali
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  // 0 → A, 25 → Z, 26 → AA
  function huruf(n) {
    let s = '';
    n += 1;
    while (n > 0) {
      const sisa = (n - 1) % 26;
      s = String.fromCharCode(65 + sisa) + s;
      n = Math.floor((n - sisa) / 26);
    }
    return s;
  }

  const angkaSah = (v) => typeof v === 'number' && isFinite(v);

  // Nama sheet Excel: maksimal 31 aksara, tanpa : \ / ? * [ ]
  function namaSheet(nama, dipakai) {
    let n = String(nama || 'Sheet').replace(/[:\\\/?*\[\]]/g, '-').slice(0, 31).trim() || 'Sheet';
    const dasar = n;
    let i = 2;
    while (dipakai.has(n.toLowerCase())) {
      const ekor = ' (' + i + ')';
      n = dasar.slice(0, 31 - ekor.length) + ekor;
      i++;
    }
    dipakai.add(n.toLowerCase());
    return n;
  }

  function xmlSheet(baris) {
    // lebar kolom mengikuti isi terpanjang, dibatasi supaya tidak melebar liar
    const lebar = [];
    for (const r of baris) {
      r.forEach((sel, i) => {
        const n = String(sel == null ? '' : sel).length;
        if (!(lebar[i] >= n)) lebar[i] = n;
      });
    }
    const kolom = lebar.length
      ? '<cols>' + lebar.map((n, i) =>
          `<col min="${i + 1}" max="${i + 1}" width="${Math.min(52, Math.max(8, n + 2))}" customWidth="1"/>`
        ).join('') + '</cols>'
      : '';

    const isi = baris.map((r, y) => {
      const sel = r.map((v, x) => {
        const ref = huruf(x) + (y + 1);
        const gaya = y === 0 ? ' s="1"' : '';
        if (v == null || v === '') return `<c r="${ref}"${gaya}/>`;
        if (angkaSah(v)) return `<c r="${ref}"${gaya}><v>${v}</v></c>`;
        return `<c r="${ref}"${gaya} t="inlineStr"><is><t xml:space="preserve">${lolos(v)}</t></is></c>`;
      }).join('');
      return `<row r="${y + 1}">${sel}</row>`;
    }).join('');

    const bekuKepala = baris.length > 1
      ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
      : '';

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${bekuKepala}${kolom}<sheetData>${isi}</sheetData></worksheet>`;
  }

  const GAYA = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FF1B3A6B"/><name val="Calibri"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF2C75C"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
</cellXfs>
</styleSheet>`;

  /* ── rakit workbook ────────────────────────────────────────────── */

  function buat(sheets) {
    const daftar = (sheets && sheets.length ? sheets : [{ nama: 'Kosong', baris: [['(tidak ada data)']] }]);
    const dipakai = new Set();
    const siap = daftar.map((s, i) => ({
      nama: namaSheet(s.nama, dipakai),
      baris: s.baris || [],
      id: i + 1
    }));

    const berkas = [
      {
        nama: '[Content_Types].xml',
        isi: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${siap.map(s => `<Override PartName="/xl/worksheets/sheet${s.id}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n')}
</Types>`)
      },
      {
        nama: '_rels/.rels',
        isi: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`)
      },
      {
        nama: 'xl/workbook.xml',
        isi: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${siap.map(s => `<sheet name="${lolos(s.nama)}" sheetId="${s.id}" r:id="rId${s.id}"/>`).join('')}</sheets>
</workbook>`)
      },
      {
        nama: 'xl/_rels/workbook.xml.rels',
        isi: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${siap.map(s => `<Relationship Id="rId${s.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${s.id}.xml"/>`).join('\n')}
<Relationship Id="rIdGaya" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`)
      },
      { nama: 'xl/styles.xml', isi: utf8(GAYA) }
    ];

    for (const s of siap) {
      berkas.push({ nama: `xl/worksheets/sheet${s.id}.xml`, isi: utf8(xmlSheet(s.baris)) });
    }

    return zip(berkas);
  }

  function unduh(namaBerkas, sheets) {
    const blob = buat(sheets);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = namaBerkas;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  window.XLSX = { buat, unduh };
})();
