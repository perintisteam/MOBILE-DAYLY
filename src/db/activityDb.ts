import { openDatabaseSync } from 'expo-sqlite';
import type { Activity } from '../types/activity';

const db = openDatabaseSync('activity-tracker.db');

export async function initActivityDb(): Promise<void> {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `;

  db.execSync(createTableSql);
}

export async function getActivitiesByDay(day: string): Promise<Activity[]> {
  const selectSql = `
    SELECT id, day, title, description, createdAt
    FROM activities
    WHERE day = ?
    ORDER BY createdAt DESC
  `;

  return db.getAllSync<Activity>(selectSql, [day]);
}

export async function insertActivity(params: {
  day: string;
  title: string;
  description: string;
}): Promise<void> {
  const insertSql = `
    INSERT INTO activities (day, title, description, createdAt)
    VALUES (?, ?, ?, ?)
  `;

  const title = params.title.trim();
  const description = params.description.trim();

  if (!title) throw new Error('Judul aktivitas tidak boleh kosong');
  if (!description) throw new Error('Deskripsi tidak boleh kosong');

  db.runSync(insertSql, [params.day, title, description, Date.now()]);
}

export async function deleteActivity(id: number): Promise<void> {
  const deleteSql = `DELETE FROM activities WHERE id = ?`;

  db.runSync(deleteSql, [id]);
}
