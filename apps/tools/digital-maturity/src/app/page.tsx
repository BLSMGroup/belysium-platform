'use client';

import { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.belysiumgroup.com';

const DIMENSIONS = [
  'Strategy & Leadership',
  'Customer Experience',
  'Operations & Automation',
  'Data & Analytics',
  'Technology & Infrastructure',
  'Culture & Talent',
  'Cybersecurity & Risk',
  'Ecosystem & Partnerships',
];

const MATURITY_LABELS = ['', 'Initial', 'Developing', 'Defined', 'Advanced', 'Leading'];
const MATURITY_COLORS: Record<string, string> = {
  Initial: '#ef4444', Developing: '#f97316', Defined: '#f59e0b', Advanced: '#22c55e', Leading: '#10b981',
};

interface AssessmentReport {
  overallScore: number;
  maturityLevel: string;
  summary: string;
  dimensionScores: Array<{
    dimension: string; score: number; benchmark: number; gap: number;
    maturityLevel: string; strengths: string[]; gaps: string[];
  }>;
  priorityInitiatives: Array<{
    rank: number; initiative: string; dimension: string;
    impact: string; effort: string; timeframe: string; description: string; estimatedROI: string;
  }>;
  roadmap: {
    quickWins: Array<{ initiative: string; timeframe: string; kpi: string }>;
    mediumTerm: Array<{ initiative: string; timeframe: string; kpi: string }>;
    strategic: Array<{ initiative: string; timeframe: string; kpi: string }>;
  };
  narrative: string;
}

export default function DigitalMaturity() {
  const [token, setToken] = useState<string | null>(null);
  const [step, setStep] = useState<'auth' | 'form' | 'result'>('auth');
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(DIMENSIONS.map(d => [d, 3]))
  );
  const [meta, setMeta] = useState({ companyName: '', industry: '', revenue: '' });
  const [authForm, setAuthForm] = useState({ email: '', licenseKey: '' });
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    if (!authForm.email || !authForm.licenseKey) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/tool-login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setToken(json.token); setStep('form');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/tools/digital-maturity/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...meta, scores }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setReport(json); setStep('result');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const radarData = DIMENSIONS.map(d => ({
    dimension: d.split(' & ')[0], // Shorten for chart
    score: scores[d],
    fullMark: 5,
  }));

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="inline-block bg-[#c9a84c] text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">Belysium Professional</div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]">Digital Maturity Assessment</h1>
        <p className="text-gray-500 mt-1">40-question audit across 8 dimensions · AI-generated roadmap</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">{error}</div>}

      {/* Auth step */}
      {step === 'auth' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-md">
          <h2 className="font-semibold text-lg mb-5">Enter your license credentials</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a2e]" placeholder="you@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">License key</label>
              <input value={authForm.licenseKey} onChange={e => setAuthForm(p => ({ ...p, licenseKey: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#1a1a2e]" placeholder="BEL-XXXXXXXXXXXXXXXX" />
            </div>
            <button onClick={handleAuth} disabled={loading} className="w-full bg-[#1a1a2e] text-white rounded-xl py-3 font-semibold hover:opacity-90 disabled:opacity-50">
              {loading ? 'Verifying…' : 'Unlock Tool →'}
            </button>
          </div>
        </div>
      )}

      {/* Assessment form */}
      {step === 'form' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-4">Company details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['companyName', 'industry', 'revenue'].map(key => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1 capitalize">{key === 'revenue' ? 'Revenue range' : key === 'companyName' ? 'Company name' : 'Industry'}</label>
                  <input
                    value={(meta as any)[key]}
                    onChange={e => setMeta(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a2e]"
                    placeholder={key === 'revenue' ? 'e.g. 10-50M EUR' : key === 'industry' ? 'e.g. Manufacturing' : 'Confidential'}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Radar preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-2">Live preview</h2>
            <p className="text-gray-400 text-sm mb-4">Adjust sliders below to see your maturity profile.</p>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                <Radar name="Score" dataKey="score" stroke="#1a1a2e" fill="#1a1a2e" fillOpacity={0.25} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Dimension sliders */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-5">Rate your digital maturity</h2>
            <p className="text-gray-400 text-sm mb-6">For each dimension, select the score that best reflects your current state (1 = Initial, 5 = Leading).</p>
            <div className="space-y-6">
              {DIMENSIONS.map(dim => (
                <div key={dim}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{dim}</span>
                    <span className="text-sm font-semibold text-[#1a1a2e]">
                      {scores[dim]}/5 — <span className="text-[#c9a84c]">{MATURITY_LABELS[scores[dim]]}</span>
                    </span>
                  </div>
                  <input
                    type="range" min="1" max="5" step="1" value={scores[dim]}
                    onChange={e => setScores(p => ({ ...p, [dim]: Number(e.target.value) }))}
                    className="w-full accent-[#1a1a2e]"
                  />
                  <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                    <span>1 — Initial</span><span>3 — Defined</span><span>5 — Leading</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full bg-[#1a1a2e] text-white rounded-xl py-3.5 font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Generating assessment…</>
            ) : 'Generate Assessment & Roadmap →'}
          </button>
        </div>
      )}

      {/* Results */}
      {step === 'result' && report && (
        <div className="space-y-6">
          {/* Overall score */}
          <div className="bg-[#1a1a2e] text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="text-center flex-shrink-0">
              <div className="text-5xl font-bold text-[#c9a84c]">{report.overallScore.toFixed(1)}</div>
              <div className="text-xs opacity-60 mt-1">out of 5.0</div>
              <div className="mt-2 font-semibold"
                style={{ color: MATURITY_COLORS[report.maturityLevel] ?? '#c9a84c' }}>
                {report.maturityLevel}
              </div>
            </div>
            <div>
              <div className="text-[#c9a84c] text-xs font-semibold uppercase tracking-wider mb-2">Executive Summary</div>
              <p className="leading-relaxed text-sm">{report.summary}</p>
            </div>
          </div>

          {/* Radar + dimension breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-lg mb-4">Maturity Radar</h2>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={report.dimensionScores.map(d => ({ dimension: d.dimension.split(' & ')[0], score: d.score, benchmark: d.benchmark }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
                  <Radar name="Your score" dataKey="score" stroke="#1a1a2e" fill="#1a1a2e" fillOpacity={0.3} />
                  <Radar name="Benchmark" dataKey="benchmark" stroke="#c9a84c" fill="#c9a84c" fillOpacity={0.1} strokeDasharray="4" />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-lg mb-4">Dimension Scores</h2>
              <div className="space-y-3">
                {report.dimensionScores.map(d => (
                  <div key={d.dimension}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium truncate max-w-[60%]">{d.dimension}</span>
                      <span style={{ color: MATURITY_COLORS[d.maturityLevel] ?? '#888' }}>
                        {d.score.toFixed(1)} — {d.maturityLevel}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(d.score / 5) * 100}%`, background: MATURITY_COLORS[d.maturityLevel] ?? '#1a1a2e' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Priority initiatives */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-4">Priority Initiatives</h2>
            <div className="space-y-4">
              {report.priorityInitiatives.map(init => (
                <div key={init.rank} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#c9a84c] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{init.rank}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{init.initiative}</div>
                      <div className="text-gray-500 text-sm mt-1">{init.description}</div>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{init.dimension}</span>
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Impact: {init.impact}</span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{init.timeframe}</span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">ROI: {init.estimatedROI}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Roadmap */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-4">Transformation Roadmap</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Quick Wins', subtitle: '0-3 months', items: report.roadmap.quickWins, color: '#22c55e' },
                { title: 'Medium Term', subtitle: '3-12 months', items: report.roadmap.mediumTerm, color: '#f59e0b' },
                { title: 'Strategic', subtitle: '12-24 months', items: report.roadmap.strategic, color: '#1a1a2e' },
              ].map(phase => (
                <div key={phase.title} className="border border-gray-100 rounded-xl p-4">
                  <div className="font-semibold text-sm mb-0.5" style={{ color: phase.color }}>{phase.title}</div>
                  <div className="text-xs text-gray-400 mb-3">{phase.subtitle}</div>
                  <div className="space-y-2">
                    {phase.items.map((item, i) => (
                      <div key={i} className="text-xs">
                        <div className="font-medium">{item.initiative}</div>
                        <div className="text-gray-400">KPI: {item.kpi}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-gray-100">
            <h2 className="font-semibold text-lg mb-3">Assessment Narrative</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{report.narrative}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setStep('form'); setReport(null); }} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium hover:bg-gray-50">New Assessment</button>
            <button onClick={() => window.print()} className="flex-1 bg-[#c9a84c] text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90">Print / Save PDF</button>
          </div>
        </div>
      )}
    </div>
  );
}
