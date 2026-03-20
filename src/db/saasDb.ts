import { openDatabaseSync } from 'expo-sqlite';

import type { Activity } from '@/types/activity';
import type { AuditLog } from '@/types/audit';
import type { MoneyTransaction } from '@/types/money';
import type { Note } from '@/types/note';
import type { ThemeMode } from '@/types/theme';
import type { UserProfile } from '@/types/profile';
import type { ActivityDaySummary, MoneyDaySummary } from '@/types/chart';

const db = openDatabaseSync('saas-tracker.sqlite');

function jsonStringifySafe(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return null as unknown as string;
  }
}

export function initSaasDb(): void {
  db.execSync(`
    PRAGMA journal_mode=WAL;

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      imageB64 TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS money_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      category TEXT NOT NULL,
      note TEXT NOT NULL,
      imageB64 TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      imageB64 TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      bio TEXT NOT NULL,
      imageB64 TEXT,
      birthday TEXT,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      createdAt INTEGER NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entityId INTEGER,
      day TEXT,
      payload TEXT
    );
  `);

  // seed default profile
  // migration for existing installs
  const columns = db.getAllSync<{ name: string }>('PRAGMA table_info(user_profile)');
  const hasBirthday = columns.some((c) => c.name === 'birthday');
  if (!hasBirthday) {
    db.execSync(`ALTER TABLE user_profile ADD COLUMN birthday TEXT;`);
  }

  const existingProfile = db.getFirstSync<UserProfile>(
    'SELECT id, name, bio, imageB64, birthday, updatedAt FROM user_profile WHERE id = 1'
  );
  if (!existingProfile) {
    db.runSync(
      'INSERT INTO user_profile (id, name, bio, imageB64, birthday, updatedAt) VALUES (1, ?, ?, ?, ?, ?)',
      ['Your Name', 'Write your bio...', null, null, Date.now()]
    );
  }

  const themeValue = db.getFirstSync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    ['themeMode']
  );
  if (!themeValue) {
    db.runSync('INSERT INTO settings (key, value) VALUES (?, ?)', ['themeMode', 'system']);
  }
}

function logAudit(params: {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: AuditLog['entity'];
  entityId: number | null;
  day: string | null;
  payload: unknown;
}): void {
  db.runSync(
    `
    INSERT INTO audit_log (createdAt, action, entity, entityId, day, payload)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    [
      Date.now(),
      params.action,
      params.entity,
      params.entityId,
      params.day,
      jsonStringifySafe(params.payload),
    ]
  );
}

export function getThemeMode(): ThemeMode {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
    'themeMode',
  ]);
  const v = row?.value ?? 'system';
  if (v === 'light' || v === 'dark' || v === 'system') return v;
  return 'system';
}

export function setThemeMode(mode: ThemeMode): void {
  db.runSync('UPDATE settings SET value = ? WHERE key = ?', [mode, 'themeMode']);
  logAudit({
    action: 'UPDATE',
    entity: 'settings',
    entityId: null,
    day: null,
    payload: { themeMode: mode },
  });
}

export function getProfile(): UserProfile {
  const row = db.getFirstSync<UserProfile>(
    'SELECT id, name, bio, imageB64, birthday, updatedAt FROM user_profile WHERE id = 1'
  );

  // initSaasDb seeds it, but keep a safe fallback anyway
  if (!row) {
    return {
      id: 1,
      name: 'Your Name',
      bio: 'Write your bio...',
      imageB64: null,
      birthday: null,
      updatedAt: Date.now(),
    };
  }
  return row;
}

export function updateProfile(params: {
  name: string;
  bio: string;
  imageB64: string | null;
  birthday: string | null;
}): void {
  const now = Date.now();
  db.runSync(
    `
      UPDATE user_profile
      SET name = ?, bio = ?, imageB64 = ?, birthday = ?, updatedAt = ?
      WHERE id = 1
    `,
    [params.name.trim(), params.bio.trim(), params.imageB64, params.birthday, now]
  );

  logAudit({
    action: 'UPDATE',
    entity: 'profile',
    entityId: 1,
    day: null,
    payload: { name: params.name, bio: params.bio, birthday: params.birthday },
  });
}

export function getActivitiesByDay(day: string): Activity[] {
  return db.getAllSync<Activity>(
    `
      SELECT id, day, title, description, imageB64, createdAt, updatedAt
      FROM activities
      WHERE day = ?
      ORDER BY updatedAt DESC
    `,
    [day]
  );
}

export function getMoneySummaryRange(startDay: string, endDay: string): MoneyDaySummary[] {
  const rows = db.getAllSync<{
    day: string;
    income: number | string | null;
    expense: number | string | null;
  }>(
    `
      SELECT
        day,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM money_transactions
      WHERE day >= ? AND day <= ?
      GROUP BY day
      ORDER BY day
    `,
    [startDay, endDay]
  );

  return rows.map((r) => ({
    day: r.day,
    income: Number(r.income) || 0,
    expense: Number(r.expense) || 0,
  }));
}

export function getActivityCountRange(startDay: string, endDay: string): ActivityDaySummary[] {
  const rows = db.getAllSync<{
    day: string;
    count: number | string | null;
  }>(
    `
      SELECT
        day,
        COUNT(*) AS count
      FROM activities
      WHERE day >= ? AND day <= ?
      GROUP BY day
      ORDER BY day
    `,
    [startDay, endDay]
  );

  return rows.map((r) => ({
    day: r.day,
    count: Number(r.count) || 0,
  }));
}

export function createActivity(params: {
  day: string;
  title: string;
  description: string;
  imageB64: string | null;
}): number {
  const now = Date.now();
  const result = db.runSync(
    `
      INSERT INTO activities (day, title, description, imageB64, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [params.day, params.title.trim(), params.description.trim(), params.imageB64, now, now]
  );

  logAudit({
    action: 'CREATE',
    entity: 'activity',
    entityId: result.lastInsertRowId,
    day: params.day,
    payload: { title: params.title, description: params.description },
  });

  return result.lastInsertRowId;
}

export function updateActivity(params: {
  id: number;
  day: string;
  title: string;
  description: string;
  imageB64: string | null;
}): void {
  const now = Date.now();
  db.runSync(
    `
      UPDATE activities
      SET day = ?, title = ?, description = ?, imageB64 = ?, updatedAt = ?
      WHERE id = ?
    `,
    [params.day, params.title.trim(), params.description.trim(), params.imageB64, now, params.id]
  );

  logAudit({
    action: 'UPDATE',
    entity: 'activity',
    entityId: params.id,
    day: params.day,
    payload: { title: params.title, description: params.description },
  });
}

export function deleteActivity(id: number): void {
  const existing = db.getFirstSync<Activity>('SELECT id, day FROM activities WHERE id = ?', [id]);
  db.runSync('DELETE FROM activities WHERE id = ?', [id]);
  logAudit({
    action: 'DELETE',
    entity: 'activity',
    entityId: id,
    day: existing?.day ?? null,
    payload: null,
  });
}

export function getMoneyByDay(day: string): MoneyTransaction[] {
  return db.getAllSync<MoneyTransaction>(
    `
      SELECT id, day, type, amount, currency, category, note, imageB64, createdAt, updatedAt
      FROM money_transactions
      WHERE day = ?
      ORDER BY updatedAt DESC
    `,
    [day]
  );
}

export function createMoney(params: {
  day: string;
  type: MoneyTransaction['type'];
  amount: number;
  currency: string;
  category: string;
  note: string;
  imageB64: string | null;
}): number {
  const now = Date.now();
  const result = db.runSync(
    `
      INSERT INTO money_transactions
        (day, type, amount, currency, category, note, imageB64, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      params.day,
      params.type,
      params.amount,
      params.currency,
      params.category.trim(),
      params.note.trim(),
      params.imageB64,
      now,
      now,
    ]
  );

  logAudit({
    action: 'CREATE',
    entity: 'money',
    entityId: result.lastInsertRowId,
    day: params.day,
    payload: {
      type: params.type,
      amount: params.amount,
      category: params.category,
      note: params.note,
    },
  });

  return result.lastInsertRowId;
}

export function updateMoney(params: {
  id: number;
  day: string;
  type: MoneyTransaction['type'];
  amount: number;
  currency: string;
  category: string;
  note: string;
  imageB64: string | null;
}): void {
  const now = Date.now();
  db.runSync(
    `
      UPDATE money_transactions
      SET day = ?, type = ?, amount = ?, currency = ?, category = ?, note = ?, imageB64 = ?, updatedAt = ?
      WHERE id = ?
    `,
    [
      params.day,
      params.type,
      params.amount,
      params.currency,
      params.category.trim(),
      params.note.trim(),
      params.imageB64,
      now,
      params.id,
    ]
  );

  logAudit({
    action: 'UPDATE',
    entity: 'money',
    entityId: params.id,
    day: params.day,
    payload: {
      type: params.type,
      amount: params.amount,
      category: params.category,
      note: params.note,
    },
  });
}

export function deleteMoney(id: number): void {
  const existing = db.getFirstSync<MoneyTransaction>(
    'SELECT id, day FROM money_transactions WHERE id = ?',
    [id]
  );
  db.runSync('DELETE FROM money_transactions WHERE id = ?', [id]);
  logAudit({
    action: 'DELETE',
    entity: 'money',
    entityId: id,
    day: existing?.day ?? null,
    payload: null,
  });
}

export function getNotesByDay(day: string): Note[] {
  return db.getAllSync<Note>(
    `
      SELECT id, day, title, body, imageB64, createdAt, updatedAt
      FROM notes
      WHERE day = ?
      ORDER BY updatedAt DESC
    `,
    [day]
  );
}

export function createNote(params: {
  day: string;
  title: string;
  body: string;
  imageB64: string | null;
}): number {
  const now = Date.now();
  const result = db.runSync(
    `
      INSERT INTO notes (day, title, body, imageB64, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [params.day, params.title.trim(), params.body.trim(), params.imageB64, now, now]
  );

  logAudit({
    action: 'CREATE',
    entity: 'note',
    entityId: result.lastInsertRowId,
    day: params.day,
    payload: { title: params.title, body: params.body },
  });

  return result.lastInsertRowId;
}

export function updateNote(params: {
  id: number;
  day: string;
  title: string;
  body: string;
  imageB64: string | null;
}): void {
  const now = Date.now();
  db.runSync(
    `
      UPDATE notes
      SET day = ?, title = ?, body = ?, imageB64 = ?, updatedAt = ?
      WHERE id = ?
    `,
    [params.day, params.title.trim(), params.body.trim(), params.imageB64, now, params.id]
  );

  logAudit({
    action: 'UPDATE',
    entity: 'note',
    entityId: params.id,
    day: params.day,
    payload: { title: params.title, body: params.body },
  });
}

export function deleteNote(id: number): void {
  const existing = db.getFirstSync<Note>('SELECT id, day FROM notes WHERE id = ?', [id]);
  db.runSync('DELETE FROM notes WHERE id = ?', [id]);
  logAudit({
    action: 'DELETE',
    entity: 'note',
    entityId: id,
    day: existing?.day ?? null,
    payload: null,
  });
}

export function getAuditLogs(params: { limit: number }): AuditLog[] {
  return db.getAllSync<AuditLog>(
    `
      SELECT id, createdAt, action, entity, entityId, day, payload
      FROM audit_log
      ORDER BY createdAt DESC
      LIMIT ?
    `,
    [params.limit]
  );
}

export function resetAllDataForDev(): void {
  // Not exposed in UI; just a helper for local testing.
  db.execSync(`
    DELETE FROM activities;
    DELETE FROM money_transactions;
    DELETE FROM notes;
    DELETE FROM audit_log;
    DELETE FROM settings;
    UPDATE user_profile SET name = 'Your Name', bio = 'Write your bio...', imageB64 = NULL, updatedAt = ${Date.now()} WHERE id = 1;
    INSERT OR IGNORE INTO settings (key, value) VALUES ('themeMode', 'system');
  `);
}
