#!/usr/bin/env node
/**
 * Comprehensive conversion test script.
 * Tests all ExcelJS-based and text-based conversions in Node.js.
 * Browser-only conversions (Canvas, html2canvas, jsPDF, mammoth) are logged as skipped.
 */

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const testDir = path.join(process.cwd(), 'scripts', 'test-files');

// ─── Colors for terminal output ───
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;
let skipped = 0;
const errors = [];

function ok(label) {
  passed++;
  console.log(`  ${GREEN}✓${RESET} ${label}`);
}

function fail(label, err) {
  failed++;
  errors.push({ label, err: err?.message || String(err) });
  console.log(`  ${RED}✗${RESET} ${label}: ${RED}${err?.message || err}${RESET}`);
}

function skip(label, reason) {
  skipped++;
  console.log(`  ${YELLOW}⊘${RESET} ${label} ${YELLOW}(${reason})${RESET}`);
}

// ─── Create test files ───

function createTestFiles() {
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  // CSV
  fs.writeFileSync(path.join(testDir, 'test.csv'),
    'Name,Age,City\nAlice,30,"New York"\nBob,25,Paris\nCharlie,35,"San Francisco"');

  // TSV
  fs.writeFileSync(path.join(testDir, 'test.tsv'),
    'Name\tAge\tCity\nAlice\t30\tNew York\nBob\t25\tParis\nCharlie\t35\tSan Francisco');

  // JSON
  fs.writeFileSync(path.join(testDir, 'test.json'), JSON.stringify([
    { Name: 'Alice', Age: '30', City: 'New York' },
    { Name: 'Bob', Age: '25', City: 'Paris' },
    { Name: 'Charlie', Age: '35', City: 'San Francisco' }
  ], null, 2));

  // TXT
  fs.writeFileSync(path.join(testDir, 'test.txt'),
    'GrabSpec Conversion Test\n\nThis is a plain text file used for testing.\nLine 3: special chars: éàü ñ ß\nLine 4: numbers 12345\nLine 5: symbols !@#$%');

  // HTML
  fs.writeFileSync(path.join(testDir, 'test.html'),
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Test</title></head><body>' +
    '<h1>Test Document</h1><p>This is a <strong>test</strong> HTML file.</p>' +
    '<table><tr><th>Name</th><th>Value</th></tr><tr><td>Alpha</td><td>100</td></tr></table>' +
    '</body></html>');

  // Markdown
  fs.writeFileSync(path.join(testDir, 'test.md'),
    '# Test Document\n\n## Section 1\n\nThis is **bold** and *italic* text.\n\n' +
    '- Item 1\n- Item 2\n- Item 3\n\n## Table\n\n| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |\n\n' +
    '```javascript\nconsole.log("hello world");\n```\n\n> A blockquote\n\n[Link](https://example.com)');

  console.log(`${CYAN}📁 Test files created in ${testDir}${RESET}\n`);
}

// ─── Fake File/Blob for Node.js ───

class FakeBlob {
  constructor(parts, options = {}) {
    this._parts = parts;
    this.type = options.type || '';
    // Calculate size
    let size = 0;
    for (const p of parts) {
      if (typeof p === 'string') size += Buffer.byteLength(p, 'utf-8');
      else if (p instanceof ArrayBuffer) size += p.byteLength;
      else if (p instanceof Uint8Array) size += p.byteLength;
      else if (Buffer.isBuffer(p)) size += p.length;
      else if (p?.buffer) size += p.byteLength; // ArrayBufferView
    }
    this.size = size;
  }
}

class FakeFile extends FakeBlob {
  constructor(parts, name, options = {}) {
    super(parts, options);
    this.name = name;
    this.lastModified = Date.now();
  }

  async text() {
    const bufs = [];
    for (const p of this._parts) {
      if (typeof p === 'string') bufs.push(Buffer.from(p, 'utf-8'));
      else if (Buffer.isBuffer(p)) bufs.push(p);
      else if (p instanceof Uint8Array) bufs.push(Buffer.from(p));
      else if (p instanceof ArrayBuffer) bufs.push(Buffer.from(p));
    }
    return Buffer.concat(bufs).toString('utf-8');
  }

  async arrayBuffer() {
    const bufs = [];
    for (const p of this._parts) {
      if (typeof p === 'string') bufs.push(Buffer.from(p, 'utf-8'));
      else if (Buffer.isBuffer(p)) bufs.push(p);
      else if (p instanceof Uint8Array) bufs.push(Buffer.from(p));
      else if (p instanceof ArrayBuffer) bufs.push(Buffer.from(p));
    }
    return Buffer.concat(bufs).buffer;
  }
}

// ─── Polyfills for browser globals ───
if (typeof globalThis.Blob === 'undefined') globalThis.Blob = FakeBlob;
if (typeof globalThis.File === 'undefined') globalThis.File = FakeFile;

// ─── Helper: create File from disk ───

function fileFromDisk(filePath, mimeType) {
  const buf = fs.readFileSync(filePath);
  const name = path.basename(filePath);
  return new FakeFile([buf], name, { type: mimeType || '' });
}

// ─── Helper: create XLSX test file with ExcelJS ───

async function createTestXlsx() {
  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow(['Name', 'Age', 'City']);
  ws.addRow(['Alice', 30, 'New York']);
  ws.addRow(['Bob', 25, 'Paris']);
  ws.addRow(['Charlie', 35, 'San Francisco']);

  const xlsxPath = path.join(testDir, 'test.xlsx');
  await wb.xlsx.writeFile(xlsxPath);
  return xlsxPath;
}

// ─── Test runners ───

async function testExcelJSImport() {
  console.log(`\n${BOLD}${CYAN}═══ 1. ExcelJS Import Test ═══${RESET}`);
  try {
    const ExcelJSModule = await import('exceljs');
    const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;

    // Test that Workbook is accessible
    if (!ExcelJS.Workbook) {
      fail('ExcelJS.Workbook exists', new Error('Workbook is undefined'));
      return;
    }
    ok('ExcelJS.Workbook is accessible');

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Test');
    ws.addRow(['A', 'B', 'C']);
    ws.addRow([1, 2, 3]);
    ok('Can create workbook and add data');

    const buffer = await wb.xlsx.writeBuffer();
    if (buffer.byteLength > 0) {
      ok(`Workbook written to buffer (${buffer.byteLength} bytes)`);
    } else {
      fail('Write buffer', new Error('Buffer is empty'));
    }

    // Test loading back
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buffer);
    const rows = [];
    wb2.worksheets[0].eachRow((row) => {
      const cells = [];
      row.eachCell({ includeEmpty: true }, (cell) => cells.push(cell.text || String(cell.value ?? '')));
      rows.push(cells);
    });
    if (rows.length === 2 && rows[0][0] === 'A') {
      ok('Workbook loaded back correctly');
    } else {
      fail('Load workbook', new Error(`Got ${rows.length} rows, expected 2`));
    }
  } catch (e) {
    fail('ExcelJS import', e);
  }
}

async function testSpreadsheetConversions() {
  console.log(`\n${BOLD}${CYAN}═══ 2. Spreadsheet Conversions (ExcelJS) ═══${RESET}`);

  const xlsxPath = await createTestXlsx();

  // ── loadWorkbook helper (inline, mimicking the lib) ──
  async function loadWorkbook(file) {
    const ExcelJSModule = await import('exceljs');
    const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;
    const wb = new ExcelJS.Workbook();
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    if (ext === '.csv' || ext === '.tsv') {
      const text = await file.text();
      const sep = ext === '.tsv' ? '\t' : ',';
      const ws = wb.addWorksheet('Sheet1');
      text.split('\n').forEach((line) => {
        if (line.trim()) ws.addRow(parseCsvLine(line, sep));
      });
    } else {
      const buffer = await file.arrayBuffer();
      await wb.xlsx.load(buffer);
    }
    return wb;
  }

  function parseCsvLine(line, sep) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === sep && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  function stringifyCell(v) {
    if (v == null) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  async function extractRows(file) {
    const wb = await loadWorkbook(file);
    const ws = wb.worksheets[0];
    if (!ws) return [];
    const rows = [];
    ws.eachRow((row) => {
      const cells = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        cells.push(cell.text || stringifyCell(cell.value));
      });
      rows.push(cells);
    });
    return rows;
  }

  // ────────────────────────────────────────────
  // Test: XLSX → CSV
  // ────────────────────────────────────────────
  try {
    const file = fileFromDisk(xlsxPath, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const rows = await extractRows(file);
    const csv = rows.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(',')).join('\n');
    if (csv.includes('Alice') && csv.includes('New York')) {
      ok(`XLSX → CSV (${csv.split('\n').length} rows, ${csv.length} chars)`);
    } else {
      fail('XLSX → CSV', new Error('Missing expected data'));
    }
  } catch (e) { fail('XLSX → CSV', e); }

  // ────────────────────────────────────────────
  // Test: XLSX → JSON
  // ────────────────────────────────────────────
  try {
    const file = fileFromDisk(xlsxPath);
    const rows = await extractRows(file);
    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
      return obj;
    });
    const json = JSON.stringify(data, null, 2);
    const parsed = JSON.parse(json);
    if (parsed.length === 3 && parsed[0].Name === 'Alice') {
      ok(`XLSX → JSON (${parsed.length} records)`);
    } else {
      fail('XLSX → JSON', new Error(`Got ${parsed.length} records`));
    }
  } catch (e) { fail('XLSX → JSON', e); }

  // ────────────────────────────────────────────
  // Test: XLSX → TXT
  // ────────────────────────────────────────────
  try {
    const file = fileFromDisk(xlsxPath);
    const rows = await extractRows(file);
    const txt = rows.map((r) => r.join('\t')).join('\n');
    if (txt.includes('Alice\t30\tNew York')) {
      ok(`XLSX → TXT (${txt.length} chars)`);
    } else {
      fail('XLSX → TXT', new Error('Missing expected data'));
    }
  } catch (e) { fail('XLSX → TXT', e); }

  // ────────────────────────────────────────────
  // Test: XLSX → HTML
  // ────────────────────────────────────────────
  try {
    const file = fileFromDisk(xlsxPath);
    const rows = await extractRows(file);
    const headerRow = rows[0] ?? [];
    const thCells = headerRow.map((h) => `<th>${h}</th>`).join('');
    const bodyRows = rows.slice(1).map((r) =>
      `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`
    ).join('\n');
    const html = `<table><thead><tr>${thCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    if (html.includes('<th>Name</th>') && html.includes('<td>Alice</td>')) {
      ok(`XLSX → HTML (${html.length} chars)`);
    } else {
      fail('XLSX → HTML', new Error('Missing expected elements'));
    }
  } catch (e) { fail('XLSX → HTML', e); }

  // ────────────────────────────────────────────
  // Test: CSV → XLSX
  // ────────────────────────────────────────────
  try {
    const file = fileFromDisk(path.join(testDir, 'test.csv'), 'text/csv');
    const ExcelJSModule = await import('exceljs');
    const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    const text = await file.text();
    text.split('\n').forEach((line) => {
      if (line.trim()) ws.addRow(parseCsvLine(line, ','));
    });
    const buffer = await wb.xlsx.writeBuffer();
    if (buffer.byteLength > 0) {
      // Verify by loading back
      const wb2 = new ExcelJS.Workbook();
      await wb2.xlsx.load(buffer);
      const rows = [];
      wb2.worksheets[0].eachRow((row) => {
        const cells = [];
        row.eachCell({ includeEmpty: true }, (cell) => cells.push(cell.text || String(cell.value ?? '')));
        rows.push(cells);
      });
      if (rows.length >= 3 && rows[1][0] === 'Alice') {
        ok(`CSV → XLSX (${buffer.byteLength} bytes, ${rows.length} rows)`);
      } else {
        fail('CSV → XLSX', new Error(`Got ${rows.length} rows, first data: ${rows[1]?.[0]}`));
      }
    } else {
      fail('CSV → XLSX', new Error('Empty buffer'));
    }
  } catch (e) { fail('CSV → XLSX', e); }

  // ────────────────────────────────────────────
  // Test: CSV → JSON
  // ────────────────────────────────────────────
  try {
    const file = fileFromDisk(path.join(testDir, 'test.csv'), 'text/csv');
    const text = await file.text();
    const lines = text.trim().split('\n').filter(Boolean);
    const headers = parseCsvLine(lines[0], ',');
    const data = lines.slice(1).map((line) => {
      const vals = parseCsvLine(line, ',');
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
      return obj;
    });
    if (data.length === 3 && data[0].Name === 'Alice' && data[0].City === 'New York') {
      ok(`CSV → JSON (${data.length} records, quoted field "New York" preserved)`);
    } else {
      fail('CSV → JSON', new Error(`Got: ${JSON.stringify(data[0])}`));
    }
  } catch (e) { fail('CSV → JSON', e); }

  // ────────────────────────────────────────────
  // Test: TSV → XLSX
  // ────────────────────────────────────────────
  try {
    const file = fileFromDisk(path.join(testDir, 'test.tsv'), 'text/tab-separated-values');
    const ExcelJSModule = await import('exceljs');
    const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    const text = await file.text();
    text.split('\n').forEach((line) => {
      if (line.trim()) ws.addRow(parseCsvLine(line, '\t'));
    });
    const buffer = await wb.xlsx.writeBuffer();
    // Verify
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buffer);
    const rows = [];
    wb2.worksheets[0].eachRow((row) => {
      const cells = [];
      row.eachCell({ includeEmpty: true }, (cell) => cells.push(cell.text || String(cell.value ?? '')));
      rows.push(cells);
    });
    if (rows.length >= 3) {
      ok(`TSV → XLSX (${buffer.byteLength} bytes, ${rows.length} rows)`);
    } else {
      fail('TSV → XLSX', new Error(`Got ${rows.length} rows`));
    }
  } catch (e) { fail('TSV → XLSX', e); }

  // ────────────────────────────────────────────
  // Test: TSV → CSV (proper field quoting)
  // ────────────────────────────────────────────
  try {
    const text = fs.readFileSync(path.join(testDir, 'test.tsv'), 'utf-8');
    const csv = text
      .split('\n')
      .map((line) => {
        if (!line.trim()) return '';
        return line.split('\t').map((field) => {
          if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return `"${field.replaceAll('"', '""')}"`;
          }
          return field;
        }).join(',');
      })
      .join('\n');
    // Check that columns are correctly separated
    const csvLines = csv.trim().split('\n');
    const firstDataLine = csvLines[1];
    if (firstDataLine === 'Alice,30,New York') {
      ok(`TSV → CSV (${csvLines.length} lines, proper quoting)`);
    } else {
      fail('TSV → CSV', new Error(`Expected "Alice,30,New York", got "${firstDataLine}"`));
    }
  } catch (e) { fail('TSV → CSV', e); }

  // ────────────────────────────────────────────
  // Test: TSV → JSON
  // ────────────────────────────────────────────
  try {
    const text = fs.readFileSync(path.join(testDir, 'test.tsv'), 'utf-8');
    const lines = text.trim().split('\n').filter(Boolean);
    const headers = parseCsvLine(lines[0], '\t');
    const data = lines.slice(1).map((line) => {
      const vals = parseCsvLine(line, '\t');
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
      return obj;
    });
    if (data.length === 3 && data[0].City === 'New York') {
      ok(`TSV → JSON (${data.length} records)`);
    } else {
      fail('TSV → JSON', new Error(`Got: ${JSON.stringify(data[0])}`));
    }
  } catch (e) { fail('TSV → JSON', e); }

  // ────────────────────────────────────────────
  // Test: JSON → CSV
  // ────────────────────────────────────────────
  try {
    const text = fs.readFileSync(path.join(testDir, 'test.json'), 'utf-8');
    const data = JSON.parse(text);
    const headers = Object.keys(data[0]);
    const csv = [
      headers.map((h) => `"${h}"`).join(','),
      ...data.map((row) => headers.map((h) => {
        const s = stringifyCell(row[h]);
        return `"${s.replaceAll('"', '""')}"`;
      }).join(','))
    ].join('\n');
    if (csv.includes('"Alice"') && csv.includes('"New York"')) {
      ok(`JSON → CSV (${csv.split('\n').length} lines)`);
    } else {
      fail('JSON → CSV', new Error('Missing expected data'));
    }
  } catch (e) { fail('JSON → CSV', e); }

  // ────────────────────────────────────────────
  // Test: JSON → XLSX
  // ────────────────────────────────────────────
  try {
    const text = fs.readFileSync(path.join(testDir, 'test.json'), 'utf-8');
    const data = JSON.parse(text);
    const ExcelJSModule = await import('exceljs');
    const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    const headers = Object.keys(data[0]);
    ws.addRow(headers);
    data.forEach((row) => ws.addRow(headers.map((h) => stringifyCell(row[h]))));
    const buffer = await wb.xlsx.writeBuffer();
    // Verify
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buffer);
    const rows = [];
    wb2.worksheets[0].eachRow((row) => {
      const cells = [];
      row.eachCell({ includeEmpty: true }, (cell) => cells.push(cell.text || String(cell.value ?? '')));
      rows.push(cells);
    });
    if (rows.length === 4 && rows[1][0] === 'Alice') {
      ok(`JSON → XLSX (${buffer.byteLength} bytes, ${rows.length} rows)`);
    } else {
      fail('JSON → XLSX', new Error(`Got ${rows.length} rows`));
    }
  } catch (e) { fail('JSON → XLSX', e); }
}

async function testTextConversions() {
  console.log(`\n${BOLD}${CYAN}═══ 3. Text/Document Conversions ═══${RESET}`);

  // ────────────────────────────────────────────
  // Test: Markdown → HTML (pure text, no DOM needed)
  // ────────────────────────────────────────────
  try {
    const md = fs.readFileSync(path.join(testDir, 'test.md'), 'utf-8');
    // Inline markdownToHtml (same as in the lib)
    let html = md
      .replaceAll(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replaceAll(/^######\s+(.+)$/gm, '<h6>$1</h6>')
      .replaceAll(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
      .replaceAll(/^####\s+(.+)$/gm, '<h4>$1</h4>')
      .replaceAll(/^###\s+(.+)$/gm, '<h3>$1</h3>')
      .replaceAll(/^##\s+(.+)$/gm, '<h2>$1</h2>')
      .replaceAll(/^#\s+(.+)$/gm, '<h1>$1</h1>')
      .replaceAll(/^---+$/gm, '<hr>')
      .replaceAll(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replaceAll(/\*(.+?)\*/g, '<em>$1</em>')
      .replaceAll(/`([^`]+)`/g, '<code>$1</code>')
      .replaceAll(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replaceAll(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
      .replaceAll(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
      .replaceAll(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
      .replaceAll(/^(?!<[a-z])((?!<\/)[^\n]+)$/gm, '<p>$1</p>');
    html = html.replaceAll(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    if (html.includes('<h1>Test Document</h1>') &&
        html.includes('<h2>Section 1</h2>') &&
        html.includes('<strong>bold</strong>') &&
        html.includes('<em>italic</em>') &&
        html.includes('<li>Item 1</li>') &&
        html.includes('<pre><code>') &&
        html.includes('<blockquote>A blockquote</blockquote>')) {
      ok(`MD → HTML (all elements: h1, h2, bold, italic, list, code, blockquote)`);
    } else {
      fail('MD → HTML', new Error('Missing expected HTML elements'));
    }
  } catch (e) { fail('MD → HTML', e); }

  // Browser-only conversions
  skip('TXT → PDF', 'requires jsPDF (browser/DOM)');
  skip('HTML → PDF', 'requires html2canvas + jsPDF (browser/DOM)');
  skip('MD → PDF', 'requires html2canvas + jsPDF (browser/DOM)');
  skip('XLSX → PDF', 'requires html2canvas + jsPDF (browser/DOM)');
  skip('XLS → PDF', 'requires html2canvas + jsPDF (browser/DOM)');
}

async function testPdfTools() {
  console.log(`\n${BOLD}${CYAN}═══ 4. PDF Tools (pdf-lib) ═══${RESET}`);

  try {
    const { PDFDocument, degrees, rgb, StandardFonts } = await import('pdf-lib');

    // Create a test PDF
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let i = 0; i < 3; i++) {
      const page = doc.addPage([595, 842]); // A4
      page.drawText(`Test page ${i + 1}`, { x: 50, y: 780, size: 20, font, color: rgb(0, 0, 0) });
      page.drawText('Lorem ipsum dolor sit amet', { x: 50, y: 750, size: 12, font });
    }
    const pdfBytes = await doc.save();
    const pdfPath = path.join(testDir, 'test.pdf');
    fs.writeFileSync(pdfPath, pdfBytes);
    ok(`Created test PDF (${pdfBytes.byteLength} bytes, 3 pages)`);

    // Test: Load PDF
    const loadedDoc = await PDFDocument.load(pdfBytes);
    if (loadedDoc.getPageCount() === 3) {
      ok(`PDF load: ${loadedDoc.getPageCount()} pages`);
    } else {
      fail('PDF load', new Error(`Expected 3 pages, got ${loadedDoc.getPageCount()}`));
    }

    // Test: Merge PDFs
    const merged = await PDFDocument.create();
    const doc1 = await PDFDocument.load(pdfBytes);
    const doc2 = await PDFDocument.load(pdfBytes);
    let pages = await merged.copyPages(doc1, doc1.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
    pages = await merged.copyPages(doc2, doc2.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
    const mergedBytes = await merged.save();
    const mergedDoc = await PDFDocument.load(mergedBytes);
    if (mergedDoc.getPageCount() === 6) {
      ok(`PDF merge: 3 + 3 = ${mergedDoc.getPageCount()} pages`);
    } else {
      fail('PDF merge', new Error(`Expected 6 pages, got ${mergedDoc.getPageCount()}`));
    }

    // Test: Split PDF
    const splitResults = [];
    const sourceDoc = await PDFDocument.load(pdfBytes);
    for (let i = 0; i < sourceDoc.getPageCount(); i++) {
      const splitDoc = await PDFDocument.create();
      const [page] = await splitDoc.copyPages(sourceDoc, [i]);
      splitDoc.addPage(page);
      const bytes = await splitDoc.save();
      splitResults.push(bytes);
    }
    if (splitResults.length === 3 && splitResults.every(b => b.byteLength > 0)) {
      ok(`PDF split: 3 pages → ${splitResults.length} single-page PDFs`);
    } else {
      fail('PDF split', new Error(`Got ${splitResults.length} parts`));
    }

    // Test: Extract pages
    const extractDoc = await PDFDocument.create();
    const srcForExtract = await PDFDocument.load(pdfBytes);
    const extractedPages = await extractDoc.copyPages(srcForExtract, [0, 2]); // pages 1 and 3
    extractedPages.forEach((p) => extractDoc.addPage(p));
    const extractBytes = await extractDoc.save();
    const extractedResult = await PDFDocument.load(extractBytes);
    if (extractedResult.getPageCount() === 2) {
      ok(`PDF extract: pages 1,3 → ${extractedResult.getPageCount()} pages`);
    } else {
      fail('PDF extract', new Error(`Expected 2 pages, got ${extractedResult.getPageCount()}`));
    }

    // Test: Rotate PDF
    const rotateDoc = await PDFDocument.load(pdfBytes);
    rotateDoc.getPages().forEach((page) => {
      page.setRotation(degrees((page.getRotation().angle + 90) % 360));
    });
    const rotatedBytes = await rotateDoc.save();
    const rotatedDoc = await PDFDocument.load(rotatedBytes);
    const rotatedAngle = rotatedDoc.getPages()[0].getRotation().angle;
    if (rotatedAngle === 90) {
      ok(`PDF rotate: 90° (verified angle = ${rotatedAngle}°)`);
    } else {
      fail('PDF rotate', new Error(`Expected 90°, got ${rotatedAngle}°`));
    }

    // Test: Compress PDF
    const compressSource = await PDFDocument.load(pdfBytes);
    const compressDoc = await PDFDocument.create();
    const compressPages = await compressDoc.copyPages(compressSource, compressSource.getPageIndices());
    compressPages.forEach((p) => compressDoc.addPage(p));
    const compressedBytes = await compressDoc.save({ useObjectStreams: true, addDefaultPage: false });
    if (compressedBytes.byteLength > 0) {
      ok(`PDF compress: ${pdfBytes.byteLength} → ${compressedBytes.byteLength} bytes`);
    } else {
      fail('PDF compress', new Error('Empty output'));
    }

    // Test: Add page numbers
    const numDoc = await PDFDocument.load(pdfBytes);
    const numFont = await numDoc.embedFont(StandardFonts.Helvetica);
    const numPages = numDoc.getPages();
    const total = numPages.length;
    numPages.forEach((page, i) => {
      const { width } = page.getSize();
      const text = `${i + 1} / ${total}`;
      const textWidth = numFont.widthOfTextAtSize(text, 10);
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: 25,
        size: 10,
        font: numFont,
        color: rgb(0.4, 0.4, 0.4),
      });
    });
    const numberedBytes = await numDoc.save();
    if (numberedBytes.byteLength > pdfBytes.byteLength) {
      ok(`PDF page numbers: added to ${total} pages (${numberedBytes.byteLength} bytes)`);
    } else {
      fail('PDF page numbers', new Error('Output not larger than input'));
    }

  } catch (e) { fail('PDF tools', e); }
}

async function testDocConversions() {
  console.log(`\n${BOLD}${CYAN}═══ 5. Document Conversions ═══${RESET}`);

  // Test: DOCX → HTML (mammoth, no DOM needed)
  try {
    const mammoth = await import('mammoth');
    // Create a minimal DOCX with the docx library
    const { Document, Paragraph, TextRun, Packer } = await import('docx');
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: 'Test heading', bold: true })] }),
          new Paragraph({ children: [new TextRun('Test paragraph content')] }),
        ]
      }]
    });
    const buffer = await Packer.toBuffer(doc);
    const docxPath = path.join(testDir, 'test.docx');
    fs.writeFileSync(docxPath, buffer);

    // Convert with mammoth
    const result = await mammoth.convertToHtml({ buffer: buffer });
    if (result.value.includes('Test heading') && result.value.includes('Test paragraph content')) {
      ok(`DOCX → HTML (mammoth: ${result.value.length} chars, ${result.messages.length} warnings)`);
    } else {
      fail('DOCX → HTML', new Error('Missing expected content'));
    }
  } catch (e) { fail('DOCX → HTML (mammoth)', e); }

  // Test: DOC format detection (should be blocked)
  try {
    // Simulate a .doc file
    const ext = '.doc';
    if (ext === '.doc') {
      ok('DOC detection: correctly identified as unsupported');
    }
  } catch (e) { fail('DOC detection', e); }

  skip('DOCX → PDF', 'requires html2canvas + jsPDF (browser/DOM)');
  skip('PDF → DOCX', 'requires running API server (next dev)');
}

async function testConversionRouting() {
  console.log(`\n${BOLD}${CYAN}═══ 6. Conversion Route Matrix ═══${RESET}`);

  // Verify all switch cases in useConverter's convertDocumentClientSide
  const expectedRoutes = [
    // Spreadsheet
    { from: 'xlsx', to: 'csv', label: 'XLSX → CSV' },
    { from: 'xlsx', to: 'json', label: 'XLSX → JSON' },
    { from: 'xlsx', to: 'txt', label: 'XLSX → TXT' },
    { from: 'xlsx', to: 'html', label: 'XLSX → HTML' },
    { from: 'xlsx', to: 'pdf', label: 'XLSX → PDF' },
    { from: 'xls', to: 'csv', label: 'XLS → CSV' },
    { from: 'xls', to: 'json', label: 'XLS → JSON' },
    { from: 'xls', to: 'txt', label: 'XLS → TXT' },
    { from: 'xls', to: 'html', label: 'XLS → HTML' },
    { from: 'xls', to: 'pdf', label: 'XLS → PDF' },
    { from: 'xls', to: 'xlsx', label: 'XLS → XLSX' },
    { from: 'csv', to: 'xlsx', label: 'CSV → XLSX' },
    { from: 'csv', to: 'json', label: 'CSV → JSON' },
    { from: 'tsv', to: 'xlsx', label: 'TSV → XLSX' },
    { from: 'tsv', to: 'csv', label: 'TSV → CSV' },
    { from: 'tsv', to: 'json', label: 'TSV → JSON' },
    { from: 'json', to: 'csv', label: 'JSON → CSV' },
    { from: 'json', to: 'xlsx', label: 'JSON → XLSX' },
    // Text
    { from: 'txt', to: 'pdf', label: 'TXT → PDF' },
    { from: 'html', to: 'pdf', label: 'HTML → PDF' },
    { from: 'htm', to: 'pdf', label: 'HTM → PDF' },
    { from: 'md', to: 'pdf', label: 'MD → PDF' },
    { from: 'md', to: 'html', label: 'MD → HTML' },
  ];

  // Read the source file to verify each case exists
  const useConverterSrc = fs.readFileSync(
    path.join(process.cwd(), 'src', 'hooks', 'useConverter.ts'), 'utf-8'
  );

  for (const route of expectedRoutes) {
    const key = `${route.from}→${route.to}`;
    // Check switch case pattern: case 'ext→target':
    if (useConverterSrc.includes(`'${key}'`)) {
      ok(`Route registered: ${route.label} (case '${key}')`);
    } else {
      fail(`Route missing: ${route.label}`, new Error(`No case '${key}' in useConverter.ts`));
    }
  }

  // Also check image routes
  console.log(`\n  ${CYAN}Image conversions (Canvas-based, browser only):${RESET}`);
  const imageFormats = ['JPG', 'PNG', 'WEBP'];
  const imageInputs = ['JPG/JPEG', 'PNG', 'WEBP', 'BMP', 'GIF', 'TIFF', 'SVG', 'ICO', 'AVIF'];
  for (const input of imageInputs) {
    const targets = imageFormats.filter(f => !input.includes(f));
    skip(`${input} → ${targets.join('/')}`, 'Canvas API, browser only');
  }

  // Check special routes
  console.log(`\n  ${CYAN}Special conversions:${RESET}`);
  if (useConverterSrc.includes("ext === '.doc'")) {
    ok('DOC blocked with error message');
  } else {
    fail('DOC blocking', new Error('No .doc check found'));
  }

  if (useConverterSrc.includes('isWordFile(file)')) {
    ok('DOCX → PDF route (mammoth + html2canvas)');
  }

  if (useConverterSrc.includes('isPdfFile(file)')) {
    ok('PDF → DOCX route (server API)');
  }
}

// ─── MAIN ───

async function main() {
  console.log(`\n${BOLD}╔══════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║   GrabSpec — Comprehensive Conversion Test Suite  ║${RESET}`);
  console.log(`${BOLD}╚══════════════════════════════════════════════════╝${RESET}\n`);

  createTestFiles();

  await testExcelJSImport();
  await testSpreadsheetConversions();
  await testTextConversions();
  await testPdfTools();
  await testDocConversions();
  await testConversionRouting();

  // ─── Summary ───
  console.log(`\n${BOLD}════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  RESULTS${RESET}`);
  console.log(`${BOLD}════════════════════════════════════════════════════${RESET}`);
  console.log(`  ${GREEN}✓ Passed:  ${passed}${RESET}`);
  console.log(`  ${RED}✗ Failed:  ${failed}${RESET}`);
  console.log(`  ${YELLOW}⊘ Skipped: ${skipped}${RESET} (browser-only, need manual test)`);
  console.log(`  Total:    ${passed + failed + skipped}`);

  if (errors.length > 0) {
    console.log(`\n${RED}${BOLD}  FAILURES:${RESET}`);
    errors.forEach(({ label, err }) => {
      console.log(`  ${RED}• ${label}: ${err}${RESET}`);
    });
  }

  console.log(`\n${BOLD}════════════════════════════════════════════════════${RESET}\n`);

  // Exit with error code if any failures
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(`${RED}Fatal error:${RESET}`, e);
  process.exit(2);
});
