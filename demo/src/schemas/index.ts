import { Type, Static } from '@sinclair/typebox';

// ── Shared sub-objects ────────────────────────────────────────────────────────

export const AchievementSchema = Type.Object({
  name: Type.String(),
  displayName: Type.String(),
  description: Type.String(),
  isActive: Type.Boolean(),
  iconURI: Type.Optional(Type.String()),
  percentCompleted: Type.Optional(Type.Number()),
});
export type Achievement = Static<typeof AchievementSchema>;

export const ChannelDefSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.String(),
  scoreUnit: Type.String(),
  sortOrder: Type.Union([Type.Literal('ASC'), Type.Literal('DESC')]),
  type: Type.Optional(Type.Union([Type.Literal('cumulative'), Type.Literal('snapshot')])),
  auth: Type.Optional(Type.Boolean()),
});
export type ChannelDef = Static<typeof ChannelDefSchema>;

// ── GET /metrics ─────────────────────────────────────────────────────────────

export const MetricsResponseSchema = Type.Object({
  name: Type.String(),
  description: Type.String(),
  achievements: Type.Array(AchievementSchema),
  channels: Type.Array(ChannelDefSchema),
});
export type MetricsResponse = Static<typeof MetricsResponseSchema>;

// ── GET /metrics/:channel ────────────────────────────────────────────────────

export const ChannelParamsSchema = Type.Object({
  channel: Type.String(),
});

export const ChannelQuerySchema = Type.Object({
  startDate: Type.Optional(Type.String({ format: 'date-time' })),
  endDate: Type.Optional(Type.String({ format: 'date-time' })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 1000, default: 50 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
  minAchievements: Type.Optional(Type.Integer({ minimum: 0 })),
  api_key: Type.Optional(Type.String()),
});
export type ChannelQuery = Static<typeof ChannelQuerySchema>;

export const RankingEntrySchema = Type.Object({
  rank: Type.Integer(),
  address: Type.String(),
  displayName: Type.Union([Type.String(), Type.Null()]),
  score: Type.Number(),
});
export type RankingEntry = Static<typeof RankingEntrySchema>;

export const ChannelRankingsResponseSchema = Type.Object({
  channel: Type.String(),
  startDate: Type.Optional(Type.String()),
  endDate: Type.Optional(Type.String()),
  totalPlayers: Type.Integer(),
  totalScore: Type.Number(),
  entries: Type.Array(RankingEntrySchema),
});
export type ChannelRankingsResponse = Static<typeof ChannelRankingsResponseSchema>;

// ── GET /metrics/users/:address ───────────────────────────────────────────────

export const UserParamsSchema = Type.Object({
  address: Type.String(),
});

export const UserQuerySchema = Type.Object({
  // Accepts a single value or multiple: ?channel=a&channel=b
  channel: Type.Optional(Type.Union([Type.String(), Type.Array(Type.String())])),
  startDate: Type.Optional(Type.String({ format: 'date-time' })),
  endDate: Type.Optional(Type.String({ format: 'date-time' })),
  api_key: Type.Optional(Type.String()),
});
export type UserQuery = Static<typeof UserQuerySchema>;

export const IdentitySchema = Type.Object({
  address: Type.String(),
  delegatedFrom: Type.Array(Type.String()),
  displayName: Type.Optional(Type.String()),
});
export type Identity = Static<typeof IdentitySchema>;

export const StatsSchema = Type.Object({
  score: Type.Number(),
  rank: Type.Integer(),
  matchesPlayed: Type.Optional(Type.Integer()),
});
export type Stats = Static<typeof StatsSchema>;

export const ChannelEntrySchema = Type.Object({
  startDate: Type.Optional(Type.String()),
  endDate: Type.Optional(Type.String()),
  stats: StatsSchema,
});
export type ChannelEntry = Static<typeof ChannelEntrySchema>;

export const UserProfileResponseSchema = Type.Object({
  identity: IdentitySchema,
  achievements: Type.Array(Type.String()),
  channels: Type.Optional(Type.Record(Type.String(), ChannelEntrySchema)),
});
export type UserProfileResponse = Static<typeof UserProfileResponseSchema>;

// ── Error ─────────────────────────────────────────────────────────────────────

export const ErrorSchema = Type.Object({ error: Type.String() });
