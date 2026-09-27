import { getDb } from '../client';
import { settings } from '../schema';
import { eq } from 'drizzle-orm';

export async function getSetting(key: string): Promise<string | null> {
  const db = getDb();
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result.length > 0 ? result[0].value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  const existing = await getSetting(key);
  if (existing !== null) {
    await db.update(settings).set({ value }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value });
  }
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = getDb();
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function deleteSetting(key: string): Promise<void> {
  const db = getDb();
  await db.delete(settings).where(eq(settings.key, key));
}
