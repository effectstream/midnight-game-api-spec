# Midnight dApp Integration API — PRC-6

This repository contains the **PRC-6** specification, the standard interface that any application built on [Midnight](https://midnight.foundation) must implement to be indexed by the Midnight Platform, along with a reference implementation.

> Achievement tracking is defined separately in [PRC-1](./prc-1.md), which PRC-6 references for the achievement object shape and per-achievement progress endpoints.

---

## Specification

**Full spec: [prc-6.md](./prc-6.md)**

The Midnight Platform is an **aggregator** — it queries your application's API to build unified user profiles across the ecosystem. Your application is the source of truth for metrics, achievements, and identity resolution.

`{BASE_URL}` is the root URL of your server (e.g. `https://my-app.io`). Three endpoints are required:

| Endpoint | Purpose |
| --- | --- |
| `GET {BASE_URL}/metrics` | App metadata, achievement definitions, and declared channel list |
| `GET {BASE_URL}/metrics/{channel}` | Ranked entries for a specific metric channel, paginated |
| `GET {BASE_URL}/metrics/users/{address}` | Per-user identity and channel stats; accepts Session or Main Wallet address |

**Channels** are independent metric streams (`leaderboard`, `volume`, `transactions`, `tvl`, `verifications`, and more, plus custom). Each channel declares a `sortOrder` (`ASC`/`DESC`), a `type` (`cumulative` or `snapshot`), and optionally `auth: true` to gate it behind an API key.

**Identity** is built on a Session Wallet → Main Wallet delegation model. Session Wallets are temporary; Main Wallets are permanent. Rankings must consolidate scores under Main Wallets, and the user endpoint must resolve either address type to the Main Wallet.

See [prc-6.md](./prc-6.md) for the complete field-level reference, all query parameters, error responses, and custom channel rules.

---

## Demo Server

The `demo/` directory is a working reference implementation of PRC-6 using **Node.js + Fastify + TypeBox** (TypeScript). It models a fictional racing game called "Cyber Drifter" with in-memory fixture data.

### Running

```bash
cd demo
npm install
npm run dev      # hot-reload via tsx watch
npm start        # run once
```

The server starts on `http://localhost:3000`. Override with `PORT` and `HOST` environment variables.

### Available routes

```
GET http://localhost:3000/metrics
GET http://localhost:3000/metrics/leaderboard
GET http://localhost:3000/metrics/kos
GET http://localhost:3000/metrics/transactions
GET http://localhost:3000/metrics/volume          ← requires API key
GET http://localhost:3000/metrics/users/:address
```

### Demo credentials

| | Value |
| --- | --- |
| API key (private channels) | `demo-api-key-12345` |
| Main Wallet | `mn_main_driftking` |
| Session Wallet (→ driftking) | `mn_session_abc123` |

Pass the API key as a header (`X-API-Key: demo-api-key-12345`) or query param (`?api_key=demo-api-key-12345`).

### Example requests

```bash
# App metadata and channel list
curl http://localhost:3000/metrics

# Leaderboard (top 5)
curl "http://localhost:3000/metrics/leaderboard?limit=5"

# Private channel with API key
curl -H "X-API-Key: demo-api-key-12345" http://localhost:3000/metrics/volume

# Resolve a session wallet → main wallet identity
curl http://localhost:3000/metrics/users/mn_session_abc123

# User with multiple channel stats
curl "http://localhost:3000/metrics/users/mn_main_driftking?channel=leaderboard&channel=kos"
```

### Source structure

```
demo/src/
  index.ts              # Fastify app entry; registers routes
  data/store.ts         # Fixture data (users, channels, delegation map) + helper functions
  schemas/index.ts      # TypeBox schemas for all request/response types
  routes/
    metrics.ts          # GET /metrics
    channel.ts          # GET /metrics/:channel
    users.ts            # GET /metrics/users/:address
```

All fixture data lives in `data/store.ts`. To adapt the demo to a real application, replace the in-memory store with your database queries while keeping the response shapes identical.
