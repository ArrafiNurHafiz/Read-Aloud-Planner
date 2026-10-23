import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../../src/server.js';
import { pool } from '../../src/db/pool.js';
import type { FastifyInstance } from 'fastify';

describe('Activities CRUD API', () => {
  let app: FastifyInstance;
  let sessionCookie: string;
  let testUserId: string;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();

    // Register & Login
    const email = `act-test-${Date.now()}@test.com`;
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'password-rahasia-1234' }
    });
    testUserId = JSON.parse(regRes.body).user_id;

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'password-rahasia-1234' }
    });
    sessionCookie = loginRes.headers['set-cookie'] as string;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    await app.close();
  });

  it('creates and reads an activity with linear sentence', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/activities',
      headers: { cookie: sessionCookie },
      payload: {
        title: 'Kelas Aksesibilitas',
        date: '2026-10-26',
        start_time: '10:00',
        duration_min: 60,
        location: 'Lab Komputer'
      }
    });

    expect(createRes.statusCode).toBe(201);
    const created = JSON.parse(createRes.body);
    expect(created.linear_sentence).toContain('Kelas Aksesibilitas');

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/activities?date=2026-10-26',
      headers: { cookie: sessionCookie }
    });

    expect(getRes.statusCode).toBe(200);
    const list = JSON.parse(getRes.body);
    expect(list.count).toBe(1);
    expect(list.activities[0].linear_sentence).toContain('Senin, 10.00, Kelas Aksesibilitas, 1 jam, Lab Komputer.');
  });
});
