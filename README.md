# Pre-Test BIMTEK eMonDAK

Situs pre-test daring untuk peserta Bimbingan Teknis aplikasi **eMonitoring DAK**.
Satu halaman muka bergaya *edge futuristik* hitam dengan aksen biru–kuning Pekerjaan
Umum, lalu ujian pilihan ganda, papan peringkat berpodium, dan ruang admin.

Tanpa kerangka kerja, tanpa proses build: HTML + CSS + JavaScript biasa, sama
seperti `monev-dak`. Cukup unggah berkasnya, situsnya jalan.

---

## Isi ringkas

| Berkas | Isinya |
| --- | --- |
| `index.html` | Halaman muka (hero video satu layar penuh) + rangka aplikasi |
| `assets/style.css` | Seluruh gaya tampilan: tema hitam, biru & kuning PU |
| `assets/konfig.js` | **Satu-satunya berkas yang disunting tiap bimtek** — token, jumlah soal, batas waktu |
| `assets/soal.js` | Bank soal 25 butir dari berkas .docx penyelenggara |
| `assets/data.js` | Lapisan penyimpanan: Firestore atau localStorage |
| `assets/app.js` | Perute halaman, logika ujian, peringkat, ruang admin |
| `assets/firebase-config.js` | Kunci proyek Firebase + nama koleksi |
| `firestore.rules` | Aturan keamanan Firestore beserta cara memasangnya |
| `server.mjs` | Peladen statis untuk pratinjau lokal (tidak dipakai Vercel) |
| `scripts/hash-token.mjs` | Pembuat sidik jari SHA-256 untuk token admin |

Alamat di dalam situs: `#/` beranda · `#/cara` · `#/masuk` · `#/tes` ·
`#/hasil` · `#/peringkat` · `#/admin` · `#/bantuan`

---

## Menjalankan di komputer sendiri

```bash
node server.mjs
```

Lalu buka <http://localhost:3900>.

Selalu lewat `http://`, jangan klik ganda `index.html` — Firebase dan Web Crypto
tidak aktif pada `file://`, dan aplikasi akan turun ke **mode lokal** (pita kuning
di kiri bawah, data hanya mengendap di peramban itu).

---

## Pengaturan sebelum bimtek — `assets/konfig.js`

```js
jumlahSoal: 20,          // diundi dari 21 grup soal unik
batasMenit: 25,          // 0 = tanpa batas waktu
acakOpsi:   true,        // urutan A–D diacak tiap peserta
tokenPeserta: ["BIMTEK2026", "EMONDAK-SUMUT"],
hashAdmin: "d05b9c…",    // sidik jari token admin
medali: ["emas", "perunggu", "perak"],
```

**Token peserta** dibagikan panitia di kelas; boleh lebih dari satu (mis. per
angkatan). Tidak peka huruf besar/kecil.

**Token admin** bawaan: `PFID-ADMIN-2026`. Ganti sebelum dipakai sungguhan:

```bash
node scripts/hash-token.mjs "TOKEN-BARU-ANDA"
```

Tempel `hashAdmin` yang tercetak ke `assets/konfig.js`. Yang tersimpan di repo
hanya sidik jarinya, bukan tokennya.

**Urutan medali** sengaja ditulis `emas → perunggu → perak`, persis seperti
permintaan penyelenggara (juara 1 emas, juara 2 perunggu, juara 3 perak). Untuk
memakai urutan internasional, tukar dua kata terakhirnya jadi
`["emas", "perak", "perunggu"]`.

### Bank soal

25 butir dari `DAFTAR PERTANYAAN PRE & POST TEST BIMTEK EMONDAK.docx`. Empat
pasang di antaranya menanyakan hal yang sama dengan redaksi berbeda
(ukuran foto, format PDF, adendum, format nilai kontrak), jadi tiap pasangan
diberi penanda `grup` yang sama dan pengundian hanya mengambil satu wakil per
grup — peserta tidak akan menemui soal kembar. Tersisa **21 grup unik**, dan
`jumlahSoal` tidak boleh melebihi angka itu.

`id` tiap butir (`p01`…`p25`) **jangan diubah** setelah ada nilai masuk, karena
dipakai menyusun ulang pembahasan dan analisis butir soal.

---

## Basis data

Bawaannya menumpang proyek Firebase `emondak-faee8` (proyek yang sama dengan
monev-dak) pada koleksi terpisah **`pretestHasil`**. Kunci Web API Firebase
memang dirancang tampil di sisi klien; yang mengamankan data adalah
`firestore.rules`.

Sebelum dipakai, aturan di `firestore.rules` **wajib dipasang manual** lewat
Firebase Console — lihat petunjuk lengkap di bagian atas berkas itu. Ringkasnya:
salin blok `match /pretestHasil/{id}` dan tempel sebelum blok penutup
`match /{document=**}` pada aturan yang sudah ada. Jangan menimpa seluruh
aturan lama; monev-dak masih memakainya.

Aturannya: dokumen boleh dibuat siapa pun (peserta memang tidak login) tetapi
isinya diperiksa ketat, sedangkan **ubah dan hapus ditolak untuk semua orang** —
nilai terkunci begitu terkirim. Membersihkan data uji coba dilakukan dari
Firebase Console.

> **Catatan privasi.** Papan peringkat hanya menampilkan nama, instansi, dan
> nilai, tetapi email peserta tersimpan pada dokumen yang sama dan secara teknis
> ikut terbaca oleh siapa pun yang membuka koleksinya. Untuk bimtek internal ini
> dianggap memadai. Bila email dinilai sensitif, aktifkan Firebase Auth untuk
> akun admin lalu ganti `allow read: if true;` menjadi aturan berbasis email
> admin seperti pada `monev-dak/firestore.rules`.

Ingin memakai proyek Firebase sendiri? Ganti isi `assets/firebase-config.js`
dengan konfigurasi proyek baru, lalu tempel seluruh `firestore.rules` di sana.

---

## Alur peserta

1. **Masuk** — nama, email, instansi, token. Tidak ada kata sandi; email menjadi
   penanda peserta dan satu email hanya boleh sekali mengerjakan.
2. **Mengerjakan** — 20 soal, satu layar satu soal, ada peta nomor dan hitung
   mundur. Jawaban disimpan di `sessionStorage`, jadi halaman boleh dimuat ulang
   tanpa kehilangan progres; waktu tetap berjalan.
3. **Hasil** — nilai 0–100, jumlah benar/salah, lama pengerjaan, dan pembahasan
   tiap butir. Bisa dicetak atau disimpan sebagai PDF.
4. **Peringkat** — podium tiga besar bertropi + tabel seluruh peserta. Urutan:
   nilai tertinggi, lalu waktu pengerjaan tercepat.

## Ruang admin (`#/admin`)

Masuk dengan token admin, lalu tersedia:

- jumlah peserta yang sudah mengisi, jumlah instansi, rata-rata nilai, nilai
  tertinggi dan terendah, rata-rata waktu pengerjaan;
- tabel seluruh peserta lengkap dengan email dan token, berikut kotak pencarian;
- **analisis butir soal** — persentase benar tiap nomor, diurutkan dari yang
  paling banyak salah, sebagai bahan penekanan materi di kelas;
- unduh rekap **CSV** (pemisah titik koma + BOM, langsung rapi di Excel).

Ruang admin hanya membaca. Menghapus atau mengubah nilai dilakukan dari Firebase
Console, sesuai aturan keamanan di atas.

---

## Push ke GitHub

```bash
git init
git add .
git commit -m "Situs pre-test BIMTEK eMonDAK"
git branch -M main
git remote add origin https://github.com/shusuka/pretest-bimtek.git
git push -u origin main
```

> Vercel akun ini menolak deploy bila email penulis commit bukan
> `love201108@gmail.com`. Pastikan `git config user.email love201108@gmail.com`
> di repo ini sebelum commit pertama.

## Deploy ke Vercel

Vercel → **Add New… → Project** → pilih repo `pretest-bimtek` → Framework Preset
**Other** → Root Directory `./` → Deploy. Tidak ada perintah build dan tidak ada
variabel lingkungan; `vercel.json` sudah mengatur `cleanUrls` dan tajuk keamanan.

Setiap `git push` ke `main` memicu deploy ulang otomatis.
