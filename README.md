# 🍿 Popkorn

Watch videos together, in perfect sync.

> **⚠️ Warning:** This project is under heavy development. Expect breaking changes, missing features, and rough edges. Not production-ready.

---

## What it does

Popkorn lets multiple people watch the same video in sync inside a shared room — no account, no install, just a browser. Supports both local video files and direct streaming URLs.

- Real-time play / pause / seek sync with latency compensation
- Local files stay on your machine — nothing is uploaded
- Host controls who can drive playback
- Live chat and ping display per member

---

## Requirements

- [mise](https://mise.jdx.dev) — used to manage the Node.js version

---

## Setup

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd popkorn

# 2. Trust the mise config and install Node 22
mise trust
mise install

# 3. Install all dependencies (root + client + server)
npm install
npm install --prefix client
npm install --prefix server
```

---

## Running in dev

```bash
npm run dev
```

This starts both servers concurrently:

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express + Socket.io) | http://localhost:3001 |

The Vite dev server proxies `/socket.io` to port 3001 automatically — no manual CORS config needed.

To verify the backend is up:

```bash
curl http://localhost:3001/health
# {"status":"ok"}
```

---

## Project structure

```
popkorn/
├── client/          React + Vite + TypeScript frontend
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── types/   ← all shared types live here
└── server/          Node.js + Express + Socket.io backend
    └── src/
```
