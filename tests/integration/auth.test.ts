import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../../src/server.js';
import { pool } from '../../src/db/pool.js';
import type { FastifyInstance } from 'fastify';

describe('Auth Endpoints', () => {
  let app: FastifyInstance;
  const testEmail = `user-${Date.now()}@example.com`;
  const testPassword = 'rahasia-banget-1234';

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    await app.close();
  });

  it('rejects short passwords', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: testEmail, password: 'short' }
    });
    expect(res.statusCode).toBe(400);
  });

  it('registers a user successfully', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: testEmail, password: testPassword }
    });
    expect(res.statusCode).toBe(201);
  });

  it('logs in and issues session cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: testEmail, password: testPassword }
    });
    expect(res.statusCode).toBe(200);
    expect(res.cookies.some((c) => c.name === 'session_id')).toBe(true);
  });
});
