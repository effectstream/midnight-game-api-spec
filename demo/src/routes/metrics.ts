import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { MetricsResponseSchema } from '../schemas/index.js';
import { APP_NAME, APP_DESCRIPTION, ACHIEVEMENTS, CHANNEL_DEFS } from '../data/store.js';

const metricsRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/metrics',
    {
      schema: {
        response: { 200: MetricsResponseSchema },
      },
    },
    async () => ({
      name: APP_NAME,
      description: APP_DESCRIPTION,
      achievements: ACHIEVEMENTS,
      channels: CHANNEL_DEFS,
    }),
  );
};

export default metricsRoute;
