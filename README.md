# QR Scan — Fast & Private QR Code Scanner PWA

![QR Scan](public/favicon.svg)

A **production-quality Progressive Web App** for QR code scanning, built with React, TypeScript, and Vite. Fully local-first — your data never leaves your device.

## ✨ Features

- 📷 **Live camera scanning** with auto-detection
- 🔍 **Smart content parsing** — URLs, Email, Phone, WiFi, vCard, Geo, and more
- 🔐 **Security first** — dangerous protocol blocking, URL confirmation before opening
- 📋 **Scan history** — searchable, filterable, with favorites
- 🌙 **Dark mode** — Light / Dark / System
- 📤 **Share & copy** — Web Share API with clipboard fallback
- 🖼 **Image upload** — decode QR from photos
- ⌨️ **Manual input** — paste any QR content
- 📱 **PWA** — installable on Android, iPhone, and desktop
- 🔒 **100% local** — no server, no account, no tracking

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS v3 |
| QR Scanner | html5-qrcode |
| Routing | React Router v6 |
| Icons | Lucide React |
| Storage | IndexedDB + localStorage |
| PWA | vite-plugin-pwa + Workbox |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

> **Note:** Camera access requires HTTPS in production. It works on `localhost` during development.

## 📁 Project Structure

```
src/
├── components/
│   ├── scanner/     # QRScanner, ScannerOverlay, CameraControls, ScanStatus
│   ├── results/     # ScanResult, ResultActions, ContentTypeBadge
│   ├── history/     # HistoryList, HistoryItem, HistoryFilters
│   ├── common/      # Button, Modal, Toast, EmptyState, SafeLinkModal
│   └── layout/      # Header, Sidebar, BottomNavigation
├── pages/           # Scanner, History, Favorites, Settings
├── hooks/           # useQRScanner, useHistory, useTheme, useToast, useMediaQuery
├── services/        # qrParser, qrValidator, storage, share
├── context/         # AppContext
├── types/           # qr.ts
└── utils/           # cn, formatDate
```

## 🔒 Privacy

All scan data is stored **only on your device** using IndexedDB. No data is sent to any server. No analytics. No account required.

## 🚢 Deploy

Deploy the `dist/` folder to any static host:

```bash
# Vercel
npx vercel --prod

# Netlify
npx netlify deploy --prod --dir=dist

# Cloudflare Pages
npx wrangler pages deploy dist
```

## 📄 License

MIT
