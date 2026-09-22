/* ══════════════════════════════════════════════════════════════════
   BANK SOAL — EVALUASI PEMAHAMAN OPERATOR eMonitoring DAK
   Sumber : "22 September 2022 SOAL PRE TEST EMONDAK New.docx" (revisi
            penyelenggara, 22 September 2026) — menggantikan bank 29
            butir dari "SOAL PRE TEST EMONDAK New (1).docx".
   Jumlah : 25 butir — 20 butir eMonDAK ditambah 5 butir anti korupsi.
            Soal kembar sudah dibuang penyelenggara (p15, p17, p19, p23
            tidak ada lagi di dokumen), jadi 25 soal per peserta berarti
            seluruh bank keluar, hanya urutannya yang diacak. Nomor yang
            dibuang JANGAN dipakai ulang; butir baru mulai p26.

            Ini bank soal BAWAAN. Panitia boleh menimpanya dari Ruang
            Admin → "Bank soal" (impor .docx/.json/tempel teks) tanpa
            deploy ulang; hasil impornya tersimpan di Firestore pada
            pretestBank/aktif dan langsung dipakai semua peserta.
   Format : id    = kode tetap, JANGAN diubah setelah ada nilai masuk
                    (dipakai menyusun ulang pembahasan & analisis butir)
            q     = pertanyaan
            o     = opsi pada urutan asli dokumen [A, B, C, D]
            a     = indeks opsi yang benar pada urutan asli (0 = A)
            bahas = penjelasan singkat yang muncul di halaman hasil
            grup  = penanda soal kembar (opsional; bank ini tidak memakainya)
   ══════════════════════════════════════════════════════════════════ */
window.SOAL_PRETEST = [
  { id: "p01",
    q: "Bagaimana cara mengakses aplikasi eMonitoring DAK?",
    o: ["Mengakses halaman website Portal FID > eMonDAK",
        "Mengakses halaman website Portal FID > SIPDJD",
        "Mengirimkan formulir permohonan akses data secara fisik setiap kali ingin membuka aplikasi",
        "Mengunduh aplikasi eMonitoring DAK terlebih dahulu melalui Google Play Store atau App Store di smartphone masing-masing"], a: 0,
    bahas: "eMonDAK dibuka lewat peramban dari Portal FID, menu eMonDAK — bukan SIPDJD, dan tidak ada aplikasi ponsel yang perlu diunduh." },

  { id: "p02",
    q: "Dua data (credentials) apa yang wajib diisi pada form Login portal depan eMonDAK?",
    o: ["Username dan Password",
        "NIK dan Nomor Kartu Keluarga",
        "Nama Lengkap dan Asal Daerah",
        "Alamat Email dan Nomor Telepon"], a: 0,
    bahas: "Akses operator daerah dikunci dengan username dan password yang dibagikan pengelola pusat." },

  { id: "p03",
    q: "Di menu manakah Anda menginput informasi mengenai status tender atau pelelangan kegiatan?",
    o: ["Menu Status PBJ (Pengadaan Barang/Jasa)",
        "Dashboard Utama",
        "Menu Tenaga Kerja",
        "Menu Realisasi Keuangan"], a: 0,
    bahas: "Seluruh tahapan pemilihan penyedia — persiapan, tender, sampai kontrak — dilaporkan pada menu Status PBJ." },

  { id: "p04",
    q: "Pada fitur apa Anda disarankan untuk rutin melakukan pembaharuan demi menjaga keamanan akun eMonDAK Anda?",
    o: ["Kata Sandi (Password)",
        "Foto Profil",
        "Alamat Rumah",
        "Nomor Rekening Bank"], a: 0,
    bahas: "Kata sandi diganti berkala, terutama bila operator daerah berganti orang." },

  { id: "p05",
    q: "Menu apa yang WAJIB diisi pertama kali saat baru login agar fitur pelaporan lainnya dapat terbuka?",
    o: ["Menu Data OPD (Organisasi Perangkat Daerah)",
        "Menu Unggah Foto",
        "Menu Realisasi Keuangan",
        "Menu Helpdesk"], a: 0,
    bahas: "Data OPD adalah pintu masuk: identitas dinas dan operatornya harus lengkap dulu sebelum menu pelaporan lain aktif." },

  { id: "p06",
    q: "Fitur bantuan apa yang disediakan di dalam aplikasi untuk terhubung langsung dengan pusat jika operator menemui kendala atau error?",
    o: ["Button Helpdesk via WhatsApp",
        "Kolom komentar publik",
        "Surat fisik ke kantor",
        "Call center darurat"], a: 0,
    bahas: "Tombol Helpdesk di dalam aplikasi menyambungkan operator ke petugas pusat melalui WhatsApp." },

  { id: "p07",
    q: "Pada Menu Data OPD, hal apa yang wajib diisi?",
    o: ["Nama Petugas/Operator",
        "Realisasi Keuangan",
        "Foto Kegiatan",
        "PHO/BAST"], a: 0,
    bahas: "Menu Data OPD memuat identitas dinas dan nama petugas/operator penanggung jawab pelaporan." },

  { id: "p08",
    q: "Apakah Anda sudah mengetahui batas waktu (deadline) penginputan data realisasi DAK di aplikasi eMonDAK?",
    o: ["Seminggu sekali di bulan berkenaan",
        "Sebulan sekali, maksimal 7 hari dari bulan berkenaan",
        "Per semester, maksimal 7 hari dari bulan berkenaan",
        "Per triwulan, maksimal di akhir bulan"], a: 1,
    bahas: "Pelaporan bersifat bulanan dan ditutup paling lambat 7 hari setelah bulan berkenaan berakhir." },

  { id: "p09",
    q: "Berapa ukuran maksimal file foto progres yang dapat diunggah ke sistem?",
    o: ["10 MB",
        "5 MB",
        "20 MB",
        "Tanpa batasan ukuran"], a: 0,
    bahas: "Batas unggah satu berkas foto progres adalah 10 MB; foto yang lebih besar perlu dikompresi lebih dulu." },

  { id: "p10",
    q: "Berapa persentase foto progres kegiatan yang wajib diunggah?",
    o: ["0%, 50%, dan 100%",
        "100% saja",
        "50% dan 100%",
        "25%, 50%, 75%, dan 100%"], a: 0,
    bahas: "Dokumentasi wajib diambil dari titik yang sama pada tiga tahap: 0%, 50%, dan 100%." },

  { id: "p11",
    q: "Format file apa yang diwajibkan oleh sistem untuk dokumen lampiran seperti Kontrak, DED, dan RAB?",
    o: ["PDF (.pdf)",
        "Word (.doc)",
        "Excel (.xls)",
        "Gambar (.jpg)"], a: 0,
    bahas: "Seluruh dokumen lampiran diunggah dalam format PDF agar isinya tidak berubah dan mudah diverifikasi." },

  { id: "p12",
    q: "Angka realisasi penyerapan keuangan di dalam aplikasi wajib mengacu pada dokumen apa?",
    o: ["Nilai SP2D (Surat Perintah Pencairan Dana) yang sudah cair",
        "Rencana Anggaran Biaya (RAB)",
        "Kuitansi pembelian material",
        "Estimasi/tebakan kontraktor"], a: 0,
    bahas: "Realisasi keuangan adalah uang yang benar-benar cair, dibuktikan dengan SP2D — bukan rencana atau perkiraan." },

  { id: "p13",
    q: "Jika terjadi perubahan desain atau volume pekerjaan (adendum), dokumen apa yang wajib diunggah?",
    o: ["Justifikasi Teknis",
        "Kuitansi toko",
        "Surat Izin Usaha",
        "Foto lokasi baru"], a: 0,
    bahas: "Setiap adendum harus disertai Justifikasi Teknis sebagai dasar perubahan desain atau volume." },

  { id: "p16",
    q: "Fitur apa yang digunakan untuk melaporkan manfaat atau fungsi infrastruktur yang dibangun pada tahun sebelumnya?",
    o: ["Output & Immediate Outcome",
        "Menu Input OPD",
        "Status PBJ",
        "Profil Pengguna"], a: 0,
    bahas: "Menu Output & Immediate Outcome merekam manfaat bangunan tahun sebelumnya, bukan progres tahun berjalan." },

  { id: "p18",
    q: "Jika suatu paket pekerjaan dijalankan secara Swakelola, dokumen apa yang diunggah pada kolom Dokumen Kontrak?",
    o: ["SK Tim Pengelola Swakelola / SPK Swakelola",
        "Kuitansi beli semen",
        "Foto gotong royong",
        "Dikosongkan saja"], a: 0,
    bahas: "Pekerjaan swakelola tetap punya dasar hukum pelaksanaan: SK Tim Pengelola atau SPK Swakelola yang diunggah di kolom dokumen kontrak." },

  { id: "p20",
    q: "Apa fungsi utama tombol “Simpan” (Save) setelah mengetik angka progres di aplikasi?",
    o: ["Memastikan data tersimpan dan tidak hilang saat pindah halaman",
        "Mengunci laporan secara permanen",
        "Mencetak laporan ke printer",
        "Keluar dari aplikasi"], a: 0,
    bahas: "Angka yang diketik belum masuk basis data sampai tombol Simpan ditekan; berpindah halaman tanpa menyimpan membuat isian hilang." },

  { id: "p21",
    q: "Dalam penulisan angka Nilai Kontrak di sistem, bagaimana format yang benar?",
    o: ["Mengetik nominal angka pasti tanpa spasi/titik (contoh: 1500000)",
        "Menggunakan huruf (contoh: Satu Juta Rupiah)",
        "Dibulatkan secara acak",
        "Diisi angka 0 dulu"], a: 0,
    bahas: "Kolom nilai kontrak hanya menerima angka polos tanpa titik, koma, spasi, atau tulisan “Rp”." },

  { id: "p22",
    q: "Siapa yang bertanggung jawab penuh atas kebenaran dan keabsahan seluruh data yang dilaporkan di eMonDAK?",
    o: ["Pemerintah Daerah (Pemda)",
        "Admin Helpdesk",
        "Pengembang aplikasi",
        "Tim Verifikator Pusat"], a: 0,
    bahas: "Data yang diunggah adalah pernyataan resmi pemerintah daerah; pusat memverifikasi, tetapi tanggung jawab kebenarannya tetap pada Pemda." },

  { id: "p24",
    q: "Apabila kegiatan fisik di lapangan sudah selesai 100%, dokumen apakah yang wajib diunggah ke dalam sistem?",
    o: ["PHO / BAST (Berita Acara Serah Terima)",
        "Surat Permohonan Dana",
        "Kuitansi Toko Material",
        "Foto KTP Kontraktor"], a: 0,
    bahas: "Penyelesaian pekerjaan dibuktikan dengan PHO/BAST, bukan sekadar foto 100%." },

  { id: "p25",
    q: "Pada sub-menu “Data Tenaga Kerja”, data utama apakah yang wajib dilaporkan oleh operator daerah?",
    o: ["Jumlah tenaga kerja yang terserap pada kegiatan tersebut",
        "Nama lengkap seluruh tukang bangunan",
        "Besar gaji harian mandor",
        "Daftar hadir PNS di dinas"], a: 0,
    bahas: "Yang dilaporkan adalah jumlah tenaga kerja yang terserap, sebagai indikator manfaat ekonomi DAK di daerah." },

  /* ── Bagian anti korupsi ───────────────────────────────────────────
     Sumber : "SOAL PRE TEST EMONDAK New (1).docx" — bagian "PERTANYAAN
              SOAL ANTI KORUPSI", ditambahkan penyelenggara dalam rangka
              Pembangunan Zona Integritas di lingkungan PFID.
     ────────────────────────────────────────────────────────────────── */

  { id: "k01",
    q: "UU Tipikor yang tetap menjadi rujukan utama, dengan beberapa ketentuan telah disesuaikan dalam KUHP Nasional, adalah…",
    o: ["UU Nomor 31 Tahun 1999 yang diubah dengan UU Nomor 20 Tahun 2001",
        "UU Nomor 5 Tahun 2014",
        "UU Nomor 25 Tahun 2009",
        "UU Nomor 14 Tahun 2008"], a: 0,
    bahas: "Dasar hukum pemberantasan korupsi adalah UU 31/1999 sebagaimana diubah dengan UU 20/2001; sebagian ketentuannya kini disesuaikan dalam KUHP Nasional." },

  { id: "k02",
    q: "Manakah yang termasuk tujuh kelompok tindak pidana korupsi?",
    o: ["Suap-menyuap, pemerasan, dan gratifikasi",
        "Keterlambatan, ketidakhadiran, dan pemborosan",
        "Pelanggaran parkir, kecelakaan, dan pencemaran",
        "Perselisihan, kelalaian, dan kesalahan ketik"], a: 0,
    bahas: "Tujuh kelompoknya: kerugian keuangan negara, suap-menyuap, penggelapan dalam jabatan, pemerasan, perbuatan curang, benturan kepentingan dalam pengadaan, dan gratifikasi." },

  { id: "k03",
    q: "Pengusaha menawarkan uang kepada pejabat agar memenangkan tender. Perbuatan ini termasuk…",
    o: ["Suap",
        "Gratifikasi yang boleh diterima",
        "Hadiah biasa",
        "Sumbangan sosial"], a: 0,
    bahas: "Ada maksud memengaruhi keputusan jabatan, jadi perbuatan itu suap — bukan hadiah dan bukan gratifikasi yang boleh diterima." },

  { id: "k04",
    q: "Menurut Peraturan KPK terbaru, berapa batas nilai kado pernikahan yang tidak wajib dilaporkan dari setiap pemberi?",
    o: ["Maksimal Rp1.500.000",
        "Maksimal Rp5.000.000",
        "Maksimal Rp10.000.000",
        "Tidak ada batas nilai"], a: 0,
    bahas: "Kado pernikahan sampai Rp1.500.000 dari tiap pemberi dikecualikan dari kewajiban lapor; selebihnya tetap wajib dilaporkan ke KPK." },

  { id: "k05",
    q: "Rekan kerja memberi hadiah ulang tahun. Agar tidak wajib dilaporkan menurut aturan terbaru, ketentuan yang tepat adalah…",
    o: ["Bukan uang/alat tukar, maksimal Rp500.000 per pemberian, dan total Rp1.500.000 setahun dari pemberi yang sama",
        "Boleh berupa uang maksimal Rp2.000.000",
        "Boleh berapa pun selama diberikan di kantor",
        "Harus selalu diterima agar tidak menyinggung pemberi"], a: 0,
    bahas: "Pengecualian hadiah antar rekan kerja dibatasi tiga syarat sekaligus: bukan uang, maksimal Rp500.000 sekali beri, dan tidak lebih dari Rp1.500.000 setahun dari pemberi yang sama." }
];
