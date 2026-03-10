import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  UserParamsSchema,
  UserQuerySchema,
  UserProfileResponseSchema,
  ErrorSchema,
  ChannelEntry,
} from '../schemas/index.js';
import { USERS, resolveUser, getSessionWallets, getChannelDef, DEMO_API_KEY } from '../data/store.js';

/** Default date window: now − 1 year → now */
function defaultDateWindow() {
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return { now: now.toISOString(), oneYearAgo: oneYearAgo.toISOString() };
}

/** Normalise the `channel` query param — single string or string[] → string[] */
function normaliseChannels(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

const usersRoute: FastifyPluginAsyncTypebox = async (app) => {
  // Register BEFORE /metrics/:channel so the static segment `users` wins.
  app.get(
    '/metrics/users/:address',
    {
      schema: {
        params: UserParamsSchema,
        querystring: UserQuerySchema,
        response: {
          200: UserProfileResponseSchema,
          401: ErrorSchema,
          404: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { address } = request.params;
      const { startDate, endDate, api_key } = request.query;

      const user = resolveUser(address);
      if (!user) {
        return reply.status(404).send({ error: `Address '${address}' not found.` });
      }

      const requestedChannels = normaliseChannels(request.query.channel);

      // Gate any private channels behind the API key
      const privateChannels = requestedChannels.filter((ch) => getChannelDef(ch)?.auth === true);
      if (privateChannels.length > 0) {
        const apiKey = (request.headers['x-api-key'] as string | undefined) ?? api_key;
        if (!apiKey || apiKey !== DEMO_API_KEY) {
          return reply.status(401).send({ error: 'API key is missing or invalid.' });
        }
      }

      const identity = {
        address: user.address,
        delegatedFrom: getSessionWallets(user.address),
        ...(user.displayName !== undefined && { displayName: user.displayName }),
      };

      // No channel params → identity + achievements only (useful for identity resolution)
      if (requestedChannels.length === 0) {
        return { identity, achievements: user.achievements };
      }

      // Date defaults for cumulative channels
      const { now, oneYearAgo } = defaultDateWindow();
      const appliedStart = startDate ?? oneYearAgo;
      const appliedEnd = endDate ?? now;

      // Build per-channel stats
      const channels: Record<string, ChannelEntry> = {};

      for (const channelId of requestedChannels) {
        const channelDef = getChannelDef(channelId);
        if (!channelDef) continue; // skip unknown channels

        const isSnapshot = channelDef.type === 'snapshot';

        // Compute dynamic rank within this channel
        const usersWithScore = USERS.filter((u) => u.scores[channelId] !== undefined);
        usersWithScore.sort((a, b) =>
          channelDef.sortOrder === 'ASC'
            ? a.scores[channelId] - b.scores[channelId]
            : b.scores[channelId] - a.scores[channelId],
        );
        const rank = usersWithScore.findIndex((u) => u.address === user.address) + 1;

        channels[channelId] = {
          ...(!isSnapshot && { startDate: appliedStart, endDate: appliedEnd }),
          stats: {
            score: user.scores[channelId] ?? 0,
            rank: rank > 0 ? rank : 0,
            ...(user.matchesPlayed[channelId] !== undefined && {
              matchesPlayed: user.matchesPlayed[channelId],
            }),
          },
        };
      }

      return { identity, achievements: user.achievements, channels };
    },
  );
};

export default usersRoute;
