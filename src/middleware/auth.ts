import { FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/cookie';
import { query } from '../db/pool.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const sessionId = req.cookies['session_id'];
  if (!sessionId) {
    return reply.status(401).send({ error: 'Sesi tidak ditemukan atau kadaluarsa.' });
  }

  const res = await query(
    `SELECT u.id, u.email FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = $1 AND s.expires_at > NOW()`,
    [sessionId]
  );

  if (res.rowCount === 0) {
    return reply.status(401).send({ error: 'Sesi tidak valid.' });
  }

  req.user = res.rows[0];
}
