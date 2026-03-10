import type { Achievement, ChannelDef } from '../schemas/index.js';

// ── App config ────────────────────────────────────────────────────────────────

export const APP_NAME = 'Cyber Drifter';
export const APP_DESCRIPTION = 'High-octane neon racing on the Midnight blockchain.';

/** Demo API key for private channels. Pass as X-API-Key header or ?api_key= */
export const DEMO_API_KEY = 'demo-api-key-12345';

// ── Achievements ──────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  {
    name: 'first_race',
    displayName: 'First Race',
    description: 'Complete your first race.',
    isActive: true,
    iconURI: 'https://placehold.co/100x100/22c55e/ffffff?text=1st+Race',
    percentCompleted: 89.4,
  },
  {
    name: 'speed_demon',
    displayName: 'Speed Demon',
    description: 'Finish a lap under 60 seconds.',
    isActive: true,
    iconURI: 'https://placehold.co/100x100/f97316/ffffff?text=Speed+Demon',
    percentCompleted: 14.2,
  },
  {
    name: 'knockout_artist',
    displayName: 'Knockout Artist',
    description: 'Land 100 KOs in a single season.',
    isActive: true,
    iconURI: 'https://placehold.co/100x100/ef4444/ffffff?text=KO+Artist',
    percentCompleted: 0.87,
  },
  {
    name: 'podium_finish',
    displayName: 'Podium Finish',
    description: 'Finish in the top 3 of a ranked race.',
    isActive: true,
    iconURI: 'https://placehold.co/100x100/eab308/ffffff?text=Podium',
    percentCompleted: 32.1,
  },
  {
    name: 'night_owl',
    displayName: 'Night Owl',
    description: 'Complete a race between midnight and 4 AM.',
    isActive: true,
    iconURI: 'https://placehold.co/100x100/7c3aed/ffffff?text=Night+Owl',
    percentCompleted: 55.6,
  },
];

// ── Channel definitions ───────────────────────────────────────────────────────

export const CHANNEL_DEFS: ChannelDef[] = [
  {
    id: 'leaderboard',
    name: 'Lap Time',
    description: 'Best lap time recorded per player (lower is better).',
    scoreUnit: 'Lap Time (s)',
    sortOrder: 'ASC',
  },
  {
    id: 'kos',
    name: 'Knock Outs',
    description: 'Total opponents knocked out per player.',
    scoreUnit: 'KOs',
    sortOrder: 'DESC',
  },
  {
    id: 'transactions',
    name: 'Transactions',
    description: 'Total on-chain transactions submitted by this player.',
    scoreUnit: 'Transactions',
    sortOrder: 'DESC',
  },
  {
    id: 'volume',
    name: 'USD Volume',
    description: 'Total USD volume wagered per player. Requires API key.',
    scoreUnit: 'USD Volume',
    sortOrder: 'DESC',
    auth: true,
  },
];

// ── User records (Main Wallets) ───────────────────────────────────────────────

export interface UserRecord {
  /** Main Wallet address */
  address: string;
  displayName?: string;
  achievements: string[];
  /** Score per channel */
  scores: Record<string, number>;
  /** Total interactions per channel */
  matchesPlayed: Record<string, number>;
}

export const USERS: UserRecord[] = [
  {
    address: 'mn_main_driftking',
    displayName: 'DriftKing',
    achievements: ['first_race', 'speed_demon', 'podium_finish', 'knockout_artist'],
    scores: { leaderboard: 45.2, kos: 8750, transactions: 312, volume: 50000 },
    matchesPlayed: { leaderboard: 145, kos: 312, transactions: 312 },
  },
  {
    address: 'mn_main_nightrider',
    displayName: 'NightRider',
    achievements: ['first_race', 'podium_finish', 'night_owl'],
    scores: { leaderboard: 46.8, kos: 7200, transactions: 198, volume: 38000 },
    matchesPlayed: { leaderboard: 97, kos: 198, transactions: 198 },
  },
  {
    address: 'mn_main_ghostracer',
    displayName: 'GhostRacer',
    achievements: ['first_race', 'night_owl'],
    scores: { leaderboard: 52.1, kos: 5100, transactions: 124, volume: 22000 },
    matchesPlayed: { leaderboard: 62, kos: 124, transactions: 124 },
  },
  {
    address: 'mn_main_voidrunner',
    achievements: ['first_race'],
    scores: { leaderboard: 58.3, kos: 3400, transactions: 87, volume: 15000 },
    matchesPlayed: { leaderboard: 43, kos: 87, transactions: 87 },
  },
  {
    address: 'mn_main_neonstreak',
    displayName: 'NeonStreak',
    achievements: ['first_race', 'speed_demon'],
    scores: { leaderboard: 61.7, kos: 1200, transactions: 45, volume: 5000 },
    matchesPlayed: { leaderboard: 22, kos: 45, transactions: 45 },
  },
];

// ── Delegation map: Session Wallet → Main Wallet ──────────────────────────────
//
// By default a new Session Wallet delegates to itself. Here we register
// explicit delegations so the demo shows cross-wallet identity resolution.

export const DELEGATION_MAP: Record<string, string> = {
  mn_session_abc123: 'mn_main_driftking',  // DriftKing's primary session
  mn_session_ghi789: 'mn_main_driftking',  // DriftKing's secondary session
  mn_session_def456: 'mn_main_nightrider',
  mn_session_jkl012: 'mn_main_ghostracer',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve any address (Main or Session) to its UserRecord. */
export function resolveUser(address: string): UserRecord | undefined {
  const direct = USERS.find((u) => u.address === address);
  if (direct) return direct;

  const mainAddress = DELEGATION_MAP[address];
  if (mainAddress) return USERS.find((u) => u.address === mainAddress);

  return undefined;
}

/** Return all Session Wallets that delegate to the given Main Wallet. */
export function getSessionWallets(mainAddress: string): string[] {
  return Object.entries(DELEGATION_MAP)
    .filter(([, main]) => main === mainAddress)
    .map(([session]) => session);
}

/** Look up a channel definition by ID. */
export function getChannelDef(channelId: string): ChannelDef | undefined {
  return CHANNEL_DEFS.find((c) => c.id === channelId);
}
