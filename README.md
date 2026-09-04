# Evaluasi Pemahaman Operator eMonitoring DAK

Situs **pre-test dan post-test** daring untuk operator daerah aplikasi
**eMonitoring DAK** — Pusat Fasilitasi Infrastruktur Daerah, Kementerian
Pekerjaan Umum. Temanya terang — langit cerah, kartu putih, aksen biru tua
dan emas yang diambil dari lambang eMonitoring DAK — lalu kuis serentak bergaya
Kahoot: peserta punya akun, menunggu di lobi, dan mengerjakan bersama-sama dalam
jendela waktu yang dibuka panitia.

Pre-test dan post-test memakai **bank soal yang sama persis**. Yang membedakan
hanya judul, sebutan di layar, dan pemisahan rekap — jadi selisih nilai sebelum
dan sesudah materi bimtek benar-benar bisa dibandingkan.

Tanpa kerangka kerja, tanpa proses build: HTML + CSS + JavaScript biasa, sama
seperti `monev-dak`. Cukup unggah berkasnya, situsnya jalan.

---

## Alur singkat

```
Peserta :  akun (nama, email, pemda)  →  lobi (token + hitung mundur)
           →  layar persiapan  →  aba-aba 5 detik  →  20 soal berpoin
           →  hasil, waktu per soal & pembahasan  →  papan juara

Admin   :  akun panitia  →  pilih jenis tes (pre/post)  →  atur & buka sesi
           →  pantau langsung + lama sesi berjalan  →  akhiri sesi
           →  rekap Excel (satu sheet per token) atau CSV
```

Peserta tidak memakai kata sandi sama sekali: mereka dikenali dari **email**
yang diketik sendiri, dan memilih pemda dari daftar seluruh Indonesia. Yang
menjaga ujian tetap serentak adalah **token sesi 6 karakter** yang hanya berlaku
pada jendela waktu yang dibuka panitia.

---

## Isi ringkas

| Berkas | Isinya |
| --- | --- |
| `index.html` | Halaman muka (hero langit cerah satu layar penuh) + rangka aplikasi |
| `assets/style.css` | Seluruh gaya tampilan: tema terang, ubin jawaban, animasi |
| `assets/konfig.js` | Jenis tes, nilai bawaan sesi, dan rumus poin |
| `assets/wilayah.js` | 38 provinsi + 514 kabupaten/kota untuk pilihan pemda |
| `assets/soal.js` | Bank soal bawaan, 29 butir dari berkas .docx penyelenggara |
| `assets/impor-soal.js` | Pembaca .docx/.json/teks untuk impor soal dari Ruang Admin |
| `assets/data.js` | Lapisan penyimpanan: Firestore atau localStorage |
| `assets/xlsx.js` | Penulis berkas `.xlsx` untuk rekap Excel (tanpa pustaka luar) |
| `assets/app.js` | Perute halaman, kuis, papan peringkat, ruang admin |
| `assets/firebase-config.js` | Kunci proyek Firebase + nama koleksi |
| `assets/logo-pu.png` | Logo lengkap Kementerian Pekerjaan Umum (cadangan, lockup penuh) |
| `assets/lambang-pu.png` | Lambang PU saja — dipakai pada kop bersama nama unit |
| `assets/logo-emondak.png` | Logo resmi eMonitoring DAK (cadangan) |
| `assets/lambang-emondak.png` | Lambangnya saja — favicon dan cap air hero |
| `firestore.rules` | Aturan keamanan Firestore beserta cara memasangnya |
| `dev-server.mjs` | Peladen statis untuk pratinjau lokal (tidak diunggah ke Vercel) |

Alamat di dalam situs: `#/` beranda · `#/cara` · `#/akun` · `#/lobi` ·
`#/siap` · `#/tes` · `#/hasil` · `#/peringkat` · `#/admin` · `#/bantuan`

### Rekap Excel tanpa pustaka luar

`assets/xlsx.js` merakit sendiri berkas `.xlsx`, yang sebenarnya arsip ZIP berisi
XML. Semua entri ditulis dengan metode *stored* (tanpa kompresi) supaya tidak
perlu deflate, dan itu tetap sah dibuka Excel, LibreOffice, maupun Google Sheets.
Alasannya: situs ini statis tanpa proses build, jadi lebih baik menulis ±250 baris
sendiri daripada menarik pustaka dari CDN yang bisa mati saat hari-H bimtek.

---

## Menjalankan di komputer sendiri

```bash
node dev-server.mjs
```

Lalu buka <http://localhost:3900>.

Selalu lewat `http://`, jangan klik ganda `index.html` — Firebase tidak aktif
pada `file://`, dan aplikasi akan turun ke **mode lokal** (pita kuning
di kiri bawah, data hanya mengendap di peramban itu). Mode lokal berguna untuk
gladi bersih: seluruh alur tetap jalan tanpa jaringan, dan Ruang Admin terbuka
tanpa pemeriksaan karena tidak ada yang bisa diperiksa.

---

## Menjalankan sesi (panitia)

1. Buka `#/admin`, masuk dengan email dan kata sandi akun panitia.
2. Pilih **jenis tes**: *Pre-Test* (sebelum materi) atau *Post-Test* (sesudah
   materi). Soalnya sama; yang berubah hanya judul, sebutan di layar, dan
   pemisahan rekap. Mengganti pilihan ikut menyesuaikan judul sesi.
3. Isi **kode sesi** (mis. `BIMTEK-01`, pembeda rekap antar angkatan),
   **token peserta** yang akan dibagikan di kelas, judul, jumlah soal, dan
   detik per soal (`120` = 2 menit per soal; total maksimalnya ditampilkan
   di bawah kotak isian).
4. Tentukan jadwal:
   - **Terjadwal** — isi *Dibuka mulai* dan *Ditutup pukul*, lalu Buka sesi.
     Peserta yang menunggu di lobi melihat hitung mundur raksasa dan layarnya
     berganti sendiri saat waktunya tiba.
   - **Langsung** — kosongkan jadwal lalu tekan **Buka sesi sekarang**; sesi
     terbuka seketika dan tertutup otomatis 60 menit kemudian.
5. Bacakan tokennya. Peserta memasukkannya di lobi, lalu berhenti di **layar
   persiapan**. Sesudah semua masuk, beri aba-aba: peserta menekan *Kerjakan*,
   muncul hitung mundur 5 detik, dan seisi kelas membuka soal pertama bersamaan.
6. Lencana di kanan kartu sesi menunjukkan **sudah berapa lama sesi berjalan**
   dan sisa waktunya, berdenyut tiap detik.
7. Pantau di bagian **Pemantauan langsung** — jumlah yang sudah mengisi,
   rata-rata poin dan nilai, rata-rata waktu kerja, tabel peserta, serta
   **rekap waktu penyelesaian tiap soal** (rata-rata, tercepat, terlama, dan
   berapa kali kehabisan waktu). Kotak *Tampilkan* menyaring per token atau
   membuka seluruh riwayat. Angkanya berubah sendiri setiap ada yang selesai.
8. **Akhiri sesi sekarang** menghentikan penerimaan peserta baru. Yang sedang
   mengerjakan otomatis dikumpulkan lembar jawabannya.
9. Unduh **Excel** (satu sheet per token: peserta, waktu per soal, ditambah
   sheet ringkasan dan rincian jawaban) atau **CSV** untuk daftar yang sedang
   ditampilkan.

Jam yang dipakai adalah jam perangkat masing-masing. Selisih beberapa menit
antar laptop peserta itu wajar, jadi beri jarak jadwal secukupnya.

Satu email boleh mengerjakan **satu kali per kode sesi untuk tiap jenis tes** —
peserta yang sudah ikut pre-test tetap bisa ikut post-test walaupun kode sesinya
tidak diganti.

---

## Membersihkan data sebelum angkatan berikutnya

Di bagian **Pembersihan data** pada Ruang Admin ada empat tombol:

| Tombol | Yang dihapus | Yang tetap utuh | Kata kunci |
| --- | --- | --- | --- |
| **Reset masa uji coba** | Seluruh `pretestAkun` **dan** seluruh `pretestHasil` | Pengaturan sesi & bank soal | `saya akan lawan` |
| Hapus akun peserta saja | Seluruh isi `pretestAkun` | Semua nilai yang sudah masuk | `saya akan lawan` |
| Hapus hasil sesi ini | Nilai pada kode sesi yang sedang aktif | Akun peserta & sesi lain | `HAPUS` |
| Hapus seluruh riwayat hasil | Seluruh isi `pretestHasil` | Akun peserta | `HAPUS SEMUA` |

Keempatnya meminta konfirmasi **dua kali**: kotak "yakin?" lalu mengetik ulang
kata kuncinya. Pengetikannya tidak peka huruf besar/kecil maupun spasi berlebih.
Tidak ada pembatalan sesudahnya.

**Reset masa uji coba** adalah tombol yang dipakai selama pengujian: sesudahnya
orang yang sama bisa mendaftar lagi dan mengerjakan lagi dari nol, karena akun
sekaligus nilainya sudah bersih. Tiga tombol lain bekerja sendiri-sendiri —
menghapus akun tidak menghapus nilai, dan sebaliknya. Peserta yang akunnya
dihapus cukup mendaftar ulang dengan email yang sama.

---

## Perhitungan poin

Poin dihitung ala Kahoot supaya jawaban cepat dihargai:

```
benar  →  600 (poin dasar)
        + 0…400 (makin cepat menjawab, makin besar; mati bila "poin kecepatan" dimatikan)
        + 50 per jawaban benar beruntun mulai yang ke-3 (maksimal 5 tingkat)
salah / waktu habis  →  0 poin dan hitungan beruntun kembali nol
```

Angkanya diatur di `assets/konfig.js` (`poinDasar`, `poinCepatMaks`,
`bonusBeruntun`). Selain poin, nilai 0–100 tetap dihitung dari jumlah jawaban
benar — poin untuk papan juara, nilai untuk rekap resmi.

Papan peringkat diurutkan dari **poin** tertinggi, lalu nilai, lalu waktu
pengerjaan tercepat.

**Urutan medali** sengaja ditulis `emas → perunggu → perak`, persis seperti
permintaan penyelenggara (juara 1 emas, juara 2 perunggu, juara 3 perak). Untuk
memakai urutan internasional, ubah `medali` di `assets/konfig.js` menjadi
`["emas", "perak", "perunggu"]`.

---

## Akun panitia

Panitia memakai **Firebase Authentication**; akunnya dibuat langsung di Firebase
Console, bukan dari dalam aplikasi:

1. Console → **Authentication → Sign-in method** → aktifkan **Email/Password**.
2. **Users → Add user** → isi email dan kata sandi panitia.
3. Tulis email itu pada fungsi `emailAdmin()` di `firestore.rules`, lalu Publish.

Sesudah itu Ruang Admin (`#/admin`) dibuka dengan email dan kata sandi tersebut.
Firebase mengingat keadaan masuk, jadi menyegarkan halaman tidak mengeluarkan
panitia dari papan.

Tidak ada token admin, tidak ada kata sandi yang tersimpan di repo. Peserta tetap
tanpa akun Firebase — mereka dikenali dari email yang diketik sendiri.

---

## Basis data

Proyek Firebase khusus: **`bimtek-pfid`**
([console](https://console.firebase.google.com/u/0/project/bimtek-pfid/firestore)).
Koleksinya:

| Koleksi | Isi |
| --- | --- |
| `pretestAkun/{idAkun}` | profil peserta — nama, email, pemda, provinsi |
| `pretestSesi/aktif` | jenis tes, jadwal, & token sesi yang sedang berjalan |
| `pretestBank/aktif` | bank soal hasil impor panitia — menimpa `assets/soal.js` |
| `pretestHasil/{auto}` | nilai akhir tiap peserta, termasuk waktu tiap butir soal |

Tiap rekaman di `pretestHasil` menyimpan larik `jawaban`, satu entri per butir
berisi `id` soal, nomor urutnya di layar peserta, pilihan, benar/salah, poin, dan
**`detik`** — lama peserta memikirkan butir itu. Dari situlah seluruh rekap waktu
di Ruang Admin, di halaman hasil peserta, dan di berkas Excel dihitung.

Yang disiapkan manual di Firebase Console (petunjuk lengkap di bagian atas
`firestore.rules`): **akun panitia** di Authentication, **daftar email panitia**
pada fungsi `emailAdmin()`, dan **aturan keamanan** yang ditempel lalu Publish.

Aturannya: dokumen boleh dibuat siapa pun (peserta memang tidak login) tetapi
isinya diperiksa ketat. Nilai **tidak bisa diubah oleh siapa pun**, termasuk
panitia — terkunci begitu terkirim. Yang boleh dilakukan panitia adalah
menghapus rekaman (tombol ✕ pada tabel rekap, atau tombol pembersihan massal)
dan menulis pengaturan sesi.

> **Catatan privasi.** Papan peringkat hanya menampilkan nama, pemda, dan poin,
> tetapi email peserta tersimpan pada dokumen yang sama dan secara teknis ikut
> terbaca oleh siapa pun yang membuka koleksinya. Untuk bimtek internal ini
> dianggap memadai. Bila email dinilai sensitif, ubah `allow read: if true;`
> pada `pretestHasil` dan `pretestAkun` menjadi `if isAdmin();` —
> konsekuensinya papan peringkat hanya bisa dibuka panitia.

Ingin memakai proyek Firebase sendiri? Ganti isi `assets/firebase-config.js`
dengan konfigurasi proyek baru, lalu tempel seluruh `firestore.rules` di sana.

### Peringatan "Secrets detected" dari GitHub

GitHub menandai `apiKey` pada `assets/firebase-config.js` sebagai *Google API
Key* yang bocor. Peringatan itu **wajar dan tidak perlu ditindaklanjuti dengan
rotasi kunci**: kunci Web API Firebase memang dirancang tampil di sisi klien —
ia ikut terunduh oleh setiap pengunjung situs, persis seperti alamat proyeknya.
Ia hanya menunjuk proyek mana yang dituju, bukan memberi izin apa pun. Yang
menjaga data adalah `firestore.rules` dan akun panitia di Firebase
Authentication. Alert-nya boleh ditutup dengan alasan *false positive*.

Yang tetap layak dikerjakan, karena kunci itu memang terbuka:

1. **Batasi kunci pada domain sendiri.** Google Cloud Console → APIs & Services
   → Credentials → kunci "Browser key (auto created by Firebase)" →
   *Application restrictions* → **HTTP referrers**, lalu daftarkan
   `bimtek-pfid.vercel.app/*`, `*.vercel.app/*`, dan `localhost/*`. Biarkan
   *API restrictions* pada "Don't restrict key" supaya Firestore dan Identity
   Toolkit tetap jalan.
2. **Tutup pendaftaran mandiri di Authentication.** Penyedia Email/Password
   yang aktif membuat siapa pun bisa memanggil endpoint pendaftaran dengan
   kunci itu dan membuat akun di proyek ini. Akun semacam itu tidak mendapat
   izin apa-apa — `emailAdmin()` hanya mengenali email panitia — tetapi lebih
   rapi bila ditutup: Google Cloud Console → Identity Platform → **Settings →
   User actions** → hilangkan centang **Enable create (sign-up)**. Akun panitia
   tetap bisa ditambah dari Firebase Console.

Yang benar-benar rahasia di proyek ini hanya **kata sandi akun panitia**, dan
itu tidak pernah tersimpan di repo maupun di berkas mana pun.

---

## Bank soal

**29 butir bawaan**: 24 butir eMonDAK dari `SOAL PRE TEST EMONDAK New.docx`
ditambah 5 butir anti korupsi dari revisi 4 September 2026 (bagian "PERTANYAAN
SOAL ANTI KORUPSI", dalam rangka Pembangunan Zona Integritas).

Tiga pasang di antaranya menanyakan hal yang sama dengan redaksi berbeda (format
PDF, adendum, format nilai kontrak), jadi tiap pasangan diberi penanda `grup` dan
pengundian hanya mengambil satu wakil per grup — peserta tidak akan menemui soal
kembar dalam satu lembar. Tersisa **26 grup unik**, dan jumlah soal per sesi
tidak boleh melebihi angka itu. Bawaannya kini **25 soal per peserta**.

`id` tiap butir **jangan diubah** setelah ada nilai masuk, karena dipakai
menyusun ulang pembahasan dan analisis butir soal. `p14` sudah dibuang pada
revisi 2 September (kembarannya hilang dari dokumen baru) dan nomornya **tidak
dipakai ulang** — butir eMonDAK baru memakai `p26` dan seterusnya, butir anti
korupsi memakai `k01`…, dan butir hasil impor mendapat `i…` otomatis.

### Semuanya diacak per peserta

Tiap peserta mendapat lembar sendiri, diundi saat tokennya diterima:

1. **butir mana yang keluar** — satu wakil acak per grup, lalu dipotong sebanyak
   jumlah soal sesi;
2. **urutan soalnya**; dan
3. **urutan pilihan A–D pada tiap soal** — kuncinya disimpan sebagai indeks pada
   urutan asli dokumen, jadi pengacakan tampilan tidak pernah menggeser kunci.

Dua peserta yang duduk bersebelahan tidak akan melihat layar yang sama.

### Impor soal baru dari Ruang Admin

Penyelenggara kerap mengirim revisi soal beberapa jam sebelum kelas. Kartu
**Bank soal** di Ruang Admin memasukkannya tanpa deploy ulang:

| Sumber | Keterangan |
| --- | --- |
| `.docx` | Dokumen Word kiriman penyelenggara — dibongkar di peramban panitia (ZIP + inflate bawaan), tidak diunggah ke mana pun |
| `.json` | Cadangan yang pernah diunduh lewat tombol **Unduh cadangan (JSON)** |
| teks | Disalin-tempel ke kotak pada kartu itu, atau berkas `.txt`/`.csv` |

Dua tata tulis dipahami, dan boleh bercampur dalam satu berkas:

```
Bagaimana cara mengakses eMonDAK?        1. Dasar hukum korupsi
[✔] A. Lewat Portal FID > eMonDAK        UU Tipikor rujukan utamanya adalah…
[ ] B. Lewat Portal FID > SIPDJD         A. UU 31/1999 jo. UU 20/2001
[ ] C. Lewat Play Store                  B. UU 5/2014
[ ] D. Lewat surat resmi                 Jawaban benar: A
```

Pilihan yang menyatu dalam satu baris (`A. satu B. dua C. tiga`) ikut dipecah —
Word kerap menggabungkannya saat teks disalin. Judul bagian yang huruf besar
semua dan label bernomor seperti "1. Dasar hukum korupsi" tidak ikut terbawa
menjadi pertanyaan.

Hasil bacaan **tidak langsung disimpan**. Yang muncul lebih dulu adalah
pratinjau yang masih bisa dibetulkan:

- **Kunci** — kunci yang tidak terbaca ditandai merah dan wajib dipilih dulu;
- **Grup kembar** — isi kata yang sama pada dua butir yang menanyakan hal serupa;
- **Pembahasan** — kalimat yang muncul di halaman hasil peserta.

Butir yang teks pertanyaannya sudah ada di bank memakai **id lamanya kembali**,
jadi rekap butir dan pembahasan nilai yang telanjur masuk tidak putus. Pilih
**Tambah / perbarui** untuk menimpa butir yang sama sambil menyimpan sisanya,
atau **Ganti seluruh bank soal** untuk memulai dari nol.

Hasilnya tersimpan di `pretestBank/aktif` dan langsung dipakai peserta yang
masuk sesudahnya. Bank di `assets/soal.js` tetap utuh sebagai cadangan, dan
tombol **Kembalikan ke bank bawaan** memulihkannya kapan saja.

> Aturan `pretestBank` pada `firestore.rules` harus sudah ditempel dan
> dipublikasikan di Firebase Console; tanpa itu penyimpanan ditolak dengan pesan
> soal izin.

---

## Ketahanan saat ujian

- Jawaban, poin, dan nomor soal disimpan di `sessionStorage`. Halaman yang
  tertutup atau dimuat ulang kembali ke soal yang sama dengan poin utuh —
  hitung mundur tetap berjalan selama itu, jadi menyegarkan halaman tidak
  memberi keuntungan.
- Satu akun hanya boleh mengerjakan satu kali per kode sesi untuk tiap jenis
  tes — pre-test dan post-test dihitung terpisah.
- Layar persiapan dan aba-aba 5 detik ikut tersimpan: peserta yang halamannya
  tertutup sebelum menekan *Kerjakan* kembali ke layar persiapan, bukan langsung
  ke soal. Hitungan waktu kerja baru mulai sesudah aba-aba selesai.
- Bila jendela waktu sesi berakhir di tengah pengerjaan, lembar jawaban
  dikumpulkan otomatis dan halaman hasil memberi tahu alasannya.
- Bila pengiriman nilai gagal (jaringan atau aturan Firestore belum dipasang),
  halaman hasil menampilkan peringatan merah supaya peserta melapor ke panitia
  sebelum menutup halaman.
- Suara efek mati secara bawaan; peserta bisa menyalakannya lewat tombol 🔇 di
  ruang ujian. Semua animasi otomatis padam bila perangkat menyalakan
  *reduce motion*.

---

## Push ke GitHub

Remote `origin` sudah menunjuk ke <https://github.com/shusuka/bimtek_PFID>:

```bash
git push -u origin main
```

> Vercel akun ini menolak deploy bila email penulis commit bukan
> `love201108@gmail.com`. Repo ini sudah disetel begitu lewat `git config`.

## Deploy ke Vercel

Vercel → **Add New… → Project** → pilih repo `bimtek_PFID` → Framework Preset
**Other** → Root Directory `./` → Deploy. Tidak ada perintah build dan tidak ada
variabel lingkungan; `vercel.json` sudah mengatur `cleanUrls` dan tajuk keamanan.

Setiap `git push` ke `main` memicu deploy ulang otomatis.
