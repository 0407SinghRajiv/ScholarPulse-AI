import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import FileUpload from './components/FileUpload';
import ProcessingState from './components/ProcessingState';
import MetricsOverview from './components/MetricsOverview';
import TabNavigation from './components/TabNavigation';
import SummaryTab from './components/SummaryTab';
import MethodologyTab from './components/MethodologyTab';
import ResearchGapTab from './components/ResearchGapTab';
import FutureScopeTab from './components/FutureScopeTab';
import ReferencesTab from './components/ReferencesTab';
import PDFExporter from './components/PDFExporter';
import PDFSplitViewer from './components/PDFSplitViewer';
import UserDashboard from './components/UserDashboard';
import AuthModal from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { analyzePDF } from './services/api';
import {
  uploadPaperToStorage,
  saveAnalysisRecord,
  getPaperSignedUrl,
  downloadPaperBlob
} from './services/supabase';
import { AlertTriangle, ArrowLeft, Columns, LayoutDashboard } from 'lucide-react';

function MainApp() {
  const { user, openAuthModal } = useAuth();

  const [viewMode, setViewMode] = useState('landing'); // 'landing' | 'analyzer' | 'dashboard'
  const [data, setData] = useState(null);
  const [uploadedPdfBlobUrl, setUploadedPdfBlobUrl] = useState(null);
  const [uploadedPdfFile, setUploadedPdfFile] = useState(null);
  const [layoutMode, setLayoutMode] = useState('split');
  const [activeGrounding, setActiveGrounding] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleFileUpload = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF research paper file.');
      setViewMode('analyzer');
      return;
    }

    if (!user) {
      openAuthModal('Please sign in or create an account to upload and analyze research papers.');
      return;
    }

    // Create immediate zero-latency local blob URL for embedded PDF reader
    const localBlobUrl = URL.createObjectURL(file);
    setUploadedPdfBlobUrl(localBlobUrl);
    setUploadedPdfFile(file);
    setActiveGrounding(null);
    setLayoutMode('split');

    setError(null);
    setViewMode('analyzer');
    setLoading(true);
    setLoadingStep('Extracting PDF structure & text metadata...');

    try {
      setTimeout(() => setLoadingStep('Extracting semantic concept embeddings...'), 2000);
      setTimeout(() => setLoadingStep('Synthesizing research gaps & open directions...'), 5000);

      // 1. Upload to Supabase Storage in parallel with AI analysis
      let storageFilePath = null;
      try {
        const storageRes = await uploadPaperToStorage(user.id, file);
        if (storageRes?.path) {
          storageFilePath = storageRes.path;
        }
      } catch (storageErr) {
        console.warn('Paper storage upload note:', storageErr);
      }

      // 2. Perform deep analysis via backend
      const result = await analyzePDF(file);
      setData(result);

      // 3. Persist analysis results to Supabase DB
      try {
        await saveAnalysisRecord({
          userId: user.id,
          fileName: file.name,
          filePath: storageFilePath,
          fileSizeBytes: file.size,
          pageCount: result.stats?.page_count || 1,
          complexityScore: result.stats?.complexity_score || 65,
          readTimeMins: result.stats?.estimated_read_time || 5,
          summary: typeof result.summary === 'string' ? result.summary.slice(0, 300) : '',
          fullResult: result,
        });
      } catch (dbErr) {
        console.warn('Database record save note:', dbErr);
      }
    } catch (err) {
      setError(err.message || 'Error connecting to analysis server.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setData(null);
    setError(null);
    setActiveGrounding(null);
    setUploadedPdfFile(null);
    if (uploadedPdfBlobUrl) {
      URL.revokeObjectURL(uploadedPdfBlobUrl);
      setUploadedPdfBlobUrl(null);
    }
  };

  const handleSelectGrounding = (grounding) => {
    if (!grounding) return;
    if (layoutMode !== 'split') {
      setLayoutMode('split');
    }
    setActiveGrounding(grounding);
  };

  // Reopen historical analysis without re-analyzing
  const handleOpenHistoricalAnalysis = async (paperRecord) => {
    if (!paperRecord?.full_result) return;

    setData(paperRecord.full_result);
    setActiveGrounding(null);
    setLayoutMode('split');
    setError(null);

    // Try loading stored PDF if available
    if (paperRecord.file_path) {
      try {
        const blob = await downloadPaperBlob(paperRecord.file_path);
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          setUploadedPdfBlobUrl(blobUrl);
          setUploadedPdfFile(blob);
        } else {
          const signedUrl = await getPaperSignedUrl(paperRecord.file_path);
          if (signedUrl) {
            setUploadedPdfBlobUrl(signedUrl);
            setUploadedPdfFile(null);
          }
        }
      } catch (e) {
        console.warn('Could not restore PDF blob from storage:', e);
      }
    }

    setViewMode('analyzer');
  };

  return (
    <div className={`app-container ${layoutMode === 'split' && data && uploadedPdfBlobUrl ? 'wide-workspace' : ''}`}>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hasData={Boolean(data)}
      />

      <main>
        {/* LOADING PROCESSING STATE OVERLAY */}
        {loading && <ProcessingState stepMessage={loadingStep} />}

        {/* ERROR NOTIFICATION PANEL */}
        {!loading && error && (
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderColor: 'var(--accent-rose)',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--accent-rose)',
              }}
            >
              <AlertTriangle size={22} />
              <strong style={{ fontSize: '1rem' }}>Analysis Error:</strong>
              <span>{error}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'var(--accent-rose)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => setViewMode('landing')}
                style={{
                  background: 'var(--card-inner-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--panel-border)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Return to Home
              </button>
            </div>
          </div>
        )}

        {/* 1. HOME / OVERVIEW VIEW */}
        {!loading && !error && viewMode === 'landing' && (
          <LandingPage
            onLaunchUpload={handleFileUpload}
            onOpenAnalyzer={() => setViewMode('analyzer')}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}

        {/* 2. DASHBOARD VIEW */}
        {!loading && !error && viewMode === 'dashboard' && (
          <UserDashboard
            onOpenAnalysis={handleOpenHistoricalAnalysis}
            onNewUpload={() => setViewMode('analyzer')}
          />
        )}

        {/* 3. ANALYZER STUDIO VIEW */}
        {!loading && !error && viewMode === 'analyzer' && (
          <div>
            {!data && (
              <FileUpload
                onFileUpload={handleFileUpload}
                loading={loading}
              />
            )}

            {data && (
              <div>
                {/* STUDIO TOOLBAR (MODE TOGGLES & PAPER TITLE) */}
                <div className="studio-header-toolbar">
                  <div className="studio-toolbar-actions">
                    <button
                      type="button"
                      onClick={() => setViewMode('landing')}
                      className="action-btn"
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Home</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('dashboard')}
                      className="action-btn"
                    >
                      <LayoutDashboard size={14} />
                      <span>User Dashboard</span>
                    </button>

                    {uploadedPdfBlobUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setLayoutMode((prev) => (prev === 'split' ? 'full' : 'split'))
                        }
                        className="action-btn active-accent"
                      >
                        {layoutMode === 'split' ? (
                          <>
                            <LayoutDashboard size={14} />
                            <span>Full Dashboard</span>
                          </>
                        ) : (
                          <>
                            <Columns size={14} />
                            <span>Split-Screen PDF Reader</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="studio-toolbar-badge" title={data.filename}>
                    <span className="studio-badge-label">Active Paper:</span>
                    <strong className="studio-badge-filename">{data.filename}</strong>
                  </div>
                </div>

                {/* UNIFIED WORKSPACE (SPLIT-SCREEN OR FULL DASHBOARD) */}
                <div
                  className={`analyzer-workspace ${
                    layoutMode === 'split' && (uploadedPdfBlobUrl || uploadedPdfFile)
                      ? 'split-workspace-grid'
                      : 'full-workspace'
                  }`}
                >
                  {/* LEFT PANE: EMBEDDED PDF.JS VIEWER WITH BOUNDING BOXES */}
                  {layoutMode === 'split' && (uploadedPdfBlobUrl || uploadedPdfFile) && (
                    <div className="split-left-column">
                      <PDFSplitViewer
                        pdfUrl={uploadedPdfBlobUrl}
                        pdfFile={uploadedPdfFile}
                        activeGrounding={activeGrounding}
                        onClearGrounding={() => setActiveGrounding(null)}
                        onClose={() => setLayoutMode('full')}
                        filename={data.filename}
                      />
                    </div>
                  )}

                  {/* MAIN INSIGHT STUDIO PANE */}
                  <div className="workspace-main-column">
                    <MetricsOverview
                      stats={data.stats}
                      keywords={data.keywords}
                      filename={data.filename}
                    />

                    <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

                    <div style={{ marginBottom: '32px' }}>
                      {activeTab === 'summary' && (
                        <SummaryTab
                          summary={data.summary}
                          summaryGroundings={data.structured?.summary_groundings}
                          onSelectGrounding={handleSelectGrounding}
                        />
                      )}
                      {activeTab === 'methodology' && (
                        <MethodologyTab
                          methodology={data.methodology}
                          methodStructured={data.structured?.method_structured}
                          onSelectGrounding={handleSelectGrounding}
                        />
                      )}
                      {activeTab === 'gaps' && (
                        <ResearchGapTab
                          formalLimitations={data.formal_limitations}
                          researchGap={data.research_gap}
                          gapsStructured={data.structured?.gaps_structured}
                          onSelectGrounding={handleSelectGrounding}
                        />
                      )}
                      {activeTab === 'future' && (
                        <FutureScopeTab
                          futureScope={data.future_scope}
                          scopeStructured={data.structured?.scope_structured}
                          onSelectGrounding={handleSelectGrounding}
                        />
                      )}
                      {activeTab === 'references' && (
                        <ReferencesTab
                          importantReferences={data.important_references}
                          referencesStructured={data.structured?.references_structured}
                        />
                      )}
                    </div>

                    <PDFExporter data={data} onReset={handleReset} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Authentication Modal */}
      <AuthModal onAuthSuccess={(target) => setViewMode(target || 'dashboard')} />

      <footer
        style={{
          marginTop: '48px',
          textAlign: 'center',
          color: 'var(--text-subtle)',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}
      >
        ScholarPulse AI © 2026 — Enterprise Research Paper Analyzer
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
