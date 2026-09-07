import React, { useState } from 'react';
import Hero3DCanvas from './Hero3DCanvas';
import {
  Sparkles,
  ArrowRight,
  Upload,
  Layers,
  FileText,
  Compass,
  AlertOctagon,
  BookOpen,
  CheckCircle2,
  Cpu,
  GraduationCap,
  Microscope,
  Award,
  ChevronRight,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LandingPage({
  onLaunchUpload,
  onOpenAnalyzer,
  theme,
  onToggleTheme,
}) {

  const [selectedPersona, setSelectedPersona] = useState('researchers');
  const [activePreviewTab, setActivePreviewTab] = useState('summary');
  const [dragActive, setDragActive] = useState(false);

  const personas = {
    students: {
      title: 'Master Thesis & PhD Candidates',
      tagline: 'Draft thesis literature reviews in minutes, not weeks.',
      desc: 'Quickly dissect 50+ papers for your dissertation, isolate author-acknowledged research gaps to formulate your research proposal, and cite seminal works accurately.',
      metric: 'Save ~18 Hours',
      metricSub: 'per comprehensive literature review',
      highlights: [
        'Instant executive summaries for thesis chapters',
        'Automatic extraction of open research gaps',
        'Seminal citation ranking for bibliography building',
      ],
    },
    researchers: {
      title: 'Academic & Postdoc Researchers',
      tagline: 'Spot methodology flaws and theoretical frontiers effortlessly.',
      desc: 'Deconstruct experimental baselines, mathematical loss equations, and dataset sampling biases to benchmark your novel contributions against peer-reviewed state of the art.',
      metric: '3.2s Synthesis',
      metricSub: 'end-to-end multi-section extraction',
      highlights: [
        '4-Pillar methodology architecture breakdowns',
        'Categorized limitations: Data, Method & Scope gaps',
        'Future research roadmap generation for grant proposals',
      ],
    },
    faculty: {
      title: 'Professors & University Faculty',
      tagline: 'Prepare seminar briefings and peer-review briefs in one click.',
      desc: 'Generate publication-grade A4 evaluation reports formatted for departmental reading groups, curriculum synthesis, and rapid assessment of newly submitted manuscripts.',
      metric: 'Publication-Grade',
      metricSub: 'A4 peer-review ready PDF exports',
      highlights: [
        'Clean A4 evaluation briefs with exact mathematical bounds',
        'Section word density and structural complexity metrics',
        'Zero tracking: 100% privacy-first client-side rendering',
      ],
    },
    labs: {
      title: 'R&D Teams & Industry Labs',
      tagline: 'Evaluate patent literature and algorithm reproducibility fast.',
      desc: 'Filter corporate vs academic benchmarks, verify hardware requirements, and assess scalability bottlenecks before committing expensive GPU cluster training runs.',
      metric: '10x Velocity',
      metricSub: 'accelerating patent and paper triage',
      highlights: [
        'Comparative corporate vs academic evaluation',
        'KV-cache and complexity bottleneck identification',
        'Extracted concept embeddings with relevance percentages',
      ],
    },
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      triggerConfetti();
      onLaunchUpload(e.dataTransfer.files[0]);
    }
  };


  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#818cf8', '#34d399', '#c084fc'],
      });
    } catch {
      // Graceful fallback
    }
  };


  return (
    <div className="landing-page-root">
      {/* 1. HERO SECTION WITH 3D CANVAS */}
      <section className="landing-hero-container">
        {/* Glow backdrop spots */}
        <div className="hero-glow-spot hero-glow-spot-1" />
        <div className="hero-glow-spot hero-glow-spot-2" />

        <div className="landing-hero-grid">
          {/* Left Column: Typography & CTAs */}
          <div className="hero-content-col">
            <div className="badge-pill-futuristic">
              <img
                src="/logo-icon.png"
                alt="ScholarPulse AI"
                style={{ width: '22px', height: '22px', borderRadius: '6px', objectFit: 'cover' }}
              />
              <span className="badge-pill-text-long">ScholarPulse AI — Read Less • Understand More • Research Better</span>
              <span className="badge-pill-text-short">ScholarPulse AI Research Engine</span>
            </div>

            <h1 className="hero-display-title">
              Deconstruct Academic Papers into <span className="text-gradient-vibe">Actionable Insights</span>
            </h1>

            <p className="hero-lead-description">
              An enterprise AI research intelligence platform that parses academic PDFs into
              executive summaries, 4-pillar methodology breakdowns, critical research gaps, and
              foundational citation hierarchies in seconds.
            </p>

            {/* Persona Switcher Bar */}
            <div className="persona-nav-strip">
              <span className="persona-nav-label">Tailored for:</span>
              <div className="persona-pills-row">
                {Object.keys(personas).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPersona(key)}
                    className={`persona-pill-btn ${selectedPersona === key ? 'active' : ''}`}
                  >
                    {key === 'students' && <GraduationCap size={14} />}
                    {key === 'researchers' && <Microscope size={14} />}
                    {key === 'faculty' && <BookOpen size={14} />}
                    {key === 'labs' && <Cpu size={14} />}
                    <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Persona Card */}
            <div className="persona-dynamic-card">
              <div className="persona-card-header">
                <div>
                  <h4 className="persona-card-title">{personas[selectedPersona].title}</h4>
                  <div className="persona-card-tagline">{personas[selectedPersona].tagline}</div>
                </div>
                <div className="persona-metric-badge">
                  <div className="p-metric-val">{personas[selectedPersona].metric}</div>
                  <div className="p-metric-sub">{personas[selectedPersona].metricSub}</div>
                </div>
              </div>

              <div className="persona-highlights-list">
                {personas[selectedPersona].highlights.map((h, i) => (
                  <div key={i} className="persona-highlight-item">
                    <CheckCircle2 size={15} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action CTAs */}
            <div className="hero-cta-cluster">
              <button
                type="button"
                onClick={onOpenAnalyzer}
                className="btn-vibe-primary"
              >
                <Upload size={18} />
                <span>Launch Paper Analyzer</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => {
                  document.getElementById('features-bento')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-vibe-secondary"
              >
                <Sparkles size={16} style={{ color: 'var(--primary-blue)' }} />
                <span>Explore Capabilities</span>
              </button>
            </div>

            {/* Supported Corpus Sources Strip */}
            <div className="supported-corpus-strip">
              <span className="corpus-label">Ingests all standard academic PDF formats:</span>
              <div className="corpus-logos">
                <span className="corpus-tag">arXiv</span>
                <span className="corpus-tag">IEEE Xplore</span>
                <span className="corpus-tag">Nature</span>
                <span className="corpus-tag">ACM Digital Library</span>
                <span className="corpus-tag">Springer</span>
                <span className="corpus-tag">PubMed</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Holographic Stage */}
          <div className="hero-3d-col">
            <div className="hero-3d-card-frame">
              <Hero3DCanvas />
            </div>
          </div>
        </div>
      </section>


      {/* 2. LIVE INTERACTIVE METRICS BANNER */}
      <section className="stats-strip-container">
        <div className="stats-grid">
          <div className="stat-item-card">
            <div className="stat-number">3.2s</div>
            <div className="stat-label">Average Analysis Speed</div>
            <div className="stat-sub">High-velocity document comprehension & synthesis</div>
          </div>

          <div className="stat-item-card">
            <div className="stat-number">99.4%</div>
            <div className="stat-label">Structural Section Accuracy</div>
            <div className="stat-sub">Automated section extraction & text breakdown</div>
          </div>

          <div className="stat-item-card">
            <div className="stat-number">100%</div>
            <div className="stat-label">Privacy-First Architecture</div>
            <div className="stat-sub">Direct in-browser report generation with zero tracking</div>
          </div>

          <div className="stat-item-card">
            <div className="stat-number">4-Pillar</div>
            <div className="stat-label">Deep Methodology Deconstruction</div>
            <div className="stat-sub">Corpus, experimental setup, classification, & math formulations</div>
          </div>
        </div>
      </section>

      {/* 3. 3D BENTO GRID — PRODUCT CAPABILITIES */}
      <section id="features-bento" className="bento-showcase-section">
        <div className="section-header-centered">
          <div className="badge-pill-small">PRODUCT CAPABILITIES</div>
          <h2 className="section-title-large">
            Engineered For Rigorous <span className="text-gradient-vibe">Academic Discovery</span>
          </h2>
          <p className="section-subtitle">
            ScholarPulse bridges the gap between raw PDF documents and high-leverage intellectual insight.
          </p>
        </div>

        <div className="bento-grid">
          {/* Card 1: Executive Summary */}
          <div className="bento-card bento-span-2">
            <div className="bento-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <FileText size={24} />
            </div>
            <h3 className="bento-title">High-Fidelity Executive Synthesis</h3>
            <p className="bento-description">
              Extracts the exact core problem, methodology architecture, and quantitative benchmark results in a dense 150-200 word brief tailored for rapid academic consumption.
            </p>
            <div className="bento-preview-box">
              <div className="bento-quote-bar" />
              <div className="bento-quote-text">
                "Introduces an optimized self-attention architecture within a six-layer encoder-decoder framework on WMT 2014, establishing 28.4 BLEU with O(N) memory efficiency..."
              </div>
            </div>
          </div>

          {/* Card 2: 4-Pillar Methodology */}
          <div className="bento-card">
            <div className="bento-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <Layers size={24} />
            </div>
            <h3 className="bento-title">4-Pillar Methodology</h3>
            <p className="bento-description">
              Deconstructs experimental setup into Dataset Corpus, Baselines, Risk Classification, and Mathematical Formulations.
            </p>
            <div className="bento-mini-tags">
              <span className="mini-tag">Corpus Size</span>
              <span className="mini-tag">Loss Equations</span>
              <span className="mini-tag">Ablation Controls</span>
            </div>
          </div>

          {/* Card 3: Research Gaps & Limitations */}
          <div className="bento-card">
            <div className="bento-icon-wrapper" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
              <AlertOctagon size={24} />
            </div>
            <h3 className="bento-title">Zero-Shot Gap Extraction</h3>
            <p className="bento-description">
              Isolates formal author-acknowledged limitations from unaddressed open research questions with automatic badge classification.
            </p>
            <div className="bento-mini-badges">
              <span className="badge-limitation">Critical Limitation</span>
              <span className="badge-gap">Methodological Gap</span>
              <span className="badge-scope">Scope Constraint</span>
            </div>
          </div>

          {/* Card 4: Seminal Citations */}
          <div className="bento-card bento-span-2">
            <div className="bento-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Award size={24} />
            </div>
            <h3 className="bento-title">Foundational Citation Hierarchy</h3>
            <p className="bento-description">
              Ranks references by foundational centrality rather than incidental mention. Identifies the seminal works that form the paper's intellectual bedrock with calibrated impact percentages.
            </p>
            <div className="bento-ref-preview">
              <div className="bento-ref-row">
                <span className="ref-rank-badge">#1</span>
                <span className="ref-name">Vaswani et al. (2017) — Attention Is All You Need</span>
                <span className="ref-score-badge">98.0%</span>
              </div>
              <div className="bento-ref-row">
                <span className="ref-rank-badge">#2</span>
                <span className="ref-name">Bahdanau et al. (2014) — Neural Machine Translation</span>
                <span className="ref-score-badge">91.5%</span>
              </div>
            </div>
          </div>

          {/* Card 5: Publication-Grade PDF */}
          <div className="bento-card bento-span-3">
            <div className="bento-split-content">
              <div>
                <div className="bento-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <Download size={24} />
                </div>
                <h3 className="bento-title">Publication-Grade A4 Evaluation Briefs</h3>
                <p className="bento-description" style={{ maxWidth: '540px' }}>
                  Download professionally formatted, mathematically bounded A4 evaluation reports complete with running headers, exact page budgets, methodology tables, and citation appendices ready for faculty reviews, lab seminars, and thesis citations.
                </p>
                <div className="bento-pdf-features">
                  <span className="pdf-f-pill">✓ Standard A4 Layout</span>
                  <span className="pdf-f-pill">✓ Clean Typography & Formatting</span>
                  <span className="pdf-f-pill">✓ Multi-Page Precision</span>
                  <span className="pdf-f-pill">✓ Peer-Review Ready</span>
                </div>
              </div>
              <div className="bento-pdf-illustration">
                <div className="mini-paper-preview">
                  <div className="m-paper-header" />
                  <div className="m-paper-line" style={{ width: '85%' }} />
                  <div className="m-paper-line" style={{ width: '70%' }} />
                  <div className="m-paper-box" />
                  <div className="m-paper-table" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE SANDBOX PREVIEW */}
      <section className="sandbox-preview-section">
        <div className="section-header-centered">
          <div className="badge-pill-small">INTERACTIVE SANDBOX</div>
          <h2 className="section-title-large">
            Inspect Real Synthesis <span className="text-gradient-vibe">Live</span>
          </h2>
          <p className="section-subtitle">
            Explore how ScholarPulse categorizes the landmark <em>Attention Is All You Need</em> Transformer manuscript.
          </p>
        </div>

        <div className="sandbox-glass-card">
          {/* Tabs header */}
          <div className="sandbox-tab-strip">
            <button
              type="button"
              onClick={() => setActivePreviewTab('summary')}
              className={`sandbox-tab-btn ${activePreviewTab === 'summary' ? 'active' : ''}`}
            >
              <FileText size={15} />
              <span>Summary</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewTab('methodology')}
              className={`sandbox-tab-btn ${activePreviewTab === 'methodology' ? 'active' : ''}`}
            >
              <Layers size={15} />
              <span>Methodology (4 Pillars)</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewTab('gaps')}
              className={`sandbox-tab-btn ${activePreviewTab === 'gaps' ? 'active' : ''}`}
            >
              <AlertOctagon size={15} />
              <span>Limitations & Gaps</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewTab('future')}
              className={`sandbox-tab-btn ${activePreviewTab === 'future' ? 'active' : ''}`}
            >
              <Compass size={15} />
              <span>Future Directions</span>
            </button>
          </div>

          {/* Tab content area */}
          <div className="sandbox-tab-body">
            {activePreviewTab === 'summary' && (
              <div className="sandbox-pane">
                <div className="pane-lead">
                  This landmark paper introduces the Transformer, a novel neural network architecture based entirely on self-attention mechanisms, discarding recurrent and convolutional networks. By relying on multi-head attention to compute representations of input and output sequences without sequential recurrent steps, the Transformer allows for significantly greater parallelization and establishes a new state of the art in translation quality (28.4 BLEU on English-to-German) with dramatically reduced training time.
                </div>
                <div className="pane-stats-row">
                  <div className="p-stat"><span>Complexity Index:</span> <strong>78 / 100</strong></div>
                  <div className="p-stat"><span>Est. Reading Time:</span> <strong>29 mins</strong></div>
                  <div className="p-stat"><span>Corpus Scale:</span> <strong>6,420 words (15 pages)</strong></div>
                </div>
              </div>
            )}

            {activePreviewTab === 'methodology' && (
              <div className="sandbox-method-grid">
                <div className="s-method-card">
                  <div className="s-method-badge">PILLAR 1: CORPUS</div>
                  <h5>Dataset Construction</h5>
                  <p>Synthesizes a benchmark dataset of 4.5M sentence pairs from WMT 2014 English-German and 36M pairs for English-French, evaluated against academic baselines.</p>
                </div>
                <div className="s-method-card">
                  <div className="s-method-badge">PILLAR 2: ARCHITECTURE</div>
                  <h5>Experimental Setup & Controls</h5>
                  <p>6-layer encoder and decoder stacks utilizing 8 parallel attention heads (d_k = 64) with sinusoidal positional encodings and residual connections.</p>
                </div>
                <div className="s-method-card">
                  <div className="s-method-badge">PILLAR 3: ALGORITHM</div>
                  <h5>Mathematical Attention Equations</h5>
                  <p>Scaled Dot-Product Attention: Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V, counteracting vanishing gradients in large dimensional spaces.</p>
                </div>
                <div className="s-method-card">
                  <div className="s-method-badge">PILLAR 4: EVALUATION</div>
                  <h5>Regression & Reliability</h5>
                  <p>Analyzed BLEU score stability against sequence length degradation, demonstrating sustained accuracy beyond recurrent LSTM capacity.</p>
                </div>
              </div>
            )}

            {activePreviewTab === 'gaps' && (
              <div className="sandbox-gaps-list">
                <div className="s-gap-card">
                  <span className="badge-limitation">Critical Limitation</span>
                  <h5>Quadratic Time and Memory Complexity</h5>
                  <p>Self-attention matrix computation scales O(N^2) with context length N, constraining applications to long-form document synthesis.</p>
                </div>
                <div className="s-gap-card">
                  <span className="badge-scope">Scope Constraint</span>
                  <h5>Context Window Extrapolation Limits</h5>
                  <p>Sinusoidal encodings exhibit fidelity degradation when evaluation sequence length exceeds training sequence boundaries.</p>
                </div>
                <div className="s-gap-card">
                  <span className="badge-gap">Methodological Gap</span>
                  <h5>Autoregressive Decoding Bottleneck</h5>
                  <p>Sequential generation remains bounded during inference, failing to exploit GPU tensor core parallelization during token decoding.</p>
                </div>
              </div>
            )}

            {activePreviewTab === 'future' && (
              <div className="sandbox-scope-list">
                <div className="s-scope-row">
                  <span className="s-scope-num">01</span>
                  <div>
                    <h6>Linear & Sparse Attention Architectures</h6>
                    <p>Sub-quadratic attention mechanisms (e.g. FlashAttention, Linformer) designed to scale to 1M+ token context windows.</p>
                  </div>
                </div>
                <div className="s-scope-row">
                  <span className="s-scope-num">02</span>
                  <div>
                    <h6>Universal Multi-Modal Pre-Training</h6>
                    <p>Extending multi-head self-attention mechanisms to image patches, spectrogram audio representations, and structured AST code.</p>
                  </div>
                </div>
                <div className="s-scope-row">
                  <span className="s-scope-num">03</span>
                  <div>
                    <h6>Hardware-Aware KV-Cache Quantization</h6>
                    <p>4-bit and 8-bit key-value cache compression techniques to alleviate the autoregressive inference memory bandwidth wall.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sandbox Footer Action */}
          <div className="sandbox-footer-bar">
            <div className="s-footer-hint">
              <Sparkles size={15} style={{ color: 'var(--primary-blue)' }} />
              <span>Synthesize identical publication-grade insights from your own research papers.</span>
            </div>
            <button
              type="button"
              onClick={onOpenAnalyzer}
              className="btn-vibe-primary"
              style={{ padding: '8px 18px', fontSize: '0.86rem' }}
            >
              <Upload size={15} />
              <span>Analyze Your Research Paper</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* 5. DRAG-AND-DROP CALL TO ACTION CARD */}
      <section className="landing-cta-section">
        <div
          className={`cta-dropzone-card ${dragActive ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="cta-content">
            <div className="cta-icon-orb">
              <Upload size={32} />
            </div>
            <h2 className="cta-title">
              Ready To Accelerate Your <span className="text-gradient-vibe">Research Velocity</span>?
            </h2>
            <p className="cta-subtitle">
              Drop any academic PDF here or click below to launch the analysis environment. Zero account required.
            </p>

            <div className="cta-buttons-row">
              <button
                type="button"
                onClick={onOpenAnalyzer}
                className="btn-vibe-primary"
              >
                <Upload size={18} />
                <span>Upload Research Paper</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LANDING FOOTER */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="brand-logo-small">
              <img
                src="/logo-icon.png"
                alt="ScholarPulse AI"
                style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover' }}
              />
              <span>ScholarPulse AI</span>
            </div>
            <p className="footer-tagline">
              Enterprise AI research synthesis engine for researchers, students, and educators.
            </p>
          </div>

          <div className="footer-links-row">
            <button type="button" onClick={onOpenAnalyzer} className="footer-link-btn">
              Analyzer Workspace
            </button>
            <button type="button" onClick={onToggleTheme} className="footer-link-btn">
              {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            </button>
          </div>
        </div>

        <div className="footer-sub-bottom">
          ScholarPulse AI © 2026 — Enterprise Research Paper Analyzer. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

