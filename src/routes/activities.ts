import { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { formatLinearSentence } from '../services/formatter.js';

export async function activityRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', async (req, reply) => {
    const userId = req.user!.id;
    const { date } = req.query as { date?: string };
    const targetDate = date || new Date().toISOString().split('T')[0];

    const res = await query(
      `SELECT id, title, TO_CHAR(date, 'YYYY-MM-DD') as date, start_time::text, duration_min, location, notes, done, timezone
       FROM activities
       WHERE user_id = $1 AND date = $2
       ORDER BY start_time ASC`,
      [userId, targetDate]
    );

    const activities = res.rows.map((row) => ({
      ...row,
      linear_sentence: formatLinearSentence({
        title: row.title,
        date: row.date,
        start_time: row.start_time,
        duration_min: row.duration_min,
        location: row.location,
        notes: row.notes,
        done: row.done
      }, 'id')
    }));

    return reply.send({ date: targetDate, count: activities.length, activities });
  });

  fastify.post('/', async (req, reply) => {
    const userId = req.user!.id;
    const { title, date, start_time, duration_min, location, notes, timezone } = (req.body as any) || {};

    if (!title || !date || !start_time || !duration_min) {
      return reply.status(400).send({ error: 'Judul, tanggal, jam mulai, dan durasi wajib diisi.' });
    }

    const id = randomUUID();
    await query(
      `INSERT INTO activities (id, user_id, title, date, start_time, duration_min, location, notes, timezone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, userId, title, date, start_time, duration_min, location || '', notes || '', timezone || 'Asia/Jakarta']
    );

    const linear = formatLinearSentence({
      title,
      date,
      start_time,
      duration_min,
      location: location || '',
      notes: notes || '',
      done: false
    }, 'id');

    return reply.status(201).send({ message: 'Kegiatan berhasil disimpan.', id, linear_sentence: linear });
  });

  fastify.patch('/:id', async (req, reply) => {
    const userId = req.user!.id;
    const { id } = req.params as { id: string };
    const { done, title, date, start_time, duration_min, location, notes } = (req.body as any) || {};

    const existing = await query(
      `SELECT id, user_id, title, TO_CHAR(date, 'YYYY-MM-DD') as date, start_time::text, duration_min, location, notes, done
       FROM activities WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (existing.rowCount === 0) {
      return reply.status(404).send({ error: 'Kegiatan tidak ditemukan.' });
    }

    const current = existing.rows[0];
    const newDone = done !== undefined ? Boolean(done) : current.done;
    const newTitle = title !== undefined ? title : current.title;
    const newDate = date !== undefined ? date : current.date;
    const newStart = start_time !== undefined ? start_time : current.start_time;
    const newDur = duration_min !== undefined ? duration_min : current.duration_min;
    const newLoc = location !== undefined ? location : current.location;
    const newNotes = notes !== undefined ? notes : current.notes;

    await query(
      `UPDATE activities
       SET done = $1, title = $2, date = $3, start_time = $4, duration_min = $5, location = $6, notes = $7, updated_at = NOW()
       WHERE id = $8 AND user_id = $9`,
      [newDone, newTitle, newDate, newStart, newDur, newLoc, newNotes, id, userId]
    );

    const updatedLinear = formatLinearSentence({
      title: newTitle,
      date: newDate,
      start_time: newStart,
      duration_min: newDur,
      location: newLoc,
      notes: newNotes,
      done: newDone
    }, 'id');

    return reply.send({ message: 'Kegiatan diperbarui.', id, done: newDone, linear_sentence: updatedLinear });
  });

  fastify.delete('/:id', async (req, reply) => {
    const userId = req.user!.id;
    const { id } = req.params as { id: string };

    const res = await query('DELETE FROM activities WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (res.rowCount === 0) {
      return reply.status(404).send({ error: 'Kegiatan tidak ditemukan.' });
    }

    return reply.send({ message: 'Kegiatan berhasil dihapus.', id });
  });
}
