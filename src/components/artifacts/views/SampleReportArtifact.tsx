// SampleReportArtifact - Preview of a market report for a category
// Shows key sections: Executive Summary, Price Trends, Key Suppliers, Risks

import { useMemo } from 'react';
import { ArrowLeft, Download, Calendar, TrendingUp, TrendingDown, Building2, AlertTriangle } from 'lucide-react';

interface SampleReportArtifactProps {
  category: string;
  analystName: string;
  onBack: () => void;
}

// Generate stable value from string
const getStableValue = (str: string, seed: number, min: number, max: number) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i) + seed;
    hash = hash & hash;
  }
  const normalized = Math.abs(hash % 1000) / 1000;
  return normalized * (max - min) + min;
};

export const SampleReportArtifact = ({
  category,
  analystName,
  onBack,
}: SampleReportArtifactProps) => {
  // Stable mock data derived from category name
  const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const { priceChange, pricePercent, chartBars } = useMemo(() => {
    const isUp = getStableValue(category, 1, 0, 100) > 50;
    const percent = getStableValue(category, 2, 2, 14).toFixed(1);
    const bars = Array.from({ length: 12 }, (_, i) =>
      Math.floor(getStableValue(category + i, 3, 30, 70))
    );
    return { priceChange: isUp, pricePercent: percent, chartBars: bars };
  }, [category]);

  return (
    <div className="p-4 bg-[#fafafa] min-h-full">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Report Header */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-violet-600 font-medium mb-1">SAMPLE REPORT</p>
            <h2 className="text-lg font-medium text-slate-900">{category} Market Analysis</h2>
            <p className="text-sm text-slate-500 mt-1">Decision Grade Report Preview</p>
          </div>
          <button className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
            <Download className="w-4 h-4 text-slate-600" />
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {reportDate}
          </span>
          <span>By {analystName}</span>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-5 mb-4">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Executive Summary</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          The {category.toLowerCase()} market continues to show {priceChange ? 'upward' : 'downward'} pressure
          driven by {priceChange ? 'strong demand and supply constraints' : 'softening demand and inventory builds'}.
          Key factors include raw material costs, energy prices, and regional trade dynamics.
          We recommend {priceChange ? 'securing contracts early' : 'negotiating flexible terms'} given current conditions.
        </p>
      </div>

      {/* Price Trend */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-5 mb-4">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Price Trend (30 Days)</h3>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${priceChange ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            {priceChange ? (
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-rose-600" />
            )}
          </div>
          <div>
            <p className={`text-2xl font-medium ${priceChange ? 'text-emerald-600' : 'text-rose-600'}`}>
              {priceChange ? '+' : '-'}{pricePercent}%
            </p>
            <p className="text-xs text-slate-500">vs previous period</p>
          </div>
        </div>
        {/* Mini chart placeholder */}
        <div className="h-24 bg-slate-50 rounded-xl flex items-center justify-center">
          <div className="flex items-end gap-1 h-16">
            {chartBars.map((h, i) => (
              <div
                key={i}
                className={`w-4 rounded-t ${priceChange ? 'bg-emerald-200' : 'bg-rose-200'}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Key Suppliers */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-5 mb-4">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Top Suppliers</h3>
        <div className="space-y-3">
          {[
            { name: 'GlobalCorp Industries', region: 'North America', share: '24%' },
            { name: 'Pacific Materials Ltd', region: 'APAC', share: '18%' },
            { name: 'EuroSupply GmbH', region: 'EMEA', share: '15%' },
          ].map((supplier) => (
            <div key={supplier.name} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{supplier.name}</p>
                  <p className="text-xs text-slate-500">{supplier.region}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-slate-600">{supplier.share}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Factors */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-5 mb-4">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Key Risks</h3>
        <div className="space-y-2">
          {[
            { risk: 'Supply chain disruptions', level: 'High' },
            { risk: 'Currency volatility', level: 'Medium' },
            { risk: 'Regulatory changes', level: 'Low' },
          ].map((item) => (
            <div key={item.risk} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${
                  item.level === 'High' ? 'text-rose-500' :
                  item.level === 'Medium' ? 'text-amber-500' : 'text-slate-400'
                }`} />
                <span className="text-sm text-slate-700">{item.risk}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                item.level === 'High' ? 'bg-rose-100 text-rose-700' :
                item.level === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {item.level}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-2xl p-5 text-white">
        <h3 className="font-medium mb-2">Get the Full Report</h3>
        <p className="text-sm text-violet-100 mb-4">
          Unlock 5-year forecasts, negotiation strategies, and detailed supplier analysis.
        </p>
        <button className="w-full py-3 rounded-xl bg-white text-violet-600 text-sm font-medium hover:bg-violet-50 transition-colors">
          Upgrade to Decision Grade
        </button>
      </div>
    </div>
  );
};

export default SampleReportArtifact;
