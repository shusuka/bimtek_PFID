# Pre-Test BIMTEK eMonDAK

Situs pre-test daring untuk peserta Bimbingan Teknis aplikasi **eMonitoring DAK**.
Halaman muka bergaya *edge futuristik* hitam dengan aksen biru–kuning Pekerjaan
Umum, lalu kuis serentak bergaya Kahoot: peserta punya akun, menunggu di lobi,
dan mengerjakan bersama-sama dalam jendela waktu yang dibuka panitia.

Tanpa kerangka kerja, tanpa proses build: HTML + CSS + JavaScript biasa, sama
seperti `monev-dak`. Cukup unggah berkasnya, situsnya jalan.

---

## Alur singkat

```
Peserta :  akun (nama, email, pemda)  →  lobi (token + hitung mundur)
           →  20 soal berpoin  →  hasil & pembahasan  →  papan juara

Admin   :  akun panitia  →  atur & buka sesi  →  pantau langsung  →  rekap CSV
```

Peserta tidak memakai kata sandi sama sekali: mereka dikenali dari **email**
yang diketik sendiri, dan memilih pemda dari daftar seluruh Indonesia. Yang
menjaga ujian tetap serentak adalah **token sesi 6 karakter** yang hanya berlaku
pada jendela waktu yang dibuka panitia.

---

## Isi ringkas

| Berkas | Isinya |
| --- | --- |
| `index.html` | Halaman muka (hero video satu layar penuh) + rangka aplikasi |
| `assets/style.css` | Seluruh gaya tampilan: tema hitam, ubin jawaban, animasi |
| `assets/konfig.js` | Nilai bawaan sesi dan rumus poin |
| `assets/wilayah.js` | 38 provinsi + 514 kabupaten/kota untuk pilihan pemda |
| `assets/soal.js` | Bank soal 25 butir dari berkas .docx penyelenggara |
| `assets/data.js` | Lapisan penyimpanan: Firestore atau localStorage |
| `assets/app.js` | Perute halaman, kuis, papan peringkat, ruang admin |
| `assets/firebase-config.js` | Kunci proyek Firebase + nama koleksi |
| `firestore.rules` | Aturan keamanan Firestore beserta cara memasangnya |
| `dev-server.mjs` | Peladen statis untuk pratinjau lokal (tidak diunggah ke Vercel) |

Alamat di dalam situs: `#/` beranda · `#/cara` · `#/akun` · `#/lobi` ·
`#/tes` · `#/hasil` · `#/peringkat` · `#/admin` · `#/bantuan`

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
2. Isi **kode sesi** (mis. `BIMTEK-01`, pembeda rekap antar angkatan),
   **token peserta** yang akan dibagikan di kelas, judul, jumlah soal, dan
   detik per soal.
3. Tentukan jadwal:
   - **Terjadwal** — isi *Dibuka mulai* dan *Ditutup pukul*, lalu Buka sesi.
     Peserta yang menunggu di lobi melihat hitung mundur raksasa dan layarnya
     berganti sendiri saat waktunya tiba.
   - **Langsung** — kosongkan jadwal lalu tekan **Buka sesi sekarang**; sesi
     terbuka seketika dan tertutup otomatis 60 menit kemudian.
4. Bacakan tokennya. Peserta memasukkannya di lobi dan langsung mulai.
5. Pantau di bagian **Pemantauan langsung** — jumlah yang sudah mengisi,
   rata-rata poin dan nilai, tabel peserta, serta analisis butir soal. Angkanya
   berubah sendiri setiap ada yang selesai.
6. **Tutup sesi sekarang** menghentikan penerimaan peserta baru. Yang sedang
   mengerjakan otomatis dikumpulkan lembar jawabannya begitu jendela waktu
   habis.

Jam yang dipakai adalah jam perangkat masing-masing. Selisih beberapa menit
antar laptop peserta itu wajar, jadi beri jarak jadwal secukupnya.

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
| `pretestSesi/aktif` | jadwal & token sesi yang sedang berjalan |
| `pretestHasil/{auto}` | nilai akhir tiap peserta |

Yang disiapkan manual di Firebase Console (petunjuk lengkap di bagian atas
`firestore.rules`): **akun panitia** di Authentication, **daftar email panitia**
pada fungsi `emailAdmin()`, dan **aturan keamanan** yang ditempel lalu Publish.

Aturannya: dokumen boleh dibuat siapa pun (peserta memang tidak login) tetapi
isinya diperiksa ketat. Nilai **tidak bisa diubah oleh siapa pun**, termasuk
panitia — terkunci begitu terkirim. Yang boleh dilakukan panitia adalah
menghapus rekaman (tombol ✕ pada tabel rekap) dan menulis pengaturan sesi.

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

25 butir dari `DAFTAR PERTANYAAN PRE & POST TEST BIMTEK EMONDAK.docx`. Empat
pasang di antaranya menanyakan hal yang sama dengan redaksi berbeda (ukuran
foto, format PDF, adendum, format nilai kontrak), jadi tiap pasangan diberi
penanda `grup` dan pengundian hanya mengambil satu wakil per grup — peserta
tidak akan menemui soal kembar. Tersisa **21 grup unik**, dan jumlah soal per
sesi tidak boleh melebihi angka itu.

`id` tiap butir (`p01`…`p25`) **jangan diubah** setelah ada nilai masuk, karena
dipakai menyusun ulang pembahasan dan analisis butir soal.

---

## Ketahanan saat ujian

- Jawaban, poin, dan nomor soal disimpan di `sessionStorage`. Halaman yang
  tertutup atau dimuat ulang kembali ke soal yang sama dengan poin utuh —
  hitung mundur tetap berjalan selama itu, jadi menyegarkan halaman tidak
  memberi keuntungan.
- Satu akun hanya boleh mengerjakan satu kali per kode sesi.
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
