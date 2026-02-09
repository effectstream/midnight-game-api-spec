# Standard Game Integration API Specification

**Version:** 1.2  
**Protocol:** REST / JSON  
**Authentication:** Public (Read-Only)  
**Author:** Edward Alvarado <edward.alvarado@midnight.foundation>

## Changelog
*   **1.0** Initial Version
*   **1.1** Added start_date end_date as query params for incentive/prize resolution. Removed period, player_id, parameter from leaderboard. Added examples.
*   **1.2** Updated delegation logic

## Overview

This specification defines the strict interface that Game Developers must implement to be indexed by the Platform.

In this architecture, the Game acts as the "Source of Truth" for:
*   **Scoring:** Storing and validating high scores.
*   **Achievement Tracking:** Managing unlocking logic.
*   **Identity Resolution (Delegation):** Linking temporary "Session Wallets" (used for gameplay) to permanent "Main Wallets" (used for reputation and aggregation).

The Platform functions as an aggregator, querying these endpoints to build a unified profile for users across the ecosystem.

---

## 1. Game Metadata

**Endpoint:** `GET /v1/game/info`

Retrieves static configuration, display metadata, and global achievement statistics. The Platform uses this to render the game's landing page and show community progress.

### Response Body

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | The display name of the game. |
| `description` | String | A short summary of the game. |
| `score_unit` | String | The label for the score (e.g., "Points", "Seconds", "Gold", "Time [s]"). |
| `sort_order` | Enum | `DESC` (Higher score is better) or `ASC` (Lower score is better). |
| `achievements` | Array | List of all available achievements. |

### Achievement Object

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique identifier for the achievement (e.g., `first_blood`). |
| `name` | String | Display title. |
| `description` | String | Rules to unlock. |
| `icon_url` | String | Full URL to the badge image. Square Image. Minimum of 100x100. |
| `completed_count` | Integer | Total number of unique users (Main Addresses) who have unlocked this. |

### Example Response

```json
{
  "name": "Cyber Drifter",
  "description": "High-octane neon racing.",
  "score_unit": "Lap Time (s)",
  "sort_order": "ASC",
  "achievements": [
    {
      "id": "speed_demon",
      "name": "Speed Demon",
      "description": "Finish a lap under 60 seconds",
      "icon_url": "https://cyber-drifter.io/assets/badges/speed.png",
      "completed_count": 1420
    },
    {
      "id": "collector",
      "name": "Collector",
      "description": "Find all hidden coins",
      "icon_url": "https://cyber-drifter.io/assets/badges/coin.png",
      "completed_count": 85
    }
  ]
}
```

---

## 2. Global Leaderboard

**Endpoint:** `GET /v1/game/leaderboard`

Retrieves the current global rankings based on the specified time range.

**Implementation Requirement:** The Game must aggregate scores such that if a User plays with multiple "Session Wallets" that delegate to one "Main Wallet," only the Main Wallet appears in this list with the consolidated high score. By default the initial Session Wallet, should delegate to self when created.

### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `start_date` | String (ISODate) | No | Filter timeframe. Optional. Default Now - 1Y |
| `end_date` | String (ISODate) | No | Filter timeframe. Optional. Default Now |
| `limit` | Integer | No | Number of entries to return (default: 50). Max 1000 |
| `offset` | Integer | No | Number of entries to skip (for pagination). |

### Response Body

| Field | Type | Description |
| :--- | :--- | :--- |
| `start_date` | String | Filter Start Date |
| `end_date` | String | Filter End Date |
| `total_players` | Integer | Total number of ranked (main wallets) unique users in this range. |
| `entries` | Array | The ordered list of rankings. |

### Entry Object

| Field | Type | Description |
| :--- | :--- | :--- |
| `rank` | Integer | The position in the leaderboard (1-based). |
| `address` | String | The Main Wallet Address (resolved identity). |
| `display_name` | String | (Optional) User's chosen username. |
| `score` | Number | Total score for the time range. |
| `achievements_unlocked` | Integer | Count of achievements unlocked by this user in the time range. |

### Example Response

**Request:** `GET /v1/game/leaderboard`

```json
{
  "start_date": "2025-02-05T23:00:00.000Z",
  "end_date": "2026-02-05T12:00:00.000Z",
  "total_players": 450,
  "entries": [
    {
      "rank": 1,
      "address": "0xMainWalletA...",
      "display_name": "DriftKing",
      "score": 45.2,
      "achievements_unlocked": 10
    },
    {
      "rank": 2,
      "address": "0xMainWalletB...",
      "display_name": null,
      "score": 46.8,
      "achievements_unlocked": 8
    }
  ]
}
```

---

## 3. User Profile

**Endpoint:** `GET /v1/game/users/{address}`

Retrieves the stats for a specific wallet address.

**Implementation Requirement (Identity Resolution):** This endpoint is the critical link between temporary wallets and permanent identities.
The Game checks if the `{address}` provided is a "Session Wallet" linked to a "Main Wallet" in the game's internal database.
If linked, the Game must return the Main Wallet's combined stats (Score, Rank, Achievements).
The identity object in the response must explicitly show the relationship between the queried address and the resolved address.

### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `start_date` | String (ISODate) | No | Filter timeframe. Optional. Default Now - 1Y |
| `end_date` | String (ISODate) | No | Filter timeframe. Optional. Default Now |

### Path Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `address` | String | Main or Session Wallet Address |

### Response Body

| Field | Type | Description |
| :--- | :--- | :--- |
| `identity` | Object | Contains identity resolution details. |
| `stats` | Object | The user's gameplay metrics in time range. |
| `start_date` | String | Filter Start Date |
| `end_date` | String | Filter End Date |

### Identity Object

| Field | Type | Description |
| :--- | :--- | :--- |
| `delegated_from` | String[] | List of addresses that delegate to this wallet. Can be empty, depending on game implementation allows using session wallets. |
| `address` | String | The Main Wallet Address where stats are stored. |
| `display_name` | String | Optional display name for game account |

### Stats Object

| Field | Type | Description |
| :--- | :--- | :--- |
| `score` | Number | Total Score for Time Range (Same as Leaderboard Score) |
| `achievements` | String[] | List of achievement IDs unlocked by this user in time range. |
| `ranking` | Number | Dynamic rank for the specified time range. |
| `matches_played` | Integer | (Optional) Total games played. |

### Example Response (Delegation Case)


**Request:** `GET /v1/game/users/0xMainWallet...`
or
**Request:** `GET /v1/game/users/0xSessionWallet...`

```json
{
  "identity": {
    "delegated_from": ["0xSessionWallet..."],
    "address": "0xMainWalletA...",
    "display_name": "my name"
  },
  "stats": {
    "score": 50500,
    "achievements": [
      "speed_demon",
      "first_blood",
      "level_50_boss"
    ],
    "matches_played": 145,
    "ranking": 13
  },
  "start_date": "2025-02-05T12:00:00.000Z",
  "end_date": "2026-02-05T12:00:00.000Z"
}
```
