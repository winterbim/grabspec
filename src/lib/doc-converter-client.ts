/**
 * Client-side DOCX → PDF and PDF → DOCX conversion.
 * Uses mammoth (browser) + jsPDF + html2canvas.
 * No server, no Chromium — runs entirely in the browser.
 */

export interface DocConversionResult {
  blob: Blob;
  filename: string;
  size: number;
  duration: number;
}

/**
 * Convert DOCX/DOC → PDF entirely client-side.
 * Pipeline: mammoth (DOCX→HTML) → hidden div → html2canvas → jsPDF
 */
export async function convertWordToPdfClient(file: File): Promise<DocConversionResult> {
  const startTime = performance.now();

  // Dynamic imports for code splitting
  const mammoth = await import('mammoth');
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');

  // 1. Convert DOCX → HTML via mammoth
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const base64 = await image.read('base64');
        return { src: `data:${image.contentType};base64,${base64}` };
      }),
    }
  );

  // 2. Render HTML in a hidden container
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:794px;padding:40px 50px;' +
    'font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;' +
    'color:#000;background:#fff;';
  container.innerHTML = `
    <style>
      h1 { font-size: 22px; margin: 16px 0 8px; font-weight: 700; }
      h2 { font-size: 18px; margin: 14px 0 6px; font-weight: 700; }
      h3 { font-size: 15px; margin: 12px 0 4px; font-weight: 600; }
      p { margin: 0 0 8px; }
      table { border-collapse: collapse; width: 100%; margin: 10px 0; }
      td, th { border: 1px solid #bbb; padding: 4px 8px; }
      th { background: #f0f0f0; font-weight: 600; }
      img { max-width: 100%; height: auto; margin: 8px 0; }
      ul, ol { padding-left: 24px; margin: 6px 0; }
      li { margin-bottom: 3px; }
    </style>
    ${result.value}
  `;
  document.body.appendChild(container);

  // Wait for images to load
  const images = container.querySelectorAll('img');
  if (images.length > 0) {
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
      ),
    );
  }

  // 3. Capture to canvas with html2canvas
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false,
    width: 794,
    windowWidth: 794,
  });

  document.body.removeChild(container);

  // 4. Split canvas into A4 pages and create PDF
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(
    canvas.toDataURL('image/jpeg', 0.95),
    'JPEG',
    0,
    position,
    imgWidth,
    imgHeight,
  );
  heightLeft -= pageHeight;

  // Additional pages
  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.95),
      'JPEG',
      0,
      position,
      imgWidth,
      imgHeight,
    );
    heightLeft -= pageHeight;
  }

  const pdfBlob = pdf.output('blob');
  const baseName = file.name.replace(/\.(docx?)$/i, '');

  return {
    blob: pdfBlob,
    filename: `${baseName}.pdf`,
    size: pdfBlob.size,
    duration: performance.now() - startTime,
  };
}

/**
 * Check if a file is a Word document.
 */
export function isWordFile(file: File): boolean {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  return ext === '.docx' || ext === '.doc';
}

/**
 * Check if a file is a PDF.
 */
export function isPdfFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.pdf');
}
