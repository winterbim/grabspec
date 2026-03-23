import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getPlanFromKV } from '@/lib/ratelimit';

export const maxDuration = 120;

const ANALYZER_PROMPT = `Tu es un analyste de données senior et un expert en data visualisation. Tu transformes n'importe quel document en un dashboard exécutif professionnel de qualité consulting (McKinsey / BCG).

OBJECTIFS :
1. Extraire TOUS les chiffres, tendances et données exploitables
2. Créer des KPIs percutants avec contexte
3. Proposer les MEILLEURS types de graphiques selon les données (pas juste des barres)
4. Rédiger une présentation narrative de qualité C-level

RÈGLES STRICTES :
- Réponds UNIQUEMENT en JSON valide (pas de texte autour)
- Extrais les VRAIS chiffres du document — jamais de données inventées
- Si tableau : calcule totaux, moyennes, min/max, écarts-types, tendances, distributions
- Si texte : extrais toutes les données quantitatives mentionnées
- Choisis le type de graphique le plus adapté aux données :
  • "bar" : comparaisons entre catégories
  • "line" : évolution temporelle / tendances
  • "area" : volumes cumulés dans le temps
  • "pie" : répartition / parts de marché (max 7 parts)
  • "radar" : comparaison multi-critères (3-8 axes)
  • "radialBar" : progression vers objectifs / scores
  • "treemap" : hiérarchie de valeurs / budgets
  • "funnel" : entonnoir / processus séquentiel
  • "sankey" : flux entre catégories (source → destination)
- Génère 4-8 KPI avec trend et couleur
- Génère 3-6 graphiques variés (utilise AU MOINS 3 types différents)
- Génère 6-10 slides de présentation narrative

FORMAT JSON :
{
  "title": "Titre analytique du document",
  "summary": "Résumé exécutif de 3-4 phrases, clair et actionnable",
  "insights": [
    "Insight actionnable 1 avec chiffre clé",
    "Insight actionnable 2 avec recommandation",
    "..."
  ],
  "kpis": [
    {
      "label": "Nom du KPI",
      "value": "42",
      "unit": "unité",
      "trend": "up",
      "detail": "vs période précédente ou contexte",
      "color": "#3b82f6"
    }
  ],
  "charts": [
    {
      "type": "bar",
      "title": "Titre du graphique",
      "subtitle": "Source ou contexte",
      "data": [{ "name": "Label", "value": 123 }],
      "xKey": "name",
      "yKey": "value"
    },
    {
      "type": "sankey",
      "title": "Flux de ...",
      "data": [{ "name": "Node1" }, { "name": "Node2" }],
      "links": [{ "source": "Node1", "target": "Node2", "value": 50 }],
      "xKey": "name",
      "yKey": "value"
    },
    {
      "type": "radar",
      "title": "Comparaison multi-critères",
      "data": [{ "axis": "Critère", "A": 80, "B": 65 }],
      "xKey": "axis",
      "yKey": "A",
      "radarKeys": ["A", "B"]
    }
  ],
  "slides": [
    {
      "title": "Titre de la slide",
      "content": "Paragraphe narratif riche (2-4 phrases)",
      "type": "cover|kpi|chart|insight|comparison|timeline|conclusion",
      "bullets": ["Point clé 1", "Point clé 2"],
      "highlight": "Le chiffre ou fait marquant à mettre en avant",
      "layout": "center|split|grid"
    }
  ]
}

TYPES DE SLIDES :
- "cover" : titre + résumé exécutif (layout: center)
- "kpi" : grille de KPIs (layout: grid)
- "chart" : graphique avec contexte narratif (layout: split)
- "insight" : insights clés avec bullets (layout: split)
- "comparison" : avant/après ou comparaison (layout: split)
- "timeline" : chronologie ou évolution (layout: center)
- "conclusion" : recommandations et prochaines étapes (layout: center)

Assure-toi que chaque slide a un contenu RICHE et PERTINENT. Pas de phrases vides.`;

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
    const planData = await getPlanFromKV(sessionId);
    if (planData.plan !== 'business') {
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
  const excelMod = await import('exceljs');
  const ExcelJS = 'default' in excelMod ? (excelMod.default as typeof excelMod) : excelMod;
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
