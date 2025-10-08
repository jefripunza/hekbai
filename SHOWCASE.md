# 🔥 Assalamualaikum, Halo Pak Dhika dan teman-teman semua!

- Perkenalan, saya **Jefri Herdi Triyanto**. Sudah lama tidak ikut showcase terakhir ketemu di acara GDE Jogja kemaren hehee, Hari ini saya ingin memamerkan **HEKBAI** project saya yang kemarin telah rilis.
• **Description** : ini adalah project untuk sekedar edukasi terhadap XSS (Cross Site Scripting) dan Web Attack Simulation Framework
• **Note** : ini adalah project yang dibuat untuk sekedar edukasi dan penelitian, jadi jangan sampai terlalu sering digunakan untuk serangan yang tidak sah.
- Sekali lagi terima kasih sudah review, Pak Dhika 🙏

## 🔗 Source Code & Demo

- 🔗 : Source Code & Demo
- 🔧 : GitHub: [https://github.com/jefripunza/hekbai](https://github.com/jefripunza/hekbai)
- 🔗 : Website sederhana untuk informasi lebih terbuka: [https://hekbai.jefripunza.com/](https://hekbai.jefripunza.com/)

## 📚 Tutorial

- buka [https://hekbai.jefripunza.com/](https://hekbai.jefripunza.com/)
- masukkan room_id
- klik tombol "Connect"
- masukkan configurasi
- klik tombol "Save Configuration"
- klik tombol "Copy Intercept Code"
- buka tab baru dengan website target misalnya [https://dpr.go.id/](https://dpr.go.id/)
- pastekan intercept code di dalam inspect -> console
- kembali ke halaman hekbai dan klik tombol "Attack"
- lalu kembali ke tab target dan Tadaa !!

## 🤝 Open for Feedback!

- Kalau teman-teman punya ide, saran, atau sekadar mau coba versi demonya —
- feel free join Discord saya, kirim feedback via GitHub Issues,
- atau bahkan fork & bikin branch sendiri karena project ini open source.

- Terima kasih banyak Pak Dhika dan semua teman-teman 🙏

---

## 📋 Fitur Utama HEKBAI

### 🎯 Web Attack Simulation Framework
- **Educational Purpose Only** - Framework untuk pembelajaran keamanan web
- **Real-time WebSocket Communication** - Komunikasi real-time antara attacker dan target
- **Multiple Attack Templates** - Berbagai template serangan untuk analisis pendidikan
- **Anti-exit Protection** - Mekanisme perlindungan anti-keluar
- **Logo & Music Integration** - Integrasi logo dan musik dalam simulasi

### 🔧 Teknologi yang Digunakan
- **Backend**: TypeScript + Bun Runtime
- **WebSocket**: ws library untuk komunikasi real-time
- **Web Framework**: Express.js dengan middleware keamanan
- **Security**: Helmet.js, CORS protection
- **Development**: Hot reload dengan Bun watch mode

### 🚀 Cara Menjalankan

#### Development Mode
```bash
bun install
bun run dev
```

#### Production Build
```bash
bun run compile
```

### 🎮 Demo Features
1. **Room Entry Interface** - Interface untuk masuk atau membuat room
2. **Attack Configuration Panel** - Panel konfigurasi serangan dengan berbagai parameter
3. **Real-time Monitoring** - Dashboard monitoring real-time untuk target yang terhubung

### ⚖️ Legal & Ethical Notice
- **EDUCATIONAL PURPOSE ONLY** - Hanya untuk tujuan edukasi dan penelitian
- **No Malicious Intent** - Dilarang keras untuk tujuan jahat
- **User Responsibility** - Pengguna bertanggung jawab penuh atas penggunaan
- **Legal Compliance** - Pastikan memiliki izin sebelum testing pada sistem apapun
