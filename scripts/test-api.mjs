#!/usr/bin/env node
/**
 * Test the PDF → DOCX API route on the running dev server.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function test() {
  console.log('Creating test PDF...');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawText('Test PDF for API', { x: 50, y: 780, size: 20, font, color: rgb(0, 0, 0) });
  page.drawText('This is a paragraph of text to test the conversion.', { x: 50, y: 750, size: 12, font });
  const bytes = await doc.save();
  console.log(`  PDF created: ${bytes.byteLength} bytes`);

  // Send to API
  console.log('Calling PDF → DOCX API...');
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', blob, 'test.pdf');

  try {
    const res = await fetch('http://localhost:3456/api/converter/pdf-to-word', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.arrayBuffer();
      console.log(`  ✅ PDF → DOCX: ${data.byteLength} bytes`);
      
      // Verify it's a valid DOCX (starts with PK zip header)
      const view = new Uint8Array(data);
      if (view[0] === 0x50 && view[1] === 0x4B) {
        console.log('  ✅ Valid DOCX (ZIP) header confirmed');
      } else {
        console.log(`  ⚠️  Unexpected header: ${view[0].toString(16)} ${view[1].toString(16)}`);
      }
    } else {
      const text = await res.text();
      console.log(`  ❌ HTTP ${res.status}: ${text.substring(0, 300)}`);
    }
  } catch (e) {
    console.log(`  ❌ Fetch error: ${e.message}`);
  }
}

test().catch(console.error);
