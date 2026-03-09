import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, string> = {};

  checks.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ? `set (${process.env.ANTHROPIC_API_KEY.substring(0, 12)}...)` : 'MISSING';
  checks.CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'MISSING';
  checks.SERPAPI_KEY = process.env.SERPAPI_KEY ? 'set' : 'not set (DDG fallback)';

  // Test DuckDuckGo
  try {
    const params = new URLSearchParams({ q: 'test' });
    const res = await fetch(`https://html.duckduckgo.com/html/?${params}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
    });
    checks.duckduckgo = `status ${res.status}, ${(await res.text()).length} bytes`;
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
