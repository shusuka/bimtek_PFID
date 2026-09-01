/* ══════════════════════════════════════════════════════════════════
   BANK SOAL — PRE-TEST BIMTEK eMonDAK
   Sumber : "DAFTAR PERTANYAAN PRE & POST TEST BIMTEK EMONDAK"
            (berkas .docx dari penyelenggara)
   Jumlah : 25 butir. Empat pasang di antaranya menanyakan hal yang
            sama dengan redaksi berbeda, jadi tiap pasangan diberi
            penanda `grup` yang sama; pengundian hanya mengambil SATU
            butir dari tiap grup supaya peserta tidak menemui soal
            kembar dalam satu sesi.
   Format : id    = kode tetap, JANGAN diubah setelah ada nilai masuk
                    (dipakai menyusun ulang pembahasan & analisis butir)
            q     = pertanyaan
            o     = opsi pada urutan asli dokumen [A, B, C, D]
            a     = indeks opsi yang benar pada urutan asli (0 = A)
            bahas = penjelasan singkat yang muncul di halaman hasil
            grup  = penanda soal kembar (boleh kosong)
   ══════════════════════════════════════════════════════════════════ */
window.SOAL_PRETEST = [
  { id: "p01",
    q: "Bagaimana cara mengakses aplikasi eMonitoring DAK?",
    o: ["Mengakses halaman website: https://infrastrukturdaerah.pu.go.id/emondak/",
        "Mengakses halaman website: https://infrastrukturdaerah.pu.go.id/sipdjd/auth",
        "Mengirimkan formulir permohonan akses data secara fisik setiap kali ingin membuka aplikasi",
        "Mengunduh aplikasi eMonitoring DAK terlebih dahulu melalui Google Play Store atau App Store"], a: 0,
    bahas: "eMonDAK berbasis web dan dibuka langsung lewat peramban di alamat infrastrukturdaerah.pu.go.id/emondak/ — tidak ada aplikasi ponsel yang perlu diunduh." },

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
    q: "Pada bagian menu profil, fitur apa yang disarankan untuk rutin diperbarui demi menjaga keamanan akun eMonDAK Anda?",
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
    o: ["Link/Tombol Helpdesk via WhatsApp",
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

  { id: "p09", grup: "ukuran-foto",
    q: "Berapa ukuran maksimal file foto progres yang dapat diunggah ke sistem?",
    o: ["10 MB",
        "2 MB",
        "20 MB",
        "Tanpa batasan ukuran"], a: 0,
    bahas: "Batas unggah satu berkas foto progres adalah 10 MB; foto yang lebih besar perlu dikompresi lebih dulu." },

  { id: "p10",
    q: "Berapa kali persentase foto progres kegiatan yang wajib diunggah?",
    o: ["3 kali (0%, 50%, dan 100%)",
        "1 kali (100% saja)",
        "2 kali (50% dan 100%)",
        "4 kali (25%, 50%, 75%, dan 100%)"], a: 0,
    bahas: "Dokumentasi wajib diambil dari titik yang sama pada tiga tahap: 0%, 50%, dan 100%." },

  { id: "p11", grup: "format-pdf",
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

  { id: "p13", grup: "adendum",
    q: "Jika terjadi perubahan desain atau volume pekerjaan (adendum), dokumen apa yang wajib diunggah?",
    o: ["Justifikasi Teknis",
        "Kuitansi toko",
        "Surat Izin Usaha",
        "Foto lokasi baru"], a: 0,
    bahas: "Setiap adendum harus disertai Justifikasi Teknis sebagai dasar perubahan desain atau volume." },

  { id: "p14", grup: "ukuran-foto",
    q: "Berapa ukuran maksimal file foto progres kegiatan yang diizinkan untuk diunggah ke dalam sistem?",
    o: ["10 MB",
        "2 MB",
        "20 MB",
        "Tanpa batasan ukuran"], a: 0,
    bahas: "Batas unggah satu berkas foto progres adalah 10 MB." },

  { id: "p15",
    q: "Jika dokumen PDF DED yang akan diunggah ukurannya 30 MB (melebihi batas sistem), apa langkah yang harus dilakukan?",
    o: ["Mengompresi file PDF (PDF Compressor) menjadi ukuran yang lebih kecil",
        "Menghapus seluruh gambar dalam dokumen",
        "Mengirim file lewat pos",
        "Memotret layar komputer"], a: 0,
    bahas: "Berkas dikecilkan dengan alat kompresi PDF tanpa mengubah isinya, lalu diunggah ulang." },

  { id: "p16",
    q: "Fitur apa yang digunakan untuk melaporkan manfaat atau fungsi infrastruktur yang dibangun pada tahun sebelumnya?",
    o: ["Output & Immediate Outcome",
        "Menu Input OPD",
        "Status PBJ",
        "Profil Pengguna"], a: 0,
    bahas: "Menu Output & Immediate Outcome merekam manfaat bangunan tahun sebelumnya, bukan progres tahun berjalan." },

  { id: "p17", grup: "format-pdf",
    q: "Format file apakah yang diwajibkan oleh sistem saat Anda menggunakan fitur “Unggah Dokumen Kontrak”?",
    o: ["PDF (.pdf)",
        "Word (.doc)",
        "Excel (.xls)",
        "Gambar (.jpg)"], a: 0,
    bahas: "Dokumen kontrak diunggah dalam format PDF." },

  { id: "p18",
    q: "Jika suatu paket pekerjaan dijalankan secara Swakelola, dokumen apa yang diunggah pada kolom Dokumen Kontrak?",
    o: ["SK Tim Pengelola Swakelola / SPK Swakelola",
        "Kuitansi beli semen",
        "Foto gotong royong",
        "Dikosongkan saja"], a: 0,
    bahas: "Pekerjaan swakelola tetap punya dasar hukum pelaksanaan: SK Tim Pengelola atau SPK Swakelola yang diunggah di kolom dokumen kontrak." },

  { id: "p19", grup: "adendum",
    q: "Kolom dokumen apa yang wajib diisi dan diunggah pada sistem apabila terjadi perubahan desain atau volume pekerjaan di lapangan (adendum)?",
    o: ["Kolom Justifikasi Teknis (Adendum)",
        "Kolom DED",
        "Kolom SPK",
        "Kolom Berita Acara Rapat"], a: 0,
    bahas: "Perubahan desain atau volume diunggah pada kolom Justifikasi Teknis (Adendum)." },

  { id: "p20",
    q: "Apa fungsi utama tombol “Simpan” (Save) setelah mengetik angka progres di aplikasi?",
    o: ["Memastikan data tersimpan dan tidak hilang saat pindah halaman",
        "Mengunci laporan secara permanen",
        "Mencetak laporan ke printer",
        "Keluar dari aplikasi"], a: 0,
    bahas: "Angka yang diketik belum masuk basis data sampai tombol Simpan ditekan; berpindah halaman tanpa menyimpan membuat isian hilang." },

  { id: "p21", grup: "format-nilai",
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

  { id: "p23", grup: "format-nilai",
    q: "Dalam fitur pengisian Nilai Kontrak, bagaimana format penulisan angka yang benar di dalam sistem?",
    o: ["Mengetik nominal angka pasti tanpa spasi atau titik (contoh: 1500000)",
        "Menggunakan huruf (contoh: Satu Juta Rupiah)",
        "Dibulatkan ke angka terdekat",
        "Diisi angka 0 terlebih dahulu"], a: 0,
    bahas: "Nilai kontrak diketik sebagai angka polos, sesuai nominal pada dokumen kontrak." },

  { id: "p24",
    q: "Apabila kegiatan fisik di lapangan sudah selesai 100%, dokumen apakah yang wajib diunggah ke dalam sistem?",
    o: ["PHO / BAST (Berita Acara Serah Terima)",
        "Surat Permohonan Dana",
        "Kuitansi Toko Material",
        "Foto KTP Kontraktor"], a: 0,
    bahas: "Penyelesaian pekerjaan dibuktikan dengan PHO/BAST, bukan sekadar foto 100%." },

  { id: "p25",
    q: "Pada sub-menu “Data Tenaga Kerja”, data utama apakah yang wajib dilaporkan oleh operator daerah?",
    o: ["Jumlah tenaga kerja lokal yang terserap pada kegiatan tersebut",
        "Nama lengkap seluruh tukang bangunan",
        "Besar gaji harian mandor",
        "Daftar hadir PNS di dinas"], a: 0,
    bahas: "Yang dilaporkan adalah jumlah tenaga kerja lokal yang terserap, sebagai indikator manfaat ekonomi DAK di daerah." }
];
