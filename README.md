# NetSim — Simulasi & Konfigurasi Jaringan

> 🌐 **Live di [https://netsim.rakasyau.my.id](https://netsim.rakasyau.my.id)**

**NetSim** adalah aplikasi web simulator topologi jaringan yang berjalan langsung di browser. Kamu bisa membangun topologi jaringan secara visual — router, switch, server, PC, dan perangkat lainnya — lalu mengonfigurasinya dengan script CLI sungguhan (RouterOS, Cisco IOS, netplan) dan dibantu AI. Cocok untuk belajar jaringan, latihan konfigurasi, atau sekadar eksperimen topologi tanpa perlu perangkat fisik.

Tanpa instalasi: cukup buka situsnya, daftar akun gratis, dan mulai membangun jaringan pertamamu.

---

## Fitur Utama

### 🖥️ Editor Topologi Visual
- **9 tipe perangkat**: Router Mikrotik (RB4011), Switch Cisco (2960), Server Linux (Ubuntu 24.04), PC, Laptop, Access Point, Firewall (CCR2004), Cloud/Internet, dan Printer.
- Seret & lepas perangkat dari library ke kanvas, sambungkan dengan kabel, geser, zoom, dan pan dengan bebas (snap grid, minimap).
- Hostname perangkat otomatis (RB-1, RB-2, …) — tinggal atur IP tiap interface.
- Auto-save, undo/redo (Ctrl+Z / Ctrl+Y), hapus cepat (Del).

### ⚙️ Konfigurasi Perangkat
- Template cepat: **DHCP Server**, **NAT Masquerade**, **OSPF Single Area**, **Static Route**, dan **VLAN di Bridge** — sekali klik, script siap.
- Editor script RouterOS dengan linting sintaks (`Ctrl+Enter` untuk menyimpan).
- Validasi otomatis: mendeteksi masalah seperti interface tanpa IP dan menampilkan ringkasannya langsung di panel.

### 🤖 AI Assistant (Google Gemini)
- **Chat AI**: tanya konsep jaringan apa pun dengan konteks topologi yang sedang kamu kerjakan.
- **Buat Topologi**: deskripsikan jaringanmu, AI menyusun topologinya.
- **Generate Config**: buat script CLI (RouterOS / Cisco IOS / netplan) untuk tiap perangkat sesuai vendor & IP yang sudah diatur.
- Kuota AI harian (20 permintaan) dengan indikator sisa kuota.

### 📁 Manajemen Proyek
- Dashboard ringkasan: jumlah proyek, perangkat tersimpan, aktivitas terakhir, dan pencarian proyek.
- Status proyek (Draft / Selesai / Dibagikan), filter vendor, duplikat, dan hapus proyek.

### 📤 Ekspor
- **PNG** — gambar topologi, **ZIP** — kumpulan script konfigurasi, **JSON** — data topologi.

### 🔐 Akun
- Registrasi gratis (nama, email, institusi). Email bersifat tetap; profil bisa diperbarui kapan saja.

---

## Cara Menggunakan

1. Buka [netsim.rakasyau.my.id](https://netsim.rakasyau.my.id) dan **daftar** akun gratis.
2. Dari dashboard, klik **Buat Proyek** — beri nama dan deskripsi, lalu buka editor.
3. **Seret perangkat** dari library ke kanvas dan sambungkan antar perangkat.
4. Atur IP di panel properti, atau pakai template config / AI untuk membuat script.
5. Simpan otomatis setiap perubahan — ekspor topologi & config kapan pun dibutuhkan.

---

## Teknologi

Dibangun dengan **Next.js 16** (App Router), **React 19**, **Tailwind CSS 4**, dan **React Flow** untuk kanvas editor. Data disimpan di **MongoDB Atlas**, autentikasi memakai **NextAuth v5** (JWT), dan fitur AI ditenagai **Google Gemini**. Di-deploy di **Vercel** dengan domain & DNS melalui **Cloudflare**.

---

## Tautan

- 🌐 Website: [https://netsim.rakasyau.my.id](https://netsim.rakasyau.my.id)
- 📦 Repositori: [github.com/rakasyau/NetSim](https://github.com/rakasyau/NetSim)
