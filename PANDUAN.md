# Panduan Memasang Web Kas Kelas (step by step)

Isi folder:

```
kas-kelas/
├─ index.html      halaman utama
├─ style.css       tampilan (liquid glass putih-hijau)
├─ app.js          logika web
├─ config.js       <-- tempat menempel URL Apps Script
├─ sw.js           service worker (cepat + bisa offline)
├─ manifest.json   supaya bisa dipasang seperti aplikasi / jadi APK
├─ Code.gs         kode Google Apps Script (dipakai di langkah 2)
└─ img/            ikon buku, latar menu, latar pembuka
```

## Langkah 0 — Coba dulu (mode demo)
Buka `index.html` lewat server lokal atau langsung upload (langkah 4). Selama `API_URL` di `config.js`
masih kosong, web jalan dalam mode demo **kosong (tanpa data apa pun)** dan PIN admin demo **1234**. Cocok buat lihat-lihat
sebelum disambung ke spreadsheet.

## Langkah 1 — Buat Google Spreadsheet
1. Buka <https://sheets.google.com> → **Kosong (Blank)**.
2. Beri nama, misalnya **Kas Kelas 8B**.

## Langkah 2 — Pasang kode Apps Script (ini yang membuat spreadsheet otomatis)
1. Di spreadsheet: menu **Ekstensi → Apps Script**.
2. Hapus semua isi `Code.gs` bawaan, lalu **tempel seluruh isi file `Code.gs`** dari folder ini.
3. Cari baris `const PIN_AWAL = '123456';` di paling atas, **ganti PIN-nya** (ini PIN admin Kucay).
4. Klik ikon 💾 **Simpan**.
5. Di dropdown fungsi (atas editor) pilih **`setup`** lalu klik **▶ Jalankan**.
6. Muncul izin akses: **Tinjau izin → pilih akun → Lanjutan → Buka proyek (tidak aman) → Izinkan**.
   (Aman, karena skripnya milikmu sendiri.)
7. Kembali ke spreadsheet. Sekarang ada 6 sheet:
   - **Kas** — tabel centang per minggu (M1–M4 tiap bulan), gaya seperti gambar 3
   - **Siswa** — masih kosong. Isi 32 nama lewat web: login admin → **Menu Admin → Tambah siswa** (otomatis masuk ke sheet ini).
   - **Transaksi** — semua uang masuk/keluar
   - **Pengumuman**, **Pengaturan**, **Rangkuman** (total + grafik per bulan)

## Langkah 3 — Jadikan Web App & ambil URL-nya
1. Di Apps Script: **Terapkan (Deploy) → Penerapan baru (New deployment)**.
2. Klik ikon ⚙ → pilih **Aplikasi web (Web app)**.
3. **Jalankan sebagai: Saya** · **Siapa yang punya akses: Siapa saja (Anyone)**.
4. Klik **Terapkan**, lalu **salin URL** yang berakhiran `/exec`.
5. Buka `config.js`, tempel di sini:
   ```js
   window.KAS_CONFIG = { API_URL: "https://script.google.com/macros/s/XXXX/exec" };
   ```
> Kalau nanti kamu mengubah `Code.gs`, deploy ulang: **Terapkan → Kelola penerapan → ✏ → Versi: Baru → Terapkan**. URL tetap sama.

## Langkah 4 — Taruh web di internet (pilih salah satu)
**A. Netlify Drop (paling mudah, tanpa akun ribet)**
1. Buka <https://app.netlify.com/drop>.
2. Seret **seluruh folder `kas-kelas`** ke halaman itu. Selesai, kamu dapat link.

**B. GitHub Pages (kayak web kelas kamu sebelumnya)**
1. Buat repository baru → **Add file → Upload files** → upload semua isi folder (termasuk folder `img`).
2. **Settings → Pages → Branch: main / (root) → Save**.
3. Tunggu 1–2 menit, link: `https://username.github.io/nama-repo/`.

## Langkah 5 — Isi data awal (sebagai admin)
1. Buka web → **Menu → Masuk Admin** → masukkan PIN dari langkah 2.
2. **Menu → Pengaturan**: isi nama kelas, kas per minggu (5000), bulan mulai kas, **WhatsApp Kucay** (format `628123…`), dan link spreadsheet.
3. **Bayar Kas → Unggah QR**: pilih foto QRIS Kucay (otomatis dikecilkan).
4. **Pengumuman**: tombol "Buat pengumuman".

## Cara pakai sehari-hari
- **Siswa bayar** → scan QRIS → kirim bukti ke Kucay lewat tombol WhatsApp di halaman *Bayar Kas*.
- **Kucay**: buka *Siswa* → ketuk nama → ketuk kotak minggu yang dibayar (atau *Tandai lunas minggu ini*). Saldo & riwayat otomatis bertambah dan spreadsheet ikut terisi.
- Mencentang langsung di spreadsheet juga berfungsi dua arah (transaksi otomatis tercatat).
- Tombol **+** (hanya admin) = catat pengeluaran/pemasukan lain (misal beli spidol).
- Tombol *Ingatkan via WA* di detail siswa mengirim pesan pengingat; di *Rangkuman* ada **Salin pesan pengingat grup**.

## Notifikasi di HP
Di web: **Menu → Aku siapa?** (pilih nama) → **Pengingat** → izinkan notifikasi.
Setiap kali web dibuka dan kas kamu belum lunas, muncul notifikasi + banner peringatan.
> Catatan jujur: notifikasi yang masuk sendiri saat web **tertutup** butuh server push khusus yang tidak tersedia di Google Apps Script gratis. Sebagai gantinya ada tombol *Ingatkan via WA* untuk admin.

## Jadi APK
**Cara cepat (tanpa APK):** buka web di Chrome Android → ⋮ → **Instal aplikasi**. Jadi ikon di layar utama, tampil layar penuh (ini sebenarnya sudah WebAPK).
**Cara mau file .apk:**
1. Pastikan web sudah online (langkah 4, harus `https`).
2. Buka <https://www.pwabuilder.com> → tempel link webmu → **Start**.
3. Klik **Package for stores → Android** → **Generate**.
4. Unduh zip, di dalamnya ada file `.apk` → kirim ke teman kelas untuk diinstal (aktifkan "izinkan dari sumber tidak dikenal").

## Kalau ada masalah
| Gejala | Solusi |
|---|---|
| Tampil "Tidak bisa terhubung" | Cek `API_URL` benar & berakhiran `/exec`; akses web app harus **Siapa saja** |
| PIN salah | PIN ada di Apps Script → ⚙ Setelan proyek → Properti skrip → `PIN` |
| Setelah ubah `Code.gs` tidak berubah | Deploy ulang dengan **Versi: Baru** |
| Data lama masih muncul | Tarik/ketuk tombol 🔄 di pojok atas |
| Mau reset total | Jalankan `setup` lagi (menimpa sheet Pengaturan/Siswa/Transaksi/Pengumuman) |
