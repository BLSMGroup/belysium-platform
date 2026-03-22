'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.belysiumgroup.com';

interface PropertyReport {
  summary: string;
  acquisitionCosts: { purchasePrice: number; registrationTax: number; notaryCosts: number; totalAcquisitionCost: number; totalAcquisitionCostPercent: number };
  financing: { monthlyMortgagePayment: number; totalInterestPaid: number; loanToValue: number };
  annualCashflow: { grossRentalIncome: number; vacancyLoss: number; effectiveRentalIncome: number; operatingCosts: number; mortgagePayments: number; netCashflow: number };
  returns: { grossYield: number; netYield: number; cashOnCashReturn: number; irr: number; totalReturn10Year: number };
  cashflowProjection: Array<{ year: number; rent: number; costs: number; mortgage: number; netCashflow: number; propertyValue: number; equity: number }>;
  belgianTaxNotes: string[];
  marketContext: string;
  risks: string[];
  verdict: 'Strong Buy' | 'Buy' | 'Hold' | 'Caution' | 'Avoid';
  verdictReason: string;
}

const VERDICT_COLORS: Record<string, string> = {
  'Strong Buy': '#10b981', Buy: '#22c55e', Hold: '#f59e0b', Caution: '#f97316', Avoid: '#ef4444',
};

const fmt = (n: number) => n.toLocaleString('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const pct = (n: number) => `${n.toFixed(2)}%`;

export default function PropertyRoi() {
  const [token, setToken] = useState<string | null>(null);
  const [step, setStep] = useState<'auth' | 'form' | 'result'>('auth');
  const [authForm, setAuthForm] = useState({ email: '', licenseKey: '' });
  const [form, setForm] = useState({
    purchasePrice: 280000, registrationTaxRate: 3, notaryCostRate: 1.5,
    mortgageAmount: 224000, interestRate: 3.5, loanTermYears: 25,
    monthlyRent: 900, occupancyRate: 95, condoFees: 1200, propertyTax: 800,
    insurance: 400, maintenanceRate: 1, annualAppreciation: 3, holdingYears: 10,
    propertyType: 'apartment', location: 'Herselt, Belgium', isPrimaryResidence: false,
  });
  const [report, setReport] = useState<PropertyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  const handleAuth = async () => {
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
      const res = await fetch(`${API_URL}/tools/property-roi/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setReport(json); setStep('result');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const numInput = (label: string, key: string, opts?: { step?: number; suffix?: string; min?: number }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number" step={opts?.step ?? 1} min={opts?.min ?? 0}
          value={(form as any)[key]}
          onChange={e => set(key, Number(e.target.value))}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a2e]"
        />
        {opts?.suffix && <span className="absolute right-3 top-2.5 text-gray-400 text-sm">{opts.suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="inline-block bg-[#c9a84c] text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">Belysium Developments</div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]">Belgian Property ROI Calculator</h1>
        <p className="text-gray-500 mt-1">Full investment analysis with Belgian tax treatment</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">{error}</div>}

      {step === 'auth' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-md">
          <h2 className="font-semibold text-lg mb-5">Enter your license credentials</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a2e]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">License key</label>
              <input value={authForm.licenseKey} onChange={e => setAuthForm(p => ({ ...p, licenseKey: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#1a1a2e]" />
            </div>
            <button onClick={handleAuth} disabled={loading} className="w-full bg-[#1a1a2e] text-white rounded-xl py-3 font-semibold hover:opacity-90 disabled:opacity-50">
              {loading ? 'Verifying…' : 'Unlock Tool →'}
            </button>
          </div>
        </div>
      )}

      {step === 'form' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-4">Property details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Property type</label>
                <input value={form.propertyType} onChange={e => set('propertyType', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a2e]" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                <input value={form.location} onChange={e => set('location', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a2e]" />
              </div>
            </div>
            <div className="mt-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isPrimaryResidence} onChange={e => set('isPrimaryResidence', e.target.checked)} className="accent-[#1a1a2e]" />
                Primary residence (affects registration tax eligibility)
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-4">Acquisition costs</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {numInput('Purchase price (€)', 'purchasePrice')}
              {numInput('Registration tax rate', 'registrationTaxRate', { step: 0.5, suffix: '%' })}
              {numInput('Notary cost rate', 'notaryCostRate', { step: 0.1, suffix: '%' })}
            </div>
            <div className="mt-3 bg-amber-50 rounded-xl px-4 py-3 text-xs text-amber-800">
              <strong>Belgian note:</strong> 3% registration tax applies to primary residence in Flanders (abattement conditions). Standard rate: 12%. Notary fees ~1.0-1.5% + VAT.
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-4">Financing</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {numInput('Mortgage amount (€)', 'mortgageAmount')}
              {numInput('Interest rate', 'interestRate', { step: 0.1, suffix: '%' })}
              {numInput('Loan term (years)', 'loanTermYears', { min: 5 })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-4">Rental income</h2>
            <div className="grid grid-cols-2 gap-4">
              {numInput('Monthly rent (€)', 'monthlyRent')}
              {numInput('Occupancy rate', 'occupancyRate', { suffix: '%' })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-4">Annual costs</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {numInput('Condo fees/yr (€)', 'condoFees')}
              {numInput('Property tax/yr (€)', 'propertyTax')}
              {numInput('Insurance/yr (€)', 'insurance')}
              {numInput('Maintenance rate', 'maintenanceRate', { step: 0.1, suffix: '%' })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-4">Projections</h2>
            <div className="grid grid-cols-2 gap-4">
              {numInput('Annual appreciation', 'annualAppreciation', { step: 0.5, suffix: '%' })}
              {numInput('Holding period (years)', 'holdingYears', { min: 1 })}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full bg-[#1a1a2e] text-white rounded-xl py-3.5 font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Calculating…</> : 'Calculate ROI →'}
          </button>
        </div>
      )}

      {step === 'result' && report && (
        <div className="space-y-6">
          {/* Verdict */}
          <div className="bg-[#1a1a2e] text-white rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-6">
              <div className="text-center flex-shrink-0">
                <div className="text-3xl font-bold" style={{ color: VERDICT_COLORS[report.verdict] }}>{report.verdict}</div>
                <div className="text-xs opacity-50 mt-1">Verdict</div>
              </div>
              <div>
                <div className="text-[#c9a84c] text-xs font-semibold uppercase tracking-wider mb-1">Summary</div>
                <p className="text-sm leading-relaxed">{report.summary}</p>
                <p className="text-xs opacity-60 mt-2 italic">{report.verdictReason}</p>
              </div>
            </div>
          </div>

          {/* Key returns */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Gross Yield', value: pct(report.returns.grossYield) },
              { label: 'Net Yield', value: pct(report.returns.netYield) },
              { label: 'Cash-on-Cash', value: pct(report.returns.cashOnCashReturn) },
              { label: `IRR`, value: pct(report.returns.irr) },
              { label: `${form.holdingYears}yr Total Return`, value: pct(report.returns.totalReturn10Year) },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                <p className="text-xs text-gray-400 mb-1">{m.label}</p>
                <p className="text-xl font-bold text-[#1a1a2e]">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Acquisition costs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold mb-3">Acquisition Costs</h2>
              {[
                ['Purchase price', fmt(report.acquisitionCosts.purchasePrice)],
                ['Registration tax', fmt(report.acquisitionCosts.registrationTax)],
                ['Notary costs', fmt(report.acquisitionCosts.notaryCosts)],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">{l}</span><span className="font-medium">{v}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 font-semibold">
                <span>Total cost</span>
                <span>{fmt(report.acquisitionCosts.totalAcquisitionCost)}</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold mb-3">Annual Cashflow</h2>
              {[
                ['Gross rental income', fmt(report.annualCashflow.grossRentalIncome)],
                ['Vacancy loss', `−${fmt(report.annualCashflow.vacancyLoss)}`],
                ['Operating costs', `−${fmt(report.annualCashflow.operatingCosts)}`],
                ['Mortgage payments', `−${fmt(report.annualCashflow.mortgagePayments)}`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">{l}</span><span className="font-medium">{v}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 font-semibold">
                <span>Net cashflow</span>
                <span className={report.annualCashflow.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {fmt(report.annualCashflow.netCashflow)}
                </span>
              </div>
            </div>
          </div>

          {/* Cashflow projection chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-lg mb-4">{form.holdingYears}-Year Projection</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={report.cashflowProjection}>
                <XAxis dataKey="year" tick={{ fontSize: 11 }} label={{ value: 'Year', position: 'insideBottom', offset: -2 }} />
                <YAxis yAxisId="left" tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Line yAxisId="right" dataKey="propertyValue" name="Property value" stroke="#c9a84c" strokeWidth={2} dot={false} />
                <Line yAxisId="right" dataKey="equity" name="Equity" stroke="#1a1a2e" strokeWidth={2} dot={false} />
                <Line yAxisId="left" dataKey="netCashflow" name="Net cashflow/yr" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Belgian tax notes */}
          {report.belgianTaxNotes?.length > 0 && (
            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
              <h2 className="font-semibold text-amber-900 mb-3">Belgian Tax Notes</h2>
              <ul className="space-y-1.5">
                {report.belgianTaxNotes.map((note, i) => (
                  <li key={i} className="text-sm text-amber-800 flex gap-2">
                    <span className="flex-shrink-0">•</span>{note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Market context */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold mb-2">Market Context</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{report.marketContext}</p>
          </div>

          {/* Risks */}
          {report.risks?.length > 0 && (
            <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
              <h2 className="font-semibold text-red-900 mb-3">Key Risks</h2>
              <ul className="space-y-1.5">
                {report.risks.map((risk, i) => (
                  <li key={i} className="text-sm text-red-800 flex gap-2"><span>⚠</span>{risk}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setStep('form'); setReport(null); }} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium hover:bg-gray-50">New Calculation</button>
            <button onClick={() => window.print()} className="flex-1 bg-[#c9a84c] text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90">Print / Save PDF</button>
          </div>

          <div className="text-center text-xs text-gray-400 pb-4">
            Interested in Li'Eau apartments?{' '}
            <a href="mailto:Thomas@BelysiumGroup.com" className="text-[#c9a84c] hover:underline">Contact Thomas</a>
          </div>
        </div>
      )}
    </div>
  );
}
