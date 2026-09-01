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
    token: "A7K2M9",       // 6 karakter; tombol "Acak" di Ruang Admin membuat yang baru
    jumlahSoal: 20,        // maksimal 21 (grup soal unik di bank soal)
    detikPerSoal: 30,      // hitung mundur tiap butir, ala Kahoot
    poinCepat: true,       // makin cepat menjawab, makin besar poin
    aktif: false           // dibuka dari Ruang Admin
  },

  // ── Perhitungan poin ──────────────────────────────────────────────
  poinDasar: 600,   // poin untuk jawaban benar, seberapa pun lambatnya
  poinCepatMaks: 400, // tambahan maksimal bila menjawab seketika
  bonusBeruntun: 50,  // tambahan per jawaban benar beruntun (mulai ke-3)

  // ── Akun panitia ──────────────────────────────────────────────────
  // Tidak ada pengaturannya di sini. Panitia memakai akun Firebase
  // Authentication yang dibuat langsung di Firebase Console
  // (Authentication → Users → Add user), dan daftar email yang berhak
  // ditulis pada fungsi emailAdmin() di firestore.rules.

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
