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
import type { NodeProps, SankeyNodeOptions } from 'recharts/types/chart/Sankey';
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

  const [exporting, setExporting] = useState(false);

  const exportPng = useCallback(async () => {
    if (!dashboardRef.current || exporting) return;
    setExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(dashboardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
        filter: (node: HTMLElement) => {
          // Skip invisible nodes that cause issues
          if (node.tagName === 'NOSCRIPT') return false;
          return true;
        },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${filename.replace(/\.[^.]+$/, '')}_dashboard.png`;
      a.click();
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('Export PNG échoué. Veuillez réessayer.');
    } finally {
      setExporting(false);
    }
  }, [filename, exporting]);

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
          <Button variant="outline" size="sm" onClick={exportPng} disabled={exporting}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {exporting ? 'Export…' : t('exportPng')}
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
        })).filter((l) => l.source !== -1 && l.target !== -1 && l.source !== l.target);
        if (nodes.length < 2 || links.length === 0) return <NoData label="Données Sankey insuffisantes" />;
        return (
          <Sankey
            data={{ nodes, links }}
            nodeWidth={10}
            nodePadding={24}
            linkCurvature={0.5}
            iterations={32}
            margin={{ top: 12, right: 60, bottom: 12, left: 12 }}
            link={{ stroke: '#a78bfa', strokeOpacity: 0.4 }}
            node={((props: NodeProps) => {
              const { x, y, width: w, height: h, index, payload } = props;
              return (
                <g key={`node-${index}`}>
                  <rect x={x} y={y} width={w} height={h} fill={PALETTE.full[index % PALETTE.full.length]} rx={2} />
                  <text x={x + w + 8} y={y + h / 2} textAnchor="start" dominantBaseline="central" fill="#64748b" fontSize={11} fontWeight={500}>
                    {payload?.name}
                  </text>
                </g>
              );
            }) as unknown as SankeyNodeOptions}
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

// ── Ultra-Pro HTML Presentation Generator ──

function buildPieChart(chart: AnalysisChart): string {
  const data = chart.data.slice(0, 7);
  const total = data.reduce((s, d) => s + (Number(d[chart.yKey]) || 0), 0);
  if (total === 0) return '';
  let cumPct = 0;
  const stops = data.map((d, i) => {
    const pct = ((Number(d[chart.yKey]) || 0) / total) * 100;
    const start = cumPct;
    cumPct += pct;
    return `${PALETTE.full[i % PALETTE.full.length]} ${start}% ${cumPct}%`;
  }).join(', ');
  const legend = data.map((d, i) => {
    const pct = ((Number(d[chart.yKey]) || 0) / total) * 100;
    return `<div class="pie-legend-item"><span class="pie-dot" style="background:${PALETTE.full[i % PALETTE.full.length]}"></span>${escHtml(String(d[chart.xKey]))} <strong>${pct.toFixed(1)}%</strong></div>`;
  }).join('');
  return `<div class="pie-wrap"><div class="pie-donut" style="background:conic-gradient(${stops})"><div class="pie-hole">${data.length}<small>items</small></div></div><div class="pie-legend">${legend}</div></div>`;
}

function buildBarChart(chart: AnalysisChart): string {
  const data = chart.data.slice(0, 10);
  const maxVal = Math.max(...data.map((d) => Number(d[chart.yKey]) || 0), 1);
  return `<div class="bars">${data.map((d, j) => {
    const val = Number(d[chart.yKey]) || 0;
    const pct = (val / maxVal) * 100;
    const color = PALETTE.full[j % PALETTE.full.length];
    return `<div class="bar-row anim-item" style="--delay:${j * 0.06}s">
      <span class="bar-label">${escHtml(String(d[chart.xKey]))}</span>
      <div class="bar-track"><div class="bar-fill" data-width="${pct}" style="width:0%;background:linear-gradient(90deg,${color},${color}dd)"></div></div>
      <span class="bar-val" data-count="${val}">${val.toLocaleString('fr-CH')}</span>
    </div>`;
  }).join('')}</div>`;
}

function buildRadarSvg(chart: AnalysisChart): string {
  const data = chart.data.slice(0, 8);
  const keys = chart.radarKeys || [chart.yKey];
  const maxVal = Math.max(...data.flatMap((d) => keys.map((k) => Number(d[k]) || 0)), 1);
  const cx = 130, cy = 130, R = 100;
  const n = data.length;
  if (n < 3) return '';
  const angleStep = (2 * Math.PI) / n;
  // Grid circles
  let svg = `<svg viewBox="0 0 260 260" class="radar-svg">`;
  for (let r = 1; r <= 4; r++) {
    const cr = (R * r) / 4;
    svg += `<circle cx="${cx}" cy="${cy}" r="${cr}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
  }
  // Axis lines + labels
  data.forEach((d, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const x2 = cx + R * Math.cos(angle);
    const y2 = cy + R * Math.sin(angle);
    const lx = cx + (R + 16) * Math.cos(angle);
    const ly = cy + (R + 16) * Math.sin(angle);
    svg += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
    svg += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="central" fill="#94a3b8" font-size="10">${escHtml(String(d[chart.xKey]).slice(0, 14))}</text>`;
  });
  // Data polygons
  keys.forEach((key, ki) => {
    const points = data.map((d, i) => {
      const val = Number(d[key]) || 0;
      const r = (val / maxVal) * R;
      const angle = -Math.PI / 2 + i * angleStep;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
    const color = PALETTE.full[ki % PALETTE.full.length];
    svg += `<polygon points="${points}" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2" class="radar-poly"/>`;
    // Dots
    data.forEach((d, i) => {
      const val = Number(d[key]) || 0;
      const r = (val / maxVal) * R;
      const angle = -Math.PI / 2 + i * angleStep;
      svg += `<circle cx="${cx + r * Math.cos(angle)}" cy="${cy + r * Math.sin(angle)}" r="3.5" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
    });
  });
  svg += `</svg>`;
  // Legend
  if (keys.length > 1) {
    svg += `<div class="radar-legend">${keys.map((k, i) => `<span class="radar-legend-item"><span class="pie-dot" style="background:${PALETTE.full[i % PALETTE.full.length]}"></span>${escHtml(k)}</span>`).join('')}</div>`;
  }
  return svg;
}

function buildSankeyHtml(chart: AnalysisChart): string {
  if (!chart.links || chart.links.length === 0) return '<p style="color:var(--muted);font-size:13px;text-align:center;">Pas de données Sankey</p>';
  const nodeNames = [...new Set([...chart.links.map(l => l.source), ...chart.links.map(l => l.target)])];
  const totalValue = chart.links.reduce((s, l) => s + l.value, 0);
  const rows = chart.links.slice(0, 12).map((l, i) => {
    const pct = totalValue > 0 ? (l.value / totalValue) * 100 : 0;
    const color = PALETTE.full[i % PALETTE.full.length];
    return `<div class="bar-row anim-item" style="--delay:${i * 0.06}s">
      <span class="bar-label">${escHtml(l.source)} → ${escHtml(l.target)}</span>
      <div class="bar-track"><div class="bar-fill" data-width="${pct}" style="width:0%;background:linear-gradient(90deg,${color},${color}dd)"></div></div>
      <span class="bar-val">${l.value.toLocaleString('fr-CH')}</span>
    </div>`;
  }).join('');
  return `<div class="sankey-info"><span class="chart-type-badge">FLUX</span> <small style="color:var(--dim);margin-left:8px">${nodeNames.length} nœuds · ${chart.links.length} flux</small></div><div class="bars">${rows}</div>`;
}

function generatePresentation(result: AnalysisResult, filename: string): string {
  const date = new Date().toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' });
  const totalSlides = result.slides.length;

  const slides = result.slides.map((slide, i) => {
    let bodyHtml = '';
    let extraClass = '';

    switch (slide.type) {
      case 'cover':
        extraClass = 'slide-cover';
        bodyHtml = `
          <div class="cover-content anim-group">
            <div class="cover-logo anim-item">
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="14" fill="#6366f1"/><rect x="14" y="10" width="22" height="30" rx="2.5" fill="white" opacity="0.9"/><rect x="19" y="17" width="12" height="2" rx="1" fill="#6366f1" opacity="0.5"/><rect x="19" y="22" width="9" height="2" rx="1" fill="#6366f1" opacity="0.4"/><circle cx="40" cy="38" r="12" fill="#4f46e5" stroke="white" stroke-width="2.5"/><path d="M36 38 L39 41 L45 35" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="cover-badge anim-item" style="--delay:.1s">ANALYSE DOCUMENTAIRE</div>
            <h1 class="anim-item" style="--delay:.2s">${escHtml(result.title)}</h1>
            <p class="cover-subtitle anim-item" style="--delay:.3s">${escHtml(slide.content)}</p>
            <div class="cover-divider anim-item" style="--delay:.4s"></div>
            <div class="cover-meta anim-item" style="--delay:.5s">
              <span>${escHtml(filename)}</span>
              <span class="meta-sep">•</span>
              <span>${date}</span>
              <span class="meta-sep">•</span>
              <span>${totalSlides} slides</span>
            </div>
          </div>`;
        break;

      case 'kpi':
        bodyHtml = `
          <div class="anim-group">
            <h2 class="anim-item">${escHtml(slide.title)}</h2>
            ${slide.content ? `<p class="slide-desc anim-item" style="--delay:.1s">${escHtml(slide.content)}</p>` : ''}
            <div class="kpi-grid">${result.kpis.map((k, j) => {
              const accent = k.color || PALETTE.full[j % PALETTE.full.length];
              return `
              <div class="kpi anim-item" style="--delay:${0.1 + j * 0.08}s;--accent:${accent}">
                <div class="kpi-accent" style="background:${accent}"></div>
                <div class="kpi-trend" style="color:${k.trend === 'up' ? '#34d399' : k.trend === 'down' ? '#f87171' : '#94a3b8'}">${k.trend === 'up' ? '▲' : k.trend === 'down' ? '▼' : '●'}</div>
                <div class="kpi-value" data-count="${k.value.replace(/[^\d.,]/g, '')}">${escHtml(k.value)}${k.unit ? `<small>${escHtml(k.unit)}</small>` : ''}</div>
                <div class="kpi-label">${escHtml(k.label)}</div>
                ${k.detail ? `<div class="kpi-detail">${escHtml(k.detail)}</div>` : ''}
              </div>`;
            }).join('')}
            </div>
          </div>`;
        break;

      case 'chart':
        bodyHtml = `
          <div class="anim-group">
            <h2 class="anim-item">${escHtml(slide.title)}</h2>
            ${slide.content ? `<p class="slide-desc anim-item" style="--delay:.1s">${escHtml(slide.content)}</p>` : ''}
            <div class="charts-grid">
              ${result.charts.map((c, ci) => {
                let chartHtml = '';
                if (c.type === 'pie') chartHtml = buildPieChart(c);
                else if (c.type === 'radar') chartHtml = `<div class="radar-wrap">${buildRadarSvg(c)}</div>`;
                else if (c.type === 'sankey') chartHtml = buildSankeyHtml(c);
                else chartHtml = buildBarChart(c);
                return `
                <div class="chart-block anim-item" style="--delay:${0.1 + ci * 0.1}s">
                  <div class="chart-header">
                    <h3>${escHtml(c.title)}</h3>
                    ${c.subtitle ? `<p class="chart-subtitle">${escHtml(c.subtitle)}</p>` : ''}
                    <span class="chart-type-badge">${c.type.toUpperCase()}</span>
                  </div>
                  ${chartHtml}
                </div>`;
              }).join('')}
            </div>
          </div>`;
        break;

      case 'insight':
        bodyHtml = `
          <div class="anim-group">
            <h2 class="anim-item">${escHtml(slide.title)}</h2>
            ${slide.content ? `<p class="slide-desc anim-item" style="--delay:.1s">${escHtml(slide.content)}</p>` : ''}
            <div class="insight-grid">${(slide.bullets || result.insights).map((ins, j) => `
              <div class="insight-card anim-item" style="--delay:${0.1 + j * 0.06}s">
                <span class="insight-num">${j + 1}</span>
                <div class="insight-text">
                  <p>${escHtml(ins)}</p>
                </div>
              </div>`).join('')}
            </div>
          </div>`;
        break;

      case 'comparison':
        bodyHtml = `
          <div class="anim-group">
            <h2 class="anim-item">${escHtml(slide.title)}</h2>
            ${slide.highlight ? `<div class="highlight-box anim-item" style="--delay:.1s"><div class="highlight-icon">💡</div>${escHtml(slide.highlight)}</div>` : ''}
            <p class="slide-desc anim-item" style="--delay:.15s">${escHtml(slide.content)}</p>
            ${slide.bullets ? `<div class="compare-grid">${slide.bullets.map((b, j) => `
              <div class="compare-card anim-item" style="--delay:${0.2 + j * 0.06}s">
                <div class="compare-marker" style="background:${PALETTE.full[j % PALETTE.full.length]}"></div>
                <p>${escHtml(b)}</p>
              </div>`).join('')}</div>` : ''}
          </div>`;
        break;

      case 'timeline':
        bodyHtml = `
          <div class="anim-group">
            <h2 class="anim-item">${escHtml(slide.title)}</h2>
            <p class="slide-desc anim-item" style="--delay:.1s">${escHtml(slide.content)}</p>
            ${slide.bullets ? `<div class="timeline">${slide.bullets.map((b, j) => `
              <div class="timeline-item anim-item" style="--delay:${0.15 + j * 0.08}s">
                <div class="tl-connector">
                  <div class="tl-dot" style="background:${PALETTE.full[j % PALETTE.full.length]};box-shadow:0 0 12px ${PALETTE.full[j % PALETTE.full.length]}60"></div>
                  ${j < (slide.bullets?.length ?? 0) - 1 ? '<div class="tl-line"></div>' : ''}
                </div>
                <div class="tl-content">
                  <div class="tl-step">Étape ${j + 1}</div>
                  <p>${escHtml(b)}</p>
                </div>
              </div>`).join('')}
            </div>` : ''}
          </div>`;
        break;

      case 'conclusion':
        extraClass = 'slide-conclusion';
        bodyHtml = `
          <div class="anim-group">
            <div class="conclusion-icon anim-item">🎯</div>
            <h2 class="anim-item" style="--delay:.1s">${escHtml(slide.title)}</h2>
            ${slide.highlight ? `<div class="highlight-box anim-item" style="--delay:.15s"><div class="highlight-icon">⚡</div>${escHtml(slide.highlight)}</div>` : ''}
            <p class="slide-desc anim-item" style="--delay:.2s">${escHtml(slide.content)}</p>
            ${slide.bullets ? `<ul class="bullet-list">${slide.bullets.map((b, j) => `<li class="anim-item" style="--delay:${0.25 + j * 0.06}s">${escHtml(b)}</li>`).join('')}</ul>` : ''}
            <div class="conclusion-brand anim-item" style="--delay:.5s">
              <span>Powered by</span>
              <strong>GrabSpec Analytics</strong>
            </div>
          </div>`;
        break;

      default:
        bodyHtml = `
          <div class="anim-group">
            <h2 class="anim-item">${escHtml(slide.title)}</h2>
            <p class="slide-desc anim-item" style="--delay:.1s">${escHtml(slide.content)}</p>
            ${slide.bullets ? `<ul class="bullet-list">${slide.bullets.map((b, j) => `<li class="anim-item" style="--delay:${0.15 + j * 0.06}s">${escHtml(b)}</li>`).join('')}</ul>` : ''}
          </div>`;
    }

    return `<section class="slide ${extraClass}" data-index="${i}" id="slide-${i + 1}">
      <div class="slide-grain"></div>
      ${bodyHtml}
      <div class="slide-footer">
        <div class="footer-brand">
          <svg width="16" height="16" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="14" fill="#6366f1"/><rect x="14" y="10" width="22" height="30" rx="2.5" fill="white" opacity="0.9"/><circle cx="40" cy="38" r="12" fill="#4f46e5" stroke="white" stroke-width="2.5"/></svg>
          <span>GrabSpec Analytics</span>
        </div>
        <span>${i + 1} / ${totalSlides}</span>
      </div>
    </section>`;
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(result.title)} — GrabSpec</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0a0820;--surface:#12102d;--card:#1a1545;--text:#e0e7ff;--muted:#94a3b8;--dim:#475569;--accent:#6366f1;--accent2:#8b5cf6;--cyan:#06b6d4;--emerald:#10b981}
html{scroll-snap-type:y mandatory;scroll-behavior:smooth}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;color:var(--text);background:var(--bg);-webkit-font-smoothing:antialiased}

/* ─── Grain overlay ─── */
.slide-grain{position:absolute;inset:0;opacity:0.03;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

/* ─── Slides ─── */
.slide{min-height:100vh;scroll-snap-align:start;display:flex;flex-direction:column;justify-content:center;padding:8vh 10vw;position:relative;background:var(--bg);overflow:hidden}
.slide:nth-child(even){background:var(--surface)}
.slide::before{content:'';position:absolute;top:-50%;right:-30%;width:80vw;height:80vw;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.04) 0%,transparent 70%);pointer-events:none}

.slide h2{font-size:clamp(28px,4vw,52px);font-weight:800;margin-bottom:24px;background:linear-gradient(135deg,#e0e7ff 0%,#a78bfa 60%,#818cf8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1.15;letter-spacing:-0.02em}
.slide-desc{font-size:clamp(15px,1.6vw,19px);line-height:1.85;color:var(--muted);max-width:720px;margin-bottom:32px}

/* ─── Slide footer ─── */
.slide-footer{position:absolute;bottom:20px;left:10vw;right:10vw;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--dim);letter-spacing:0.5px;text-transform:uppercase}
.footer-brand{display:flex;align-items:center;gap:8px}
.footer-brand svg{opacity:0.6}

/* ─── Animations ─── */
.anim-item{opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1);transition-delay:var(--delay,0s)}
.slide.visible .anim-item{opacity:1;transform:translateY(0)}

/* ─── Cover ─── */
.slide-cover{background:linear-gradient(140deg,#0a0820 0%,#1e1b4b 35%,#312e81 65%,#4338ca 100%);text-align:center;align-items:center}
.slide-cover::after{content:'';position:absolute;bottom:0;left:0;right:0;height:120px;background:linear-gradient(transparent,rgba(10,8,32,0.4))}
.cover-content{max-width:800px;position:relative;z-index:1}
.cover-logo{margin-bottom:28px}
.cover-badge{display:inline-block;padding:8px 20px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.35);border-radius:24px;font-size:11px;font-weight:700;letter-spacing:3px;color:#a5b4fc;margin-bottom:28px;backdrop-filter:blur(8px)}
.cover-content h1{font-size:clamp(36px,5.5vw,72px);font-weight:900;background:linear-gradient(135deg,#fff 0%,#e0e7ff 50%,#c4b5fd 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1.08;margin-bottom:24px;letter-spacing:-0.03em}
.cover-subtitle{font-size:clamp(16px,2vw,22px);color:var(--muted);line-height:1.7;max-width:600px;margin:0 auto}
.cover-divider{width:64px;height:3px;background:linear-gradient(90deg,var(--accent),var(--cyan));border-radius:2px;margin:32px auto 24px}
.cover-meta{font-size:13px;color:var(--dim);display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
.meta-sep{color:var(--accent);opacity:0.5}

/* ─── Conclusion ─── */
.slide-conclusion{background:linear-gradient(140deg,#0a2540 0%,#0c4a6e 40%,#164e63 70%,#134e4a 100%)}
.conclusion-icon{font-size:48px;margin-bottom:16px}
.conclusion-brand{margin-top:48px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);font-size:13px;color:var(--dim)}
.conclusion-brand strong{color:var(--accent);margin-left:6px;font-weight:700}

/* ─── KPI Grid ─── */
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
.kpi{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:24px 20px;position:relative;overflow:hidden;backdrop-filter:blur(4px);transition:transform .25s,box-shadow .25s}
.kpi:hover{transform:translateY(-3px);box-shadow:0 8px 32px rgba(99,102,241,0.12)}
.kpi-accent{position:absolute;top:0;left:0;right:0;height:3px;border-radius:3px 3px 0 0}
.kpi-trend{position:absolute;top:16px;right:16px;font-size:12px}
.kpi-value{font-size:clamp(28px,3vw,44px);font-weight:800;color:#fff;margin-top:4px;font-variant-numeric:tabular-nums}
.kpi-value small{font-size:0.4em;color:var(--muted);margin-left:4px;font-weight:500}
.kpi-label{font-size:12px;color:var(--muted);font-weight:600;margin-top:6px;text-transform:uppercase;letter-spacing:0.5px}
.kpi-detail{font-size:11px;color:var(--dim);margin-top:8px;line-height:1.4}

/* ─── Charts ─── */
.charts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:20px}
.chart-block{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:24px;backdrop-filter:blur(4px)}
.chart-header{display:flex;flex-wrap:wrap;align-items:flex-start;gap:8px;margin-bottom:16px}
.chart-header h3{font-size:15px;font-weight:700;color:#e0e7ff;flex:1;letter-spacing:-0.01em}
.chart-subtitle{font-size:11px;color:var(--dim);width:100%;margin-top:-4px}
.chart-type-badge{font-size:9px;padding:3px 8px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.25);border-radius:6px;color:#a5b4fc;font-weight:700;letter-spacing:1px;white-space:nowrap}

.bars{display:flex;flex-direction:column;gap:8px}
.bar-row{display:flex;align-items:center;gap:12px}
.bar-label{width:120px;font-size:12px;text-align:right;color:var(--muted);flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar-track{flex:1;height:28px;background:rgba(255,255,255,0.04);border-radius:8px;overflow:hidden}
.bar-fill{height:100%;border-radius:8px;transition:width 1.4s cubic-bezier(0.16,1,0.3,1)}
.bar-val{width:64px;font-size:12px;font-weight:700;color:#e0e7ff;font-variant-numeric:tabular-nums}

/* ─── Pie / Donut ─── */
.pie-wrap{display:flex;align-items:center;gap:28px;flex-wrap:wrap;justify-content:center}
.pie-donut{width:180px;height:180px;border-radius:50%;position:relative;flex-shrink:0;box-shadow:0 0 40px rgba(99,102,241,0.15)}
.pie-hole{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:90px;height:90px;border-radius:50%;background:var(--card);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff}
.pie-hole small{font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;font-weight:600}
.pie-legend{display:flex;flex-direction:column;gap:8px}
.pie-legend-item{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)}
.pie-legend-item strong{color:#e0e7ff;margin-left:4px}
.pie-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}

/* ─── Radar ─── */
.radar-wrap{display:flex;flex-direction:column;align-items:center}
.radar-svg{width:260px;height:260px}
.radar-poly{transition:all .6s ease}
.radar-legend{display:flex;gap:16px;margin-top:8px}
.radar-legend-item{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted)}

/* ─── Insights ─── */
.insight-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
.insight-card{display:flex;gap:16px;align-items:flex-start;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:20px;backdrop-filter:blur(4px);transition:transform .2s}
.insight-card:hover{transform:translateX(4px)}
.insight-num{flex-shrink:0;width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--accent),var(--accent2));border-radius:10px;font-size:15px;font-weight:800;color:#fff;box-shadow:0 4px 12px rgba(99,102,241,0.25)}
.insight-text p{font-size:14px;line-height:1.65;color:#cbd5e1}

/* ─── Highlight ─── */
.highlight-box{background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.06));border:1px solid rgba(99,102,241,0.2);border-radius:14px;padding:24px 28px;font-size:clamp(17px,2.2vw,26px);font-weight:700;color:#c4b5fd;margin-bottom:28px;display:flex;align-items:center;gap:16px;line-height:1.4}
.highlight-icon{font-size:28px;flex-shrink:0}

/* ─── Bullets ─── */
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:14px;max-width:700px}
.bullet-list li{padding-left:28px;position:relative;font-size:15px;line-height:1.7;color:#cbd5e1}
.bullet-list li::before{content:'';position:absolute;left:0;top:10px;width:10px;height:10px;background:linear-gradient(135deg,var(--accent),var(--cyan));border-radius:50%;box-shadow:0 0 8px rgba(99,102,241,0.3)}

/* ─── Comparison ─── */
.compare-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
.compare-card{display:flex;gap:14px;align-items:flex-start;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:18px;transition:transform .2s}
.compare-card:hover{transform:translateY(-2px)}
.compare-marker{width:4px;height:100%;min-height:24px;border-radius:4px;flex-shrink:0}
.compare-card p{font-size:14px;line-height:1.6;color:#cbd5e1}

/* ─── Timeline ─── */
.timeline{display:flex;flex-direction:column;gap:0;max-width:640px}
.timeline-item{display:flex;gap:20px}
.tl-connector{display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:20px}
.tl-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;z-index:1}
.tl-line{width:2px;flex:1;background:rgba(99,102,241,0.2);margin-top:4px}
.tl-content{padding-bottom:28px}
.tl-step{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:4px}
.tl-content p{font-size:14px;line-height:1.65;color:#cbd5e1}

/* ─── Navigation ─── */
nav.controls{position:fixed;bottom:24px;right:24px;display:flex;flex-direction:column;gap:6px;z-index:10}
nav.controls button{width:44px;height:44px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(10,8,32,0.85);backdrop-filter:blur(16px);cursor:pointer;font-size:16px;color:#a5b4fc;transition:all .2s;display:flex;align-items:center;justify-content:center}
nav.controls button:hover{background:var(--accent);color:#fff;border-color:var(--accent);transform:scale(1.05)}
nav.controls button svg{width:18px;height:18px;stroke:currentColor;stroke-width:2;fill:none}

/* ─── Slide dots ─── */
.slide-dots{position:fixed;right:12px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:8px;z-index:10}
.slide-dots .dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.12);cursor:pointer;transition:all .3s;border:none}
.slide-dots .dot.active{background:var(--accent);box-shadow:0 0 10px rgba(99,102,241,0.5);transform:scale(1.3)}

/* ─── Progress ─── */
.progress-bar{position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,var(--accent),var(--cyan),var(--emerald));z-index:20;transition:width .4s cubic-bezier(.16,1,.3,1);box-shadow:0 0 12px rgba(99,102,241,0.4)}

/* ─── Responsive ─── */
@media (max-width:768px){
  .slide{padding:6vh 6vw}
  .kpi-grid{grid-template-columns:repeat(2,1fr)}
  .charts-grid{grid-template-columns:1fr}
  .pie-wrap{flex-direction:column}
  .slide-dots{display:none}
}
@media print{.slide{page-break-after:always;min-height:auto;padding:40px}nav.controls,.progress-bar,.slide-dots,.slide-grain{display:none}.anim-item{opacity:1!important;transform:none!important}}
</style>
</head>
<body>
<div class="progress-bar" id="progress" style="width:0%"></div>

${slides.join('\n')}

<!-- Slide dots -->
<div class="slide-dots" id="dots">
${result.slides.map((_, i) => `<button class="dot${i === 0 ? ' active' : ''}" onclick="go(${i})" title="Slide ${i + 1}"></button>`).join('\n')}
</div>

<!-- Nav controls -->
<nav class="controls">
<button onclick="prev()" title="Précédent"><svg viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg></button>
<button onclick="next()" title="Suivant"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
</nav>

<script>
const allSlides=document.querySelectorAll('.slide');
const dots=document.querySelectorAll('.dot');
const progressBar=document.getElementById('progress');
let current=0;

function updateUI(){
  progressBar.style.width=((current+1)/allSlides.length*100)+'%';
  dots.forEach((d,i)=>d.classList.toggle('active',i===current));
}

function go(i){
  i=Math.max(0,Math.min(i,allSlides.length-1));
  allSlides[i].scrollIntoView({behavior:'smooth'});
  current=i;
  updateUI();
}
function next(){go(current+1)}
function prev(){go(current-1)}

document.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'||e.key===' '||e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();next()}
  if(e.key==='ArrowUp'||e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();prev()}
  if(e.key==='Home'){e.preventDefault();go(0)}
  if(e.key==='End'){e.preventDefault();go(allSlides.length-1)}
});

// Intersection observer for animations + tracking
const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('visible');
      const idx=parseInt(e.target.dataset.index);
      if(!isNaN(idx)){current=idx;updateUI()}
      // Animate bars
      e.target.querySelectorAll('.bar-fill').forEach(bar=>{
        const w=bar.dataset.width;
        if(w)setTimeout(()=>bar.style.width=w+'%',100);
      });
    }
  });
},{threshold:0.35});
allSlides.forEach(s=>io.observe(s));

updateUI();
// Initial visibility
setTimeout(()=>allSlides[0]?.classList.add('visible'),100);
</script>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
