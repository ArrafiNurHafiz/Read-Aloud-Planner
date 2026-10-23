import { FastifyInstance } from 'fastify';
import '@fastify/cookie';
import { randomUUID } from 'node:crypto';
import { query } from '../db/pool.js';
import { validatePasswordStrength, hashPassword, verifyPassword } from '../services/password.js';
import { requireAuth } from '../middleware/auth.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (req, reply) => {
    const { email, password } = (req.body as any) || {};
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email dan kata sandi wajib diisi.' });
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return reply.status(400).send({ error: strength.reason });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rowCount && existing.rowCount > 0) {
      return reply.status(409).send({ error: 'Email sudah terdaftar.' });
    }

    const userId = randomUUID();
    const pwHash = await hashPassword(password);
    await query('INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)', [
      userId,
      email.toLowerCase(),
      pwHash
    ]);

    await query('INSERT INTO audit_log (user_id, action, ip) VALUES ($1, $2, $3)', [
      userId,
      'REGISTER',
      req.ip
    ]);

    return reply.status(201).send({ message: 'Registrasi berhasil.', user_id: userId });
  });

  fastify.post('/login', async (req, reply) => {
    const { email, password } = (req.body as any) || {};
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email dan kata sandi wajib diisi.' });
    }

    const res = await query('SELECT id, email, password_hash FROM users WHERE email = $1', [email.toLowerCase()]);
    if (res.rowCount === 0) {
      return reply.status(401).send({ error: 'Email atau kata sandi keliru.' });
    }

    const user = res.rows[0];
    const match = await verifyPassword(password, user.password_hash);
    if (!match) {
      return reply.status(401).send({ error: 'Email atau kata sandi keliru.' });
    }

    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days
    await query('INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)', [
      sessionId,
      user.id,
      expiresAt
    ]);

    await query('INSERT INTO audit_log (user_id, action, ip) VALUES ($1, $2, $3)', [
      user.id,
      'LOGIN',
      req.ip
    ]);

    reply.setCookie('session_id', sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt
    });

    return reply.send({ message: 'Login berhasil.', user: { id: user.id, email: user.email } });
  });

  fastify.post('/magic-link', async (req, reply) => {
    const { email } = (req.body as any) || {};
    if (!email) return reply.status(400).send({ error: 'Email wajib diisi.' });

    const userRes = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userRes.rowCount === 0) {
      return reply.send({ message: 'Bila email terdaftar, tautan login telah dikirim.' });
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await query('INSERT INTO magic_links (token, user_id, expires_at) VALUES ($1, $2, $3)', [
      token,
      userRes.rows[0].id,
      expiresAt
    ]);

    return reply.send({ message: 'Tautan login dikirim.', magic_token_debug: token });
  });

  fastify.get('/magic-link/verify', async (req, reply) => {
    const { token } = (req.query as any) || {};
    if (!token) return reply.status(400).send({ error: 'Token wajib disertakan.' });

    const res = await query(
      'DELETE FROM magic_links WHERE token = $1 AND expires_at > NOW() RETURNING user_id',
      [token]
    );

    if (res.rowCount === 0) {
      return reply.status(401).send({ error: 'Tautan kadaluarsa atau tidak valid.' });
    }

    const userId = res.rows[0].user_id;
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    await query('INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)', [
      sessionId,
      userId,
      expiresAt
    ]);

    reply.setCookie('session_id', sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      expires: expiresAt
    });

    return reply.send({ message: 'Login berhasil via magic link.' });
  });

  fastify.post('/logout', { preHandler: [requireAuth] }, async (req, reply) => {
    const sessionId = req.cookies['session_id'];
    if (sessionId) {
      await query('DELETE FROM sessions WHERE id = $1', [sessionId]);
      reply.clearCookie('session_id', { path: '/' });
    }
    return reply.send({ message: 'Logout berhasil.' });
  });

  fastify.get('/me', { preHandler: [requireAuth] }, async (req, reply) => {
    return reply.send({ user: req.user });
  });
}
