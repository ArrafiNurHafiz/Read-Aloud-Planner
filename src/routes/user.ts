import { FastifyInstance } from 'fastify';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/settings', async (req, reply) => {
    const res = await query('SELECT settings_json FROM users WHERE id = $1', [req.user!.id]);
    return reply.send({ settings: res.rows[0]?.settings_json || {} });
  });

  fastify.patch('/settings', async (req, reply) => {
    const settings = req.body as any;
    await query('UPDATE users SET settings_json = $1 WHERE id = $2', [JSON.stringify(settings), req.user!.id]);
    return reply.send({ message: 'Pengaturan berhasil diperbarui.', settings });
  });
}
