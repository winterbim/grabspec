'use client';

import { useRef, useCallback, useState, useMemo } from 'react';
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
  Eye,
  X,
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
  Treemap,
  FunnelChart,
  Funnel,
  Sankey,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { AnalysisResult, AnalysisChart, AnalysisKpi } from '@/hooks/useAnalyzer';

// ── Professional color palette ──

const PALETTE = {
  primary: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'],
  accent: ['#06b6d4', '#14b8a6', '#10b981', '#34d399'],
  warm: ['#f59e0b', '#f97316', '#ef4444', '#ec4899'],
  full: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#3b82f6'],
};

const GRADIENT_DEFS = (
  <defs>
    <linearGradient id="grad-purple" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
    </linearGradient>
    <linearGradient id="grad-cyan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.6} />
    </linearGradient>
    <linearGradient id="grad-area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
    </filter>
  </defs>
);

interface AnalysisResultsProps {
  result: AnalysisResult;
  filename: string;
  onReset: () => void;
}

export function AnalysisResults({ result, filename, onReset }: AnalysisResultsProps) {
  const t = useTranslations('analyzer');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  const presentationHtml = useMemo(
    () => generatePresentation(result, filename),
    [result, filename],
  );

  const exportHtml = useCallback(() => {
    const blob = new Blob([presentationHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\.[^.]+$/, '')}_presentation.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [presentationHtml, filename]);

  return (
    <div className="space-y-8">
      {/* Header + Export buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{result.title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{filename}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPng}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t('exportPng')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Prévisualiser
          </Button>
          <Button size="sm" onClick={exportHtml} className="bg-indigo-600 text-white hover:bg-indigo-700">
            <Presentation className="mr-1.5 h-3.5 w-3.5" />
            {t('exportHtml')}
          </Button>
        </div>
      </div>

      {/* Dashboard */}
      <div ref={dashboardRef} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Summary card */}
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-5 dark:from-indigo-950/30 dark:to-purple-950/20">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            <FileText className="h-4 w-4" />
            {t('summary')}
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{result.summary}</p>
        </div>

        {/* KPIs */}
        {result.kpis.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              {t('kpis')}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {result.kpis.map((kpi, i) => (
                <KpiCard key={i} kpi={kpi} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        {result.charts.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              {t('charts')}
            </h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {result.charts.map((chart, i) => (
                <ChartCard key={i} chart={chart} />
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
            <div className="grid gap-3 sm:grid-cols-2">
              {result.insights.map((insight, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800/50"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reset */}
      <div className="text-center">
        <Button variant="ghost" onClick={onReset}>
          {t('analyzeAnother')}
        </Button>
      </div>

      {/* Presentation Preview Modal */}
      {showPreview && (
        <PresentationPreview html={presentationHtml} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

// ── KPI Card with accent bar ──

function KpiCard({ kpi, index }: { kpi: AnalysisKpi; index: number }) {
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const trendColor = kpi.trend === 'up' ? 'text-emerald-500' : kpi.trend === 'down' ? 'text-rose-500' : 'text-slate-400';
  const accentColor = kpi.color || PALETTE.full[index % PALETTE.full.length];

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: accentColor }}
      />
      <p className="pl-3 text-xs font-medium uppercase tracking-wider text-slate-500">{kpi.label}</p>
      <div className="mt-1.5 flex items-end gap-2 pl-3">
        <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{kpi.value}</span>
        {kpi.unit && <span className="mb-0.5 text-sm font-medium text-slate-400">{kpi.unit}</span>}
        <TrendIcon className={`mb-1 ml-auto h-4 w-4 ${trendColor}`} />
      </div>
      {kpi.detail && <p className="mt-1 pl-3 text-[11px] text-slate-400">{kpi.detail}</p>}
    </div>
  );
}

// ── Chart Card with type switcher ──

const CHART_TYPE_LABELS: Record<string, string> = {
  bar: '📊 Barres',
  line: '📈 Lignes',
  area: '📉 Aires',
  pie: '🥧 Camembert',
  radar: '🎯 Radar',
  radialBar: '🎛️ Radial',
  treemap: '🗂️ Treemap',
  funnel: '🔽 Entonnoir',
  sankey: '🔀 Sankey',
};

const SWITCHABLE_TYPES = ['bar', 'line', 'area', 'pie'] as const;

function ChartCard({ chart }: { chart: AnalysisChart }) {
  const [activeType, setActiveType] = useState(chart.type);
  const isSwitchable = !['sankey', 'radar', 'treemap', 'funnel', 'radialBar'].includes(chart.type);

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{chart.title}</p>
          {chart.subtitle && <p className="text-[11px] text-slate-400">{chart.subtitle}</p>}
        </div>
        {isSwitchable && (
          <div className="flex gap-1">
            {SWITCHABLE_TYPES.map((tp) => (
              <button
                key={tp}
                onClick={() => setActiveType(tp)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition ${
                  activeType === tp
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {CHART_TYPE_LABELS[tp]}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={chart.type === 'sankey' ? 'h-72' : 'h-56'}>
        <ResponsiveContainer width="100%" height="100%">
          <ChartRenderer chart={{ ...chart, type: activeType as AnalysisChart['type'] }} />
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Chart Renderer ──

const tooltipStyle = {
  contentStyle: {
    background: '#1e1b4b',
    border: 'none',
    borderRadius: 8,
    color: '#e0e7ff',
    fontSize: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
};

function ChartRenderer({ chart }: { chart: AnalysisChart }) {
  const data = chart.data;

  switch (chart.type) {
    case 'bar':
      return (
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
          {GRADIENT_DEFS}
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f020" vertical={false} />
          <XAxis dataKey={chart.xKey} fontSize={11} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis fontSize={11} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey={chart.yKey} radius={[6, 6, 0, 0]} fill="url(#grad-purple)" />
        </BarChart>
      );

    case 'line':
      return (
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
          {GRADIENT_DEFS}
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f020" vertical={false} />
          <XAxis dataKey={chart.xKey} fontSize={11} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis fontSize={11} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          <Line
            type="monotone"
            dataKey={chart.yKey}
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      );

    case 'area':
      return (
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
          {GRADIENT_DEFS}
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f020" vertical={false} />
          <XAxis dataKey={chart.xKey} fontSize={11} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis fontSize={11} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          <Area
            type="monotone"
            dataKey={chart.yKey}
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#grad-area)"
          />
        </AreaChart>
      );

    case 'pie':
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey={chart.yKey}
            nameKey={chart.xKey}
            cx="50%"
            cy="50%"
            outerRadius={85}
            innerRadius={45}
            paddingAngle={3}
            strokeWidth={0}
            label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
            fontSize={10}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE.full[i % PALETTE.full.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      );

    case 'radar':
      return (
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey={chart.xKey} fontSize={10} tick={{ fill: '#94a3b8' }} />
          <PolarRadiusAxis fontSize={9} tick={{ fill: '#94a3b8' }} />
          {(chart.radarKeys || [chart.yKey]).map((key, i) => (
            <Radar
              key={key}
              dataKey={key}
              stroke={PALETTE.full[i % PALETTE.full.length]}
              fill={PALETTE.full[i % PALETTE.full.length]}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </RadarChart>
      );

    case 'radialBar':
      return (
        <RadialBarChart
          data={data.map((d, i) => ({ ...d, fill: PALETTE.full[i % PALETTE.full.length] }))}
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="90%"
          startAngle={180}
          endAngle={0}
        >
          <RadialBar
            dataKey={chart.yKey}
            background={{ fill: '#f1f5f9' }}
            cornerRadius={8}
            label={{ position: 'insideStart', fill: '#fff', fontSize: 11 }}
          />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </RadialBarChart>
      );

    case 'treemap':
      return (
        <Treemap
          data={data.map((d, i) => ({ ...d, fill: PALETTE.full[i % PALETTE.full.length] }))}
          dataKey={chart.yKey}
          nameKey={chart.xKey}
          stroke="#fff"
          content={<TreemapCell />}
        >
          <Tooltip {...tooltipStyle} />
        </Treemap>
      );

    case 'funnel':
      return (
        <FunnelChart>
          <Tooltip {...tooltipStyle} />
          <Funnel
            data={data.map((d, i) => ({ ...d, fill: PALETTE.full[i % PALETTE.full.length] }))}
            dataKey={chart.yKey}
            nameKey={chart.xKey}
            isAnimationActive
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE.full[i % PALETTE.full.length]} />
            ))}
          </Funnel>
        </FunnelChart>
      );

    case 'sankey':
      if (chart.links && chart.links.length > 0) {
        const nodeNames = [...new Set([
          ...chart.links.map((l) => l.source),
          ...chart.links.map((l) => l.target),
        ])];
        const nodes = nodeNames.map((name) => ({ name }));
        const links = chart.links.map((l) => ({
          source: nodeNames.indexOf(l.source),
          target: nodeNames.indexOf(l.target),
          value: l.value,
        }));
        return (
          <Sankey
            data={{ nodes, links }}
            nodeWidth={10}
            nodePadding={20}
            linkCurvature={0.5}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
            link={{ stroke: '#a78bfa', strokeOpacity: 0.4 }}
            node={<SankeyNode />}
          >
            <Tooltip {...tooltipStyle} />
          </Sankey>
        );
      }
      return <NoData label="Données Sankey manquantes" />;

    default:
      return <NoData label="Type non supporté" />;
  }
}

function NoData({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
    </div>
  );
}

// Custom Treemap cell
function TreemapCell(props: Record<string, unknown>) {
  const { x, y, width, height, name, fill } = props as {
    x: number; y: number; width: number; height: number; name: string; fill: string;
  };
  if (!width || !height || width < 4 || height < 4) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} fill={fill} stroke="#fff" strokeWidth={2} opacity={0.85} />
      {width > 50 && height > 25 && (
        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={11} fontWeight={600}>
          {String(name).slice(0, 12)}
        </text>
      )}
    </g>
  );
}

// Custom Sankey node
function SankeyNode(props: Record<string, unknown>) {
  const { x, y, width, height, payload } = props as {
    x: number; y: number; width: number; height: number; payload: { name: string };
  };
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="#6366f1" rx={2} />
      <text x={x + width + 6} y={y + height / 2} textAnchor="start" dominantBaseline="central" fill="#64748b" fontSize={11}>
        {payload?.name}
      </text>
    </g>
  );
}

// ── Presentation Preview Modal ──

function PresentationPreview({ html, onClose }: { html: string; onClose: () => void }) {
  const blobUrl = useMemo(() => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    return URL.createObjectURL(blob);
  }, [html]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-[90vw] max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            <Eye className="mr-2 inline h-4 w-4" />
            Prévisualisation de la présentation
          </p>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* iframe */}
        <iframe src={blobUrl} className="flex-1 border-0" title="Presentation preview" sandbox="allow-scripts" />
      </div>
    </div>
  );
}

// ── Professional HTML Presentation Generator ──

function generatePresentation(result: AnalysisResult, filename: string): string {
  const slides = result.slides.map((slide, i) => {
    let bodyHtml = '';
    let gradientClass = '';

    switch (slide.type) {
      case 'cover':
        gradientClass = 'slide-cover';
        bodyHtml = `
          <div class="cover-content">
            <div class="cover-badge">ANALYSE</div>
            <h1>${escHtml(result.title)}</h1>
            <p class="cover-subtitle">${escHtml(slide.content)}</p>
            <div class="cover-meta">${escHtml(filename)} — ${new Date().toLocaleDateString('fr-CH')}</div>
          </div>`;
        break;

      case 'kpi':
        bodyHtml = `
          <h2>${escHtml(slide.title)}</h2>
          ${slide.content ? `<p class="slide-desc">${escHtml(slide.content)}</p>` : ''}
          <div class="kpi-grid">${result.kpis.map((k, j) => `
            <div class="kpi" style="--accent: ${k.color || PALETTE.full[j % PALETTE.full.length]}">
              <div class="kpi-icon">${k.trend === 'up' ? '↗' : k.trend === 'down' ? '↘' : '→'}</div>
              <div class="kpi-value">${escHtml(k.value)}${k.unit ? `<small>${escHtml(k.unit)}</small>` : ''}</div>
              <div class="kpi-label">${escHtml(k.label)}</div>
              ${k.detail ? `<div class="kpi-detail">${escHtml(k.detail)}</div>` : ''}
            </div>`).join('')}
          </div>`;
        break;

      case 'chart':
        bodyHtml = `
          <h2>${escHtml(slide.title)}</h2>
          ${slide.content ? `<p class="slide-desc">${escHtml(slide.content)}</p>` : ''}
          <div class="chart-section">
            ${result.charts.map((c) => {
              const maxVal = Math.max(...c.data.map((d) => Number(d[c.yKey]) || 0), 1);
              return `
                <div class="chart-block">
                  <h3>${escHtml(c.title)}</h3>
                  ${c.subtitle ? `<p class="chart-subtitle">${escHtml(c.subtitle)}</p>` : ''}
                  <div class="bars">${c.data.slice(0, 10).map((d, j) => {
                    const val = Number(d[c.yKey]) || 0;
                    const pct = (val / maxVal) * 100;
                    const color = PALETTE.full[j % PALETTE.full.length];
                    return `<div class="bar-row">
                      <span class="bar-label">${escHtml(String(d[c.xKey]))}</span>
                      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
                      <span class="bar-val">${val.toLocaleString('fr-CH')}</span>
                    </div>`;
                  }).join('')}</div>
                </div>`;
            }).join('')}
          </div>`;
        break;

      case 'insight':
        bodyHtml = `
          <h2>${escHtml(slide.title)}</h2>
          ${slide.content ? `<p class="slide-desc">${escHtml(slide.content)}</p>` : ''}
          <div class="insight-grid">${(slide.bullets || result.insights).map((ins, j) => `
            <div class="insight-card">
              <span class="insight-num">${j + 1}</span>
              <p>${escHtml(ins)}</p>
            </div>`).join('')}
          </div>`;
        break;

      case 'comparison':
        bodyHtml = `
          <h2>${escHtml(slide.title)}</h2>
          ${slide.highlight ? `<div class="highlight-box">${escHtml(slide.highlight)}</div>` : ''}
          <p class="slide-desc">${escHtml(slide.content)}</p>
          ${slide.bullets ? `<ul class="bullet-list">${slide.bullets.map((b) => `<li>${escHtml(b)}</li>`).join('')}</ul>` : ''}`;
        break;

      case 'timeline':
        bodyHtml = `
          <h2>${escHtml(slide.title)}</h2>
          <p class="slide-desc">${escHtml(slide.content)}</p>
          ${slide.bullets ? `<div class="timeline">${slide.bullets.map((b, j) => `
            <div class="timeline-item">
              <div class="timeline-dot" style="background:${PALETTE.full[j % PALETTE.full.length]}"></div>
              <p>${escHtml(b)}</p>
            </div>`).join('')}
          </div>` : ''}`;
        break;

      case 'conclusion':
        gradientClass = 'slide-conclusion';
        bodyHtml = `
          <h2>${escHtml(slide.title)}</h2>
          ${slide.highlight ? `<div class="highlight-box">${escHtml(slide.highlight)}</div>` : ''}
          <p class="slide-desc">${escHtml(slide.content)}</p>
          ${slide.bullets ? `<ul class="bullet-list">${slide.bullets.map((b) => `<li>${escHtml(b)}</li>`).join('')}</ul>` : ''}`;
        break;

      default:
        bodyHtml = `
          <h2>${escHtml(slide.title)}</h2>
          <p class="slide-desc">${escHtml(slide.content)}</p>
          ${slide.bullets ? `<ul class="bullet-list">${slide.bullets.map((b) => `<li>${escHtml(b)}</li>`).join('')}</ul>` : ''}`;
    }

    return `<section class="slide ${gradientClass}" id="slide-${i + 1}">
      ${bodyHtml}
      <div class="slide-footer"><span>GrabSpec Analytics</span><span>${i + 1} / ${result.slides.length}</span></div>
    </section>`;
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(result.title)} — GrabSpec</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0f0b2e;--surface:#1a1545;--text:#e0e7ff;--muted:#94a3b8;--accent:#6366f1;--accent2:#06b6d4}
html{scroll-snap-type:y mandatory;scroll-behavior:smooth}
body{font-family:'Inter',system-ui,sans-serif;color:var(--text);background:var(--bg)}

.slide{min-height:100vh;scroll-snap-align:start;display:flex;flex-direction:column;justify-content:center;padding:8vh 10vw;position:relative;background:var(--bg)}
.slide:nth-child(even){background:var(--surface)}
.slide h2{font-size:clamp(28px,4vw,52px);font-weight:800;margin-bottom:24px;background:linear-gradient(135deg,#e0e7ff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1.2}
.slide-desc{font-size:clamp(15px,1.8vw,20px);line-height:1.8;color:var(--muted);max-width:720px;margin-bottom:32px}
.slide-footer{position:absolute;bottom:20px;left:10vw;right:10vw;display:flex;justify-content:space-between;font-size:11px;color:#475569;letter-spacing:0.5px;text-transform:uppercase}

.slide-cover{background:linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4338ca 100%);text-align:center;align-items:center}
.cover-content{max-width:800px}
.cover-badge{display:inline-block;padding:6px 16px;background:rgba(99,102,241,0.3);border:1px solid rgba(99,102,241,0.5);border-radius:20px;font-size:12px;font-weight:600;letter-spacing:2px;color:#a5b4fc;margin-bottom:24px}
.cover-content h1{font-size:clamp(32px,5vw,64px);font-weight:900;background:linear-gradient(135deg,#fff,#c4b5fd);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1.1;margin-bottom:20px}
.cover-subtitle{font-size:clamp(16px,2vw,22px);color:#94a3b8;line-height:1.6;max-width:600px;margin:0 auto}
.cover-meta{margin-top:40px;font-size:13px;color:#6366f1}

.slide-conclusion{background:linear-gradient(135deg,#0c4a6e 0%,#164e63 50%,#134e4a 100%)}

.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}
.kpi{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;position:relative;overflow:hidden;transition:transform .2s}
.kpi:hover{transform:translateY(-2px)}
.kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--accent);border-radius:3px 3px 0 0}
.kpi-icon{font-size:20px;margin-bottom:8px}
.kpi-value{font-size:clamp(28px,3vw,42px);font-weight:800;color:#fff}
.kpi-value small{font-size:0.45em;color:var(--muted);margin-left:4px}
.kpi-label{font-size:13px;color:var(--muted);font-weight:500;margin-top:4px}
.kpi-detail{font-size:11px;color:#475569;margin-top:8px}

.chart-section{display:grid;gap:24px}
.chart-block{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:24px}
.chart-block h3{font-size:16px;font-weight:600;color:#e0e7ff;margin-bottom:4px}
.chart-subtitle{font-size:12px;color:#64748b;margin-bottom:16px}
.bars{display:flex;flex-direction:column;gap:10px}
.bar-row{display:flex;align-items:center;gap:12px}
.bar-label{width:140px;font-size:13px;text-align:right;color:#94a3b8;flex-shrink:0}
.bar-track{flex:1;height:32px;background:rgba(255,255,255,0.05);border-radius:8px;overflow:hidden}
.bar-fill{height:100%;border-radius:8px;transition:width 1.2s cubic-bezier(0.16,1,0.3,1)}
.bar-val{width:70px;font-size:13px;font-weight:700;color:#e0e7ff}

.insight-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
.insight-card{display:flex;gap:16px;align-items:flex-start;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px}
.insight-num{flex-shrink:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;font-size:14px;font-weight:700;color:#fff}
.insight-card p{font-size:14px;line-height:1.6;color:#cbd5e1}

.highlight-box{background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1));border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:20px 24px;font-size:clamp(18px,2.5vw,28px);font-weight:700;color:#a5b4fc;margin-bottom:24px;text-align:center}

.bullet-list{list-style:none;display:flex;flex-direction:column;gap:12px}
.bullet-list li{padding-left:24px;position:relative;font-size:15px;line-height:1.6;color:#cbd5e1}
.bullet-list li::before{content:'';position:absolute;left:0;top:8px;width:8px;height:8px;background:#6366f1;border-radius:50%}

.timeline{display:flex;flex-direction:column;gap:20px;padding-left:20px;border-left:2px solid rgba(99,102,241,0.3)}
.timeline-item{display:flex;gap:16px;align-items:flex-start;position:relative}
.timeline-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;margin-top:4px;margin-left:-26px}
.timeline-item p{font-size:15px;line-height:1.6;color:#cbd5e1}

nav.controls{position:fixed;bottom:24px;right:24px;display:flex;gap:8px;z-index:10}
nav.controls button{width:44px;height:44px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(15,11,46,0.8);backdrop-filter:blur(12px);cursor:pointer;font-size:18px;color:#a5b4fc;transition:all .2s}
nav.controls button:hover{background:#6366f1;color:#fff;border-color:#6366f1}

.progress-bar{position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#6366f1,#06b6d4);z-index:20;transition:width .3s}

@media print{.slide{page-break-after:always;min-height:auto;padding:40px}nav.controls,.progress-bar{display:none}}
</style>
</head>
<body>
<div class="progress-bar" id="progress" style="width:0%"></div>
${slides.join('\n')}
<nav class="controls">
<button onclick="prev()" title="Précédent">↑</button>
<button onclick="next()" title="Suivant">↓</button>
</nav>
<script>
const slides=document.querySelectorAll('.slide');
let current=0;
const progressBar=document.getElementById('progress');
function updateProgress(){progressBar.style.width=((current+1)/slides.length*100)+'%'}
function go(i){i=Math.max(0,Math.min(i,slides.length-1));slides[i].scrollIntoView({behavior:'smooth'});current=i;updateProgress()}
function next(){go(current+1)}
function prev(){go(current-1)}
document.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key===' '||e.key==='ArrowRight'){e.preventDefault();next()}if(e.key==='ArrowUp'||e.key==='ArrowLeft'){e.preventDefault();prev()}});
slides.forEach((s,i)=>new IntersectionObserver(e=>{if(e[0].isIntersecting){current=i;updateProgress()}},{threshold:0.5}).observe(s));
updateProgress();
</script>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
