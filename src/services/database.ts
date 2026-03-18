import * as SQLite from 'expo-sqlite';
import type { Conversation, Message } from '@/types/api';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('easytalk.db');
    await runMigrations(db);
  }
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS conversations (
      token TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER NOT NULL,
      token TEXT NOT NULL,
      data TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      PRIMARY KEY (token, id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_token_timestamp
    ON messages (token, timestamp DESC);
  `);
}

export async function upsertConversations(
  conversations: Conversation[],
): Promise<void> {
  const database = await getDatabase();
  const now = Date.now();

  const statement = await database.prepareAsync(
    'INSERT OR REPLACE INTO conversations (token, data, updated_at) VALUES ($token, $data, $updatedAt)',
  );

  try {
    for (const conv of conversations) {
      await statement.executeAsync({
        $token: conv.token,
        $data: JSON.stringify(conv),
        $updatedAt: now,
      });
    }
  } finally {
    await statement.finalizeAsync();
  }
}

export async function getCachedConversations(): Promise<Conversation[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ data: string }>(
    'SELECT data FROM conversations ORDER BY updated_at DESC',
  );
  return rows.map((row) => JSON.parse(row.data));
}

export async function upsertMessages(
  token: string,
  messages: Message[],
): Promise<void> {
  const database = await getDatabase();

  const statement = await database.prepareAsync(
    'INSERT OR REPLACE INTO messages (id, token, data, timestamp) VALUES ($id, $token, $data, $timestamp)',
  );

  try {
    for (const msg of messages) {
      await statement.executeAsync({
        $id: msg.id,
        $token: token,
        $data: JSON.stringify(msg),
        $timestamp: msg.timestamp,
      });
    }
  } finally {
    await statement.finalizeAsync();
  }
}

export async function getCachedMessages(
  token: string,
  limit = 50,
  beforeId?: number,
): Promise<Message[]> {
  const database = await getDatabase();

  let query = 'SELECT data FROM messages WHERE token = ?';
  const params: (string | number)[] = [token];

  if (beforeId !== undefined) {
    query += ' AND id < ?';
    params.push(beforeId);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  const rows = await database.getAllAsync<{ data: string }>(query, params);
  return rows.map((row) => JSON.parse(row.data));
}

export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM conversations;
    DELETE FROM messages;
  `);
}
