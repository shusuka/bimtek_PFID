/* ══════════════════════════════════════════════════════════════════
   KONFIGURASI SESI PRE-TEST
   Satu-satunya berkas yang perlu disunting sebelum tiap bimtek.
   Ubah nilainya, simpan, commit, lalu deploy — tidak ada pengaturan
   yang tersembunyi di tempat lain.
   ══════════════════════════════════════════════════════════════════ */
window.KONFIG = {
  // ── Identitas sesi ────────────────────────────────────────────────
  namaSesi:   "Pre-Test BIMTEK eMonDAK",
  penyelenggara: "PFID Bidang Jalan — Kementerian Pekerjaan Umum",
  tahun:      2026,

  // ── Aturan pengerjaan ─────────────────────────────────────────────
  jumlahSoal: 20,   // butir yang diundi dari bank soal (maks. 21 grup unik)
  batasMenit: 25,   // 0 = tanpa batas waktu; selebihnya otomatis dikumpulkan
  acakOpsi:   true, // urutan A–D diacak ulang tiap peserta

  // ── Token peserta ─────────────────────────────────────────────────
  // Dibagikan panitia di kelas. Tidak peka huruf besar/kecil.
  // Boleh lebih dari satu, misal per angkatan atau per provinsi.
  tokenPeserta: [
    "BIMTEK2026",
    "EMONDAK-SUMUT"
  ],

  // ── Token admin ───────────────────────────────────────────────────
  // Yang disimpan hanya sidik jari SHA-256-nya, bukan tokennya.
  // Token bawaan: PFID-ADMIN-2026
  // Ganti dengan:  node scripts/hash-token.mjs "TOKEN-BARU-ANDA"
  // lalu tempel hasilnya di baris hashAdmin di bawah.
  hashAdmin: "d05b9cd16c009a38493348da10bbdbcfcc3197e39a3a5290d4c4ba8dddc3857a",

  // ── Papan peringkat ───────────────────────────────────────────────
  // Urutan medali sesuai permintaan penyelenggara.
  // Untuk memakai urutan internasional (emas–perak–perunggu),
  // tukar saja "perunggu" dan "perak" di baris ini.
  medali: ["emas", "perunggu", "perak"],
  peringkatTerbuka: true, // false = papan peringkat hanya terlihat oleh admin

  // ── Bantuan ───────────────────────────────────────────────────────
  waPanitia: "6281234567890",       // nomor WhatsApp helpdesk panitia
  emailPanitia: "pfidbidangjalan@gmail.com"
};
