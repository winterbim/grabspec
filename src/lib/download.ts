import type { LocalProduct } from '@/lib/db';
import type { NomenclatureVars } from '@/types';

interface DownloadZipOptions {
  products: LocalProduct[];
  template: string;
  projectName: string;
  onProgress: (percent: number) => void;
}

interface DownloadExcelOptions {
  products: LocalProduct[];
  projectName: string;
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

export async function downloadZip({
  products,
  template,
  projectName,
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

  const excelData = await generateExcel(products);
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

export async function downloadExcelOnly({
  products,
  projectName,
}: DownloadExcelOptions): Promise<void> {
  const [{ saveAs }, { generateExcel }] = await Promise.all([
    import('file-saver'),
    import('@/lib/excel'),
  ]);

  const data = await generateExcel(products);
  const blob = new Blob([data as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${projectName || 'GrabSpec'}_recap.xlsx`);
}
