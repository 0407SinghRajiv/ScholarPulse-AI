import React, { useState } from 'react';
import { Upload, Sparkles, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FileUpload({ onFileUpload, loading }) {
  const { user, openAuthModal } = useAuth();
  const [dragActive, setDragActive] = useState(false);

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

    if (!user) {
      openAuthModal('Please sign in or create an account to upload and analyze research papers.');
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleClickZone = () => {
    if (!user) {
      openAuthModal('Please sign in or create an account to upload and analyze research papers.');
      return;
    }
    const input = document.getElementById('pdf-input');
    if (input) input.click();
  };

  const handleFileChange = (e) => {
    if (!user) {
      openAuthModal('Please sign in or create an account to upload and analyze research papers.');
      return;
    }
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-pill-bar">
        <Sparkles size={16} style={{ color: 'var(--primary-blue)' }} />
        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Instant AI Research Paper Analysis & Gap Identification</span>
      </div>

      <h1 className="hero-title">
        Extract Insights From <span className="highlight-blue">Research Papers</span>
      </h1>

      <p className="hero-subtitle">
        Upload any academic paper PDF to get instant executive summaries, methodology breakdowns,
        formal limitations, research gaps, future scopes, and foundational reference rankings.
      </p>

      {/* Auth Status Notification / Upload Guard */}
      {!user && (
        <div className="auth-upload-banner">
          <Lock size={15} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
          <span>Sign in to analyze and store research papers in your workspace.</span>
          <button
            type="button"
            className="auth-upload-link"
            onClick={() => openAuthModal('Please sign in or create an account to proceed.', 'analyzer')}
          >
            Sign In / Register &rarr;
          </button>
        </div>
      )}

      <div
        className={`upload-zone ${dragActive ? 'drag-active' : ''} ${!user ? 'upload-zone-locked' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickZone}
      >
        <input
          type="file"
          id="pdf-input"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={loading}
          className="file-input-hidden"
        />

        <div className="upload-icon-circle">
          {user ? <Upload size={32} /> : <Lock size={32} />}
        </div>

        <div className="upload-prompt-text">
          {user ? 'Drop your research paper PDF here or click to browse' : 'Sign in to upload & analyze research papers'}
        </div>
        <div className="upload-hint">
          {user 
            ? 'Supports arXiv, IEEE, ACM, Springer, Nature & standard PDF formats'
            : 'Click here to sign in or create a free research account'}
        </div>
      </div>
    </section>
  );
}
