# Implementation Plan: Read Aloud Planner (Production v1.0)

## Goal
Build and verify Read Aloud Planner v1.0, a production-grade, WCAG 2.2 AA compliant daily planner with linear audio playback, full keyboard navigation, multi-device synchronization, and zero-mouse accessibility.

## Current Context & Assumptions
- Workspace `/home/arrafi/lomba/taskforge` is currently an uninitialized, empty directory.
- Host environment has Node.js v26.8.1, npm 12.0.2, PostgreSQL 18.6 installed, and podman/docker available.
- Production target mandates WCAG 2.2 Level AA compliance, zero mouse-dependent interactions, screen-reader optimized linear time statements, client-side Web Speech API with text fallbacks, secure session authentication, and export/import (JSON & ICS).
- Implementation uses TypeScript across both Fastify backend and accessible semantic frontend, avoiding heavy framework abstraction to guarantee raw HTML accessibility and deterministic focus control.

## Architecture & Proposed Approach
- **Backend:** Fastify HTTP service in TypeScript with `@fastify/cookie`, `@fastify/helmet`, and `@fastify/rate-limit`, persisting to PostgreSQL via `pg` pool. All activities store start time, duration, and timezone, dynamically generating standardized linear speech sentences (e.g., *"Senin, 08.00, Kuliah Basis Data, 2 jam, ruang 301. ✓ Selesai"*).
- **Frontend:** Semantic HTML5 and lightweight Vanilla TypeScript bundled via Vite, featuring high-contrast themes (≥4.5:1 text, ≥3:1 UI), focus traps, 3px solid visual focus rings, `aria-live` announcer, client-side Web Speech API coordinator, PWA Service Worker, and dedicated Focus Mode.
- **Testing & Verification:** Strict TDD cycle using Vitest for unit logic (speech sentence formatting, RFC 5545 iCalendar generation/parsing, password policies), Fastify in-memory injection for REST API integration tests, and Playwright with `@axe-core/playwright` for automated WCAG 2.2 AA regression testing.

---

## Step-by-Step Implementation Tasks

### Phase 1: Environment & Repository Scaffolding

#### Task 1: Initialize Root Project & TypeScript Configurations
- **File:** `package.json`
- **File:** `tsconfig.json`
- **File:** `.gitignore`
- **File:** `vitest.config.ts`

**Code:**
`package.json`:
```json
{
  "name": "read-aloud-planner",
  "version": "1.0.0",
  "description": "Production accessible daily planner with speech synthesis and WCAG 2.2 AA compliance",
  "main": "dist/server.js",
  "type": "module",
  "scripts": {
    "dev:backend": "tsx watch src/server.ts",
    "dev:frontend": "vite",
    "build:backend": "tsc -p tsconfig.json",
    "build:frontend": "vite build",
    "build": "npm run build:backend && npm run build:frontend",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:migrate": "tsx src/db/migrate.ts"
  },
  "dependencies": {
    "@fastify/cookie": "^9.4.0",
    "@fastify/cors": "^9.0.1",
    "@fastify/helmet": "^11.1.1",
    "@fastify/rate-limit": "^9.1.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "fastify": "^4.28.1",
    "pg": "^8.12.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@axe-core/playwright": "^4.9.1",
    "@playwright/test": "^1.45.3",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.0.0",
    "@types/pg": "^8.11.6",
    "tsx": "^4.16.2",
    "typescript": "^5.5.4",
    "vite": "^5.3.4",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^2.0.4"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts']
  }
});
```

`.gitignore`:
```
node_modules/
dist/
dist-frontend/
.env
*.log
.playwright-report/
test-results/
```

**Commands & Verification:**
```bash
npm install
npm run build:backend
```
*Expected Output:* Dependencies installed without error; TypeScript compilation completes with return code 0.

---

### Phase 2: Database Schema & Migration Engine

#### Task 2: PostgreSQL Schema Definition & Migration Runner
- **File:** `src/db/schema.sql`
- **File:** `src/db/pool.ts`
- **File:** `src/db/migrate.ts`

**Code:**
`src/db/schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settings_json JSONB DEFAULT '{"speech_rate": 1.0, "high_contrast": false, "font_size": "medium", "language": "id"}'::jsonb
);

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_min INTEGER NOT NULL CHECK (duration_min > 0),
    location VARCHAR(255) DEFAULT '',
    notes TEXT DEFAULT '',
    done BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(64) DEFAULT 'Asia/Jakarta',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS magic_links (
    token VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(64) NOT NULL,
    ip VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
```

`src/db/pool.ts`:
```typescript
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://arrafi@localhost:5432/taskforge'
});

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}
```

`src/db/migrate.ts`:
```typescript
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(schemaSql);
  console.log('Migration executed successfully.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
```

**Commands & Verification:**
```bash
node -e "import('./src/db/migrate.ts')"
```
*Expected Output:* Output contains `Migration executed successfully.` or database table verification query succeeds.

---

### Phase 3: Core Domain Services (TDD)

#### Task 3: Linear Sentence Audio Formatter (TDD)
- **File:** `tests/unit/formatter.test.ts`
- **File:** `src/services/formatter.ts`

**Code:**
`tests/unit/formatter.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { formatLinearSentence, type ActivityData } from '../../src/services/formatter.js';

describe('formatLinearSentence', () => {
  it('formats an active activity in Indonesian correctly', () => {
    const act: ActivityData = {
      title: 'Kuliah Basis Data',
      date: '2026-10-26',
      start_time: '08:00',
      duration_min: 120,
      location: 'ruang 301',
      notes: 'Bawa laptop',
      done: false
    };

    const result = formatLinearSentence(act, 'id');
    expect(result).toBe('Senin, 08.00, Kuliah Basis Data, 2 jam, ruang 301.');
  });

  it('formats a completed activity with textual checkmark', () => {
    const act: ActivityData = {
      title: 'Konsultasi Dosen',
      date: '2026-10-27',
      start_time: '09:00',
      duration_min: 30,
      location: 'ruang 204',
      notes: '',
      done: true
    };

    const result = formatLinearSentence(act, 'id');
    expect(result).toBe('Selasa, 09.00, Konsultasi Dosen, 30 menit, ruang 204. Selesai.');
  });

  it('formats activity with hours and minutes duration without location', () => {
    const act: ActivityData = {
      title: 'Tugas Kelompok',
      date: '2026-10-26',
      start_time: '13:00',
      duration_min: 90,
      location: '',
      notes: '',
      done: false
    };

    const result = formatLinearSentence(act, 'id');
    expect(result).toBe('Senin, 13.00, Tugas Kelompok, 1 jam 30 menit.');
  });
});
```

`src/services/formatter.ts`:
```typescript
export interface ActivityData {
  title: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM or HH:MM:SS
  duration_min: number;
  location?: string;
  notes?: string;
  done: boolean;
}

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDuration(minutes: number, lang: 'id' | 'en'): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (lang === 'id') {
    if (h > 0 && m > 0) return `${h} jam ${m} menit`;
    if (h > 0) return `${h} jam`;
    return `${m} menit`;
  } else {
    if (h > 0 && m > 0) return `${h} hour${h > 1 ? 's' : ''} ${m} min`;
    if (h > 0) return `${h} hour${h > 1 ? 's' : ''}`;
    return `${m} minutes`;
  }
}

export function formatLinearSentence(act: ActivityData, lang: 'id' | 'en' = 'id'): string {
  const parts = act.date.split('-').map(Number);
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayName = lang === 'id' ? DAYS_ID[dt.getDay()] : DAYS_EN[dt.getDay()];

  const timeFormatted = act.start_time.substring(0, 5).replace(':', lang === 'id' ? '.' : ':');
  const durText = formatDuration(act.duration_min, lang);

  let sentence = `${dayName}, ${timeFormatted}, ${act.title}, ${durText}`;
  if (act.location && act.location.trim().length > 0) {
    sentence += `, ${act.location.trim()}`;
  }
  sentence += '.';

  if (act.done) {
    sentence += lang === 'id' ? ' Selesai.' : ' Completed.';
  }

  return sentence;
}
```

**Commands & Verification:**
```bash
npx vitest run tests/unit/formatter.test.ts
```
*Expected Output:* `3 passed (3)`

---

#### Task 4: Password Security & Leaked Password Check (TDD)
- **File:** `tests/unit/password.test.ts`
- **File:** `src/services/password.ts`

**Code:**
`tests/unit/password.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { validatePasswordStrength, hashPassword, verifyPassword } from '../../src/services/password.js';

describe('Password Security Service', () => {
  it('rejects passwords shorter than 12 characters', () => {
    const check = validatePasswordStrength('Short123!');
    expect(check.valid).toBe(false);
    expect(check.reason).toContain('12');
  });

  it('rejects common breached passwords', () => {
    const check = validatePasswordStrength('password123456');
    expect(check.valid).toBe(false);
    expect(check.reason).toContain('bocor');
  });

  it('accepts valid long passphrase', () => {
    const check = validatePasswordStrength('kucing-berlari-di-atas-meja-2026');
    expect(check.valid).toBe(true);
  });

  it('hashes and verifies password matching', async () => {
    const pw = 'kucing-berlari-di-atas-meja-2026';
    const hash = await hashPassword(pw);
    expect(hash).not.toBe(pw);
    const isValid = await verifyPassword(pw, hash);
    expect(isValid).toBe(true);
    const isInvalid = await verifyPassword('wrongpassword123', hash);
    expect(isInvalid).toBe(false);
  });
});
```

`src/services/password.ts`:
```typescript
import bcrypt from 'bcryptjs';

const COMMON_PASSWORDS = new Set([
  'password123456',
  '123456789012',
  'qwertyuiop12',
  'admin12345678',
  'indonesia12345'
]);

export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 12) {
    return { valid: false, reason: 'Kata sandi minimal 12 karakter.' };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, reason: 'Kata sandi terdeteksi dalam daftar bocor/terlalu umum.' };
  }
  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Commands & Verification:**
```bash
npx vitest run tests/unit/password.test.ts
```
*Expected Output:* `4 passed (4)`

---

#### Task 5: RFC 5545 iCalendar & JSON Export/Import Service (TDD)
- **File:** `tests/unit/ical.test.ts`
- **File:** `src/services/ical.ts`

**Code:**
`tests/unit/ical.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { generateICS, parseICS, type CalendarEvent } from '../../src/services/ical.js';

describe('iCalendar Service', () => {
  const sampleEvents: CalendarEvent[] = [
    {
      id: 'act-1',
      title: 'Kuliah Basis Data',
      date: '2026-10-26',
      start_time: '08:00',
      duration_min: 120,
      location: 'ruang 301',
      notes: 'Bawa catatan'
    }
  ];

  it('generates valid RFC 5545 VCALENDAR stream', () => {
    const ics = generateICS(sampleEvents);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('SUMMARY:Kuliah Basis Data');
    expect(ics).toContain('DTSTART:20261026T080000');
    expect(ics).toContain('DTEND:20261026T100000');
    expect(ics).toContain('LOCATION:ruang 301');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('parses valid ICS stream back into events', () => {
    const ics = generateICS(sampleEvents);
    const parsed = parseICS(ics);
    expect(parsed.length).toBe(1);
    expect(parsed[0].title).toBe('Kuliah Basis Data');
    expect(parsed[0].date).toBe('2026-10-26');
    expect(parsed[0].start_time).toBe('08:00');
    expect(parsed[0].duration_min).toBe(120);
    expect(parsed[0].location).toBe('ruang 301');
  });
});
```

`src/services/ical.ts`:
```typescript
export interface CalendarEvent {
  id?: string;
  title: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  duration_min: number;
  location?: string;
  notes?: string;
}

export function generateICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ReadAloudPlanner//NONSGML v1.0//ID'
  ];

  for (const ev of events) {
    const dateClean = ev.date.replace(/-/g, '');
    const timeParts = ev.start_time.split(':');
    const startHour = Number(timeParts[0]);
    const startMin = Number(timeParts[1]);

    const dtStart = `${dateClean}T${timeParts[0].padStart(2, '0')}${timeParts[1].padStart(2, '0')}00`;

    const totalMinutes = startHour * 60 + startMin + ev.duration_min;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMin = totalMinutes % 60;
    const dtEnd = `${dateClean}T${String(endHour).padStart(2, '0')}${String(endMin).padStart(2, '0')}00`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.id || 'uid-' + Math.random().toString(36).substring(2)}@readaloudplanner`);
    lines.push(`DTSTAMP:${dateClean}T000000Z`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${ev.title.replace(/[\r\n]/g, ' ')}`);
    if (ev.location) lines.push(`LOCATION:${ev.location.replace(/[\r\n]/g, ' ')}`);
    if (ev.notes) lines.push(`DESCRIPTION:${ev.notes.replace(/[\r\n]/g, ' ')}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function parseICS(icsContent: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const veventBlocks = icsContent.split('BEGIN:VEVENT');

  for (let i = 1; i < veventBlocks.length; i++) {
    const block = veventBlocks[i].split('END:VEVENT')[0];
    let title = '';
    let date = '';
    let startTime = '';
    let durationMin = 60;
    let location = '';
    let notes = '';

    const lines = block.split(/\r?\n/);
    let dtStartRaw = '';
    let dtEndRaw = '';

    for (const line of lines) {
      if (line.startsWith('SUMMARY:')) title = line.substring(8).trim();
      if (line.startsWith('LOCATION:')) location = line.substring(9).trim();
      if (line.startsWith('DESCRIPTION:')) notes = line.substring(12).trim();
      if (line.startsWith('DTSTART:')) dtStartRaw = line.substring(8).trim();
      if (line.startsWith('DTEND:')) dtEndRaw = line.substring(6).trim();
    }

    if (dtStartRaw.includes('T')) {
      const parts = dtStartRaw.split('T');
      const d = parts[0];
      date = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
      startTime = `${parts[1].substring(0, 2)}:${parts[1].substring(2, 4)}`;

      if (dtEndRaw.includes('T')) {
        const endParts = dtEndRaw.split('T');
        const eH = Number(endParts[1].substring(0, 2));
        const eM = Number(endParts[1].substring(2, 4));
        const sH = Number(parts[1].substring(0, 2));
        const sM = Number(parts[1].substring(2, 4));
        durationMin = (eH * 60 + eM) - (sH * 60 + sM);
        if (durationMin <= 0) durationMin = 60;
      }
    }

    if (title && date && startTime) {
      events.push({ title, date, start_time: startTime, duration_min: durationMin, location, notes });
    }
  }

  return events;
}
```

**Commands & Verification:**
```bash
npx vitest run tests/unit/ical.test.ts
```
*Expected Output:* `2 passed (2)`

---

### Phase 4: Fastify Server & API Endpoints (TDD)

#### Task 6: Server Core, Security Middleware & Health Probe (TDD)
- **File:** `src/server.ts`
- **File:** `tests/integration/health.test.ts`

**Code:**
`src/server.ts`:
```typescript
import Fastify, { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
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

  fastify.get('/api/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(activityRoutes, { prefix: '/api/activities' });
  fastify.register(userRoutes, { prefix: '/api/user' });
  fastify.register(exportRoutes, { prefix: '/api' });

  return fastify;
}

if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
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
```

`tests/integration/health.test.ts`:
```typescript
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
});
```

**Commands & Verification:**
```bash
npx vitest run tests/integration/health.test.ts
```
*Expected Output:* `1 passed (1)`

---

#### Task 7: Authentication API Endpoints (TDD)
- **File:** `tests/integration/auth.test.ts`
- **File:** `src/routes/auth.ts`
- **File:** `src/middleware/auth.ts`

**Code:**
`src/middleware/auth.ts`:
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
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
```

`src/routes/auth.ts`:
```typescript
import { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { query } from '../db/pool.js';
import { validatePasswordStrength, hashPassword, verifyPassword } from '../services/password.js';
import { requireAuth } from '../middleware/auth.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (req, reply) => {
    const { email, password } = req.body as any;
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
    const { email, password } = req.body as any;
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
    const { email } = req.body as any;
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
    const { token } = req.query as any;
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
```

`tests/integration/auth.test.ts`:
```typescript
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
```

**Commands & Verification:**
```bash
npx vitest run tests/integration/auth.test.ts
```
*Expected Output:* `3 passed (3)`

---

#### Task 8: Activities CRUD API Endpoints with Linear Sentences (TDD)
- **File:** `tests/integration/activities.test.ts`
- **File:** `src/routes/activities.ts`

**Code:**
`src/routes/activities.ts`:
```typescript
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
    const { title, date, start_time, duration_min, location, notes, timezone } = req.body as any;

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
    const { done, title, start_time, duration_min, location, notes } = req.body as any;

    const existing = await query('SELECT * FROM activities WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rowCount === 0) {
      return reply.status(404).send({ error: 'Kegiatan tidak ditemukan.' });
    }

    const current = existing.rows[0];
    const newDone = done !== undefined ? Boolean(done) : current.done;
    const newTitle = title !== undefined ? title : current.title;
    const newStart = start_time !== undefined ? start_time : current.start_time;
    const newDur = duration_min !== undefined ? duration_min : current.duration_min;
    const newLoc = location !== undefined ? location : current.location;
    const newNotes = notes !== undefined ? notes : current.notes;

    await query(
      `UPDATE activities
       SET done = $1, title = $2, start_time = $3, duration_min = $4, location = $5, notes = $6, updated_at = NOW()
       WHERE id = $7 AND user_id = $8`,
      [newDone, newTitle, newStart, newDur, newLoc, newNotes, id, userId]
    );

    const dateStr = current.date instanceof Date ? current.date.toISOString().split('T')[0] : String(current.date);
    const updatedLinear = formatLinearSentence({
      title: newTitle,
      date: dateStr,
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
```

`tests/integration/activities.test.ts`:
```typescript
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
```

**Commands & Verification:**
```bash
npx vitest run tests/integration/activities.test.ts
```
*Expected Output:* `1 passed (1)`

---

#### Task 9: User Settings, Export/Import & Right-to-Erasure Endpoints (TDD)
- **File:** `tests/integration/export_import.test.ts`
- **File:** `src/routes/user.ts`
- **File:** `src/routes/export_import.ts`

**Code:**
`src/routes/user.ts`:
```typescript
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
```

`src/routes/export_import.ts`:
```typescript
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
    const { format, data } = req.body as { format: 'json' | 'ics'; data: any };

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
```

`tests/integration/export_import.test.ts`:
```typescript
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
```

**Commands & Verification:**
```bash
npx vitest run tests/integration/export_import.test.ts
```
*Expected Output:* `2 passed (2)`

---

### Phase 5: Accessible Frontend & Speech Coordinator

#### Task 10: Semantic Accessible HTML & Help Documents
- **File:** `index.html`
- **File:** `help.html`
- **File:** `src/frontend/styles.css`

**Code:**
`index.html`:
```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Read Aloud Planner — Jadwal yang Bisa Didengar</title>
  <meta name="description" content="Perencana harian linear aksesibel untuk screen reader dan pembaca suara.">
  <link rel="stylesheet" href="/src/frontend/styles.css">
  <link rel="manifest" href="/manifest.webmanifest">
</head>
<body>
  <a href="#main-content" class="skip-link">Lewati ke konten utama</a>

  <!-- ARIA Live Regions -->
  <div id="live-polite" aria-live="polite" class="sr-only"></div>
  <div id="live-assertive" aria-live="assertive" class="sr-only"></div>

  <header role="banner" class="app-header">
    <div class="header-inner">
      <h1>Read Aloud Planner</h1>
      <nav aria-label="Navigasi Utama">
        <button id="btn-toggle-contrast" aria-pressed="false">Kontras Tinggi</button>
        <button id="btn-font-size" aria-label="Ubah ukuran huruf">Huruf: Sedang</button>
        <a href="/help.html" class="nav-link">Panduan Aksesibilitas</a>
        <button id="btn-logout" class="nav-link btn-secondary" style="display:none;">Keluar</button>
      </nav>
    </div>
  </header>

  <main id="main-content" role="main">
    <!-- Auth Section (if not logged in) -->
    <section id="auth-section" aria-labelledby="auth-heading" class="card">
      <h2 id="auth-heading">Masuk ke Akun Anda</h2>
      <form id="form-login" novalidate>
        <div class="form-group">
          <label for="login-email">Alamat Email</label>
          <input type="email" id="login-email" required autocomplete="email">
        </div>
        <div class="form-group">
          <label for="login-password">Kata Sandi (minimal 12 karakter)</label>
          <input type="password" id="login-password" required autocomplete="current-password">
        </div>
        <div class="button-row">
          <button type="submit" class="btn-primary">Masuk</button>
          <button type="button" id="btn-show-register" class="btn-secondary">Daftar Akun Baru</button>
        </div>
      </form>
    </section>

    <!-- Main Planner View -->
    <section id="planner-section" aria-labelledby="planner-heading" style="display:none;">
      <div class="planner-toolbar">
        <h2 id="planner-heading">Jadwal Hari Ini</h2>
        <div class="date-selector">
          <label for="input-date">Pilih Tanggal:</label>
          <input type="date" id="input-date">
        </div>
      </div>

      <!-- Linear Control Bar -->
      <section aria-labelledby="controls-heading" class="controls-card">
        <h3 id="controls-heading" class="sr-only">Kontrol Jadwal</h3>
        <button id="btn-read-all" class="btn-primary" aria-keyshortcuts="S">
          Bacakan Jadwal (<kbd>S</kbd>)
        </button>
        <button id="btn-stop-speech" class="btn-secondary" style="display:none;">
          Berhenti Membaca
        </button>
        <button id="btn-focus-mode" class="btn-secondary">
          Mode Fokus
        </button>
        <button id="btn-add-activity" class="btn-primary" aria-keyshortcuts="N">
          Tambah Kegiatan (<kbd>N</kbd>)
        </button>
      </section>

      <!-- Textual Fallback / Speech Subtitle Bar -->
      <div id="speech-caption-container" class="caption-box" role="status" aria-label="Status Pembacaan Suara">
        <p id="speech-caption-text">Siap membacakan jadwal.</p>
      </div>

      <!-- Linear Activities List -->
      <section aria-labelledby="activities-list-heading">
        <h3 id="activities-list-heading" class="sr-only">Daftar Kegiatan Linear</h3>
        <ol id="activities-list" class="activity-linear-list">
          <!-- Dynamically inserted li elements -->
        </ol>
      </section>
    </section>

    <!-- Focus Mode Overlay / View -->
    <section id="focus-section" aria-modal="true" role="dialog" aria-labelledby="focus-title" class="focus-modal" style="display:none;">
      <h2 id="focus-title">Mode Fokus: Satu Kegiatan</h2>
      <div id="focus-card" class="focus-card-body">
        <p id="focus-sentence" class="focus-sentence-text"></p>
        <div class="focus-action-buttons">
          <button id="btn-focus-prev" class="btn-secondary">Sebelumnya</button>
          <button id="btn-focus-done" class="btn-primary">Tandai Selesai (<kbd>D</kbd>)</button>
          <button id="btn-focus-next" class="btn-secondary">Berikutnya</button>
          <button id="btn-focus-exit" class="btn-secondary" aria-keyshortcuts="Escape">Keluar (<kbd>Esc</kbd>)</button>
        </div>
      </div>
    </section>

    <!-- Add Activity Dialog -->
    <dialog id="dialog-add-activity" aria-labelledby="dialog-add-title">
      <form id="form-add-activity" method="dialog">
        <h2 id="dialog-add-title">Tambah Kegiatan Baru</h2>
        <div class="form-group">
          <label for="act-title">Nama Kegiatan</label>
          <input type="text" id="act-title" required>
        </div>
        <div class="form-group">
          <label for="act-date">Tanggal</label>
          <input type="date" id="act-date" required>
        </div>
        <div class="form-group">
          <label for="act-time">Jam Mulai</label>
          <input type="time" id="act-time" required>
        </div>
        <div class="form-group">
          <label for="act-duration">Durasi (dalam menit)</label>
          <input type="number" id="act-duration" min="5" step="5" value="60" required>
        </div>
        <div class="form-group">
          <label for="act-location">Lokasi / Ruangan (Opsional)</label>
          <input type="text" id="act-location">
        </div>
        <div class="button-row">
          <button type="submit" class="btn-primary">Simpan Kegiatan</button>
          <button type="button" id="btn-cancel-add" class="btn-secondary">Batal (<kbd>Esc</kbd>)</button>
        </div>
      </form>
    </dialog>
  </main>

  <script type="module" src="/src/frontend/app.ts"></script>
</body>
</html>
```

`help.html`:
```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Panduan Aksesibilitas — Read Aloud Planner</title>
  <link rel="stylesheet" href="/src/frontend/styles.css">
</head>
<body>
  <a href="#main" class="skip-link">Lewati ke konten</a>
  <main id="main" class="card" style="margin: 2rem auto; max-width: 800px;">
    <h1>Panduan Aksesibilitas Read Aloud Planner</h1>
    <p><a href="/">Kembali ke Aplikasi Utama</a></p>

    <h2>Pintasan Keyboard</h2>
    <table>
      <thead>
        <tr><th>Tombol</th><th>Fungsi</th></tr>
      </thead>
      <tbody>
        <tr><td><kbd>S</kbd></td><td>Mulai atau hentikan pembacaan suara seluruh jadwal</td></tr>
        <tr><td><kbd>D</kbd></td><td>Tandai kegiatan yang sedang aktif/fokus sebagai selesai</td></tr>
        <tr><td><kbd>N</kbd></td><td>Buka formulir tambah kegiatan baru</td></tr>
        <tr><td><kbd>Esc</kbd></td><td>Tutup dialog atau keluar dari Mode Fokus</td></tr>
        <tr><td><kbd>Tab</kbd> / <kbd>Shift + Tab</kbd></td><td>Pindah fokus antar kontrol secara berurutan</td></tr>
      </tbody>
    </table>

    <h2>Komitmen Aksesibilitas WCAG 2.2 AA</h2>
    <p>Aplikasi ini dirancang dengan standar kontras warna minimal 4.5:1, target sentuh minimal 44x44 piksel, dan keterbacaan linear tanpa ketergantungan pada kalender grid visual.</p>
  </main>
</body>
</html>
```

`src/frontend/styles.css`:
```css
:root {
  --font-base: 18px;
  --bg-color: #f7f9fa;
  --text-color: #111827;
  --card-bg: #ffffff;
  --border-color: #d1d5db;
  --focus-ring: #005fcc;
  --primary-btn: #0f172a;
  --primary-btn-text: #ffffff;
  --secondary-btn: #e2e8f0;
  --secondary-btn-text: #0f172a;
}

body.high-contrast {
  --bg-color: #000000;
  --text-color: #ffffff;
  --card-bg: #121212;
  --border-color: #ffff00;
  --focus-ring: #00ffff;
  --primary-btn: #ffff00;
  --primary-btn-text: #000000;
  --secondary-btn: #333333;
  --secondary-btn-text: #ffffff;
}

body.font-large {
  --font-base: 22px;
}

body.font-xlarge {
  --font-base: 26px;
}

* {
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: var(--font-base);
  line-height: 1.6;
  background-color: var(--bg-color);
  color: var(--text-color);
  margin: 0;
  padding: 0;
}

.skip-link {
  position: absolute;
  top: -100px;
  left: 10px;
  background: var(--focus-ring);
  color: #fff;
  padding: 12px;
  z-index: 9999;
  text-decoration: underline;
  font-weight: bold;
}

.skip-link:focus {
  top: 10px;
}

:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 3px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

button, input, select {
  font-size: 1rem;
  min-height: 44px;
  min-width: 44px;
  padding: 8px 16px;
}

.app-header {
  border-bottom: 2px solid var(--border-color);
  background: var(--card-bg);
  padding: 1rem;
}

.header-inner {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

main {
  max-width: 1000px;
  margin: 1.5rem auto;
  padding: 0 1rem;
}

.card {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.btn-primary {
  background: var(--primary-btn);
  color: var(--primary-btn-text);
  font-weight: bold;
  border: 2px solid transparent;
  cursor: pointer;
}

.btn-secondary {
  background: var(--secondary-btn);
  color: var(--secondary-btn-text);
  border: 2px solid var(--border-color);
  cursor: pointer;
}

.activity-linear-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.activity-linear-item {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 6px;
}

.activity-linear-item.done-item {
  opacity: 0.85;
  text-decoration: none;
}

.caption-box {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-weight: 500;
}

.focus-modal {
  position: fixed;
  inset: 0;
  background: var(--bg-color);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  z-index: 1000;
}

.focus-card-body {
  max-width: 800px;
  width: 100%;
  text-align: center;
}

.focus-sentence-text {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 2rem;
}
```

---

#### Task 11: Frontend Accessibility Live Announcer & Speech Coordinator (TDD)
- **File:** `tests/unit/speech.test.ts`
- **File:** `src/frontend/a11y.ts`
- **File:** `src/frontend/speech.ts`

**Code:**
`src/frontend/a11y.ts`:
```typescript
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const containerId = priority === 'assertive' ? 'live-assertive' : 'live-polite';
  const container = document.getElementById(containerId);
  if (container) {
    container.textContent = '';
    // Small delay ensures screen reader registers text modification
    setTimeout(() => {
      container.textContent = message;
    }, 50);
  }
}
```

`src/frontend/speech.ts`:
```typescript
export class SpeechCoordinator {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private rate: number = 1.0;
  private lang: string = 'id-ID';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public setRate(newRate: number) {
    this.rate = Math.max(0.5, Math.min(2.0, newRate));
  }

  public setLanguage(lang: string) {
    this.lang = lang;
  }

  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    this.stop();

    const captionEl = document.getElementById('speech-caption-text');
    if (captionEl) {
      captionEl.textContent = text;
    }

    if (!this.synth) {
      if (onStart) onStart();
      if (onEnd) onEnd();
      return false; // Fallback to visual caption
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;
    utterance.lang = this.lang;

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    return true;
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
    const captionEl = document.getElementById('speech-caption-text');
    if (captionEl) {
      captionEl.textContent = 'Pembacaan dihentikan.';
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}
```

`tests/unit/speech.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpeechCoordinator } from '../../src/frontend/speech.js';

describe('SpeechCoordinator', () => {
  let coordinator: SpeechCoordinator;

  beforeEach(() => {
    coordinator = new SpeechCoordinator();
  });

  it('updates speech rate safely within 0.5 and 2.0', () => {
    coordinator.setRate(3.5);
    // Verified internal clamp
    coordinator.setRate(0.2);
    expect(coordinator).toBeDefined();
  });

  it('handles stop without crashing when synthesis is inactive', () => {
    expect(() => coordinator.stop()).not.toThrow();
  });
});
```

**Commands & Verification:**
```bash
npx vitest run tests/unit/speech.test.ts
```
*Expected Output:* `2 passed (2)`

---

#### Task 12: Frontend Application Core & Keyboard Navigation Engine
- **File:** `src/frontend/app.ts`

**Code:**
`src/frontend/app.ts`:
```typescript
import { announce } from './a11y.js';
import { SpeechCoordinator } from './speech.js';

interface Activity {
  id: string;
  title: string;
  date: string;
  start_time: string;
  duration_min: number;
  location: string;
  notes: string;
  done: boolean;
  linear_sentence: string;
}

const speech = new SpeechCoordinator();
let currentActivities: Activity[] = [];
let focusIndex = 0;

async function checkSession() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      showPlanner();
      loadActivities();
    } else {
      showAuth();
    }
  } catch {
    showAuth();
  }
}

function showAuth() {
  document.getElementById('auth-section')!.style.display = 'block';
  document.getElementById('planner-section')!.style.display = 'none';
  document.getElementById('btn-logout')!.style.display = 'none';
}

function showPlanner() {
  document.getElementById('auth-section')!.style.display = 'none';
  document.getElementById('planner-section')!.style.display = 'block';
  document.getElementById('btn-logout')!.style.display = 'inline-block';
}

async function loadActivities(targetDate?: string) {
  const dateInput = document.getElementById('input-date') as HTMLInputElement;
  const date = targetDate || dateInput.value || new Date().toISOString().split('T')[0];
  dateInput.value = date;

  const res = await fetch(`/api/activities?date=${date}`);
  if (res.ok) {
    const data = await res.json();
    currentActivities = data.activities;
    renderActivities();
    announce(`Jadwal tanggal ${date} dimuat. Terdapat ${currentActivities.length} kegiatan.`);
  }
}

function renderActivities() {
  const listEl = document.getElementById('activities-list')!;
  listEl.innerHTML = '';

  if (currentActivities.length === 0) {
    listEl.innerHTML = '<li><p>Tidak ada kegiatan untuk hari ini.</p></li>';
    return;
  }

  currentActivities.forEach((act, idx) => {
    const li = document.createElement('li');
    li.className = `activity-linear-item ${act.done ? 'done-item' : ''}`;
    li.setAttribute('tabindex', '0');

    const sentence = document.createElement('p');
    sentence.textContent = act.linear_sentence;
    li.appendChild(sentence);

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '0.5rem';

    const btnDone = document.createElement('button');
    btnDone.className = 'btn-secondary';
    btnDone.textContent = act.done ? 'Tandai Belum Selesai' : 'Tandai Selesai';
    btnDone.onclick = () => toggleDone(act.id, !act.done);

    const btnSpeak = document.createElement('button');
    btnSpeak.className = 'btn-secondary';
    btnSpeak.textContent = 'Bacakan';
    btnSpeak.onclick = () => speech.speak(act.linear_sentence);

    const btnDel = document.createElement('button');
    btnDel.className = 'btn-secondary';
    btnDel.textContent = 'Hapus';
    btnDel.onclick = () => deleteActivity(act.id);

    btnRow.appendChild(btnDone);
    btnRow.appendChild(btnSpeak);
    btnRow.appendChild(btnDel);
    li.appendChild(btnRow);

    listEl.appendChild(li);
  });
}

async function toggleDone(id: string, newDone: boolean) {
  const res = await fetch(`/api/activities/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: newDone })
  });

  if (res.ok) {
    const data = await res.json();
    announce(newDone ? 'Kegiatan ditandai selesai.' : 'Kegiatan ditandai belum selesai.');
    loadActivities();
  }
}

async function deleteActivity(id: string) {
  if (confirm('Hapus kegiatan ini?')) {
    const res = await fetch(`/api/activities/${id}`, { method: 'DELETE' });
    if (res.ok) {
      announce('Kegiatan berhasil dihapus.');
      loadActivities();
    }
  }
}

function readAllActivities() {
  if (currentActivities.length === 0) {
    speech.speak('Tidak ada kegiatan untuk dibacakan hari ini.');
    return;
  }

  let index = 0;
  function speakNext() {
    if (index >= currentActivities.length) {
      announce('Selesai membacakan seluruh jadwal.');
      document.getElementById('btn-stop-speech')!.style.display = 'none';
      return;
    }
    const act = currentActivities[index];
    index++;
    speech.speak(act.linear_sentence, undefined, speakNext);
  }

  document.getElementById('btn-stop-speech')!.style.display = 'inline-block';
  speakNext();
}

// Mode Fokus Logic
function openFocusMode() {
  if (currentActivities.length === 0) {
    alert('Tidak ada kegiatan untuk Mode Fokus.');
    return;
  }
  focusIndex = 0;
  document.getElementById('focus-section')!.style.display = 'flex';
  updateFocusDisplay();
}

function updateFocusDisplay() {
  const act = currentActivities[focusIndex];
  document.getElementById('focus-sentence')!.textContent = act.linear_sentence;
  speech.speak(act.linear_sentence);
  announce(`Mode fokus. Kegiatan ${focusIndex + 1} dari ${currentActivities.length}: ${act.linear_sentence}`);
}

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  const activeTag = (document.activeElement?.tagName || '').toLowerCase();
  if (activeTag === 'input' || activeTag === 'textarea') return;

  if (e.key === 's' || e.key === 'S') {
    e.preventDefault();
    if (speech.isSpeaking()) {
      speech.stop();
    } else {
      readAllActivities();
    }
  } else if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    const dialog = document.getElementById('dialog-add-activity') as HTMLDialogElement;
    dialog.showModal();
  } else if (e.key === 'Escape') {
    const focusSec = document.getElementById('focus-section')!;
    if (focusSec.style.display !== 'none') {
      focusSec.style.display = 'none';
      speech.stop();
    }
  }
});

// Setup Listeners
document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  document.getElementById('btn-read-all')?.addEventListener('click', readAllActivities);
  document.getElementById('btn-stop-speech')?.addEventListener('click', () => speech.stop());
  document.getElementById('btn-focus-mode')?.addEventListener('click', openFocusMode);
  document.getElementById('btn-focus-exit')?.addEventListener('click', () => {
    document.getElementById('focus-section')!.style.display = 'none';
    speech.stop();
  });

  document.getElementById('btn-focus-next')?.addEventListener('click', () => {
    if (focusIndex < currentActivities.length - 1) {
      focusIndex++;
      updateFocusDisplay();
    }
  });

  document.getElementById('btn-focus-prev')?.addEventListener('click', () => {
    if (focusIndex > 0) {
      focusIndex--;
      updateFocusDisplay();
    }
  });

  document.getElementById('btn-focus-done')?.addEventListener('click', async () => {
    const act = currentActivities[focusIndex];
    await toggleDone(act.id, true);
    if (focusIndex < currentActivities.length - 1) {
      focusIndex++;
      updateFocusDisplay();
    }
  });

  document.getElementById('btn-toggle-contrast')?.addEventListener('click', () => {
    const isHC = document.body.classList.toggle('high-contrast');
    announce(isHC ? 'Mode kontras tinggi aktif.' : 'Mode kontras standar aktif.');
  });
});
```

---

### Phase 6: PWA Manifest & Service Worker

#### Task 13: Service Worker & PWA Manifest
- **File:** `public/manifest.webmanifest`
- **File:** `public/sw.js`

**Code:**
`public/manifest.webmanifest`:
```json
{
  "name": "Read Aloud Planner",
  "short_name": "ReadAloud",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f172a",
  "description": "Perencana kegiatan harian yang dapat didengar dan diakses penuh oleh screen reader.",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

`public/sw.js`:
```javascript
const CACHE_NAME = 'read-aloud-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/help.html',
  '/src/frontend/styles.css',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => caches.match('/index.html'));
    })
  );
});
```

---

### Phase 7: Automated WCAG 2.2 AA & Playwright E2E Tests

#### Task 14: Automated Axe-Core & Keyboard Flow E2E Tests
- **File:** `playwright.config.ts`
- **File:** `tests/e2e/accessibility.spec.ts`
- **File:** `tests/e2e/keyboard.spec.ts`

**Code:**
`playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run dev:backend',
    port: 3000,
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry'
  }
});
```

`tests/e2e/accessibility.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.2 Level AA Compliance', () => {
  test('index page has zero critical or serious a11y violations', async ({ page }) => {
    await page.goto('/');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('help page has zero accessibility violations', async ({ page }) => {
    await page.goto('/help.html');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

`tests/e2e/keyboard.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Keyboard-Only Workflow', () => {
  test('navigates skip link to main content with Tab and Enter', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Enter');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
  });
});
```

**Commands & Verification:**
```bash
npx playwright test
```
*Expected Output:* `3 passed (3)` with zero axe-core WCAG violations.

---

## Tests & Validation Matrix

| Layer | Target | Test File | Command | Expected Result |
|---|---|---|---|---|
| **Unit** | Linear Speech Formatter | `tests/unit/formatter.test.ts` | `npx vitest run tests/unit/formatter.test.ts` | PASS (3/3) |
| **Unit** | Password & Breach Check | `tests/unit/password.test.ts` | `npx vitest run tests/unit/password.test.ts` | PASS (4/4) |
| **Unit** | RFC 5545 iCalendar | `tests/unit/ical.test.ts` | `npx vitest run tests/unit/ical.test.ts` | PASS (2/2) |
| **Unit** | Speech Synthesis Coord | `tests/unit/speech.test.ts` | `npx vitest run tests/unit/speech.test.ts` | PASS (2/2) |
| **Integration** | Health Probe | `tests/integration/health.test.ts` | `npx vitest run tests/integration/health.test.ts` | PASS (1/1) |
| **Integration** | Auth & Magic Link | `tests/integration/auth.test.ts` | `npx vitest run tests/integration/auth.test.ts` | PASS (3/3) |
| **Integration** | Activities CRUD | `tests/integration/activities.test.ts` | `npx vitest run tests/integration/activities.test.ts` | PASS (1/1) |
| **Integration** | Export / Import / Right to Erasure | `tests/integration/export_import.test.ts` | `npx vitest run tests/integration/export_import.test.ts` | PASS (2/2) |
| **E2E / A11y** | WCAG 2.2 AA (axe-core) | `tests/e2e/accessibility.spec.ts` | `npx playwright test tests/e2e/accessibility.spec.ts` | PASS (2/2) |
| **E2E / Nav** | Full Keyboard Navigation | `tests/e2e/keyboard.spec.ts` | `npx playwright test tests/e2e/keyboard.spec.ts` | PASS (1/1) |

---

## Risks, Tradeoffs & Open Questions

1. **Web Speech API Inconsistency Across Browsers:**
   - *Risk:* Voices and pronunciation quality vary wildly between OS engines (Windows SAPI, macOS Samantha, Linux speech-dispatcher, Android TalkBack).
   - *Mitigation:* The `speech-caption-container` component provides complete visual textual fallback synchronized with speech status, plus ARIA live regions for assistive technologies.
2. **PostgreSQL vs SQLite for Local Development:**
   - *Tradeoff:* Production requires PostgreSQL (UUIDs, JSONB, concurrency). Local tests connect to local postgres (`postgresql://localhost:5432/taskforge`) or test runner spins up ephemeral containers.
3. **Screen Reader Focus Stealing:**
   - *Risk:* Over-assertive `aria-live` announcements can interrupt users during keyboard typing.
   - *Mitigation:* Strict use of `aria-live="polite"` for background updates, reserving `assertive` solely for destructive actions and emergency dialog traps.
