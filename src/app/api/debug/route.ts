import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, string> = {};

  checks.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ? `set (${process.env.ANTHROPIC_API_KEY.substring(0, 12)}...)` : 'MISSING';
  checks.CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'MISSING';
  checks.SERPAPI_KEY = process.env.SERPAPI_KEY ? 'set' : 'not set';
  checks.GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY ? 'set' : 'not set';
  checks.BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN ? 'set' : 'not set';
  checks.KV_URL = process.env.KV_REST_API_URL ? 'set' : 'not set';

  // Test Google HTML scrape
  try {
    const params = new URLSearchParams({ q: 'Grohe 33265003 fiche technique', num: '5', hl: 'fr' });
    const res = await fetch(`https://www.google.com/search?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
    });
    const html = await res.text();
    const hasResults = html.includes('/url?q=');
    checks.google_html = `status ${res.status}, ${html.length} bytes, hasResults: ${hasResults}`;
  } catch (e) {
    checks.google_html = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test Bing HTML scrape
  try {
    const params = new URLSearchParams({ q: 'Grohe 33265003 fiche technique' });
    const res = await fetch(`https://www.bing.com/search?${params}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html' },
    });
    const html = await res.text();
    const hasResults = html.includes('b_algo');
    checks.bing_html = `status ${res.status}, ${html.length} bytes, hasResults: ${hasResults}`;
  } catch (e) {
    checks.bing_html = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test DuckDuckGo
  try {
    const params = new URLSearchParams({ q: 'Grohe 33265003' });
    const res = await fetch(`https://html.duckduckgo.com/html/?${params}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
    });
    const html = await res.text();
    const hasResults = html.includes('web-result');
    checks.duckduckgo = `status ${res.status}, ${html.length} bytes, hasResults: ${hasResults}`;
  } catch (e) {
    checks.duckduckgo = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test Anthropic
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const r = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say OK' }],
    });
    checks.anthropic = `OK: ${r.content[0].type === 'text' ? r.content[0].text : 'no text'}`;
  } catch (e) {
    checks.anthropic = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json(checks);
}
