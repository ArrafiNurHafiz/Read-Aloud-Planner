import Fastify, { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import fs from 'node:fs';
import { authRoutes } from './routes/auth.js';
import { activityRoutes } from './routes/activities.js';
import { userRoutes } from './routes/user.js';
import { exportRoutes } from './routes/export_import.js';

export function buildServer(): FastifyInstance {
  const fastify = Fastify({ logger: false });

  fastify.register(helmet, { contentSecurityPolicy: false });
  fastify.register(cors, { origin: true, credentials: true });
  fastify.register(cookie, { secret: process.env.COOKIE_SECRET || 'super-secret-cookie-key-32-chars!' });
  fastify.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  const distFrontendPath = path.resolve(process.cwd(), 'dist-frontend');
  const publicPath = path.resolve(process.cwd(), 'public');
  const staticRoot = fs.existsSync(distFrontendPath)
    ? distFrontendPath
    : (fs.existsSync(publicPath) ? [publicPath, process.cwd()] : [process.cwd()]);

  fastify.register(fastifyStatic, {
    root: staticRoot,
    prefix: '/'
  });

  fastify.get('/api/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(activityRoutes, { prefix: '/api/activities' });
  fastify.register(userRoutes, { prefix: '/api/user' });
  fastify.register(exportRoutes, { prefix: '/api' });

  return fastify;
}

if (process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'))) {
  const server = buildServer();
  const PORT = Number(process.env.PORT) || 3000;
  server.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening on ${address}`);
  });
}
