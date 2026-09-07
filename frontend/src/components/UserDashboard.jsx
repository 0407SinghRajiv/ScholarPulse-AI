import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserAnalyses, deleteAnalysisRecord } from '../services/supabase';
import {
  FileText, Clock, Award, Brain, Search, Trash2, ExternalLink,
  UploadCloud, BarChart3, Calendar, Layers, RefreshCw, Sparkles,
  CloudCheck, CheckCircle2, ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
} from 'recharts';

export default function UserDashboard({ onOpenAnalysis, onNewUpload }) {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Dynamic greeting based on current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const fetchHistory = async () => {
    if (!user) {
      setAnalyses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const records = await getUserAnalyses(user.id);
      setAnalyses(records || []);
    } catch (err) {
      console.error('Error loading analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalPapers = analyses.length;
    const totalTimeSavedMins = analyses.reduce(
      (acc, item) => acc + (item.estimated_read_time_mins ? Math.max(15, item.estimated_read_time_mins * 3) : 25),
      0
    );
    const timeSavedHours = (totalTimeSavedMins / 60).toFixed(1);

    const avgComplexity = totalPapers > 0
      ? Math.round(analyses.reduce((acc, item) => acc + (Number(item.complexity_score) || 65), 0) / totalPapers)
      : 0;

    const totalConcepts = analyses.reduce((acc, item) => {
      const concepts = item.full_result?.key_concepts?.length || 
                       item.full_result?.simplified_summary?.key_findings?.length || 4;
      return acc + concepts;
    }, 0);

    return { totalPapers, timeSavedHours, avgComplexity, totalConcepts };
  }, [analyses]);

  // Activity over time data for AreaChart
  const activityData = useMemo(() => {
    if (analyses.length === 0) {
      return [
        { name: 'Mon', count: 0 },
        { name: 'Tue', count: 0 },
        { name: 'Wed', count: 0 },
        { name: 'Thu', count: 0 },
        { name: 'Fri', count: 0 },
        { name: 'Sat', count: 0 },
        { name: 'Sun', count: 0 },
      ];
    }

    const dateMap = {};
    analyses.forEach((a) => {
      const d = new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dateMap[d] = (dateMap[d] || 0) + 1;
    });

    const entries = Object.entries(dateMap).slice(-7);
    if (entries.length < 2) {
      return [
        { name: 'Start', count: 0 },
        ...entries.map(([name, count]) => ({ name, count })),
      ];
    }
    return entries.map(([name, count]) => ({ name, count }));
  }, [analyses]);

  // Complexity breakdown (0-100 scale)
  const complexityData = useMemo(() => {
    let low = 0;
    let medium = 0;
    let high = 0;

    analyses.forEach((a) => {
      const score = Number(a.complexity_score) || 60;
      if (score < 50) low++;
      else if (score <= 75) medium++;
      else high++;
    });

    return [
      { name: 'Foundational (<50)', count: low, color: '#10b981' },
      { name: 'Intermediate (50-75)', count: medium, color: '#6366f1' },
      { name: 'Advanced (>75)', count: high, color: '#ec4899' },
    ];
  }, [analyses]);

  // Filtered papers list
  const filteredPapers = useMemo(() => {
    return analyses.filter((item) => {
      const q = searchQuery.toLowerCase();
      const name = (item.file_name || '').toLowerCase();
      const sum = (item.summary || '').toLowerCase();
      return name.includes(q) || sum.includes(q);
    });
  }, [analyses, searchQuery]);

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete analysis for "${item.file_name}"?`)) return;
    setDeletingId(item.id);
    try {
      await deleteAnalysisRecord(item.id, item.file_path);
      setAnalyses((prev) => prev.filter((p) => p.id !== item.id));
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        
        {/* Dynamic Welcome Header */}
        <div className="dashboard-banner">
          <div className="dashboard-banner-glow" />
          
          <div className="dashboard-banner-content">
            <div>
              <div className="dashboard-badge">
                <span className="pulsing-live-dot" />
                <ShieldCheck size={14} />
                <span>Encrypted Cloud Workspace</span>
              </div>
              <h1 className="dashboard-title">
                {greeting}, <span className="highlight-gradient">{user?.email?.split('@')[0] || 'Researcher'}</span>
              </h1>
              <p className="dashboard-subtitle">
                Vault Active &bull; {user?.email} &bull; Real-time AI Analysis Sync
              </p>
            </div>

            <div className="dashboard-actions">
              <button
                type="button"
                onClick={onNewUpload}
                className="btn-dashboard-primary"
              >
                <UploadCloud size={16} />
                <span>Analyze New Paper</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="dashboard-kpi-grid">
          {/* Card 1 */}
          <div className="dashboard-kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Papers Analyzed</span>
              <div className="kpi-card-icon icon-blue">
                <FileText size={18} />
              </div>
            </div>
            <div className="kpi-card-body">
              <span className="kpi-card-value">{stats.totalPapers}</span>
              <span className="kpi-card-tag tag-green">Cloud Synced</span>
            </div>
            <p className="kpi-card-sub">Total research papers in vault</p>
          </div>

          {/* Card 2 */}
          <div className="dashboard-kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Reading Time Saved</span>
              <div className="kpi-card-icon icon-emerald">
                <Clock size={18} />
              </div>
            </div>
            <div className="kpi-card-body">
              <span className="kpi-card-value">{stats.timeSavedHours}</span>
              <span className="kpi-card-tag tag-gray">hours</span>
            </div>
            <p className="kpi-card-sub">Estimated executive digest speedup</p>
          </div>

          {/* Card 3 */}
          <div className="dashboard-kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Avg Complexity</span>
              <div className="kpi-card-icon icon-purple">
                <Award size={18} />
              </div>
            </div>
            <div className="kpi-card-body">
              <span className="kpi-card-value">{stats.avgComplexity}</span>
              <span className="kpi-card-tag tag-purple">/ 100</span>
            </div>
            <p className="kpi-card-sub">Academic density & rigor rating</p>
          </div>

          {/* Card 4 */}
          <div className="dashboard-kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Key Insights</span>
              <div className="kpi-card-icon icon-pink">
                <Brain size={18} />
              </div>
            </div>
            <div className="kpi-card-body">
              <span className="kpi-card-value">{stats.totalConcepts}</span>
              <span className="kpi-card-tag tag-pink">Extracted</span>
            </div>
            <p className="kpi-card-sub">Concepts & open findings mapped</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="dashboard-charts-grid">
          {/* Activity Over Time */}
          <div className="dashboard-chart-card wide">
            <div className="chart-card-header">
              <div>
                <h3 className="chart-card-title">
                  <BarChart3 size={17} color="var(--primary-blue)" />
                  <span>Analysis Activity Trend</span>
                </h3>
                <p className="chart-card-sub">Papers uploaded across recent sessions</p>
              </div>
              <button
                type="button"
                onClick={fetchHistory}
                className="btn-icon-subtle"
                title="Refresh"
              >
                <RefreshCw size={15} />
              </button>
            </div>

            <div className="chart-canvas-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis dataKey="name" stroke="var(--text-subtle)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-subtle)" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--panel-bg)',
                      borderColor: 'var(--panel-border)',
                      borderRadius: '0.75rem',
                      color: 'var(--text-main)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#activityGrad)"
                    name="Papers"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Complexity Distribution */}
          <div className="dashboard-chart-card">
            <div className="chart-card-header">
              <div>
                <h3 className="chart-card-title">
                  <Layers size={17} color="var(--primary-indigo)" />
                  <span>Complexity Breakdown</span>
                </h3>
                <p className="chart-card-sub">Categorized by academic rigor</p>
              </div>
            </div>

            <div className="chart-canvas-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={complexityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis dataKey="name" stroke="var(--text-subtle)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-subtle)" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--panel-bg)',
                      borderColor: 'var(--panel-border)',
                      borderRadius: '0.75rem',
                      color: 'var(--text-main)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Papers">
                    {complexityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Paper History & Explorer */}
        <div className="dashboard-history-card">
          <div className="history-header">
            <div>
              <h2 className="history-heading">
                <FileText size={18} color="var(--primary-blue)" />
                <span>Analyzed Paper History</span>
              </h2>
              <p className="history-sub">
                Past research documents securely stored in your personal cloud vault
              </p>
            </div>

            <div className="history-search-wrapper">
              <Search size={15} className="history-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search paper title or summary..."
                className="history-search-input"
              />
            </div>
          </div>

          {/* Papers List */}
          {loading ? (
            <div className="dashboard-loading-box">
              <div className="auth-spinner" style={{ width: '28px', height: '28px', margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Retrieving your research documents from cloud vault...
              </p>
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="history-empty-state">
              <FileText size={44} color="var(--text-subtle)" style={{ margin: '0 auto 12px auto', opacity: 0.6 }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                {searchQuery ? 'No papers matched your search filter' : 'No research papers analyzed yet'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 18px auto' }}>
                {searchQuery
                  ? 'Try searching with different keywords or clear the search input.'
                  : 'Upload an academic PDF to generate executive summaries, key findings, and interactive verification.'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={onNewUpload}
                  className="btn-dashboard-primary"
                >
                  <UploadCloud size={16} />
                  <span>Analyze Your First Paper</span>
                </button>
              )}
            </div>
          ) : (
            <div className="history-table-list">
              {filteredPapers.map((paper) => {
                const dateStr = new Date(paper.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const sizeKb = paper.file_size_bytes
                  ? (paper.file_size_bytes / 1024).toFixed(0) + ' KB'
                  : 'PDF';
                const score = Number(paper.complexity_score) ? Math.round(Number(paper.complexity_score)) : 65;

                return (
                  <div key={paper.id} className="history-item">
                    <div className="history-item-left">
                      <div className="history-item-meta-row">
                        <span className="history-item-title" title={paper.file_name}>
                          {paper.file_name}
                        </span>
                        
                        <span className="history-score-badge">
                          Score {score}/100
                        </span>

                        <span className="history-meta-text">
                          <Calendar size={13} />
                          <span>{dateStr}</span>
                        </span>

                        <span className="history-meta-text">
                          &bull; {sizeKb}
                        </span>
                      </div>

                      {paper.summary && (
                        <p className="history-item-summary">
                          {paper.summary}
                        </p>
                      )}
                    </div>

                    <div className="history-item-actions">
                      <button
                        type="button"
                        onClick={() => onOpenAnalysis(paper)}
                        className="btn-studio-open"
                        title="Reopen in Studio without re-running analysis"
                      >
                        <ExternalLink size={14} />
                        <span>Open in Studio</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(paper)}
                        disabled={deletingId === paper.id}
                        className="btn-item-delete"
                        title="Delete paper record"
                      >
                        {deletingId === paper.id ? (
                          <div className="auth-spinner" style={{ width: '14px', height: '14px' }} />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
