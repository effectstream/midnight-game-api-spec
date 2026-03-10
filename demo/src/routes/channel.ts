import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  ChannelParamsSchema,
  ChannelQuerySchema,
  ChannelRankingsResponseSchema,
  ErrorSchema,
  RankingEntry,
} from '../schemas/index.js';
import { USERS, getChannelDef, DEMO_API_KEY } from '../data/store.js';

/** Default date window: now − 1 year → now */
function defaultDateWindow() {
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return { now: now.toISOString(), oneYearAgo: oneYearAgo.toISOString() };
}

const channelRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/metrics/:channel',
    {
      schema: {
        params: ChannelParamsSchema,
        querystring: ChannelQuerySchema,
        response: {
          200: ChannelRankingsResponseSchema,
          401: ErrorSchema,
          404: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { channel } = request.params;
      const { startDate, endDate, limit = 50, offset = 0, minAchievements, api_key } = request.query;

      const channelDef = getChannelDef(channel);
      if (!channelDef) {
        return reply.status(404).send({ error: `Channel '${channel}' not found.` });
      }

      // Authenticate private channels
      if (channelDef.auth) {
        const apiKey = (request.headers['x-api-key'] as string | undefined) ?? api_key;
        if (!apiKey || apiKey !== DEMO_API_KEY) {
          return reply.status(401).send({ error: 'API key is missing or invalid.' });
        }
      }

      const isSnapshot = channelDef.type === 'snapshot';
      const { now, oneYearAgo } = defaultDateWindow();
      const appliedStart = isSnapshot ? undefined : (startDate ?? oneYearAgo);
      const appliedEnd = isSnapshot ? undefined : (endDate ?? now);

      // Collect users with a score in this channel
      let usersWithScore = USERS.filter((u) => u.scores[channel] !== undefined);

      // Filter by minAchievements
      if (minAchievements !== undefined) {
        usersWithScore = usersWithScore.filter(
          (u) => u.achievements.length >= minAchievements,
        );
      }

      // Sort by sortOrder; ASC = lower is better (e.g. lap times)
      usersWithScore.sort((a, b) =>
        channelDef.sortOrder === 'ASC'
          ? a.scores[channel] - b.scores[channel]
          : b.scores[channel] - a.scores[channel],
      );

      // Assign 1-based ranks over the full sorted set
      const allEntries: RankingEntry[] = usersWithScore.map((user, idx) => ({
        rank: idx + 1,
        address: user.address,
        displayName: user.displayName ?? null,
        score: user.scores[channel],
      }));

      const totalPlayers = allEntries.length;
      const totalScore = allEntries.reduce((sum, e) => sum + e.score, 0);

      // Paginate
      const entries = allEntries.slice(offset, offset + limit);

      return {
        channel,
        ...(appliedStart !== undefined && { startDate: appliedStart }),
        ...(appliedEnd !== undefined && { endDate: appliedEnd }),
        totalPlayers,
        totalScore,
        entries,
      };
    },
  );
};

export default channelRoute;
