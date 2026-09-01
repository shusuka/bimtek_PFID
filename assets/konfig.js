/* ══════════════════════════════════════════════════════════════════
   KONFIGURASI DASAR
   Pengaturan yang jarang berubah. Jadwal sesi, token peserta, dan
   tombol buka/tutup ujian TIDAK di sini — semuanya diatur langsung
   dari Ruang Admin (#/admin) dan tersimpan di Firestore, supaya
   panitia bisa mengubahnya di kelas tanpa deploy ulang.
   ══════════════════════════════════════════════════════════════════ */
window.KONFIG = {
  // ── Identitas ─────────────────────────────────────────────────────
  namaSesi: "Pre-Test BIMTEK eMonDAK",
  penyelenggara: "PFID Bidang Jalan — Kementerian Pekerjaan Umum",
  tahun: 2026,

  // ── Nilai bawaan sesi baru ────────────────────────────────────────
  // Dipakai saat Ruang Admin membuat sesi pertama kali; sesudah itu
  // yang berlaku adalah isi Firestore.
  sesiBawaan: {
    kode: "BIMTEK-01",
    judul: "Pre-Test BIMTEK eMonDAK Angkatan 1",
    token: "BIMTEK2026",   // token khusus yang dibagikan di kelas
    jumlahSoal: 20,        // maksimal 21 (grup soal unik di bank soal)
    detikPerSoal: 30,      // hitung mundur tiap butir, ala Kahoot
    poinCepat: true,       // makin cepat menjawab, makin besar poin
    aktif: false           // dibuka dari Ruang Admin
  },

  // ── Perhitungan poin ──────────────────────────────────────────────
  poinDasar: 600,   // poin untuk jawaban benar, seberapa pun lambatnya
  poinCepatMaks: 400, // tambahan maksimal bila menjawab seketika
  bonusBeruntun: 50,  // tambahan per jawaban benar beruntun (mulai ke-3)

  // ── Token admin ───────────────────────────────────────────────────
  // Yang tersimpan hanya sidik jari SHA-256-nya, bukan tokennya.
  // Token bawaan: K9UP-C32D-5F5A-FV4H
  // Ganti dengan:  node scripts/hash-token.mjs "TOKEN-BARU-ANDA"
  // lalu tempel hasilnya di baris hashAdmin ini DAN di dokumen
  // pretestRahasia/admin pada Firebase Console (lihat firestore.rules).
  hashAdmin: "208d4f0cf1941ee2f655fc3ef422dc970bd0ed613c097c46119c53ab56ed6437",

  // ── Papan peringkat ───────────────────────────────────────────────
  // Urutan medali sesuai permintaan penyelenggara.
  // Untuk memakai urutan internasional (emas–perak–perunggu),
  // tukar saja "perunggu" dan "perak" di baris ini.
  medali: ["emas", "perunggu", "perak"],
  peringkatTerbuka: true, // false = papan peringkat hanya terlihat oleh admin

  // ── Bantuan ───────────────────────────────────────────────────────
  waPanitia: "6281234567890",
  emailPanitia: "pfidbidangjalan@gmail.com"
};
