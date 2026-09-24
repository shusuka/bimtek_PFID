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
  namaSesi: "Evaluasi Pemahaman Operator eMonitoring DAK",
  penyelenggara: "Pusat Fasilitasi Infrastruktur Daerah, Kementerian Pekerjaan Umum",
  tahun: 2026,

  // ── Jenis tes ─────────────────────────────────────────────────────
  // Pre-test dan post-test memakai BANK SOAL YANG SAMA; yang berbeda
  // hanya judul, sebutan di layar, dan pemisahan rekap. Panitia memilih
  // jenisnya di Ruang Admin sebelum membuka sesi.
  jenisTes: {
    pre:  { label: "Pre-Test",  panjang: "Pre-Test BIMTEK eMonDAK",
            ket: "Diambil SEBELUM materi bimtek, untuk mengukur pemahaman awal peserta." },
    post: { label: "Post-Test", panjang: "Post-Test BIMTEK eMonDAK",
            ket: "Diambil SESUDAH materi bimtek, untuk mengukur perubahan pemahaman peserta." }
  },

  // ── Latar beranda ─────────────────────────────────────────────────
  // Latar sekarang digambar dengan CSS (langit cerah + lambang eMonDAK),
  // jadi tidak ada berkas video yang perlu diunduh peserta. Untuk kembali
  // memakai video, isi alamat .mp4 di bawah ini.
  videoHero: "",

  // ── Contoh soal di beranda ────────────────────────────────────────
  // Kartu contoh di beranda SENGAJA memakai soal pengetahuan umum, bukan
  // bank soal ujian, supaya soal yang akan dikerjakan tidak terlihat
  // sebelum sesi dibuka. a = indeks jawaban benar (0 = pilihan pertama);
  // ikon = nama ilustrasi dari assets/ikon-soal.js.
  soalContohBeranda: [
    { q: "Planet terbesar di tata surya kita adalah…",
      o: ["Jupiter", "Saturnus", "Neptunus", "Bumi"], a: 0, ikon: "umum" },
    { q: "Hari Kemerdekaan Republik Indonesia diperingati setiap tanggal…",
      o: ["17 Agustus", "1 Juni", "28 Oktober", "10 November"], a: 0, ikon: "kalender" },
    { q: "Jembatan Suramadu menghubungkan Pulau Jawa dengan pulau…",
      o: ["Madura", "Bali", "Sumatra", "Kalimantan"], a: 0, ikon: "jembatan" },
    { q: "Mata uang resmi Negara Kesatuan Republik Indonesia adalah…",
      o: ["Rupiah", "Ringgit", "Baht", "Peso"], a: 0, ikon: "uang" },
    { q: "Berapa jumlah provinsi di Indonesia saat ini?",
      o: ["38", "34", "36", "37"], a: 0, ikon: "gedung" },
    { q: "Satu kilometer sama dengan berapa meter?",
      o: ["1.000 meter", "100 meter", "10.000 meter", "500 meter"], a: 0, ikon: "angka" },
    { q: "Lagu kebangsaan “Indonesia Raya” diciptakan oleh…",
      o: ["W.R. Supratman", "Ismail Marzuki", "Cornel Simanjuntak", "Kusbini"], a: 0, ikon: "umum" }
  ],

  // ── Nilai bawaan sesi baru ────────────────────────────────────────
  // Dipakai saat Ruang Admin membuat sesi pertama kali; sesudah itu
  // yang berlaku adalah isi Firestore.
  sesiBawaan: {
    kode: "BIMTEK-01",
    jenis: "pre",          // "pre" atau "post"
    judul: "Pre-Test BIMTEK eMonDAK Angkatan 1",
    token: "A7K2M9",       // 6 karakter; tombol "Acak" di Ruang Admin membuat yang baru
    jumlahSoal: 25,        // batas atasnya = jumlah grup soal unik di bank
                           // (bank bawaan: 25 butir, tanpa soal kembar)
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

  // ── Bank soal ─────────────────────────────────────────────────────
  // Bank bawaan ada di assets/soal.js dan ikut ter-deploy. Panitia boleh
  // menimpanya dari Ruang Admin → "Bank soal": berkas .docx/.json/teks
  // dibaca di peramban, dipratinjau, lalu disimpan ke Firestore
  // (pretestBank/aktif) dan langsung dipakai semua peserta. Tidak ada
  // pengaturannya di berkas ini.
  //
  // Tiap peserta mendapat undian sendiri: butir mana yang keluar, urutan
  // soalnya, dan urutan pilihan A–D-nya semua diacak per peserta.

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
