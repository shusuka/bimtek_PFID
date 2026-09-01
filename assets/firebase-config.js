/* ══════════════════════════════════════════════════════════════════
   KONFIGURASI FIREBASE — proyek: bimtek-pfid

   Sumber: Firebase Console → Project settings → General → "Your apps"
   → Web app → SDK setup and configuration → Config.

   Nilai di sini BUKAN rahasia; kunci Web API Firebase memang dirancang
   untuk tampil di sisi klien. Yang mengamankan data adalah Firestore
   Security Rules (lihat firestore.rules), bukan berkas ini.

   GitHub akan menandainya sebagai "Google API Key" yang bocor — peringatan
   itu boleh ditutup sebagai false positive. Penjelasan lengkap beserta dua
   langkah pengetatan yang tetap layak dikerjakan (batasi kunci pada domain
   sendiri, tutup pendaftaran mandiri di Authentication) ada di README,
   bagian "Peringatan Secrets detected dari GitHub".

   Bila apiKey dikosongkan, atau halaman dibuka lewat file://, aplikasi
   otomatis berjalan dalam MODE LOKAL: data tersimpan di localStorage
   peramban dan pita penanda muncul di kiri bawah halaman.

   Catatan: measurementId hanya dipakai Google Analytics. Aplikasi ini
   tidak memuat modul analytics — hanya Firestore — jadi barisnya
   dibiarkan saja tanpa efek apa pun.
   ══════════════════════════════════════════════════════════════════ */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCMke3t3gottJJkymkJXcV3RywObDLXyh4",
  authDomain: "bimtek-pfid.firebaseapp.com",
  projectId: "bimtek-pfid",
  storageBucket: "bimtek-pfid.firebasestorage.app",
  messagingSenderId: "366975898573",
  appId: "1:366975898573:web:d6c313938c3e65901d6a84",
  measurementId: "G-YFHNEC2ZGK"
};

// Nama koleksi Firestore tempat hasil pre-test disimpan.
window.KOLEKSI_HASIL = "pretestHasil";
