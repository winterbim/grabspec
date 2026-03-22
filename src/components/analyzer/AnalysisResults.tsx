'use client';

import { useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  FileText,
  BarChart3,
  Lightbulb,
  Presentation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { AnalysisResult, AnalysisChart, AnalysisKpi } from '@/hooks/useAnalyzer';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

interface AnalysisResultsProps {
  result: AnalysisResult;
  filename: string;
  onReset: () => void;
}

export function AnalysisResults({ result, filename, onReset }: AnalysisResultsProps) {
  const t = useTranslations('analyzer');
  const dashboardRef = useRef<HTMLDivElement>(null);

  const exportPng = useCallback(async () => {
    if (!dashboardRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true, logging: false });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\.[^.]+$/, '')}_dashboard.png`;
    a.click();
  }, [filename]);

  const exportHtml = useCallback(() => {
    const html = generatePresentation(result, filename);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\.[^.]+$/, '')}_presentation.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, filename]);

  return (
    <div className="space-y-8">
      {/* Export buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{result.title}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPng}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t('exportPng')}
          </Button>
          <Button size="sm" onClick={exportHtml} className="bg-blue-600 text-white hover:bg-blue-700">
            <Presentation className="mr-1.5 h-3.5 w-3.5" />
            {t('exportHtml')}
          </Button>
        </div>
      </div>

      {/* Dashboard (exportable) */}
      <div ref={dashboardRef} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        {/* Summary */}
        <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/20">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
            <FileText className="h-4 w-4" />
            {t('summary')}
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{result.summary}</p>
        </div>

        {/* KPIs */}
        {result.kpis.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              {t('kpis')}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {result.kpis.map((kpi, i) => (
                <KpiCard key={i} kpi={kpi} />
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        {result.charts.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              {t('charts')}
            </h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {result.charts.map((chart, i) => (
                <ChartRenderer key={i} chart={chart} />
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {result.insights.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              {t('keyInsights')}
            </h3>
            <ul className="space-y-2">
              {result.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Reset */}
      <div className="text-center">
        <Button variant="ghost" onClick={onReset}>
          {t('analyzeAnother')}
        </Button>
      </div>
    </div>
  );
}

// ── KPI Card ──

function KpiCard({ kpi }: { kpi: AnalysisKpi }) {
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const trendColor = kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-slate-400';

  return (
    <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
      <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
      <div className="mt-1 flex items-end gap-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpi.value}</span>
        {kpi.unit && <span className="mb-0.5 text-sm text-slate-500">{kpi.unit}</span>}
        <TrendIcon className={`mb-1 ml-auto h-4 w-4 ${trendColor}`} />
      </div>
      {kpi.detail && <p className="mt-1 text-[11px] text-slate-400">{kpi.detail}</p>}
    </div>
  );
}

// ── Chart Renderer ──

function ChartRenderer({ chart }: { chart: AnalysisChart }) {
  const data = chart.data;

  return (
    <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
      <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{chart.title}</p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey={chart.xKey} fontSize={11} tick={{ fill: '#94a3b8' }} />
              <YAxis fontSize={11} tick={{ fill: '#94a3b8' }} />
              <Tooltip />
              <Bar dataKey={chart.yKey} radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : chart.type === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey={chart.xKey} fontSize={11} tick={{ fill: '#94a3b8' }} />
              <YAxis fontSize={11} tick={{ fill: '#94a3b8' }} />
              <Tooltip />
              <Line type="monotone" dataKey={chart.yKey} stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          ) : chart.type === 'area' ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey={chart.xKey} fontSize={11} tick={{ fill: '#94a3b8' }} />
              <YAxis fontSize={11} tick={{ fill: '#94a3b8' }} />
              <Tooltip />
              <Area type="monotone" dataKey={chart.yKey} stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
            </AreaChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                dataKey={chart.yKey}
                nameKey={chart.xKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name }) => name}
                fontSize={11}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── HTML Presentation Generator ──

function generatePresentation(result: AnalysisResult, filename: string): string {
  const slides = result.slides.map((slide, i) => {
    let body = '';
    if (slide.type === 'kpi' && result.kpis.length > 0) {
      body = `<div class="kpi-grid">${result.kpis.map((k) =>
        `<div class="kpi"><div class="kpi-value">${k.value}${k.unit ? ` <small>${k.unit}</small>` : ''}</div><div class="kpi-label">${k.label}</div></div>`
      ).join('')}</div>`;
    } else if (slide.type === 'chart' && result.charts.length > 0) {
      body = result.charts.map((c) => {
        const maxVal = Math.max(...c.data.map((d) => Number(d[c.yKey]) || 0));
        return `<div class="chart-title">${c.title}</div><div class="bars">${c.data.map((d, j) => {
          const val = Number(d[c.yKey]) || 0;
          const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const color = CHART_COLORS[j % CHART_COLORS.length];
          return `<div class="bar-row"><span class="bar-label">${d[c.xKey]}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div><span class="bar-val">${val}</span></div>`;
        }).join('')}</div>`;
      }).join('');
    } else {
      body = `<p>${slide.content}</p>`;
    }

    return `<section class="slide" id="slide-${i + 1}"><h2>${slide.title}</h2>${body}</section>`;
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${result.title} — GrabSpec</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-snap-type:y mandatory;scroll-behavior:smooth}
body{font-family:'Segoe UI',system-ui,sans-serif;color:#1e293b;background:#0f172a}
.slide{min-height:100vh;scroll-snap-align:start;display:flex;flex-direction:column;justify-content:center;padding:8vh 10vw;background:#fff;position:relative}
.slide:nth-child(even){background:#f8fafc}
.slide h2{font-size:clamp(24px,4vw,48px);font-weight:800;margin-bottom:32px;color:#0f172a}
.slide p{font-size:clamp(16px,2vw,22px);line-height:1.7;color:#475569;max-width:700px}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px}
.kpi{background:#f1f5f9;border-radius:16px;padding:28px;text-align:center}
.kpi-value{font-size:clamp(28px,4vw,48px);font-weight:800;color:#3b82f6}
.kpi-value small{font-size:0.5em;color:#94a3b8}
.kpi-label{margin-top:8px;font-size:14px;color:#64748b;font-weight:500}
.chart-title{font-size:18px;font-weight:700;margin-bottom:16px;color:#334155}
.bars{display:flex;flex-direction:column;gap:12px}
.bar-row{display:flex;align-items:center;gap:12px}
.bar-label{width:120px;font-size:13px;text-align:right;color:#64748b;flex-shrink:0}
.bar-track{flex:1;height:28px;background:#f1f5f9;border-radius:6px;overflow:hidden}
.bar-fill{height:100%;border-radius:6px;transition:width 1s ease}
.bar-val{width:60px;font-size:13px;font-weight:600;color:#334155}
nav.controls{position:fixed;bottom:24px;right:24px;display:flex;gap:8px;z-index:10}
nav.controls button{width:40px;height:40px;border-radius:50%;border:none;background:#e2e8f0;cursor:pointer;font-size:18px;color:#475569;transition:all .2s}
nav.controls button:hover{background:#3b82f6;color:#fff}
.footer{position:absolute;bottom:16px;right:24px;font-size:11px;color:#cbd5e1}
@media print{.slide{page-break-after:always;min-height:auto;padding:40px}nav.controls{display:none}}
</style>
</head>
<body>
${slides.join('\n')}
<nav class="controls">
<button onclick="prev()" title="Previous">&#8593;</button>
<button onclick="next()" title="Next">&#8595;</button>
</nav>
<script>
const slides=document.querySelectorAll('.slide');
let current=0;
function go(i){slides[Math.max(0,Math.min(i,slides.length-1))].scrollIntoView({behavior:'smooth'});current=i}
function next(){go(current+1)}
function prev(){go(current-1)}
document.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key===' ')next();if(e.key==='ArrowUp')prev()});
new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)current=[...slides].indexOf(e.target)})},{threshold:0.5}).observe(...slides);
slides.forEach(s=>new IntersectionObserver(e=>{if(e[0].isIntersecting)current=[...slides].indexOf(s)},{threshold:0.5}).observe(s));
</script>
</body>
</html>`;
}
