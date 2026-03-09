import Dexie, { type Table } from 'dexie';
import type { SearchStatus } from '@/types';

export interface LocalProduct {
  id: string;
  projectId: string | null;
  inputName: string;
  resolvedName: string | null;
  manufacturer: string | null;
  reference: string | null;
  category: string | null;
  lot: string | null;
  photoUrl: string | null;
  photoBlobUrl: string | null;
  datasheetUrl: string | null;
  datasheetBlobUrl: string | null;
  specs: Record<string, string | null> | null;
  searchStatus: SearchStatus;
  createdAt: string;
}

export interface LocalProject {
  id: string;
  name: string;
  nomenclatureTemplate: string;
  createdAt: string;
}

export interface LocalSettings {
  key: string;
  value: string;
}

class GrabSpecDB extends Dexie {
  products!: Table<LocalProduct>;
  projects!: Table<LocalProject>;
  settings!: Table<LocalSettings>;

  constructor() {
    super('grabspec');
    this.version(1).stores({
      products: 'id, projectId, manufacturer, searchStatus, createdAt',
      projects: 'id, name, createdAt',
      settings: 'key',
    });
  }
}

export const db = new GrabSpecDB();

export async function getSessionId(): Promise<string> {
  const setting = await db.settings.get('sessionId');
  if (!setting) {
    const id = crypto.randomUUID();
    await db.settings.put({ key: 'sessionId', value: id });
    return id;
  }
  return setting.value;
}

export async function getDailySearchCount(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const setting = await db.settings.get('dailySearches');
  if (!setting || !setting.value.startsWith(today)) return 0;
  return parseInt(setting.value.split(':')[1] || '0', 10);
}

export async function incrementDailySearchCount(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const current = await getDailySearchCount();
  await db.settings.put({ key: 'dailySearches', value: `${today}:${current + 1}` });
}

export async function getStoredPlan(): Promise<string> {
  const setting = await db.settings.get('plan');
  return setting?.value || 'free';
}

export async function setStoredPlan(plan: string): Promise<void> {
  await db.settings.put({ key: 'plan', value: plan });
}
