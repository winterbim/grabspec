import type { NomenclatureVars } from '@/types';

export const DEFAULT_TEMPLATE = '{PROJET}_{LOT}_{FABRICANT}_{REF}_{TYPE}';

export const AVAILABLE_VARS: { key: keyof NomenclatureVars; label: Record<string, string> }[] = [
  { key: 'PROJET', label: { fr: 'Projet', en: 'Project', es: 'Proyecto', de: 'Projekt' } },
  { key: 'LOT', label: { fr: 'Lot', en: 'Category', es: 'Lote', de: 'Los' } },
  { key: 'FABRICANT', label: { fr: 'Fabricant', en: 'Manufacturer', es: 'Fabricante', de: 'Hersteller' } },
  { key: 'REF', label: { fr: 'Référence', en: 'Reference', es: 'Referencia', de: 'Referenz' } },
  { key: 'NOM', label: { fr: 'Nom produit', en: 'Product name', es: 'Nombre', de: 'Produktname' } },
  { key: 'TYPE', label: { fr: 'Type fichier', en: 'File type', es: 'Tipo', de: 'Dateityp' } },
  { key: 'NUM', label: { fr: 'Numéro', en: 'Number', es: 'Número', de: 'Nummer' } },
  { key: 'DATE', label: { fr: 'Date', en: 'Date', es: 'Fecha', de: 'Datum' } },
];

export function applyNomenclature(template: string, vars: NomenclatureVars, ext: string): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, sanitizeFilename(value || 'INCONNU'));
  }
  return `${result}.${ext}`;
}

function sanitizeFilename(str: string): string {
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildNomenclaturePreview(
  template: string,
  locale: string = 'fr'
): string {
  const example: NomenclatureVars = {
    PROJET: 'VILLA-DUPONT',
    LOT: 'PLOMBERIE',
    FABRICANT: 'GROHE',
    REF: '33265003',
    NOM: 'EUROSMART',
    TYPE: 'PHOTO',
    NUM: '001',
    DATE: new Date().toISOString().split('T')[0],
  };
  return applyNomenclature(template, example, 'jpg');
}
