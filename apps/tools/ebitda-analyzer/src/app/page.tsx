'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.belysiumgroup.com';

// ── Form schema ───────────────────────────────────────────────────────────────
const FormSchema = z.object({
  companyName: z.string().optional(),
  industry: z.string().min(2, 'Required'),
  currency: z.string().default('EUR'),
  revenue: z.coerce.number().positive('Must be positive'),
  grossProfit: z.coerce.number(),
  operatingCosts: z.coerce.number().positive('Must be positive'),
  ebitda: z.coerce.number(),
  headcount: z.coerce.number().int().positive().optional().or(z.literal('')),
  revenueGrowthYoY: z.coerce.number().optional().or(z.literal('')),
  topCostDrivers: z.string().optional(),
  email: z.string().email('Valid email required'),
  licenseKey: z.string().min(8, 'License key required'),
});

type FormValues = z.infer<typeof FormSchema>;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Lever {
  rank: number;
  category: string;
  lever: string;
  estimatedImpactEur: number;
  estimatedImpactPercent: number;
  effort: 'Low' | 'Medium' | 'High';
  timeToImpact: string;
  description: string;
}

interface Report {
  summary: string;
  metrics: {
    ebitdaMargin: number;
    grossMargin: number;
    industryBenchmarkEbitdaMargin: number;
    gapToIndustryBenchmark: number;
    revenuePerEmployee: number | null;
  };
  levers: Lever[];
  waterfallData: Array<{ label: string; value: number; type: string }>;
  actionPlan: Array<{ priority: number; action: string; owner: string; deadline: string; kpi: string }>;
  narrative: string;
}

const EFFORT_COLOR: Record<string, string> = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444' };

// ── Component ─────────────────────────────────────────────────────────────────
export default function EbitdaAnalyzer() {
  const [token, setToken] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'auth' | 'form' | 'result'>('auth');

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { currency: 'EUR' },
  });

  // Step 1: Authenticate with license key
  const handleAuth = async (data: FormValues) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/tool-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, licenseKey: data.licenseKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Authentication failed');
      setToken(json.token);
      setStep('form');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Generate report
  const handleAnalyze = async (data: FormValues) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        companyName: data.companyName,
        industry: data.industry,
        currency: data.currency,
        revenue: data.revenue,
        grossProfit: data.grossProfit,
        operatingCosts: data.operatingCosts,
        ebitda: data.ebitda,
        headcount: data.headcount || undefined,
        revenueGrowthYoY: data.revenueGrowthYoY || undefined,
        topCostDrivers: data.topCostDrivers
          ? data.topCostDrivers.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
      };
      const res = await fetch(`${API_URL}/tools/ebitda/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Analysis failed');
      setReport(json);
      setStep('result');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: FormValues) => {
    if (step === 'auth') handleAuth(data);
    else handleAnalyze(data);
  };

  const fmt = (n: number, currency = 'EUR') =>
    n.toLocaleString('nl-BE', { style: 'currency', currency, maximumFractionDigits: 0 });

  const pct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-block bg-[#c9a84c] text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
          Belysium Professional
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]">EBITDA Analyzer</h1>
        <p className="text-gray-500 mt-1">AI-powered profitability improvement analysis</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── Step 1: Auth ── */}
        {step === 'auth' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="font-semibold text-lg mb-1">Enter your license credentials</h2>
            <p className="text-gray-500 text-sm mb-6">
              You received these in your purchase confirmation email.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email address</label>
                <input {...register('email')} type="email" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a2e]" placeholder="you@company.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License key</label>
                <input {...register('licenseKey')} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#1a1a2e]" placeholder="BEL-XXXXXXXXXXXXXXXX" />
                {errors.licenseKey && <p className="text-red-500 text-xs mt-1">{errors.licenseKey.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#1a1a2e] text-white rounded-xl py-3 font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                {loading ? 'Verifying…' : 'Unlock Tool →'}
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-4 text-center">
              Don't have a license? <a href="https://belysiumgroup.com/tools" className="text-[#c9a84c] hover:underline">Purchase here</a>
            </p>
          </div>
        )}

        {/* ── Step 2: Input Form ── */}
        {step === 'form' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="font-semibold text-lg mb-5">Company details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Company name (optional)" error={errors.companyName?.message}>
                  <input {...register('companyName')} className={inputCls} placeholder="Confidential" />
                </Field>
                <Field label="Industry *" error={errors.industry?.message}>
                  <input {...register('industry')} className={inputCls} placeholder="e.g. Manufacturing, Logistics" />
                </Field>
                <Field label="Currency" error={errors.currency?.message}>
                  <select {...register('currency')} className={inputCls}>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </Field>
                <Field label="Headcount (optional)" error={errors.headcount?.message}>
                  <input {...register('headcount')} type="number" min="1" className={inputCls} placeholder="e.g. 120" />
                </Field>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="font-semibold text-lg mb-5">Financial inputs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Revenue *" error={errors.revenue?.message}>
                  <input {...register('revenue')} type="number" className={inputCls} placeholder="e.g. 10000000" />
                </Field>
                <Field label="Gross profit *" error={errors.grossProfit?.message}>
                  <input {...register('grossProfit')} type="number" className={inputCls} placeholder="e.g. 4000000" />
                </Field>
                <Field label="Operating costs *" error={errors.operatingCosts?.message}>
                  <input {...register('operatingCosts')} type="number" className={inputCls} placeholder="e.g. 2500000" />
                </Field>
                <Field label="EBITDA *" error={errors.ebitda?.message}>
                  <input {...register('ebitda')} type="number" className={inputCls} placeholder="e.g. 1500000" />
                </Field>
                <Field label="Revenue growth YoY % (optional)" error={errors.revenueGrowthYoY?.message}>
                  <input {...register('revenueGrowthYoY')} type="number" step="0.1" className={inputCls} placeholder="e.g. 8.5" />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Top cost drivers (comma-separated, optional)" error={errors.topCostDrivers?.message}>
                  <input {...register('topCostDrivers')} className={inputCls} placeholder="e.g. Labour, Raw materials, Logistics" />
                </Field>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#1a1a2e] text-white rounded-xl py-3.5 font-semibold text-base hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Generating analysis…
                </>
              ) : 'Generate EBITDA Analysis →'}
            </button>
          </div>
        )}
      </form>

      {/* ── Step 3: Results ── */}
      {step === 'result' && report && (
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-[#1a1a2e] text-white rounded-2xl p-6 md:p-8">
            <div className="text-[#c9a84c] text-xs font-semibold uppercase tracking-wider mb-2">Executive Summary</div>
            <p className="text-base leading-relaxed">{report.summary}</p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="EBITDA Margin" value={pct(report.metrics.ebitdaMargin)} />
            <MetricCard label="Gross Margin" value={pct(report.metrics.grossMargin)} />
            <MetricCard label="Industry Benchmark" value={pct(report.metrics.industryBenchmarkEbitdaMargin)} />
            <MetricCard
              label="Gap to Benchmark"
              value={`${report.metrics.gapToIndustryBenchmark > 0 ? '+' : ''}${pct(report.metrics.gapToIndustryBenchmark)}`}
              highlight={report.metrics.gapToIndustryBenchmark < 0}
            />
          </div>

          {/* Waterfall chart */}
          {report.waterfallData?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-lg mb-4">EBITDA Waterfall</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={report.waterfallData} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <ReferenceLine y={0} stroke="#e5e7eb" />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {report.waterfallData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.type === 'positive' ? '#22c55e' : entry.type === 'negative' ? '#ef4444' : entry.type === 'total' ? '#1a1a2e' : '#c9a84c'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Improvement levers */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-4">Top Improvement Levers</h2>
            <div className="space-y-4">
              {report.levers.map((lever) => (
                <div key={lever.rank} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#1a1a2e] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                        {lever.rank}
                      </span>
                      <span className="font-semibold text-sm">{lever.lever}</span>
                    </div>
                    <span className="text-[#c9a84c] font-semibold text-sm whitespace-nowrap">
                      +{fmt(lever.estimatedImpactEur)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm ml-8">{lever.description}</p>
                  <div className="flex gap-3 mt-2 ml-8">
                    <Badge label={lever.category} color="gray" />
                    <Badge label={lever.effort} color={EFFORT_COLOR[lever.effort] ?? '#888'} text />
                    <Badge label={lever.timeToImpact} color="gray" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-4">Action Plan</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 text-gray-400 font-medium w-8">#</th>
                    <th className="text-left pb-2 text-gray-400 font-medium">Action</th>
                    <th className="text-left pb-2 text-gray-400 font-medium">Owner</th>
                    <th className="text-left pb-2 text-gray-400 font-medium">Deadline</th>
                    <th className="text-left pb-2 text-gray-400 font-medium">KPI</th>
                  </tr>
                </thead>
                <tbody>
                  {report.actionPlan.map((item) => (
                    <tr key={item.priority} className="border-b border-gray-50">
                      <td className="py-2.5 text-gray-400">{item.priority}</td>
                      <td className="py-2.5 font-medium">{item.action}</td>
                      <td className="py-2.5 text-gray-500">{item.owner}</td>
                      <td className="py-2.5 text-gray-500">{item.deadline}</td>
                      <td className="py-2.5 text-gray-500">{item.kpi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Narrative */}
          <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-gray-100">
            <h2 className="font-semibold text-lg mb-3">Assessment Narrative</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{report.narrative}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => { setStep('form'); setReport(null); }}
              className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium hover:bg-gray-50"
            >
              New Analysis
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 bg-[#c9a84c] text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90"
            >
              Print / Save PDF
            </button>
          </div>

          <div className="text-center text-xs text-gray-400 pb-4">
            Need deeper support?{' '}
            <a href="mailto:Info@BelysiumGroup.com" className="text-[#c9a84c] hover:underline">
              Contact Belysium Professional
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a2e] bg-white';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function MetricCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100 shadow-sm'}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-red-600' : 'text-[#1a1a2e]'}`}>{value}</p>
    </div>
  );
}

function Badge({ label, color, text = false }: { label: string; color: string; text?: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium`}
      style={text ? { color, background: `${color}18` } : { background: '#f3f4f6', color: '#6b7280' }}>
      {label}
    </span>
  );
}
