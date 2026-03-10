import type { LocalProduct } from '@/lib/db';
import type { NomenclatureVars, CompanyProfile, ProjectDetails } from '@/types';
import { applyNomenclature } from '@/lib/nomenclature';

interface DownloadZipOptions {
  products: LocalProduct[];
  template: string;
  projectName: string;
  locale?: string;
  company?: CompanyProfile | null;
  projectDetails?: ProjectDetails | null;
  onProgress: (percent: number) => void;
}

interface DownloadExcelOptions {
  products: LocalProduct[];
  projectName: string;
  locale?: string;
  company?: CompanyProfile | null;
  projectDetails?: ProjectDetails | null;
}

async function fetchAsArrayBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

function buildVars(product: LocalProduct, projectName: string, index: number): NomenclatureVars {
  return {
    PROJET: projectName || 'PROJET',
    LOT: product.lot ?? '',
    FABRICANT: product.manufacturer ?? '',
    REF: product.reference ?? '',
    NOM: product.resolvedName ?? product.inputName,
    TYPE: '',
    NUM: String(index + 1).padStart(3, '0'),
    DATE: new Date().toISOString().split('T')[0],
  };
}

function getFileExtension(url: string, fallback: string): string {
  const pathname = url.split('?')[0] ?? url;
  const extension = pathname.split('.').pop()?.toLowerCase();
  return extension && /^[a-z0-9]+$/.test(extension) ? extension : fallback;
}

function buildProductFilename(
  product: LocalProduct,
  template: string,
  projectName: string,
  index: number,
  fileType: 'PHOTO' | 'FT',
  url: string
): string {
  const vars = {
    ...buildVars(product, projectName, index),
    TYPE: fileType,
  };
  const ext = fileType === 'PHOTO' ? getFileExtension(url, 'jpg') : 'pdf';
  return applyNomenclature(template, vars, ext);
}

export async function downloadZip({
  products,
  template,
  projectName,
  locale,
  company,
  projectDetails,
  onProgress,
}: DownloadZipOptions): Promise<void> {
  const [JSZip, { saveAs }, { generateExcel }, { applyNomenclature }] = await Promise.all([
    import('jszip').then((m) => m.default),
    import('file-saver'),
    import('@/lib/excel'),
    import('@/lib/nomenclature'),
  ]);

  const zip = new JSZip();
  const total = products.length;
  let done = 0;

  const excelData = await generateExcel({
    products,
    locale,
    projectName,
    company,
    projectDetails,
  });
  zip.file(`${projectName || 'GrabSpec'}_recap.xlsx`, excelData);

  for (const [index, product] of products.entries()) {
    const vars = buildVars(product, projectName, index);

    const photoUrl = product.photoBlobUrl ?? product.photoUrl;
    if (photoUrl) {
      const photoData = await fetchAsArrayBuffer(photoUrl);
      if (photoData) {
        const photoVars = { ...vars, TYPE: 'PHOTO' };
        const photoName = applyNomenclature(template, photoVars, 'jpg');
        zip.file(photoName, photoData);
      }
    }

    const pdfUrl = product.datasheetBlobUrl ?? product.datasheetUrl;
    if (pdfUrl) {
      const pdfData = await fetchAsArrayBuffer(pdfUrl);
      if (pdfData) {
        const pdfVars = { ...vars, TYPE: 'FT' };
        const pdfName = applyNomenclature(template, pdfVars, 'pdf');
        zip.file(pdfName, pdfData);
      }
    }

    done += 1;
    onProgress(Math.round((done / total) * 100));
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${projectName || 'GrabSpec'}.zip`);
}

interface DownloadSingleAssetOptions {
  product: LocalProduct;
  template: string;
  projectName: string;
  index: number;
  kind: 'photo' | 'pdf';
}

export async function downloadSingleAsset({
  product,
  template,
  projectName,
  index,
  kind,
}: DownloadSingleAssetOptions): Promise<void> {
  const [{ saveAs }] = await Promise.all([import('file-saver')]);

  const url =
    kind === 'photo'
      ? (product.photoBlobUrl ?? product.photoUrl)
      : (product.datasheetBlobUrl ?? product.datasheetUrl);

  if (!url) {
    throw new Error('Missing file URL');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch file');
  }

  const blob = await response.blob();
  const filename = buildProductFilename(
    product,
    template,
    projectName,
    index,
    kind === 'photo' ? 'PHOTO' : 'FT',
    url
  );

  saveAs(blob, filename);
}

export async function downloadExcelOnly({
  products,
  projectName,
  locale,
  company,
  projectDetails,
}: DownloadExcelOptions): Promise<void> {
  const [{ saveAs }, { generateExcel }] = await Promise.all([
    import('file-saver'),
    import('@/lib/excel'),
  ]);

  const data = await generateExcel({
    products,
    locale,
    projectName,
    company,
    projectDetails,
  });
  const blob = new Blob([data as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${projectName || 'GrabSpec'}_recap.xlsx`);
}
