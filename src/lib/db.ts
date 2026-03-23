import Dexie, { type Table } from 'dexie';
import type { SearchStatus, CompanyProfile, ProjectDetails } from '@/types';

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
  isDeleted?: boolean;
  tags?: string[];
  notes?: string;
  confidence?: number;
  source?: string;
}

export interface LocalProject {
  id: string;
  name: string;
  description?: string;
  phase?: 'etudes' | 'dce' | 'exe' | 'reception' | 'chantier';
  moa?: string;
  architect?: string;
  lot?: 'plomberie' | 'electricite' | 'cvc' | 'menuiseries' | 'autre';
  nomenclatureTemplate: string;
  productOrder?: string[];
  createdAt: string;
  updatedAt?: string;
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
    this.version(2).stores({
      products: 'id, projectId, manufacturer, category, searchStatus, createdAt, isDeleted',
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

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  const setting = await db.settings.get('companyProfile');
  if (!setting) return null;
  try {
    return JSON.parse(setting.value) as CompanyProfile;
  } catch {
    return null;
  }
}

export async function setCompanyProfile(profile: CompanyProfile): Promise<void> {
  await db.settings.put({ key: 'companyProfile', value: JSON.stringify(profile) });
}

export async function getProjectDetails(projectId: string): Promise<ProjectDetails | null> {
  const setting = await db.settings.get(`projectDetails:${projectId}`);
  if (!setting) return null;
  try {
    return JSON.parse(setting.value) as ProjectDetails;
  } catch {
    return null;
  }
}

export async function setProjectDetails(projectId: string, details: ProjectDetails): Promise<void> {
  await db.settings.put({ key: `projectDetails:${projectId}`, value: JSON.stringify(details) });
}
