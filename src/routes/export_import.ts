import { FastifyInstance } from 'fastify';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { generateICS, parseICS } from '../services/ical.js';
import { randomUUID } from 'node:crypto';

export async function exportRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/export', async (req, reply) => {
    const userId = req.user!.id;
    const { format } = req.query as { format?: string };

    const res = await query(
      `SELECT id, title, TO_CHAR(date, 'YYYY-MM-DD') as date, start_time::text, duration_min, location, notes
       FROM activities WHERE user_id = $1 ORDER BY date ASC, start_time ASC`,
      [userId]
    );

    if (format === 'ics') {
      const ics = generateICS(res.rows);
      reply.header('Content-Type', 'text/calendar; charset=utf-8');
      reply.header('Content-Disposition', 'attachment; filename="jadwal.ics"');
      return reply.send(ics);
    }

    return reply.send({ activities: res.rows });
  });

  fastify.post('/import', async (req, reply) => {
    const userId = req.user!.id;
    const { format, data } = (req.body as any) || {};

    if (!data) return reply.status(400).send({ error: 'Data impor kosong.' });

    let itemsToInsert: any[] = [];
    if (format === 'ics') {
      itemsToInsert = parseICS(data);
    } else {
      itemsToInsert = Array.isArray(data) ? data : data.activities || [];
    }

    for (const item of itemsToInsert) {
      if (item.title && item.date && item.start_time) {
        await query(
          `INSERT INTO activities (id, user_id, title, date, start_time, duration_min, location, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            randomUUID(),
            userId,
            item.title,
            item.date,
            item.start_time,
            item.duration_min || 60,
            item.location || '',
            item.notes || ''
          ]
        );
      }
    }

    return reply.send({ message: `Berhasil mengimpor ${itemsToInsert.length} kegiatan.` });
  });

  fastify.delete('/account', async (req, reply) => {
    const userId = req.user!.id;
    await query('DELETE FROM users WHERE id = $1', [userId]);
    reply.clearCookie('session_id', { path: '/' });
    return reply.send({ message: 'Akun dan seluruh data kegiatan telah dihapus permanen.' });
  });
}
