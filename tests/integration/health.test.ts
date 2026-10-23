import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../../src/server.js';
import type { FastifyInstance } from 'fastify';

describe('GET /api/health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns healthy status code 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health'
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('healthy');
  });

  it('serves static index.html from public', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/index.html'
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('Read Aloud Planner');
  });
});
