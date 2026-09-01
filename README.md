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
Peserta :  akun (nama, email, instansi)  →  lobi (token + hitung mundur)
           →  20 soal berpoin  →  hasil & pembahasan  →  papan juara

Admin   :  token admin  →  atur & buka sesi  →  pantau langsung  →  rekap CSV
```

Tidak ada kata sandi di mana pun. Peserta dikenali dari **email**, dan yang
menjaga ujian tetap serentak adalah **token sesi** yang hanya berlaku pada
jendela waktu yang ditentukan admin.

---

## Isi ringkas

| Berkas | Isinya |
| --- | --- |
| `index.html` | Halaman muka (hero video satu layar penuh) + rangka aplikasi |
| `assets/style.css` | Seluruh gaya tampilan: tema hitam, ubin jawaban, animasi |
| `assets/konfig.js` | Nilai bawaan sesi, rumus poin, sidik jari token admin |
| `assets/soal.js` | Bank soal 25 butir dari berkas .docx penyelenggara |
| `assets/data.js` | Lapisan penyimpanan: Firestore atau localStorage |
| `assets/app.js` | Perute halaman, kuis, papan peringkat, ruang admin |
| `assets/firebase-config.js` | Kunci proyek Firebase + nama koleksi |
| `firestore.rules` | Aturan keamanan Firestore beserta cara memasangnya |
| `server.mjs` | Peladen statis untuk pratinjau lokal (tidak dipakai Vercel) |
| `scripts/hash-token.mjs` | Pembuat sidik jari SHA-256 untuk token admin |

Alamat di dalam situs: `#/` beranda · `#/cara` · `#/akun` · `#/lobi` ·
`#/tes` · `#/hasil` · `#/peringkat` · `#/admin` · `#/bantuan`

---

## Menjalankan di komputer sendiri

```bash
node server.mjs
```

Lalu buka <http://localhost:3900>.

Selalu lewat `http://`, jangan klik ganda `index.html` — Firebase dan Web Crypto
tidak aktif pada `file://`, dan aplikasi akan turun ke **mode lokal** (pita kuning
di kiri bawah, data hanya mengendap di peramban itu). Mode lokal berguna untuk
gladi bersih: seluruh alur, termasuk kendali sesi, tetap jalan tanpa jaringan.

---

## Menjalankan sesi (panitia)

1. Buka `#/admin`, masukkan token admin.
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

## Token admin

Token bawaan: **`K9UP-C32D-5F5A-FV4H`**. Ganti sebelum dipakai sungguhan:

```bash
node scripts/hash-token.mjs "TOKEN-BARU-ANDA"
```

Tempel `hashAdmin` yang tercetak ke **dua tempat**:

1. `assets/konfig.js` — untuk membuka Ruang Admin di peramban;
2. dokumen Firestore `pretestRahasia/admin`, field `hash` — untuk mengizinkan
   penyimpanan pengaturan sesi (lihat `firestore.rules`).

Yang tersimpan di repo maupun di Firestore hanya sidik jarinya, bukan tokennya.

---

## Basis data

Bawaannya menumpang proyek Firebase `emondak-faee8` (proyek yang sama dengan
monev-dak) pada koleksi terpisah:

| Koleksi | Isi |
| --- | --- |
| `pretestAkun/{idAkun}` | profil peserta — nama, email, instansi |
| `pretestSesi/aktif` | jadwal & token sesi yang sedang berjalan |
| `pretestHasil/{auto}` | nilai akhir tiap peserta |
| `pretestRahasia/admin` | sidik jari token admin; tidak dapat dibaca klien |

Sebelum dipakai, **dua hal wajib disiapkan manual** di Firebase Console — dokumen
`pretestRahasia/admin` dan aturan keamanannya. Petunjuk lengkap ada di bagian
atas `firestore.rules`. Ringkasnya: salin ketiga blok `match /pretest…` dan
tempel sebelum blok penutup `match /{document=**}` pada aturan yang sudah ada.
Jangan menimpa seluruh aturan lama; monev-dak masih memakainya.

Aturannya: dokumen boleh dibuat siapa pun (peserta memang tidak login) tetapi
isinya diperiksa ketat, **ubah dan hapus ditolak untuk semua orang** — nilai
terkunci begitu terkirim. Pengaturan sesi hanya bisa ditulis oleh yang mengetahui
token admin. Membersihkan data uji coba dilakukan dari Firebase Console.

> **Catatan privasi.** Papan peringkat hanya menampilkan nama, instansi, dan
> poin, tetapi email peserta tersimpan pada dokumen yang sama dan secara teknis
> ikut terbaca oleh siapa pun yang membuka koleksinya. Untuk bimtek internal ini
> dianggap memadai. Bila email dinilai sensitif, aktifkan Firebase Auth untuk
> akun admin lalu ganti `allow read: if true;` menjadi aturan berbasis email
> admin seperti pada `monev-dak/firestore.rules`.

Ingin memakai proyek Firebase sendiri? Ganti isi `assets/firebase-config.js`
dengan konfigurasi proyek baru, lalu tempel seluruh `firestore.rules` di sana.

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

```bash
git remote add origin https://github.com/shusuka/pretest-bimtek.git
git push -u origin main
```

> Vercel akun ini menolak deploy bila email penulis commit bukan
> `love201108@gmail.com`. Repo ini sudah disetel begitu lewat `git config`.

## Deploy ke Vercel

Vercel → **Add New… → Project** → pilih repo `pretest-bimtek` → Framework Preset
**Other** → Root Directory `./` → Deploy. Tidak ada perintah build dan tidak ada
variabel lingkungan; `vercel.json` sudah mengatur `cleanUrls` dan tajuk keamanan.

Setiap `git push` ke `main` memicu deploy ulang otomatis.
