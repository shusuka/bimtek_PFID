/* ══════════════════════════════════════════════════════════════════
   KONFIGURASI DASAR
   Pengaturan yang jarang berubah. Jadwal sesi, jenis tes, token
   peserta, dan tombol buka/akhiri ujian TIDAK di sini — semuanya
   diatur langsung dari Ruang Admin (#/admin) dan tersimpan di
   Firestore, supaya panitia bisa mengubahnya di kelas tanpa deploy
   ulang.
   ══════════════════════════════════════════════════════════════════ */
window.KONFIG = {
  // ── Identitas ─────────────────────────────────────────────────────
  namaSesi: "Tes BIMTEK eMonDAK",
  penyelenggara: "Kementerian Pekerjaan Umum",
  tahun: 2026,

  // ── Jenis tes ─────────────────────────────────────────────────────
  // Pre-test dan post-test memakai BANK SOAL YANG SAMA; yang berbeda
  // hanya judul, sebutan di layar, dan pemisahan rekap. Panitia memilih
  // jenisnya di Ruang Admin sebelum membuka sesi.
  jenisTes: {
    pre:  { label: "Pre-Test",  panjang: "Pre-Test BIMTEK eMonDAK",
            ket: "Diambil SEBELUM materi bimtek — mengukur pemahaman awal peserta." },
    post: { label: "Post-Test", panjang: "Post-Test BIMTEK eMonDAK",
            ket: "Diambil SESUDAH materi bimtek — mengukur perubahan pemahaman peserta." }
  },

  // ── Latar beranda ─────────────────────────────────────────────────
  // Latar sekarang digambar dengan CSS (langit cerah + lambang eMonDAK),
  // jadi tidak ada berkas video yang perlu diunduh peserta. Untuk kembali
  // memakai video, isi alamat .mp4 di bawah ini.
  videoHero: "",

  // ── Nilai bawaan sesi baru ────────────────────────────────────────
  // Dipakai saat Ruang Admin membuat sesi pertama kali; sesudah itu
  // yang berlaku adalah isi Firestore.
  sesiBawaan: {
    kode: "BIMTEK-01",
    jenis: "pre",          // "pre" atau "post"
    judul: "Pre-Test BIMTEK eMonDAK Angkatan 1",
    token: "A7K2M9",       // 6 karakter; tombol "Acak" di Ruang Admin membuat yang baru
    jumlahSoal: 20,        // maksimal 21 (grup soal unik di bank soal)
    detikPerSoal: 120,     // hitung mundur tiap butir — 2 menit per soal
    poinCepat: true,       // makin cepat menjawab, makin besar poin
    aktif: false           // dibuka dari Ruang Admin
  },

  // Hitung mundur "bersiap" sesudah peserta menekan tombol Kerjakan,
  // supaya satu kelas benar-benar mulai pada detik yang sama.
  detikAbaAba: 5,

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
