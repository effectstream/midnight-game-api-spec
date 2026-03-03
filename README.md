# Standard Integration API Specification

**Version:** 2.5
**Protocol:** REST / JSON
**Authentication:** Public (Read-Only); Optional API Key for private channels
**Author:** Edward Alvarado [edward.alvarado@midnight.foundation](mailto:edward.alvarado@midnight.foundation)

## Status

This specification is currently in draft status.

## Changelog

- **1.0** Initial Version
- **2.0** Generalized from game-specific to a generic app/dApp integration API, with {channel} endpoints that provide specific metric data.

---

## Overview

This specification defines the interface that Developers must implement to be indexed by the Platform. It applies to games, dApps, and any application built on Midnight.

In this architecture, the Application acts as the "Source of Truth" for:

- **Metrics:** Storing and exposing channel-specific scores.
- **Achievement Tracking:** Managing unlocking logic.
- **Identity Resolution (Delegation):** Linking temporary "Session Wallets" (used during interactions) to permanent "Main Wallets" (used for reputation and aggregation).

The Platform functions as an aggregator, querying these endpoints to build a unified profile for users across the ecosystem.

---

## Authentication

By default, all endpoints are public and read-only. Individual channels may be declared **private** by setting `auth: true` in their channel definition (see [Channel Object](#channel-object)).

When a request targets a private channel — directly via `GET /v1/metrics/{channel}` or via the `channel` query param on `GET /v1/metrics/users/{address}` — the application must authenticate the caller using an API key.

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


| Channel ID          | `score_unit`                                    | `type`     | Date Filtering |
| ------------------- | ----------------------------------------------- | ---------- | -------------- |
| `leaderboard`       | App-defined (e.g. `"Points"`, `"Lap Time (s)"`) | —          | Yes            |
| `volume`            | `"USD Volume"`                                  | —          | Yes            |
| `transactions`      | `"Transactions"`                                | —          | Yes            |
| `tvl`               | `"USD"`                                         | `snapshot` | No             |
| `verifications`     | `"Verifications"`                               | —          | Yes            |
| `access_grants`     | `"Access Grants"`                               | —          | Yes            |
| `votes`             | `"Votes"`                                       | —          | Yes            |
| `proposals`         | `"Proposals"`                                   | —          | Yes            |
| `credentials`       | `"Credentials"`                                 | —          | Yes            |
| `reputation_checks` | `"Reputation Checks"`                           | —          | Yes            |
| `endorsements`      | `"Endorsements"`                                | —          | Yes            |
| `buyers`            | `"Buyers"`                                      | —          | Yes            |
| `sellers`           | `"Sellers"`                                     | —          | Yes            |
| `compliance_proofs` | `"Compliance Proofs"`                           | —          | Yes            |
| `messages`          | `"Messages"`                                    | —          | Yes            |
| `interactions`      | `"Interactions"`                                | —          | Yes            |


*`—` means `type` is omitted (defaults to `cumulative`).*

All channels are optional. Applications implement only the channels relevant to their use case.

---

## 1. App Metadata & Channels

**Endpoint:** `GET /v1/metrics`

Retrieves the application's display metadata, global achievement definitions, and the list of metric channels it exposes. The Platform uses this to render the application's profile and determine which channels to query.

### Response Body


| Field          | Type   | Description                                      |
| -------------- | ------ | ------------------------------------------------ |
| `name`         | String | Display name of the application.                 |
| `description`  | String | Short summary of the application.                |
| `achievements` | Array  | All available achievements for this application. |
| `channels`     | Array  | Metric channels this application exposes.        |


### Achievement Object


| Field             | Type    | Description                                               |
| ----------------- | ------- | --------------------------------------------------------- |
| `id`              | String  | Unique identifier (e.g. `speed_demon`).                   |
| `name`            | String  | Display title.                                            |
| `description`     | String  | How to unlock this achievement.                           |
| `icon_url`        | String  | Full URL to the badge image. Square, minimum 100×100px.   |
| `completed_count` | Integer | Total unique users (Main Wallets) who have unlocked this. |


### Channel Object


| Field         | Type    | Description                                                                                    |
| ------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `id`          | String  | Channel identifier. Standard or custom.                                                        |
| `name`        | String  | Display name.                                                                                  |
| `description` | String  | What this channel measures.                                                                    |
| `score_unit`  | String  | Label for the score value (e.g. `"KOs"`, `"USD Volume"`).                                      |
| `sort_order`  | Enum    | `DESC` (higher is better) or `ASC` (lower is better).                                          |
| `type`        | Enum    | (Optional) `cumulative` (default) or `snapshot` (current state). Only include when `snapshot`. |
| `auth`        | Boolean | (Optional) `true` if this channel requires API key authentication. Default: `false`.           |


### Example Response

```json
{
  "name": "Cyber Drifter",
  "description": "High-octane neon racing.",
  "achievements": [
    {
      "id": "speed_demon",
      "name": "Speed Demon",
      "description": "Finish a lap under 60 seconds.",
      "icon_url": "https://cyber-drifter.io/assets/badges/speed.png",
      "completed_count": 1420
    },
    {
      "id": "knockout_artist",
      "name": "Knockout Artist",
      "description": "Land 100 KOs in a single season.",
      "icon_url": "https://cyber-drifter.io/assets/badges/ko.png",
      "completed_count": 87
    }
  ],
  "channels": [
    {
      "id": "leaderboard",
      "name": "Lap Time",
      "description": "Best lap time recorded per player.",
      "score_unit": "Lap Time (s)",
      "sort_order": "ASC"
    },
    {
      "id": "kos",
      "name": "Knock Outs",
      "description": "Total opponents knocked out per player.",
      "score_unit": "KOs",
      "sort_order": "DESC"
    },
    {
      "id": "volume",
      "name": "USD Volume",
      "description": "Total USD volume wagered per player.",
      "score_unit": "USD Volume",
      "sort_order": "DESC",
      "auth": true
    }
  ]
}
```

---

## 2. Channel Rankings

**Endpoint:** `GET /v1/metrics/{channel}`

Retrieves ranked entries for a specific channel.

For `cumulative` channels, results reflect totals within the specified time window. For `snapshot` channels, `start_date` and `end_date` are not supported and will be ignored.

If the requested channel has `auth: true`, the request must include a valid API key. See [Authentication](#authentication).

**Implementation Requirement:** The application must aggregate scores such that if a user interacts with multiple Session Wallets that delegate to one Main Wallet, only the Main Wallet appears in this list with the consolidated score. By default, a new Session Wallet delegates to itself.

### Path Parameters


| Parameter | Type   | Description                                  |
| --------- | ------ | -------------------------------------------- |
| `channel` | String | Channel ID as declared in `GET /v1/metrics`. |


### Query Parameters


| Parameter          | Type             | Required | Description                                                     |
| ------------------ | ---------------- | -------- | --------------------------------------------------------------- |
| `start_date`       | String (ISODate) | No       | Cumulative channels only. Default: now − 1 year.                |
| `end_date`         | String (ISODate) | No       | Cumulative channels only. Default: now.                         |
| `limit`            | Integer          | No       | Entries to return. Default: 50. Max: 1000.                      |
| `offset`           | Integer          | No       | Entries to skip for pagination.                                 |
| `min_achievements` | Integer          | No       | Only return entries where `achievements_unlocked` ≥ this value. |


### Response Body


| Field           | Type    | Description                                                     |
| --------------- | ------- | --------------------------------------------------------------- |
| `channel`       | String  | The channel ID queried.                                         |
| `start_date`    | String  | Applied start filter. Omitted for `snapshot` channels.          |
| `end_date`      | String  | Applied end filter. Omitted for `snapshot` channels.            |
| `total_players` | Integer | Total unique ranked users (Main Wallets) in this result set.    |
| `total_score`   | Number  | Sum of all scores across all ranked players in this result set. |
| `entries`       | Array   | Ordered rankings.                                               |


### Entry Object


| Field          | Type    | Description                            |
| -------------- | ------- | -------------------------------------- |
| `rank`         | Integer | Position (1-based).                    |
| `address`      | String  | Main Wallet address.                   |
| `display_name` | String  | (Optional) User's chosen username.     |
| `score`        | Number  | Score for this channel and time range. |


### Error Responses

| Status | Condition                                                         |
| ------ | ----------------------------------------------------------------- |
| `401`  | Channel requires authentication and API key is missing or invalid. |

### Example Response

**Request:** `GET /v1/metrics/leaderboard`

```json
{
  "channel": "leaderboard",
  "start_date": "2025-02-05T23:00:00.000Z",
  "end_date": "2026-02-05T12:00:00.000Z",
  "total_players": 450,
  "total_score": 28934.6,
  "entries": [
    {
      "rank": 1,
      "address": "0xMainWalletA...",
      "display_name": "DriftKing",
      "score": 45.2
    },
    {
      "rank": 2,
      "address": "0xMainWalletB...",
      "display_name": null,
      "score": 46.8
    }
  ]
}
```

---

## 3. User Profile

**Endpoint:** `GET /v1/metrics/users/{address}`

Retrieves identity and optionally per-channel stats for a specific wallet address.

**Implementation Requirement (Identity Resolution):** This endpoint accepts both Session Wallet and Main Wallet addresses. If the queried `{address}` is a Session Wallet, the application must return the linked Main Wallet's combined stats. The `identity` object must explicitly show the relationship between the queried address and the resolved address.

If no `channel` query param is provided, only `identity` is returned. This is useful for identity resolution without fetching metric data.

If any requested `channel` has `auth: true`, the request must include a valid API key. See [Authentication](#authentication). Only the authenticated channels are gated — public channels in the same request are always returned.

### Path Parameters


| Parameter | Type   | Description                     |
| --------- | ------ | ------------------------------- |
| `address` | String | Main or Session Wallet address. |


### Query Parameters


| Parameter    | Type             | Required | Description                                                                                 |
| ------------ | ---------------- | -------- | ------------------------------------------------------------------------------------------- |
| `channel`    | String           | No       | Channel ID to include in the response. Repeatable. If omitted, only `identity` is returned. |
| `start_date` | String (ISODate) | No       | Applied to all cumulative channels. Default: now − 1 year.                                  |
| `end_date`   | String (ISODate) | No       | Applied to all cumulative channels. Default: now.                                           |


### Response Body


| Field          | Type     | Description                                                                           |
| -------------- | -------- | ------------------------------------------------------------------------------------- |
| `identity`     | Object   | Identity resolution details. Always returned.                                         |
| `achievements` | String[] | IDs of all achievements unlocked by this user. Omitted if no `channel` param is sent. |
| `channels`     | Object   | Stats keyed by channel ID. Omitted if no `channel` param is sent.                     |


### Identity Object


| Field            | Type     | Description                                                  |
| ---------------- | -------- | ------------------------------------------------------------ |
| `address`        | String   | The resolved Main Wallet address.                            |
| `delegated_from` | String[] | Session Wallets that delegate to this address. May be empty. |
| `display_name`   | String   | (Optional) Display name for this account.                    |


### Channel Entry Object

Each key in `channels` is a channel ID. Its value contains:


| Field        | Type   | Description                                            |
| ------------ | ------ | ------------------------------------------------------ |
| `start_date` | String | Applied start filter. Omitted for `snapshot` channels. |
| `end_date`   | String | Applied end filter. Omitted for `snapshot` channels.   |
| `stats`      | Object | User metrics for this channel and time range.          |


### Stats Object


| Field            | Type    | Description                                               |
| ---------------- | ------- | --------------------------------------------------------- |
| `score`          | Number  | Score for this channel and time range.                    |
| `ranking`        | Integer | Dynamic rank within this channel for the specified range. |
| `matches_played` | Integer | (Optional) Total interactions recorded.                   |


### Error Responses

| Status | Condition                                                                        |
| ------ | -------------------------------------------------------------------------------- |
| `401`  | One or more requested channels require authentication; API key is missing or invalid. |

### Example Responses

**Request:** `GET /v1/metrics/users/0xSessionWallet...`

```json
{
  "identity": {
    "address": "0x4f3a1b8e2d7c9f0a5e6b3d1c8f2a7e4b9d0c5f1a",
    "delegated_from": ["0xd3a7f2c9e1b4f6a8d0e5c2b9f4a1e7c3d6b0f8a2"],
    "display_name": "DriftKing"
  }
}
```

**Request:** `GET /v1/metrics/users/0xSessionWallet...?channel=leaderboard&channel=kos&start_date=2025-03-01T00:00:00.000Z&end_date=2026-03-01T00:00:00.000Z`

```json
{
  "identity": {
    "address": "0x4f3a1b8e2d7c9f0a5e6b3d1c8f2a7e4b9d0c5f1a",
    "delegated_from": ["0xd3a7f2c9e1b4f6a8d0e5c2b9f4a1e7c3d6b0f8a2"],
    "display_name": "DriftKing"
  },
  "achievements": ["first_race", "speed_demon", "podium_finish", "knockout_artist"],
  "channels": {
    "leaderboard": {
      "start_date": "2025-03-01T00:00:00.000Z",
      "end_date": "2026-03-01T00:00:00.000Z",
      "stats": {
        "score": 45.2,
        "ranking": 1,
        "matches_played": 145
      }
    },
    "kos": {
      "start_date": "2025-03-01T00:00:00.000Z",
      "end_date": "2026-03-01T00:00:00.000Z",
      "stats": {
        "score": 8750,
        "ranking": 2,
        "matches_played": 312
      }
    }
  }
}
```

---

## 4. Custom Channels

Applications may define channels beyond the standard list. A custom channel must:

- Be declared in `GET /v1/metrics` with a valid `id`, `name`, `description`, `score_unit`, `sort_order`, and optionally `type`.
- Implement `GET /v1/metrics/{channel}` and support the `channel` param on `GET /v1/metrics/users/{address}` following the same response envelope.

For custom channels, `entries` in the rankings response is `Object[]`. The Platform indexes `rank`, `address`, and `score` from each entry. Any additional fields are passed through opaquely. The same applies to `stats` in the user profile — the Platform reads `score` and `ranking`; all other fields are implementer-defined.

### Example: Custom `kos` Channel

**Request:** `GET /v1/metrics/kos`

```json
{
  "channel": "kos",
  "start_date": "2025-02-05T23:00:00.000Z",
  "end_date": "2026-02-05T12:00:00.000Z",
  "total_players": 310,
  "entries": [
    {
      "rank": 1,
      "address": "0xMainWalletC...",
      "display_name": "KO_Queen",
      "score": 9400
    }
  ]
}
```

