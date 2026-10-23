import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../../src/server.js';
import { pool } from '../../src/db/pool.js';
import type { FastifyInstance } from 'fastify';

describe('Export, Import & Account Deletion Endpoints', () => {
  let app: FastifyInstance;
  let cookie: string;
  let testUserId: string;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();

    const email = `exp-${Date.now()}@test.com`;
    const reg = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'password-rahasia-1234' }
    });
    testUserId = JSON.parse(reg.body).user_id;

    const log = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'password-rahasia-1234' }
    });
    cookie = log.headers['set-cookie'] as string;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    await app.close();
  });

  it('exports calendar in ICS format', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/export?format=ics',
      headers: { cookie }
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.body).toContain('BEGIN:VCALENDAR');
  });

  it('deletes account completely under right to erasure', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/account',
      headers: { cookie }
    });
    expect(res.statusCode).toBe(200);
    const chk = await pool.query('SELECT id FROM users WHERE id = $1', [testUserId]);
    expect(chk.rowCount).toBe(0);
  });
});
