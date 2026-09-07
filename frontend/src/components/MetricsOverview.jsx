import React from 'react';
import { FileText, Clock, BarChart2, BrainCircuit } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export default function MetricsOverview({ stats, keywords, filename }) {
  if (!stats) return null;

  const totalSectionWords = stats.section_breakdown
    ? stats.section_breakdown.reduce((acc, curr) => acc + (curr.words || 0), 0)
    : 0;

  const renderPieLabel = ({ name, percent }) => {
    if (percent < 0.05) return null;
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div>
      {filename && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.92rem', fontWeight: 600 }}>
          <FileText size={18} style={{ color: 'var(--primary-blue)' }} />
          <span>Active Document: <strong style={{ color: 'var(--text-main)' }}>{filename}</strong></span>
        </div>
      )}
      <div className="metrics-strip">
        <div className="glass-panel metric-card">
          <div className="metric-icon-bg" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="metric-val">{stats.page_count}</div>
            <div className="metric-lbl">Total Pages</div>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon-bg" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="metric-val">{stats.estimated_read_time_mins} min</div>
            <div className="metric-lbl">Est. Read Time</div>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon-bg" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <BarChart2 size={24} />
          </div>
          <div>
            <div className="metric-val">{stats.complexity_score}/100</div>
            <div className="metric-lbl">Complexity Index</div>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon-bg" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <BrainCircuit size={24} />
          </div>
          <div>
            <div className="metric-val">{keywords ? keywords.length : 0}</div>
            <div className="metric-lbl">Key Concepts</div>
          </div>
        </div>
      </div>

      {keywords && keywords.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '32px' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', color: 'var(--text-muted)' }}>
            🔑 Key Domain Concepts & Relevance:
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {keywords.map((kw, idx) => (
              <span
                key={idx}
                style={{
                  background: 'var(--badge-bg)',
                  color: 'var(--badge-text)',
                  border: '1px solid var(--badge-border)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {kw.keyword}
                <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>{kw.score}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {stats.section_breakdown && stats.section_breakdown.length > 0 && (
        <div id="section-breakdown-charts" className="charts-grid" style={{ borderRadius: '16px' }}>
          <div className="glass-panel chart-card">
            <div className="chart-header">
              <h4 className="chart-title">
                <BarChart2 size={18} style={{ color: 'var(--primary-blue)' }} />
                Section Word Count Breakdown
              </h4>
            </div>
            <div style={{ width: '100%', flex: 1, minHeight: 280 }}>
              <ResponsiveContainer>
                <BarChart data={stats.section_breakdown} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--panel-bg)',
                      borderColor: 'var(--panel-border)',
                      borderRadius: '12px',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem'
                    }}
                    formatter={(val) => [`${val} words`, 'Volume']}
                  />
                  <Bar dataKey="words" radius={[8, 8, 0, 0]}>
                    {stats.section_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel chart-card">
            <div className="chart-header">
              <h4 className="chart-title">
                <BrainCircuit size={18} style={{ color: 'var(--primary-indigo)' }} />
                Section Density & Proportional Share
              </h4>
            </div>
            <div style={{ width: '100%', flex: 1, minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={stats.section_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="words"
                    paddingAngle={4}
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {stats.section_breakdown.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color || '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--panel-bg)',
                      borderColor: 'var(--panel-border)',
                      borderRadius: '12px',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem'
                    }}
                    formatter={(val) => [`${val} words (${totalSectionWords > 0 ? ((val / totalSectionWords) * 100).toFixed(1) : 0}%)`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 14px', marginTop: '10px', width: '100%' }}>
                {stats.section_breakdown.map((entry, idx) => {
                  const pct = totalSectionWords > 0 ? ((entry.words / totalSectionWords) * 100).toFixed(0) : 0;
                  return (
                    <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color || '#3b82f6' }} />
                      <span>{entry.name}: {pct}% ({entry.words}w)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

