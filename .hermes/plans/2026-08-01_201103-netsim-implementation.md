# NetSim — Rencana Implementasi Bertahap

> **Untuk Hermes:** implementasikan task-by-task sesuai plan ini. UI text (menu, tombol, label) wajib Bahasa Indonesia.

**Goal:** Membangun NetSim — platform web simulasi & konfigurasi topologi jaringan berbasis AI (MVP sesuai PRD v1.0).

**Arsitektur:** Next.js (App Router) + TypeScript monolith — API Routes untuk backend (auth, CRUD proyek, proxy Gemini), React Flow untuk canvas editor, MongoDB Atlas via Mongoose. AI dipanggil dari server (API key tidak pernah ke client).

**Tech Stack:** Next.js 15 (App Router) + TypeScript · Tailwind CSS + shadcn/ui · React Flow (XYFlow) · Mongoose + MongoDB Atlas · NextAuth v5 (Auth.js, credentials + JWT) · Gemini API (backend proxy) · Vercel (deploy)

**Bahan acuan (sudah dibaca):**
- `bahan/PRD_NetSim_Topology_Builder.md` — spesifikasi produk & skema
- `bahan/gemini_prompt_engineering.md` — 3 system prompt + contoh kode API
- `bahan/netsim_editor_mockup.html` — mockup editor (jadi acuan UI editor)
- `bahan/skema mongoose/*.js` — User, Project, ActivityLog, index.js
- `bahan/KEY.txt` — MONGODB_URI & GEMINI_API_KEY (rahasia → .env saja, jangan commit)

---

## ⚠️ Catatan Kritis Sebelum Mulai

1. **Kredensial — SUDAH TERVERIFIKASI (1 Agu 2026)**: `KEY.txt` berisi MONGODB_URI & GEMINI_API_KEY yang valid & lengkap. Uji langsung: MongoDB ping OK (cluster punya DB `kampus_blog`, `netmind_db`, dll); Gemini auth OK (50 model). Tampilan `***` di read_file hanyalah masking Hermes — isi file asli lengkap.
2. **.env & .gitignore**: wajib dibuat di Fase 0; `KEY.txt` dan `.env*` tidak boleh masuk git.
3. **Model Gemini — TERVERIFIKASI (update 1 Agu 2026)**: `gemini-3.6-flash` (di PRD) SEKARANG SUDAH TERSEDIA di akun — terverifikasi via API (list models). Pakai **`gemini-3.6-flash`** sesuai PRD. (Sebelumnya sempat tidak ada — saat itu fallback ke `gemini-2.5-flash`; sekarang sudah muncul di daftar model.)
4. **UI Bahasa Indonesia** untuk semua teks antarmuka (kode/props tetap Inggris).

## ✅ Keputusan User (1 Agu 2026)

- **Auth**: email-password saja (tanpa Google OAuth; `authProvider` di model tetap didukung bila mau ditambah nanti).
- **Domain deploy**: `netsim.rakasyau.my.id` (zone Cloudflare rakasyau.my.id).
- **Repo GitHub**: bikin baru `rakasyau/NetSim`.

---

## Fase 0 — Setup & Fondasi Proyek

**Objektif:** Project Next.js berjalan lokal, struktur folder rapi, env aman.

**Files:**
- Init: `NetSim/` → `npx create-next-app@latest .` (TypeScript, Tailwind, App Router, ESLint, `src/` dir)
- Create: `src/lib/db.ts` (koneksi Mongoose, port dari `bahan/skema mongoose/index.js`)
- Create: `src/models/User.ts`, `src/models/Project.ts`, `src/models/ActivityLog.ts` (terjemahan TypeScript dari `bahan/skema mongoose/`)
- Create: `.env.local` (dari KEY.txt + password asli dari user), `.env.example`
- Create: `.gitignore` (tambah `.env*`, `KEY.txt`), `git init` + commit pertama

**Steps:**
1. Scaffold Next.js + install deps: `npm i mongoose bcryptjs zod` + `npx shadcn@latest init`.
2. Salin skema Mongoose JS → TypeScript (jaga field/enum persis sama; `ProjectSchema.methods.findDuplicateIPs` & `createVersionSnapshot` ikut diterjemahkan).
3. Buat `src/lib/db.ts` dengan global-cache pattern (dari `index.js`) + helper `crypto.ts` untuk hash token.
4. Isi `.env.local` (minta MONGODB password asli ke user), `.env.example` (placeholder).
5. `git init`, commit `chore: init next.js + mongoose schemas`.

**Verifikasi:**
- `npm run dev` → halaman default Next.js tampil tanpa error.
- Koneksi DB teruji: jalankan script kecil `node -e` (via `tsx`) yang panggil `connectDB()` → sukses konek ke Atlas.

---

## Fase 1 — Autentikasi (Register / Login / Session)

**Objektif:** User bisa daftar, login, dan session terlindungi (NextAuth credentials + JWT).

**Files:**
- Create: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx` (UI dark theme, Bahasa Indonesia)
- Create: `src/app/api/auth/[...nextauth]/route.ts` (NextAuth v5 config)
- Create: `src/lib/auth.ts` (auth options: credentials provider, bcrypt compare, JWT strategy)
- Create: `src/app/api/register/route.ts` (validasi zod, hash bcrypt, buat User, log `login`/aktivitas)
- Modify: `src/middleware.ts` (proteksi route `/dashboard`, `/editor`)

**Steps:**
1. Implement `lib/auth.ts` — credentials provider cek `comparePassword` (sudah ada di model User).
2. Register API — validasi email format + password min 8, cek duplikat email, hash, simpan.
3. Halaman login/register — dark theme (accent `#C6FF3D` dari mockup), validasi client-side, redirect ke `/dashboard` setelah sukses.
4. Middleware — route yang butuh login diarahkan ke `/login`.
5. Halaman profil sederhana (`/dashboard/settings`) — tampil nama/email/institusi, ganti nama.

**Verifikasi:**
- Register user baru → muncul di MongoDB (cek via Compass/`mongosh` atau API).
- Login benar → redirect ke dashboard; password salah → error.
- Akses `/dashboard` tanpa login → redirect ke `/login`.
- `passwordHash` tidak pernah muncul di response JSON.

---

## Fase 2 — CRUD Proyek + Dashboard

**Objektif:** Dashboard list proyek + buat/buka/edit/hapus proyek (soft delete), sesuai PRD §5.4 & §5.6.

**Files:**
- Create: `src/app/api/projects/route.ts` (GET list milik user, POST create)
- Create: `src/app/api/projects/[id]/route.ts` (GET/PUT/DELETE — ownership check + soft delete)
- Create: `src/app/api/projects/[id]/duplicate/route.ts`
- Create: `src/app/dashboard/page.tsx` (stat cards: Total Proyek, Proyek Aktif, Terakhir Diedit; list proyek + badge status Draft/Completed/Shared; search & filter by nama/tag; tombol "Buat Proyek" & "Generate dengan AI")
- Create: `src/components/project-card.tsx`, `src/components/status-badge.tsx`, `src/components/create-project-dialog.tsx`
- Modify: `src/models/Project.ts` (tambah `softDelete()`, `duplicate()`, `findDuplicateIPs()` dipakai di Fase 3)

**Steps:**
1. API CRUD dengan ownership check (`ownerId === session.user.id`), return 404 kalau bukan pemilik.
2. Soft delete: set `deletedAt`, list hanya tampilkan `deletedAt: null`; trash 30 hari → cron/handler bersihkan.
3. Dashboard UI mengikuti referensi: card metrics di atas, tabel/list proyek dengan status badge, search & filter client-side (awal) → server-side (lanjut).
4. Duplicate proyek: clone document baru dengan nama "… (Salinan)".

**Verifikasi:**
- Buat 3 proyek via UI → muncul di dashboard dengan thumbnail placeholder.
- Edit nama/deskripsi → tersimpan & tampil benar.
- Hapus → hilang dari list, tapi masih ada di DB (`deletedAt` terisi).
- Proyek user lain tidak bisa diakses (cek dengan 2 akun).

---

## Fase 3 — Topology Builder (Editor Canvas)

**Objektif:** Editor drag-and-drop topologi berfungsi penuh — fondasi dari `netsim_editor_mockup.html` jadi komponen React + React Flow.

**Files:**
- Create: `src/app/editor/[id]/page.tsx` (layout editor: rail sidebar + topbar + toolbelt + canvas + panel kanan)
- Create: `src/components/editor/toolbelt.tsx` (palet perangkat: Router Mikrotik/Cisco, Switch, Server Linux, PC, Laptop, AP, Firewall, Cloud, Printer)
- Create: `src/components/editor/topology-canvas.tsx` (React Flow: drag-drop node, kabel, zoom/pan, snap-to-grid, mini-map, undo/redo via `@xyflow/react` hooks)
- Create: `src/components/editor/property-panel.tsx` (panel kanan tab Properti: nama, hostname, vendor, OS, interfaces, IP, VLAN)
- Create: `src/components/editor/node-card.tsx` (custom node render — ikuti gaya mockup: icon vendor berwarna, sub-info mono)
- Create: `src/lib/topology-validation.ts` (validasi: IP duplikat, subnet invalid, interface belum terhubung, node tanpa hostname)
- Create: `src/app/api/projects/[id]/thumbnail/route.ts` (generate preview PNG via html-to-image, simpan ke `thumbnailUrl`)

**Steps:**
1. Install `@xyflow/react` + `html-to-image`. Buat canvas dasar: load topology dari API, render node/edge.
2. Custom node `node-card.tsx` — porting styling mockup (dark, rounded 12px, icon vendor 2-huruf: MK/CS/LX/PC, warna vendor: mikrotik `#E8734A`, cisco `#4AA8E8`, linux `#B08CFF`).
3. Drag dari toolbelt → drop ke canvas (pake drag data transfer / React Flow `onDrop`). Kabel: klik interface → tarik ke target interface.
4. Property panel: klik node → form terisi; edit hostname/IP/interface tersimpan ke state; panel kanan ada tab Properti & (placeholder) AI Assistant.
5. Auto-save (debounce 2s) PUT ke API; status pill "Tersimpan otomatis" di topbar.
6. Validasi dasar jalan otomatis — tampilkan warning list (mis. badge merah di panel kiri bawah).
7. Undo/redo + keyboard shortcuts (Ctrl+Z/Y, Del hapus, Ctrl+C/V duplikat).

**Verifikasi:**
- Drag 5 perangkat dari toolbelt → semua muncul di canvas, bisa dipindah & snap grid.
- Hubungkan kabel antar node → garis tampil dengan penanda interface.
- Klik node → property panel terisi → edit IP → auto-save → reload halaman → data tetap.
- Topologi dengan 2 node ber-IP sama → muncul warning "IP konflik".
- Export PNG (tombol di topbar) → file terdownload.

---

## Fase 4 — AI Assistant (Gemini)

**Objektif:** Chat AI 3 mode berfungsi end-to-end (generate topology, generate config, tanya jawab) — implementasi `bahan/gemini_prompt_engineering.md`.

**Files:**
- Create: `src/lib/gemini.ts` (client server-side: panggil `generateContent`, parse JSON, error handling; **model: `gemini-3.6-flash`** — sesuai PRD, sudah diverifikasi tersedia di akun)
- Create: `src/lib/prompts/topology.ts`, `src/lib/prompts/config.ts`, `src/lib/prompts/explain.ts` (tiga system prompt, salin dari `gemini_prompt_engineering.md` §2–4)
- Create: `src/app/api/ai/generate-topology/route.ts` (Mode 1: prompt → JSON topology → validasi server → return)
- Create: `src/app/api/ai/generate-config/route.ts` (Mode 2: kirim nodes+edges → config per node → linting)
- Create: `src/app/api/ai/chat/route.ts` (Mode 3: tanya jawab, markdown biasa)
- Create: `src/components/editor/ai-panel.tsx` (chat UI dari mockup: avatar, bubble, preview config, tombol **Terapkan ke Canvas** / **Tolak**, streaming)
- Create: `src/lib/rate-limit.ts` (20 request/user/hari + cache hash prompt 24 jam)
- Modify: `src/app/api/projects/[id]/route.ts` (simpan `aiChatHistory` per pesan, `actionType` & `applied` flag)

**Steps:**
1. Implement `lib/gemini.ts`: pakai model `gemini-2.5-flash` (terverifikasi); `responseMimeType: application/json`, temperature per mode (0.4/0.2/0.7 — tabel di bahan §7).
3. Mode 1: user ketik deskripsi → render preview topology di canvas (node abu-abu = draft) → tombol "Terapkan ke Canvas" mereset node menjadi final & simpan.
4. Mode 2: tombol "Generate Config" di topbar → kirim topology → tampilkan config per node di tab Properti + panel AI; linting server (cek `nodeId` valid, aturan dasar per vendor dari bahan §6) → badge "Perlu Ditinjau" jika gagal.
5. Mode 3: chat bebas, riwayat per proyek tersimpan.
6. Rate limiting + log ke ActivityLog (`ai_generated_topology` / `ai_generated_config`).

**Verifikasi:**
- Prompt: "buatkan topologi kantor kecil: 1 router Mikrotik gateway, 2 switch Cisco VLAN HR & IT, masing-masing 2 PC, 1 server Linux DHCP" → node+edge muncul di canvas sesuai.
- "Generate Config" pada topologi manual → tiap router/switch/server dapat script sintaks vendor benar; PC/Laptop script kosong.
- Prompt di luar topik / minta config hacking → JSON `{nodes:[],edges:[],error:…}` / tolak sopan.
- API key tidak bocor ke client (cek network tab: request AI ke `/api/ai/*`, bukan ke Google).

---

## Fase 5 — Config Editor, Template & Export

**Objektif:** Konfigurasi per perangkat bisa diedit manual + template siap pakai + export ZIP/PNG/JSON (PRD §5.3).

**Files:**
- Create: `src/components/editor/config-editor.tsx` (textarea + syntax highlighting dasar per vendor — pakai `prism-react-renderer` atau code mirror ringan; shortcut Ctrl+Enter validasi)
- Create: `src/lib/templates.ts` (template: VLAN, OSPF, BGP, static route, NAT, firewall filter, DHCP server, VPLS/MPLS dasar — per vendor)
- Create: `src/lib/linters.ts` (linting dasar: RouterOS mulai `/`, Cisco mode balance, netplan YAML valid)
- Create: `src/app/api/projects/[id]/configs/route.ts` (PUT config per node; `generatedBy: user|ai`)
- Create: `src/app/api/projects/[id]/export/route.ts` (ZIP: semua config `.rsc`/`.txt`/`.yaml` + `topology.json`; pakai `archiver`/`jszip`)
- Create: `src/app/api/projects/[id]/export-png/route.ts` (PNG dari canvas — `html-to-image` server-render atau client-side capture)

**Steps:**
1. Config editor dengan highlight per vendor + tombol "Simpan" (PUT ke `/configs`).
2. Template gallery di panel: pilih template → apply ke node terpilih (isi script, user tinggal edit).
3. Export ZIP + JSON; export PNG per node/keseluruhan.
4. Tombol "Export" di topbar editor (dari mockup) → dropdown pilihan format.

**Verifikasi:**
- Edit config SW-HR → save → reload → tersimpan.
- Template OSPF di-apply ke router → script terisi lengkap.
- Export ZIP → berisi file per perangkat dengan ekstensi benar (.rsc, .txt, .yaml) + topology.json.
- Export PNG → gambar topologi terlihat jelas.

---

## Fase 6 — Polish, Testing & Deploy

**Objektif:** Siap rilis MVP ke Vercel + MongoDB Atlas.

**Files:**
- Create: `src/app/page.tsx` (landing sederhana → redirect/login), `src/app/(marketing)/…` opsional
- Modify: SEO meta, favicon, `vercel.json` (jika perlu), error pages (`error.tsx`, `not-found.tsx`)
- Create: `tests/` (unit: validasi topologi, linter, rate limit; e2e dasar: login → buat proyek → drag node)
- Modify: `.env.production` (nilai prod, di Vercel dashboard)

**Steps:**
1. Polish UI: empty states (belum punya proyek), loading skeletons, error toast, responsive (canvas → mode view-only di HP sesuai PRD §9).
2. Unit tests (Vitest) untuk `topology-validation`, `linters`, `templates`, `rate-limit`.
3. E2E smoke (Playwright opsional): register → login → buat proyek → drag node → save.
4. Deploy: push ke GitHub (repo `rakasyau/NetSim`), import ke Vercel, set env vars (MONGODB_URI, GEMINI_API_KEY, NEXTAUTH_SECRET/AUTH_SECRET), `vercel --prod`.
5. Sanity check di produksi: register, buat proyek, AI generate, export.

**Verifikasi:**
- `npm run test` → semua pass.
- `vercel --prod` sukses → domain aktif; cek seluruh alur utama di browser dari domain produksi.
- `KEY.txt` TIDAK ada di repo GitHub (cek `git ls-files`).

---

## Urutan & Dependensi

```
Fase 0 (fondasi) → Fase 1 (auth) → Fase 2 (CRUD+dashboard)
                        ↓
              Fase 3 (editor canvas)
                   ↓        ↓
              Fase 4 (AI)  Fase 5 (config/export)
                   ↓        ↓
              Fase 6 (polish + deploy)
```

Fase 3 & 4 bisa dijalankan berurutan ketat (AI butuh canvas untuk preview); Fase 5 paralel dengan 4.

## Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Model `gemini-3.6-flash` (PRD) | ✅ Teratasi: tersedia di akun, terverifikasi via API |
| AI output config salah sintaks | Linting server + badge "Perlu Ditinjau" (sudah di plan) |
| Biaya API membengkak | Rate limit 20/user/hari + cache prompt identik |
| Canvas lambat di topologi besar | Batasi node MVP (~100), React Flow sudah optimized |

## Open Questions — ✅ SEMUA SUDAH DIJAWAB (1 Agu 2026)

1. ~~Password MongoDB Atlas asli?~~ → Sudah ada di KEY.txt, terverifikasi konek.
2. ~~Domain deploy?~~ → `netsim.rakasyau.my.id`.
3. ~~Google OAuth?~~ → Tidak, email-password saja.
4. ~~Repo GitHub?~~ → Baru: `rakasyau/NetSim`.

---

**Langkah berikutnya:** eksekusi Fase 0 (scaffold + env). Ready kapan saja.
