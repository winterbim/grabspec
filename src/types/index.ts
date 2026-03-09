export type PlanType = 'free' | 'pro' | 'business';

export type SearchStatus = 'pending' | 'searching' | 'found' | 'partial' | 'not_found' | 'error';

export interface ProductResult {
  id: string;
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
  specs: ProductSpecs | null;
  searchStatus: SearchStatus;
  sourceUrl: string | null;
  createdAt: string;
  projectId: string | null;
}

export interface ProductSpecs {
  dimensions: string | null;
  poids: string | null;
  materiau: string | null;
  couleur: string | null;
  puissance: string | null;
  debit: string | null;
  pression: string | null;
  tension: string | null;
  certification: string | null;
  garantie: string | null;
}

export interface NomenclatureVars {
  PROJET: string;
  LOT: string;
  FABRICANT: string;
  REF: string;
  NOM: string;
  TYPE: string;
  NUM: string;
  DATE: string;
}

export interface PlanInfo {
  plan: PlanType;
  searchesLeft: number;
}

export interface CompanyProfile {
  name: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  logo: string | null; // base64 data URL
}

export interface ProjectDetails {
  projectNumber: string;
  siteAddress: string;
  client: string;
  architect: string;
  phase: string;
}

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const FREE_DAILY_LIMIT = 3;

export const SUPPORTED_LOCALES = ['fr', 'en', 'es', 'de'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
