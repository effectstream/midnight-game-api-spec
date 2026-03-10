---
title: prc-6: Midnight dApp Integration Interface
description: Interface for integrating dApps into Midnight Platform.
author: edward.alvarado@midnight.foundation
status: open
created: 2026-03-03
---

# Midnight dApp Integration API Specification

## Status

This specification is currently in draft status.

## Changelog

- **1.0** Initial Version
- **2.0** Generalized from game-specific to a generic app/dApp integration API, with {channel} endpoints that provide specific metric data.
- **2.1** Incorporated PRC-1 to create a single specification.

---

## Overview

This specification defines the interface that Developers must implement to be indexed by the Platform. It applies to games, dApps, and any application built on Midnight.

In this architecture, the Application acts as the "Source of Truth" for:

- **Metrics:** Storing and exposing channel-specific scores.
- **Achievement Tracking:** Managing unlocking logic.
- **Identity Resolution (Delegation):** Linking temporary "Session Wallets" (used during interactions) to permanent "Main Wallets" (used for reputation and aggregation).

The Platform functions as an aggregator, querying these endpoints to build a unified profile for users across the ecosystem.

`{BASE_URL}` is the root URL of the application's server (e.g. `https://my-game.io`). Implementers may mount the `/metrics` path at any base URL they control.

Example endpoints:
```
GET {BASE_URL}/metrics
GET {BASE_URL}/metrics/leaderboard
GET {BASE_URL}/metrics/volume
GET {BASE_URL}/metrics/users/mn_addr_undeployed1234567890?channel=leaderboard
```

---

## Authentication

By default, all endpoints are public and read-only. Individual channels may be declared **private** by setting `auth: true` in their channel definition (see [Channel Object](#channel-object)).

When a request targets a private channel — directly via `GET {BASE_URL}/metrics/{channel}` or via the `channel` query param on `GET {BASE_URL}/metrics/users/{address}` — the application must authenticate the caller using an API key.

### Passing the API Key

The API key may be provided by either method. Header takes precedence.

| Method      | Format                 |
| ----------- | ---------------------- |
| HTTP Header | `X-API-Key: <key>`     |
| Query Param | `?api_key=<key>`       |

### Error Responses

| Status | Condition                                                          |
| ------ | ------------------------------------------------------------------ |
| `401`  | API key is missing or invalid on a request for a private channel.  |

### Private Channel Data

Private channels may expose sensitive data that public channels omit — for example, exact monetary volumes, granular financial metrics, or raw transaction values denominated in USD. The Platform will forward the API key when querying private channels on behalf of authorized integrations.

---

## Standard Channels

Each application exposes one or more **channels** — independent metric streams. The following channel IDs are recognized by the Platform. Applications may also expose [custom channels](#4-custom-channels).


| Channel ID          | `scoreUnit`                                    | `type`     |
| ------------------- | ----------------------------------------------- | ---------- |
| `leaderboard`       | App-defined (e.g. `"Points"`, `"Lap Time (s)"`) | —          |
| `volume`            | `"USD Volume"`                                  | —          |
| `transactions`      | `"Transactions"`                                | —          |
| `tvl`               | `"USD"`                                         | `snapshot` |
| `verifications`     | `"Verifications"`                               | —          |
| `access_grants`     | `"Access Grants"`                               | —          |
| `votes`             | `"Votes"`                                       | —          |
| `proposals`         | `"Proposals"`                                   | —          |
| `credentials`       | `"Credentials"`                                 | —          |
| `reputation_checks` | `"Reputation Checks"`                           | —          |
| `endorsements`      | `"Endorsements"`                                | —          |
| `buyers`            | `"Buyers"`                                      | —          |
| `sellers`           | `"Sellers"`                                     | —          |
| `compliance_proofs` | `"Compliance Proofs"`                           | —          |
| `messages`          | `"Messages"`                                    | —          |
| `interactions`      | `"Interactions"`                                | —          |


*`—` means `type` is `cumulative`. `snapshot` channels do not support `startDate` / `endDate` filtering.*

All channels are optional. Applications implement only the channels relevant to their use case.

---

## 1. App Metadata & Channels

**Endpoint:** `GET {BASE_URL}/metrics`

Retrieves the application's display metadata, global achievement definitions, and the list of metric channels it exposes. The Platform uses this to render the application's profile and determine which channels to query.

### Response Body


| Field          | Type   | Description                                      |
| -------------- | ------ | ------------------------------------------------ |
| `name`         | String | Display name of the application.                 |
| `description`  | String | Short summary of the application.                |
| `achievements` | Array  | All available achievements for this application. |
| `channels`     | Array  | Metric channels this application exposes.        |


### Achievement Object

Compliant with [PRC-1](./prc-1.md). The fields below are the required minimum; PRC-1 defines additional optional fields (`score`, `category`, `spoiler`, `iconGreyURI`, `startDate`, `endDate`) supported by any PRC-1-compliant consumer.

| Field                | Type    | Description                                                              |
| -------------------- | ------- | ------------------------------------------------------------------------ |
| `name`               | String  | Unique achievement identifier (e.g. `speed_demon`).                      |
| `displayName`        | String  | Display title.                                                           |
| `description`        | String  | How to unlock this achievement.                                          |
| `isActive`           | Boolean | Whether this achievement can currently be unlocked.                      |
| `iconURI`            | String  | (Optional) Full URL to the badge image. Square, minimum 100×100px.       |
| `percentCompleted`   | Number  | (Optional) Percentage of players (Main Wallets) who have unlocked this.  |


### Channel Object


| Field         | Type    | Description                                                                                    |
| ------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `id`          | String  | Channel identifier. Standard or custom.                                                        |
| `name`        | String  | Display name.                                                                                  |
| `description` | String  | What this channel measures.                                                                    |
| `scoreUnit`   | String  | Label for the score value (e.g. `"KOs"`, `"USD Volume"`).                                      |
| `sortOrder`   | Enum    | `DESC` (higher is better) or `ASC` (lower is better).                                          |
| `type`        | Enum    | (Optional) `cumulative` (default) or `snapshot` (current state). Only include when `snapshot`. |
| `auth`        | Boolean | (Optional) `true` if this channel requires API key authentication. Default: `false`.           |


### Example Response

```json
{
  "name": "Cyber Drifter",
  "description": "High-octane neon racing.",
  "achievements": [
    {
      "name": "speed_demon",
      "displayName": "Speed Demon",
      "description": "Finish a lap under 60 seconds.",
      "isActive": true,
      "iconURI": "https://cyber-drifter.io/assets/badges/speed.png",
      "percentCompleted": 14.2
    },
    {
      "name": "knockout_artist",
      "displayName": "Knockout Artist",
      "description": "Land 100 KOs in a single season.",
      "isActive": true,
      "iconURI": "https://cyber-drifter.io/assets/badges/ko.png",
      "percentCompleted": 0.87
    }
  ],
  "channels": [
    {
      "id": "leaderboard",
      "name": "Lap Time",
      "description": "Best lap time recorded per player.",
      "scoreUnit": "Lap Time (s)",
      "sortOrder": "ASC"
    },
    {
      "id": "kos",
      "name": "Knock Outs",
      "description": "Total opponents knocked out per player.",
      "scoreUnit": "KOs",
      "sortOrder": "DESC"
    },
    {
      "id": "volume",
      "name": "USD Volume",
      "description": "Total USD volume wagered per player.",
      "scoreUnit": "USD Volume",
      "sortOrder": "DESC",
      "auth": true
    }
  ]
}
```

---

## 2. Channel Rankings

**Endpoint:** `GET {BASE_URL}/metrics/{channel}`

Retrieves ranked entries for a specific channel.

For `cumulative` channels, results reflect totals within the specified time window. For `snapshot` channels, `startDate` and `endDate` are not supported and will be ignored.

If the requested channel has `auth: true`, the request must include a valid API key. See [Authentication](#authentication).

**Implementation Requirement:** The application must aggregate scores such that if a user interacts with multiple Session Wallets that delegate to one Main Wallet, only the Main Wallet appears in this list with the consolidated score. By default, a new Session Wallet delegates to itself.

### Path Parameters


| Parameter | Type   | Description                                  |
| --------- | ------ | -------------------------------------------- |
| `channel` | String | Channel ID as declared in `GET {BASE_URL}/metrics`. |


### Query Parameters


| Parameter          | Type             | Required | Description                                                     |
| ------------------ | ---------------- | -------- | --------------------------------------------------------------- |
| `startDate`       | String (ISODate) | No       | Cumulative channels only. Default: now − 1 year.                |
| `endDate`         | String (ISODate) | No       | Cumulative channels only. Default: now.                         |
| `limit`            | Integer          | No       | Entries to return. Default: 50. Max: 1000.                      |
| `offset`           | Integer          | No       | Entries to skip for pagination.                                 |
| `minAchievements` | Integer          | No       | Only return entries where `achievementsUnlocked` ≥ this value. |


### Response Body


| Field           | Type    | Description                                                     |
| --------------- | ------- | --------------------------------------------------------------- |
| `channel`       | String  | The channel ID queried.                                         |
| `startDate`    | String  | Applied start filter. Omitted for `snapshot` channels.          |
| `endDate`      | String  | Applied end filter. Omitted for `snapshot` channels.            |
| `totalPlayers` | Integer | Total unique ranked users (Main Wallets) in this result set.    |
| `totalScore`   | Number  | Sum of all scores across all ranked players in this result set. |
| `entries`       | Array   | Ordered rankings.                                               |


### Entry Object


| Field          | Type    | Description                            |
| -------------- | ------- | -------------------------------------- |
| `rank`         | Integer | Position (1-based).                    |
| `address`      | String  | Main Wallet address.                   |
| `displayName` | String  | (Optional) User's chosen username.     |
| `score`        | Number  | Score for this channel and time range. |


### Error Responses

| Status | Condition                                                         |
| ------ | ----------------------------------------------------------------- |
| `401`  | Channel requires authentication and API key is missing or invalid. |

### Example Response

**Request:** `GET {BASE_URL}/metrics/leaderboard`

```json
{
  "channel": "leaderboard",
  "startDate": "2025-02-05T23:00:00.000Z",
  "endDate": "2026-02-05T12:00:00.000Z",
  "totalPlayers": 450,
  "totalScore": 28934.6,
  "entries": [
    {
      "rank": 1,
      "address": "0xMainWalletA...",
      "displayName": "DriftKing",
      "score": 45.2
    },
    {
      "rank": 2,
      "address": "0xMainWalletB...",
      "displayName": null,
      "score": 46.8
    }
  ]
}
```

---

## 3. User Profile

**Endpoint:** `GET {BASE_URL}/metrics/users/{address}`

Retrieves identity and optionally per-channel stats for a specific wallet address.

**Implementation Requirement (Identity Resolution):** This endpoint accepts both Session Wallet and Main Wallet addresses. If the queried `{address}` is a Session Wallet, the application must return the linked Main Wallet's combined stats. The `identity` object must explicitly show the relationship between the queried address and the resolved address.

If no `channel` query param is provided, `identity` and `achievements` are returned without any channel stats. This is useful for identity resolution without fetching metric data.

If any requested `channel` has `auth: true`, the request must include a valid API key. See [Authentication](#authentication). Only the authenticated channels are gated — public channels in the same request are always returned.

### Path Parameters


| Parameter | Type   | Description                     |
| --------- | ------ | ------------------------------- |
| `address` | String | Main or Session Wallet address. |


### Query Parameters


| Parameter    | Type             | Required | Description                                                                                 |
| ------------ | ---------------- | -------- | ------------------------------------------------------------------------------------------- |
| `channel`    | String           | No       | Channel ID to include in the response. Repeatable. If omitted, only `identity` is returned. |
| `startDate` | String (ISODate) | No       | Applied to all cumulative channels. Default: now − 1 year.                                  |
| `endDate`   | String (ISODate) | No       | Applied to all cumulative channels. Default: now.                                           |


### Response Body


| Field          | Type     | Description                                                                           |
| -------------- | -------- | ------------------------------------------------------------------------------------- |
| `identity`     | Object   | Identity resolution details. Always returned.                                                                           |
| `achievements` | String[] | PRC-1 `name` values for all achievements unlocked by this user. Always returned. See [PRC-1](./prc-1.md) for full per-achievement progress tracking. |
| `channels`     | Object   | Stats keyed by channel ID. Omitted if no `channel` param is sent.                                                       |


NOTE: For further achivement tracking, see [PRC-1](./prc-1.md).

### Identity Object


| Field            | Type     | Description                                                  |
| ---------------- | -------- | ------------------------------------------------------------ |
| `address`        | String   | The resolved Main Wallet address.                            |
| `delegatedFrom` | String[] | Session Wallets that delegate to this address. May be empty. |
| `displayName`   | String   | (Optional) Display name for this account.                    |


### Channel Entry Object

Each key in `channels` is a channel ID. Its value contains:


| Field        | Type   | Description                                            |
| ------------ | ------ | ------------------------------------------------------ |
| `startDate` | String | Applied start filter. Omitted for `snapshot` channels. |
| `endDate`   | String | Applied end filter. Omitted for `snapshot` channels.   |
| `stats`      | Object | User metrics for this channel and time range.          |


### Stats Object


| Field            | Type    | Description                                               |
| ---------------- | ------- | --------------------------------------------------------- |
| `score`          | Number  | Score for this channel and time range.                    |
| `rank`           | Integer | Dynamic rank within this channel for the specified range. |
| `matchesPlayed` | Integer | (Optional) Total interactions recorded.                   |


### Error Responses

| Status | Condition                                                                        |
| ------ | -------------------------------------------------------------------------------- |
| `401`  | One or more requested channels require authentication; API key is missing or invalid. |

### Example Responses

**Request:** `GET {BASE_URL}/metrics/users/0xSessionWallet...`

```json
{
  "identity": {
    "address": "0x4f3a1b8e2d7c9f0a5e6b3d1c8f2a7e4b9d0c5f1a",
    "delegatedFrom": ["0xd3a7f2c9e1b4f6a8d0e5c2b9f4a1e7c3d6b0f8a2"],
    "displayName": "DriftKing"
  },
  "achievements": ["first_race", "speed_demon", "podium_finish"]
}
```

**Request:** `GET {BASE_URL}/metrics/users/0xSessionWallet...?channel=leaderboard&channel=kos&startDate=2025-03-01T00:00:00.000Z&endDate=2026-03-01T00:00:00.000Z`

```json
{
  "identity": {
    "address": "0x4f3a1b8e2d7c9f0a5e6b3d1c8f2a7e4b9d0c5f1a",
    "delegatedFrom": ["0xd3a7f2c9e1b4f6a8d0e5c2b9f4a1e7c3d6b0f8a2"],
    "displayName": "DriftKing"
  },
  "achievements": ["first_race", "speed_demon", "podium_finish", "knockout_artist"],
  "channels": {
    "leaderboard": {
      "startDate": "2025-03-01T00:00:00.000Z",
      "endDate": "2026-03-01T00:00:00.000Z",
      "stats": {
        "score": 45.2,
        "rank": 1,
        "matchesPlayed": 145
      }
    },
    "kos": {
      "startDate": "2025-03-01T00:00:00.000Z",
      "endDate": "2026-03-01T00:00:00.000Z",
      "stats": {
        "score": 8750,
        "rank": 2,
        "matchesPlayed": 312
      }
    }
  }
}
```

---

## 4. Custom Channels

Applications may define channels beyond the standard list. A custom channel must:

- Be declared in `GET {BASE_URL}/metrics` with a valid `id`, `name`, `description`, `scoreUnit`, `sortOrder`, and optionally `type`.
- Implement `GET {BASE_URL}/metrics/{channel}` and support the `channel` param on `GET {BASE_URL}/metrics/users/{address}` following the same response envelope.

For custom channels, `entries` in the rankings response is `Object[]`. The Platform indexes `rank`, `address`, and `score` from each entry. Any additional fields are passed through opaquely. The same applies to `stats` in the user profile — the Platform reads `score` and `rank`; all other fields are implementer-defined.

### Example: Custom `kos` Channel

**Request:** `GET {BASE_URL}/metrics/kos`

```json
{
  "channel": "kos",
  "startDate": "2025-02-05T23:00:00.000Z",
  "endDate": "2026-02-05T12:00:00.000Z",
  "totalPlayers": 310,
  "totalScore": 142800,
  "entries": [
    {
      "rank": 1,
      "address": "0xMainWalletC...",
      "displayName": "KO_Queen",
      "score": 9400
    }
  ]
}
```

