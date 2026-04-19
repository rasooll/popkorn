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

# 3. Install all dependencies
mise run install
```

---

## Available tasks

| Command               | Description                                          |
|-----------------------|------------------------------------------------------|
| `mise run install`    | Install all npm dependencies (root, client, server)  |
| `mise run dev`        | Start client and server in development mode          |
| `mise run test`       | Run all unit tests                                   |
| `mise run test:watch` | Run tests in watch mode                              |

---

## Running in dev

```bash
mise run dev
```

This starts both servers concurrently:

| Service                  | URL                                        |
|--------------------------|--------------------------------------------|
| Frontend (Vite)          | <http://localhost:5173>                    |
| Backend (Express + Socket.io) | <http://localhost:3001>               |

The Vite dev server proxies `/socket.io` to port 3001 automatically — no manual CORS config needed.

To verify the backend is up:

```bash
curl http://localhost:3001/health
# {"status":"ok"}
```

---

## Tests

```bash
mise run test
```

66 tests across client and server using [Vitest](https://vitest.dev).

| Package  | Framework                | Coverage                                              |
|----------|--------------------------|-------------------------------------------------------|
| `server` | Vitest                   | `roomManager` — all room lifecycle, state mutations   |
| `client` | Vitest + Testing Library | `fingerprint`, `RoomLobby`, `SourceSelector`          |

---

## Project structure

```text
popkorn/
├── .mise.toml           Node 22 + task definitions
├── client/              React + Vite + TypeScript frontend
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── types/       ← all shared types live here
└── server/              Node.js + Express + Socket.io backend
    └── src/
```
