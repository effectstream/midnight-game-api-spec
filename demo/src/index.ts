import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import metricsRoute from './routes/metrics.js';
import usersRoute from './routes/users.js';   // registered first — static `users` wins over :channel
import channelRoute from './routes/channel.js';

const app = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

await app.register(metricsRoute);
await app.register(usersRoute);
await app.register(channelRoute);

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

await app.listen({ port: PORT, host: HOST });

const base = `http://localhost:${PORT}`;
console.log(`
╔══════════════════════════════════════════════════════╗
║          Cyber Drifter  ·  PRC-6 Demo API            ║
╠══════════════════════════════════════════════════════╣
║  GET ${base}/metrics                         ║
║  GET ${base}/metrics/leaderboard             ║
║  GET ${base}/metrics/kos                     ║
║  GET ${base}/metrics/transactions            ║
║  GET ${base}/metrics/volume          (auth)  ║
║  GET ${base}/metrics/users/:address          ║
╠══════════════════════════════════════════════════════╣
║  Demo API key : demo-api-key-12345                   ║
║  Demo wallets : mn_main_driftking                    ║
║                 mn_session_abc123  (→ driftking)     ║
╚══════════════════════════════════════════════════════╝
`);
