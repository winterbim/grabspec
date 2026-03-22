import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 120;

const ANALYZER_PROMPT = `Tu es un analyste de données expert. À partir du contenu d'un document, tu dois :

1. Identifier les KPI (indicateurs clés) présents ou calculables
2. Proposer des graphiques pertinents avec les données
3. Rédiger un résumé exécutif et des insights clés
4. Créer un plan de présentation en slides

RÈGLES :
- Réponds UNIQUEMENT en JSON valide
- Extrais les vrais chiffres du document
- Si le document est un tableau : calcule totaux, moyennes, min/max, tendances
- Si le document est un texte : extrais les données quantitatives mentionnées
- Génère entre 3 et 8 KPI
- Génère entre 1 et 4 graphiques
- Génère entre 3 et 6 slides

JSON ATTENDU :
{
  "title": "Titre du document analysé",
  "summary": "Résumé exécutif en 2-3 phrases",
  "insights": ["Insight 1", "Insight 2", "..."],
  "kpis": [
    { "label": "Nom du KPI", "value": "42", "unit": "unité", "trend": "up|down|stable", "detail": "explication courte" }
  ],
  "charts": [
    {
      "type": "bar|line|pie|area",
      "title": "Titre du graphique",
      "data": [{ "name": "Label", "value": 123 }],
      "xKey": "name",
      "yKey": "value"
    }
  ],
  "slides": [
    { "title": "Titre slide", "content": "Contenu texte", "type": "title|kpi|chart|text|conclusion" }
  ]
}`;

function resolveApiKey(): string {
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey) return envKey;

  try {
    const fs = require('fs');
    const path = require('path');
    const credPath = path.join(process.env.HOME || '', '.claude', '.credentials.json');
    const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
    const token = creds?.claudeAiOauth?.accessToken;
    if (token && Date.now() < (creds.claudeAiOauth.expiresAt || 0)) return token;
  } catch { /* not available */ }

  throw new Error('Service configuration error');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sessionId = formData.get('sessionId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session required' }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 });
    }

    // Check plan — Business only
    const planRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://grabspec.vercel.app'}/api/plan?sessionId=${sessionId}`);
    const planData = await planRes.json();
    if (planData.data?.plan !== 'business') {
      return NextResponse.json({ error: 'Business plan required' }, { status: 403 });
    }

    // Extract text content based on file type
    const content = await extractTextContent(file);
    if (!content || content.length < 20) {
      return NextResponse.json({ error: 'Could not extract content from file' }, { status: 422 });
    }

    // Truncate to avoid context overflow
    const truncated = content.slice(0, 80_000);

    // Call Claude for analysis
    const client = new Anthropic({ apiKey: resolveApiKey() });
    const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: ANALYZER_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyse ce document "${file.name}" :\n\n${truncated}`,
        },
      ],
    });

    let text = response.content[0].type === 'text' ? response.content[0].text : '';
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    const analysis = JSON.parse(text);

    return NextResponse.json({ data: analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Text extraction by file type ───

async function extractTextContent(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.pdf')) {
    return extractFromPdf(file);
  }
  if (name.endsWith('.docx') || name.endsWith('.doc')) {
    return extractFromDocx(file);
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return extractFromXlsx(file);
  }
  if (name.endsWith('.csv') || name.endsWith('.tsv')) {
    return file.text();
  }
  if (name.endsWith('.txt') || name.endsWith('.json') || name.endsWith('.md') || name.endsWith('.html')) {
    return file.text();
  }

  return file.text();
}

async function extractFromPdf(file: File): Promise<string> {
  const { extractText } = await import('unpdf');
  const buffer = await file.arrayBuffer();
  const result = await extractText(new Uint8Array(buffer), { mergePages: true });
  return Array.isArray(result.text) ? result.text.join('\n\n') : result.text;
}

async function extractFromDocx(file: File): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require('mammoth');
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return result.value;
}

async function extractFromXlsx(file: File): Promise<string> {
  const ExcelJS = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await wb.xlsx.load(buffer);

  const lines: string[] = [];
  for (const ws of wb.worksheets.slice(0, 5)) {
    lines.push(`=== Sheet: ${ws.name} ===`);
    let rowCount = 0;
    ws.eachRow((row) => {
      if (rowCount >= 1000) return;
      const cells: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.text || String(cell.value ?? '');
        cells.push(val);
      });
      lines.push(cells.join(' | '));
      rowCount++;
    });
  }

  return lines.join('\n');
}
