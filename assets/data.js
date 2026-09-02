/* ══════════════════════════════════════════════════════════════════
   LAPISAN DATA
   Satu pintu untuk akun peserta, pengaturan sesi, dan hasil ujian.

   Dua mode, dipilih otomatis:
     • firebase — konfigurasi terisi dan halaman dibuka lewat http(s)
     • lokal    — selain itu; data mengendap di localStorage peramban
                  perangkat ini saja, cocok untuk uji coba tanpa jaringan

   Koleksi Firestore
     pretestAkun/{idAkun}   profil peserta (nama, email, instansi)
     pretestSesi/aktif      satu dokumen: jadwal & token sesi berjalan
     pretestHasil/{auto}    nilai akhir tiap peserta

   Peserta tidak memakai akun Firebase sama sekali — mereka dikenali dari
   email yang diketik sendiri. Yang memakai Firebase Authentication hanya
   panitia: akunnya dibuat langsung di Firebase Console, dan Security Rules
   memberi izin menulis sesi berdasarkan email akun itu.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  const V = 'https://www.gstatic.com/firebasejs/12.0.0';
  const KUNCI_HASIL = 'pretest_hasil_v1';
  const KUNCI_AKUN  = 'pretest_akun_v1';
  const KUNCI_SESI  = 'pretest_sesi_dok_v1';

  const idAkun = (email) => String(email || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

  const DB = {
    mode: 'lokal',
    siap: false,
    _fs: null,
    _db: null,
    _auth: null,
    _authMod: null,

    async init() {
      if (this.siap) return this.mode;
      const cfg = window.FIREBASE_CONFIG || {};
      const daring = location.protocol === 'http:' || location.protocol === 'https:';
      if (cfg.apiKey && cfg.projectId && daring) {
        try {
          const [{ initializeApp }, fs, auth] = await Promise.all([
            import(`${V}/firebase-app.js`),
            import(`${V}/firebase-firestore.js`),
            import(`${V}/firebase-auth.js`)
          ]);
          const app = initializeApp(cfg);
          this._fs = fs;
          this._db = fs.getFirestore(app);
          this._authMod = auth;
          this._auth = auth.getAuth(app);
          this.mode = 'firebase';
        } catch (e) {
          console.warn('[data] Firebase gagal dimuat, beralih ke mode lokal:', e);
          this.mode = 'lokal';
        }
      }
      this.siap = true;
      return this.mode;
    },

    /* ── AKUN PANITIA (Firebase Authentication) ────────────────────
       Akunnya dibuat langsung di Firebase Console → Authentication →
       Users → Add user. Aplikasi hanya memakainya untuk masuk; tidak
       ada pendaftaran mandiri di sini. */

    async masukAdmin(email, sandi) {
      await this.init();
      if (this.mode !== 'firebase') {
        // Mode lokal dipakai untuk gladi bersih tanpa jaringan: tidak ada
        // yang bisa diperiksa, jadi pintunya dibuka apa adanya.
        return { email: email || 'admin lokal', lokal: true };
      }
      const kred = await this._authMod.signInWithEmailAndPassword(this._auth, email, sandi);
      return kred.user;
    },

    async keluarAdmin() {
      await this.init();
      if (this.mode === 'firebase' && this._auth) await this._authMod.signOut(this._auth);
    },

    // Memberi tahu saat keadaan masuk/keluar berubah, termasuk sesi yang
    // dipulihkan sendiri oleh Firebase sesudah halaman dimuat ulang.
    pantauAdmin(saatBerubah) {
      this.init().then(() => {
        if (this.mode !== 'firebase') { saatBerubah(null); return; }
        this._authMod.onAuthStateChanged(this._auth, saatBerubah);
      });
    },

    get koleksi() { return window.KOLEKSI_HASIL || 'pretestHasil'; },

    /* ── penyimpanan lokal ─────────────────────────────────────── */
    _baca(kunci, bawaan) {
      try { return JSON.parse(localStorage.getItem(kunci)) ?? bawaan; }
      catch { return bawaan; }
    },
    _tulis(kunci, nilai) { localStorage.setItem(kunci, JSON.stringify(nilai)); },

    /* ── AKUN PESERTA ──────────────────────────────────────────── */

    async ambilAkun(email) {
      await this.init();
      const id = idAkun(email);
      if (!id) return null;
      if (this.mode === 'firebase') {
        const { doc, getDoc } = this._fs;
        const cuplik = await getDoc(doc(this._db, 'pretestAkun', id));
        return cuplik.exists() ? { id, ...cuplik.data() } : null;
      }
      return this._baca(KUNCI_AKUN, {})[id] || null;
    },

    async simpanAkun(akun) {
      await this.init();
      const id = idAkun(akun.email);
      const isi = {
        nama: akun.nama,
        email: akun.email,
        emailKunci: String(akun.email).trim().toLowerCase(),
        instansi: akun.instansi,
        provinsi: akun.provinsi || '',
        jabatan: akun.jabatan || '',
        dibuat: akun.dibuat || new Date().toISOString()
      };
      if (this.mode === 'firebase') {
        const { doc, setDoc } = this._fs;
        await setDoc(doc(this._db, 'pretestAkun', id), isi, { merge: true });
      } else {
        const semua = this._baca(KUNCI_AKUN, {});
        semua[id] = isi;
        this._tulis(KUNCI_AKUN, semua);
      }
      return { id, ...isi };
    },

    async jumlahAkun() {
      await this.init();
      if (this.mode === 'firebase') {
        const { collection, getDocs } = this._fs;
        return (await getDocs(collection(this._db, 'pretestAkun'))).size;
      }
      return Object.keys(this._baca(KUNCI_AKUN, {})).length;
    },

    async ambilSemuaAkun() {
      await this.init();
      if (this.mode === 'firebase') {
        const { collection, getDocs } = this._fs;
        const snap = await getDocs(collection(this._db, 'pretestAkun'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      const semua = this._baca(KUNCI_AKUN, {});
      return Object.entries(semua).map(([id, a]) => ({ id, ...a }));
    },

    // Menghapus SELURUH akun peserta. Dipakai panitia untuk mengosongkan
    // daftar sebelum angkatan berikutnya; hasil ujian tidak ikut terhapus
    // kecuali diminta terpisah lewat hapusSemuaHasil().
    // Mengembalikan jumlah dokumen yang terhapus.
    async hapusSemuaAkun() {
      await this.init();
      if (this.mode === 'firebase') {
        const { collection, getDocs } = this._fs;
        const snap = await getDocs(collection(this._db, 'pretestAkun'));
        await this._hapusBanyak(snap.docs.map(d => d.ref));
        return snap.size;
      }
      const n = Object.keys(this._baca(KUNCI_AKUN, {})).length;
      localStorage.removeItem(KUNCI_AKUN);
      return n;
    },

    // Menghapus rekaman nilai. Bila sesiKode diisi, hanya sesi itu yang
    // dibersihkan; bila kosong, seluruh riwayat ikut terhapus.
    async hapusSemuaHasil(sesiKode) {
      await this.init();
      if (this.mode === 'firebase') {
        const { collection, getDocs } = this._fs;
        const snap = await getDocs(collection(this._db, this.koleksi));
        const sasaran = snap.docs.filter(d => !sesiKode || d.data().sesiKode === sesiKode);
        await this._hapusBanyak(sasaran.map(d => d.ref));
        return sasaran.length;
      }
      const semua = this._baca(KUNCI_HASIL, []);
      const sisa = sesiKode ? semua.filter(r => r.sesiKode !== sesiKode) : [];
      this._tulis(KUNCI_HASIL, sisa);
      return semua.length - sisa.length;
    },

    // Firestore membatasi satu batch pada 500 tulisan.
    async _hapusBanyak(refs) {
      const { writeBatch } = this._fs;
      for (let i = 0; i < refs.length; i += 400) {
        const batch = writeBatch(this._db);
        for (const ref of refs.slice(i, i + 400)) batch.delete(ref);
        await batch.commit();
      }
    },

    /* ── SESI UJIAN ────────────────────────────────────────────── */

    async ambilSesi() {
      await this.init();
      if (this.mode === 'firebase') {
        const { doc, getDoc } = this._fs;
        const cuplik = await getDoc(doc(this._db, 'pretestSesi', 'aktif'));
        return cuplik.exists() ? cuplik.data() : null;
      }
      return this._baca(KUNCI_SESI, null);
    },

    // Hanya panitia yang sudah masuk lewat Firebase Authentication yang
    // diizinkan aturan Firestore menulis dokumen ini.
    async simpanSesi(sesi) {
      await this.init();
      const isi = {
        kode: sesi.kode || 'sesi',
        jenis: sesi.jenis === 'post' ? 'post' : 'pre',
        judul: sesi.judul || '',
        token: sesi.token || '',
        mulai: sesi.mulai || null,
        selesai: sesi.selesai || null,
        jumlahSoal: Number(sesi.jumlahSoal) || 20,
        detikPerSoal: Number(sesi.detikPerSoal) || 30,
        poinCepat: sesi.poinCepat !== false,
        aktif: !!sesi.aktif,
        diubah: new Date().toISOString()
      };
      if (this.mode === 'firebase') {
        const { doc, setDoc } = this._fs;
        await setDoc(doc(this._db, 'pretestSesi', 'aktif'), isi);
      } else {
        this._tulis(KUNCI_SESI, isi);
      }
      return isi;
    },

    // Memantau perubahan sesi secara langsung (lobi peserta & papan admin).
    pantauSesi(saatBerubah) {
      let hidup = true;
      this.init().then(() => {
        if (!hidup) return;
        if (this.mode === 'firebase') {
          const { doc, onSnapshot } = this._fs;
          this._lepasSesi = onSnapshot(doc(this._db, 'pretestSesi', 'aktif'),
            c => saatBerubah(c.exists() ? c.data() : null),
            e => console.warn('[data] pantau sesi gagal:', e));
        } else {
          const tik = () => saatBerubah(this._baca(KUNCI_SESI, null));
          tik();
          this._jamSesi = setInterval(tik, 2000);
        }
      });
      return () => {
        hidup = false;
        if (this._lepasSesi) { this._lepasSesi(); this._lepasSesi = null; }
        if (this._jamSesi) { clearInterval(this._jamSesi); this._jamSesi = null; }
      };
    },

    /* ── HASIL ─────────────────────────────────────────────────── */

    async simpan(rec) {
      await this.init();
      if (this.mode === 'firebase') {
        const { collection, addDoc, serverTimestamp } = this._fs;
        const ref = await addDoc(collection(this._db, this.koleksi), {
          ...rec, dibuat: serverTimestamp()
        });
        return ref.id;
      }
      const arr = this._baca(KUNCI_HASIL, []);
      const id = 'lok-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
      arr.push({ id, ...rec });
      this._tulis(KUNCI_HASIL, arr);
      return id;
    },

    async ambilSemua() {
      await this.init();
      if (this.mode === 'firebase') {
        const { collection, getDocs } = this._fs;
        const snap = await getDocs(collection(this._db, this.koleksi));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      return this._baca(KUNCI_HASIL, []);
    },

    // Papan peringkat langsung: dipakai Ruang Admin dan halaman peringkat.
    pantauHasil(saatBerubah) {
      let hidup = true;
      this.init().then(() => {
        if (!hidup) return;
        if (this.mode === 'firebase') {
          const { collection, onSnapshot } = this._fs;
          this._lepasHasil = onSnapshot(collection(this._db, this.koleksi),
            snap => saatBerubah(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            e => console.warn('[data] pantau hasil gagal:', e));
        } else {
          const tik = () => saatBerubah(this._baca(KUNCI_HASIL, []));
          tik();
          this._jamHasil = setInterval(tik, 2000);
        }
      });
      return () => {
        hidup = false;
        if (this._lepasHasil) { this._lepasHasil(); this._lepasHasil = null; }
        if (this._jamHasil) { clearInterval(this._jamHasil); this._jamHasil = null; }
      };
    },

    // Satu email hanya boleh sekali per sesi DAN per jenis tes: peserta yang
    // sudah mengerjakan pre-test tetap boleh mengerjakan post-test walaupun
    // kode sesinya tidak diganti panitia.
    async emailSudahIkut(email, sesiKode, jenisTes) {
      await this.init();
      const kunci = String(email || '').trim().toLowerCase();
      if (!kunci) return false;
      const jenis = jenisTes === 'post' ? 'post' : 'pre';
      const cocok = (r) =>
        (r.emailKunci || '') === kunci &&
        (!sesiKode || r.sesiKode === sesiKode) &&
        ((r.jenisTes || 'pre') === jenis);

      if (this.mode === 'firebase') {
        // Disaring di sisi klien: satu email hanya punya segelintir rekaman,
        // dan cara ini tidak menuntut indeks gabungan di Firestore.
        const { collection, query, where, getDocs } = this._fs;
        const snap = await getDocs(query(collection(this._db, this.koleksi),
          where('emailKunci', '==', kunci)));
        return snap.docs.some(d => cocok(d.data()));
      }
      return this._baca(KUNCI_HASIL, []).some(cocok);
    },

    // Menghapus satu rekaman nilai. Aturan Firestore hanya mengizinkannya
    // untuk panitia yang sudah masuk — dipakai membersihkan data uji coba
    // atau peserta yang salah daftar.
    async hapusHasil(id) {
      await this.init();
      if (this.mode === 'firebase') {
        const { doc, deleteDoc } = this._fs;
        await deleteDoc(doc(this._db, this.koleksi, id));
        return;
      }
      this._tulis(KUNCI_HASIL, this._baca(KUNCI_HASIL, []).filter(r => r.id !== id));
    },

    kosongkanLokal() {
      localStorage.removeItem(KUNCI_HASIL);
      localStorage.removeItem(KUNCI_SESI);
    }
  };

  window.DB = DB;
})();
