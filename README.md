# 🎵 iRetro - iPod-Style Music Player# Monad - iPod-Style Music Player# 🎵 iRetro



<div align="center">



**A nostalgic iPod Classic-inspired music player for the web**A web-based music player with an iPod Classic interface. Works on iOS, Android, and desktop browsers.<div align="center">



[![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue?style=for-the-badge)](https://github.com/shivanshm1726/iretro)## Features**A nostalgic iPod Classic-inspired YouTube Music client built with Rust**



*Experience the magic of the iPod Classic with modern music streaming*



</div>- 🎵 Stream music from JioSaavn[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)



## ✨ Features- 📱 Works on iOS, Android, and desktop[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)



- 🎵 **Stream Music** - Search and play music from JioSaavn- 🎨 Multiple iPod color themes (Silver, Blue, Pink, Yellow, Red)[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows-blue?style=for-the-badge)](https://github.com/shivanshm1726/web-ipod)

- 📱 **Cross-Platform** - Works on iOS, Android, and desktop browsers

- 🎨 **iPod Themes** - Multiple color themes (Silver, Blue, Pink, Yellow, Red)- ❤️ Like songs and save to your library

- ❤️ **Liked Songs** - Save your favorite tracks with Spotify-style UI

- 🔄 **Seek Controls** - Hold forward/rewind to seek through songs- 🔄 Hold forward/rewind to seek through songs<img width="300" alt="iRetro Screenshot" src="./assets/iretro-screenshot.png" />

- 👤 **User Accounts** - Sync liked songs across devices with Supabase

- 💾 **Offline Support** - Works offline with PWA support- 💾 Liked songs persist in browser storage



## 🛠️ Tech Stack*Experience the magic of the iPod Classic with modern music streaming*



| Component | Technology |## Tech Stack

|-----------|------------|

| **Backend** | Go (Golang) |</div>

| **Frontend** | Vanilla JavaScript, HTML5, CSS3 |

| **Music API** | JioSaavn |- **Frontend**: Vanilla JavaScript, HTML5, CSS3

| **Auth & Database** | Supabase |

| **Deployment** | Render / Netlify |- **Backend**: Go (stdlib only, no frameworks)---



## 🚀 Quick Start- **Music API**: JioSaavn via saavn.dev



### Prerequisites## ✨ Features



- [Go 1.21+](https://golang.org/dl/)## Quick Start

- Modern web browser

<table>

### Run Locally

### Prerequisites<tr>

1. **Clone the repository**

   ```bash<td>

   git clone https://github.com/shivanshm1726/iretro.git

   cd iretro- Go 1.21+

   ```

### 🎡 Click Wheel Interface

2. **Start the backend**

   ```bash### Run LocallyNavigate your music library with the iconic click-wheel interaction that defined a generation of music lovers

   cd backend

   go run main.go

   ```

```bash</td>

3. **Serve the frontend** (in another terminal)

   ```bash# Start the backend server<td>

   cd web

   python3 -m http.server 3000cd backend

   ```

go run main.go### 🎧 YouTube Music Integration

4. **Open in browser**

   ```Stream millions of tracks, albums, playlists, and artists directly from YouTube Music

   http://localhost:3000

   ```# Open in browser



## 📱 User Accounts (Optional)open http://localhost:8080</td>



To enable cloud sync of liked songs:```</tr>



1. Create a free [Supabase](https://supabase.com) project<tr>

2. Follow the setup guide in `SUPABASE_SETUP.md`

3. Add your credentials to `web/supabase.js`### Build for Production<td>



## 🎨 Themes



iRetro comes with 5 classic iPod color themes:```bash### 💾 Offline Caching



| Theme | Preview |cd backendSQLite-powered intelligent caching for metadata and audio files—enjoy your music anywhere

|-------|---------|

| Silver | Classic iPod look |go build -o monad-server main.go

| Blue | iPod Mini blue |

| Pink | iPod Mini pink |./monad-server</td>

| Yellow | iPod Mini yellow |

| Red | Product RED edition |```<td>



## 🎮 Controls



| Control | Action |## Project Structure### 🖥️ Cross-Platform

|---------|--------|

| **Click Wheel** | Navigate menus |Native performance on macOS, Linux, and Windows

| **Center Button** | Select / Play-Pause |

| **Menu** | Go back |```

| **⏮️ Tap** | Previous track / Restart |

| **⏭️ Tap** | Next track |monad/</td>

| **⏮️ Hold** | Rewind |

| **⏭️ Hold** | Fast forward |├── backend/           # Go backend server</tr>



## 📁 Project Structure│   ├── main.go        # API server (search, stream)</table>



```│   └── go.mod         # Go module

iretro/

├── backend/           # Go server├── web/               # Frontend (static files)---

│   ├── main.go        # Server with JioSaavn API integration

│   └── go.mod         # Go module│   ├── index.html     # Main HTML

├── web/               # Frontend

│   ├── index.html     # iPod UI structure│   ├── app.js         # Application logic## 🏗️ Architecture

│   ├── styles.css     # iPod styling

│   ├── app.js         # Application logic│   ├── styles.css     # iPod styling

│   └── supabase.js    # Auth configuration

├── Dockerfile         # Container build│   └── sw.js          # Service worker (PWA)iRetro is built as a modular Rust workspace with specialized crates:

└── README.md

```├── Dockerfile         # Container build



## 🌐 Deployment└── render.yaml        # Render.com deployment```



### Render (Backend)```iRetro/



1. Create a new Web Service on Render├── 🎯 iretro-core       → Core types, error handling, and domain models

2. Connect your GitHub repo

3. Set build command: `cd backend && go build -o server`## API Endpoints├── 📡 iretro-innertube  → YouTube Music API client (InnerTube protocol)

4. Set start command: `./backend/server`

├── 🔊 iretro-audio      → Audio playback engine (symphonia + cpal)

### Netlify (Frontend)

| Endpoint | Description |├── 🎬 iretro-extractor  → Media extraction utilities

1. Create a new site on Netlify

2. Set publish directory: `web`|----------|-------------|├── 💾 iretro-cache      → SQLite caching layer for offline support

3. Deploy!

| `GET /api/search?q=<query>` | Search for songs |├── 🖼️ iretro-app        → Dioxus desktop GUI application

## 📄 License

| `GET /api/stream/<id>` | Stream audio by song ID |└── 🎤 iretro-lyrics     → Synchronized lyrics support

MIT License - see [LICENSE](LICENSE) for details.

| `GET /api/health` | Health check |```

## 🙏 Acknowledgments



- Apple for the iconic iPod design

- JioSaavn for the music API## Deployment---

- Supabase for auth and database



---

### Render.com## 🚀 Getting Started

<div align="center">



**Made with 💜 by [Shivansh](https://github.com/shivanshm1726)**

1. Connect your GitHub repo### Prerequisites

</div>

2. Deploy using the `render.yaml` blueprint

3. Your app will be live!- Rust 1.75+ (with cargo)

- FFmpeg (for audio processing)

### Docker

### Building

```bash

docker build -t monad .```bash

docker run -p 8080:8080 monad# Clone the repository

```git clone https://github.com/shivanshm1726/web-ipod.git

cd web-ipod

## Controls

# Debug build

- **Wheel Navigation**: Up/Down arrows or scrollcargo build

- **Select**: Enter key or center button click

- **Menu**: Escape key or Menu button# Release build (optimized)

- **Play/Pause**: Space bar or play buttoncargo build --release

- **Seek**: Hold prev/next buttons

# Run the application

## Licensecargo run -p iretro-app



MIT License - see [LICENSE](LICENSE)# Run with debug logging

RUST_LOG=debug cargo run -p iretro-app
```

### Running Tests

```bash
cargo test --all
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **GUI Framework** | [Dioxus](https://dioxuslabs.com/) - React-like Rust GUI |
| **Audio Decode** | [Symphonia](https://github.com/pdeljanov/Symphonia) - Pure Rust audio decoder |
| **Audio Output** | [cpal](https://github.com/RustAudio/cpal) - Cross-platform audio I/O |
| **Resampling** | [Rubato](https://github.com/HEnquist/rubato) - High-quality audio resampling |
| **API** | InnerTube - YouTube Music's internal API |
| **Database** | SQLite via [rusqlite](https://github.com/rusqlite/rusqlite) |
| **Async Runtime** | [Tokio](https://tokio.rs/) - Async runtime for Rust |

---

## 💡 Motivation

iRetro is a love letter to the iPod Classic—the device that revolutionized how we listen to music. Inspired by projects like [InnerTune](https://github.com/z-huang/InnerTune) and [Muzza](https://github.com/Jeluchu/Muzza), iRetro aims to recreate that magical experience with modern streaming capabilities.

> *"1,000 songs in your pocket"* — but make it unlimited with YouTube Music 🎶

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- The open-source community for YouTube Music API exploration
- [Dioxus](https://dioxuslabs.com/) team for the amazing Rust GUI framework
- All contributors and supporters of this project

---

<div align="center">

**Made with ❤️ and Rust**

⭐ Star this repo if you love the iPod as much as we do!

</div>
