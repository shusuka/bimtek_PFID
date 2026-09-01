/* ══════════════════════════════════════════════════════════════════
   LAPISAN DATA
   Satu pintu untuk menyimpan dan membaca hasil pre-test.

   Dua mode, dipilih otomatis:
     • firebase — konfigurasi terisi dan halaman dibuka lewat http(s)
     • lokal    — selain itu; data mengendap di localStorage peramban
                  perangkat ini saja, cocok untuk uji coba tanpa jaringan
   ══════════════════════════════════════════════════════════════════ */
(function () {
  const V = 'https://www.gstatic.com/firebasejs/12.0.0';
  const KUNCI_LOKAL = 'pretest_hasil_v1';

  const DB = {
    mode: 'lokal',
    siap: false,
    _fs: null,
    _db: null,

    async init() {
      if (this.siap) return this.mode;
      const cfg = window.FIREBASE_CONFIG || {};
      const daring = location.protocol === 'http:' || location.protocol === 'https:';
      if (cfg.apiKey && cfg.projectId && daring) {
        try {
          const [{ initializeApp }, fs] = await Promise.all([
            import(`${V}/firebase-app.js`),
            import(`${V}/firebase-firestore.js`)
          ]);
          const app = initializeApp(cfg);
          this._fs = fs;
          this._db = fs.getFirestore(app);
          this.mode = 'firebase';
        } catch (e) {
          console.warn('[data] Firebase gagal dimuat, beralih ke mode lokal:', e);
          this.mode = 'lokal';
        }
      }
      this.siap = true;
      return this.mode;
    },

    get koleksi() { return window.KOLEKSI_HASIL || 'pretestHasil'; },

    // ── mode lokal ───────────────────────────────────────────────────
    _bacaLokal() {
      try { return JSON.parse(localStorage.getItem(KUNCI_LOKAL) || '[]'); }
      catch { return []; }
    },
    _tulisLokal(arr) {
      localStorage.setItem(KUNCI_LOKAL, JSON.stringify(arr));
    },

    // ── simpan satu hasil ────────────────────────────────────────────
    async simpan(rec) {
      await this.init();
      if (this.mode === 'firebase') {
        const { collection, addDoc, serverTimestamp } = this._fs;
        const ref = await addDoc(collection(this._db, this.koleksi), {
          ...rec, dibuat: serverTimestamp()
        });
        return ref.id;
      }
      const arr = this._bacaLokal();
      const id = 'lok-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
      arr.push({ id, ...rec });
      this._tulisLokal(arr);
      return id;
    },

    // ── ambil seluruh hasil (untuk peringkat & admin) ────────────────
    async ambilSemua() {
      await this.init();
      if (this.mode === 'firebase') {
        const { collection, getDocs } = this._fs;
        const snap = await getDocs(collection(this._db, this.koleksi));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      return this._bacaLokal();
    },

    // ── satu email hanya boleh sekali ikut ───────────────────────────
    async emailSudahIkut(email) {
      await this.init();
      const kunci = String(email || '').trim().toLowerCase();
      if (!kunci) return false;
      if (this.mode === 'firebase') {
        const { collection, query, where, limit, getDocs } = this._fs;
        const q = query(collection(this._db, this.koleksi),
          where('emailKunci', '==', kunci), limit(1));
        const snap = await getDocs(q);
        return !snap.empty;
      }
      return this._bacaLokal().some(r => (r.emailKunci || '') === kunci);
    },

    // ── hanya dipakai tombol "Bersihkan data uji coba" di mode lokal ─
    kosongkanLokal() { localStorage.removeItem(KUNCI_LOKAL); }
  };

  window.DB = DB;
})();
