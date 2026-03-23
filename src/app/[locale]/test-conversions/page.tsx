'use client';

import { useEffect, useState, useRef } from 'react';
import * as sc from '@/lib/spreadsheet-converter';
import { convertImageClientSide } from '@/lib/image-converter';
import { convertWordToPdfClient } from '@/lib/doc-converter-client';
import * as pdfTools from '@/lib/pdf-tools';

type TestResult = { name: string; status: 'pass' | 'fail' | 'running'; detail: string };

/** Create a simple XLSX file via ExcelJS for testing */
async function createTestXlsx(): Promise<File> {
  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow(['Name', 'Age', 'City']);
  ws.addRow(['Alice', 30, 'New York']);
  ws.addRow(['Bob', 25, 'Paris']);
  ws.addRow(['Charlie', 35, 'San Francisco']);
  const buffer = await wb.xlsx.writeBuffer();
  return new File([buffer], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function createTestCsv(): File {
  return new File(
    ['Name,Age,City\nAlice,30,"New York"\nBob,25,Paris\nCharlie,35,"San Francisco"'],
    'test.csv',
    { type: 'text/csv' }
  );
}

function createTestTsv(): File {
  return new File(
    ['Name\tAge\tCity\nAlice\t30\tNew York\nBob\t25\tParis\nCharlie\t35\tSan Francisco'],
    'test.tsv',
    { type: 'text/tab-separated-values' }
  );
}

function createTestJson(): File {
  const data = [
    { Name: 'Alice', Age: '30', City: 'New York' },
    { Name: 'Bob', Age: '25', City: 'Paris' },
    { Name: 'Charlie', Age: '35', City: 'San Francisco' },
  ];
  return new File([JSON.stringify(data, null, 2)], 'test.json', { type: 'application/json' });
}

function createTestTxt(): File {
  return new File(
    ['GrabSpec Test\nLine 2: éàü ñ ß\nLine 3: !@#$%\nLine 4: 12345'],
    'test.txt',
    { type: 'text/plain' }
  );
}

function createTestHtml(): File {
  return new File(
    ['<html><body><h1>Test</h1><p>Hello <strong>world</strong></p><table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table></body></html>'],
    'test.html',
    { type: 'text/html' }
  );
}

function createTestMd(): File {
  return new File(
    ['# Test\n\n## Section\n\n**Bold** and *italic*\n\n- Item 1\n- Item 2\n\n> Quote\n\n```js\nconsole.log("hi");\n```'],
    'test.md',
    { type: 'text/markdown' }
  );
}

/** Create a 50x50 red PNG for image testing */
function createTestImage(format: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 50, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.fillText('TEST', 10, 30);

    const mimeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp',
    };
    const mime = mimeMap[format] || 'image/png';

    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas toBlob failed'));
        resolve(new File([blob], `test.${format}`, { type: mime }));
      },
      mime,
      0.9
    );
  });
}

/** Create a DOCX test file with the docx library */
async function createTestDocx(): Promise<File> {
  const { Document, Paragraph, TextRun, Packer } = await import('docx');
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun({ text: 'Test Heading', bold: true, size: 32 })] }),
        new Paragraph({ children: [new TextRun('This is a test paragraph for DOCX to PDF conversion.')] }),
        new Paragraph({ children: [new TextRun({ text: 'Bold text', bold: true }), new TextRun(' and '), new TextRun({ text: 'italic text', italics: true })] }),
      ]
    }]
  });
  const buffer = await Packer.toBuffer(doc);
  // Convert to clean ArrayBuffer for File constructor
  const ab = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(ab).set(new Uint8Array(buffer));
  return new File([ab], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

/** Create a test PDF using pdf-lib */
async function createTestPdf(): Promise<File> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 3; i++) {
    const page = doc.addPage([595, 842]);
    page.drawText(`Test page ${i + 1}`, { x: 50, y: 780, size: 20, font, color: rgb(0, 0, 0) });
  }
  const bytes = await doc.save();
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return new File([ab], 'test.pdf', { type: 'application/pdf' });
}

export default function TestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  function addResult(r: TestResult) {
    setResults(prev => [...prev, r]);
  }

  function updateLast(r: TestResult) {
    setResults(prev => [...prev.slice(0, -1), r]);
  }

  async function runTest(name: string, fn: () => Promise<string>) {
    addResult({ name, status: 'running', detail: '...' });
    try {
      const detail = await fn();
      updateLast({ name, status: 'pass', detail });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateLast({ name, status: 'fail', detail: msg });
    }
  }

  async function runAllTests() {
    setResults([]);
    setRunning(true);
    setDone(false);

    // ─── 1. Spreadsheet conversions ───
    const xlsx = await createTestXlsx();
    const csv = createTestCsv();
    const tsv = createTestTsv();
    const json = createTestJson();

    await runTest('XLSX → CSV', async () => {
      const r = await sc.convertXlsxToCsv(xlsx);
      const text = await r.blob.text();
      if (!text.includes('Alice')) throw new Error('Missing data');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('XLSX → JSON', async () => {
      const r = await sc.convertXlsxToJson(xlsx);
      const text = await r.blob.text();
      const parsed = JSON.parse(text);
      if (parsed.length !== 3) throw new Error(`Expected 3 rows, got ${parsed.length}`);
      return `${parsed.length} records, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('XLSX → TXT', async () => {
      const r = await sc.convertXlsxToTxt(xlsx);
      const text = await r.blob.text();
      if (!text.includes('Alice\t30\tNew York')) throw new Error('Data mismatch');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('XLSX → HTML', async () => {
      const r = await sc.convertXlsxToHtml(xlsx);
      const text = await r.blob.text();
      if (!text.includes('<th>Name</th>') || !text.includes('<td>Alice</td>')) throw new Error('Missing HTML elements');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('XLSX → PDF', async () => {
      const r = await sc.convertXlsxToPdf(xlsx);
      if (r.size < 100) throw new Error('PDF too small');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('XLS → XLSX', async () => {
      // We test by converting from a valid XLSX pretending it's misnamed as XLS
      // This tests the loadWorkbook fallback path
      const r = await sc.convertXlsToXlsx(xlsx);
      if (r.size < 100) throw new Error('XLSX too small');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('CSV → XLSX', async () => {
      const r = await sc.convertCsvToXlsx(csv);
      if (r.size < 100) throw new Error('XLSX too small');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('CSV → JSON', async () => {
      const r = await sc.convertCsvToJson(csv);
      const text = await r.blob.text();
      const parsed = JSON.parse(text);
      if (parsed.length !== 3) throw new Error(`Expected 3 rows, got ${parsed.length}`);
      if (parsed[0].City !== 'New York') throw new Error('Quoted field not preserved');
      return `${parsed.length} records (quoted fields OK), ${r.duration.toFixed(0)}ms`;
    });

    await runTest('TSV → XLSX', async () => {
      const r = await sc.convertCsvToXlsx(tsv);
      if (r.size < 100) throw new Error('XLSX too small');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('TSV → JSON (via convertCsvToJson)', async () => {
      const r = await sc.convertCsvToJson(tsv);
      const text = await r.blob.text();
      const parsed = JSON.parse(text);
      if (parsed.length !== 3) throw new Error(`Expected 3 rows, got ${parsed.length}`);
      return `${parsed.length} records, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('JSON → CSV', async () => {
      const r = await sc.convertJsonToCsv(json);
      const text = await r.blob.text();
      if (!text.includes('Alice')) throw new Error('Missing data');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('JSON → XLSX', async () => {
      const r = await sc.convertJsonToXlsx(json);
      if (r.size < 100) throw new Error('XLSX too small');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    // ─── 2. Text/Document conversions ───
    const txt = createTestTxt();
    const html = createTestHtml();
    const md = createTestMd();

    await runTest('TXT → PDF', async () => {
      const r = await sc.convertTxtToPdf(txt);
      if (r.size < 100) throw new Error('PDF too small');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('HTML → PDF', async () => {
      const r = await sc.convertHtmlToPdf(html);
      if (r.size < 100) throw new Error('PDF too small');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('MD → PDF', async () => {
      const r = await sc.convertMdToPdf(md);
      if (r.size < 100) throw new Error('PDF too small');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('MD → HTML', async () => {
      const r = await sc.convertMdToHtml(md);
      const text = await r.blob.text();
      if (!text.includes('<h1>Test</h1>') || !text.includes('<strong>Bold</strong>')) throw new Error('Markdown not converted');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    // ─── 3. Image conversions ───
    const pngFile = await createTestImage('png');
    const jpgFile = await createTestImage('jpg');

    await runTest('PNG → JPG', async () => {
      const r = await convertImageClientSide(pngFile, 'image/jpeg');
      if (r.size < 10) throw new Error('Output too small');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('PNG → WEBP', async () => {
      const r = await convertImageClientSide(pngFile, 'image/webp');
      if (r.size < 10) throw new Error('Output too small');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('JPG → PNG', async () => {
      const r = await convertImageClientSide(jpgFile, 'image/png');
      if (r.size < 10) throw new Error('Output too small');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('JPG → WEBP', async () => {
      const r = await convertImageClientSide(jpgFile, 'image/webp');
      if (r.size < 10) throw new Error('Output too small');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    // ─── 4. DOCX → PDF ───
    await runTest('DOCX → PDF', async () => {
      const docx = await createTestDocx();
      const r = await convertWordToPdfClient(docx);
      if (r.size < 100) throw new Error('PDF too small');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    // ─── 5. PDF Tools ───
    const pdf = await createTestPdf();

    await runTest('PDF Merge (2 files)', async () => {
      const r = await pdfTools.mergePdfs([pdf, pdf]);
      if (r.pageCount !== 6) throw new Error(`Expected 6 pages, got ${r.pageCount}`);
      return `${r.pageCount} pages, ${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('PDF Split', async () => {
      const results = await pdfTools.splitPdf(pdf);
      if (results.length !== 3) throw new Error(`Expected 3 files, got ${results.length}`);
      return `${results.length} files, ${results.map(r => r.size).join('+')} bytes`;
    });

    await runTest('PDF Extract pages 1,3', async () => {
      const r = await pdfTools.extractPages(pdf, [1, 3]);
      if (r.pageCount !== 2) throw new Error(`Expected 2 pages, got ${r.pageCount}`);
      return `${r.pageCount} pages, ${r.size} bytes`;
    });

    await runTest('PDF Rotate 90°', async () => {
      const r = await pdfTools.rotatePdf(pdf, 90);
      if (r.size < 100) throw new Error('Output too small');
      return `${r.size} bytes, ${r.duration.toFixed(0)}ms`;
    });

    await runTest('PDF Compress', async () => {
      const r = await pdfTools.compressPdf(pdf);
      if (r.size < 100) throw new Error('Output too small');
      return `${r.size} bytes (original: ${pdf.size})`;
    });

    await runTest('PDF Add page numbers', async () => {
      const r = await pdfTools.addPageNumbers(pdf);
      if (r.size < pdf.size) throw new Error('Output should be larger');
      return `${r.pageCount} pages, ${r.size} bytes`;
    });

    await runTest('PDF → DOCX (API)', async () => {
      const formData = new FormData();
      formData.append('file', pdf);
      const res = await fetch('/api/converter/pdf-to-word', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const blob = await res.blob();
      if (blob.size < 100) throw new Error('DOCX too small');
      return `${blob.size} bytes`;
    });

    setRunning(false);
    setDone(true);

    // Report results to server console
    const summary = {
      pass: results.filter(r => r.status === 'pass').length + (failCount === 0 ? 1 : 0),
      fail: failCount,
      results: results.map(r => `${r.status === 'pass' ? '✅' : '❌'} ${r.name}: ${r.detail}`)
    };
    // Use beacon to send results
    try {
      navigator.sendBeacon('/api/test-report', JSON.stringify(summary));
    } catch { /* ignore */ }
  }

  // Auto-run tests on mount
  useEffect(() => {
    if (!running && !done && results.length === 0) {
      runAllTests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [results]);

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;

  return (
    <div style={{ fontFamily: 'monospace', padding: 32, maxWidth: 900, margin: '0 auto', background: '#0d1117', color: '#c9d1d9', minHeight: '100vh' }}>
      <h1 style={{ color: '#58a6ff', fontSize: 24 }}>🧪 GrabSpec — Browser Conversion Test Suite</h1>

      <button
        onClick={runAllTests}
        disabled={running}
        style={{
          padding: '12px 24px', fontSize: 16, cursor: running ? 'wait' : 'pointer',
          background: running ? '#30363d' : '#238636', color: '#fff', border: 'none', borderRadius: 6,
          marginBottom: 20
        }}
      >
        {running ? '⏳ Running tests...' : '▶ Run All Tests'}
      </button>

      {done && (
        <div style={{ fontSize: 18, marginBottom: 16 }}>
          <span style={{ color: '#3fb950' }}>✓ {passCount} passed</span>
          {' | '}
          <span style={{ color: failCount ? '#f85149' : '#8b949e' }}>✗ {failCount} failed</span>
          {' | '}
          <span style={{ color: '#8b949e' }}>Total: {results.length}</span>
        </div>
      )}

      <div ref={logRef} style={{ maxHeight: '70vh', overflow: 'auto' }}>
        {results.map((r, i) => (
          <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #21262d', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ width: 20, textAlign: 'center' }}>
              {r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⏳'}
            </span>
            <span style={{ minWidth: 240, fontWeight: 600, color: r.status === 'fail' ? '#f85149' : '#c9d1d9' }}>
              {r.name}
            </span>
            <span style={{ color: r.status === 'fail' ? '#f85149' : '#8b949e', fontSize: 13 }}>
              {r.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
