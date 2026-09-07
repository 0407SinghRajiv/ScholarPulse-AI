import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Layers,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
  User,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({
  theme,
  onToggleTheme,
  viewMode = 'landing',
  onViewModeChange,
  hasData = false,
}) {
  const { user, signOut, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on Escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleNavigate = (mode) => {
    if (onViewModeChange) onViewModeChange(mode);
    setMobileMenuOpen(false);
  };

  const handleOpenDashboard = () => {
    if (!user) {
      openAuthModal('Sign in to view your research paper dashboard and history.');
    } else {
      handleNavigate('dashboard');
    }
  };

  return (
    <>
      <header className="header glass-panel">
        <div
          className="logo-group"
          onClick={() => handleNavigate('landing')}
          style={{ cursor: 'pointer' }}
          title="Go to Home"
        >
          <div className="brand-logo-frame">
            <img
              src="/logo-icon.png"
              alt="ScholarPulse AI Logo"
              className="brand-logo-img"
            />
          </div>
          <div>
            <h1 className="brand-title">ScholarPulse AI</h1>
            <p className="brand-tagline">Read Less • Understand More • Research Better</p>
          </div>
        </div>

        {/* Desktop Navigation Pills */}
        <nav className="nav-pills desktop-only-nav" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-pill-btn ${viewMode === 'landing' ? 'active' : ''}`}
            onClick={() => handleNavigate('landing')}
          >
            <Layers size={16} />
            <span>Home</span>
          </button>

          <button
            type="button"
            className={`nav-pill-btn ${viewMode === 'analyzer' ? 'active' : ''}`}
            onClick={() => handleNavigate('analyzer')}
          >
            <FileText size={16} />
            <span>Analyzer Studio</span>
            {hasData && (
              <span
                className="nav-pill-dot"
                title="Active paper analysis in session"
              />
            )}
          </button>

          <button
            type="button"
            className={`nav-pill-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
            onClick={handleOpenDashboard}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
        </nav>

        {/* Header Right Actions */}
        <div className="header-actions">
          <div className="pill-version-badge desktop-only-badge">
            <span>AI RESEARCH ENGINE</span>
            <span className="free-tag">ACTIVE</span>
          </div>

          <button
            type="button"
            className="btn-theme-toggle"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle dark/light theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            <span className="theme-toggle-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>

          {/* Desktop User Auth Section */}
          <div className="desktop-only-auth">
            {user ? (
              <div className="user-profile-menu">
                <button
                  type="button"
                  className="user-profile-chip animate-fadeIn"
                  onClick={() => handleNavigate('dashboard')}
                  title={`Logged in as ${user.email}`}
                >
                  <div className="user-avatar-circle">
                    <User size={13} />
                  </div>
                  <span className="user-chip-email">{user.email?.split('@')[0]}</span>
                  <span className="pulsing-live-dot" style={{ width: '7px', height: '7px' }} />
                </button>
                <button
                  type="button"
                  className="btn-signout"
                  onClick={signOut}
                  title="Sign Out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-signin"
                onClick={() => openAuthModal('Sign in to analyze and store research papers')}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className={`header-hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer & Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-backdrop animate-fadeIn"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="mobile-nav-drawer animate-slideDown"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-nav-header">
              <div className="mobile-nav-brand">
                <img
                  src="/logo-icon.png"
                  alt="Logo"
                  className="mobile-nav-brand-img"
                />
                <div>
                  <div className="mobile-nav-title">ScholarPulse AI</div>
                  <div className="mobile-nav-sub">AI Research Intelligence</div>
                </div>
              </div>
              <button
                type="button"
                className="mobile-nav-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Navigation"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Items List */}
            <div className="mobile-nav-links">
              <button
                type="button"
                className={`mobile-nav-item ${viewMode === 'landing' ? 'active' : ''}`}
                onClick={() => handleNavigate('landing')}
              >
                <div className="mobile-nav-item-icon">
                  <Layers size={18} />
                </div>
                <div className="mobile-nav-item-label">
                  <span>Home</span>
                  <small>Platform overview & features</small>
                </div>
                <ChevronRight size={16} className="mobile-nav-item-arrow" />
              </button>

              <button
                type="button"
                className={`mobile-nav-item ${viewMode === 'analyzer' ? 'active' : ''}`}
                onClick={() => handleNavigate('analyzer')}
              >
                <div className="mobile-nav-item-icon">
                  <FileText size={18} />
                </div>
                <div className="mobile-nav-item-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Analyzer Studio
                    {hasData && <span className="nav-pill-dot" />}
                  </span>
                  <small>Interactive PDF reader & AI synthesis</small>
                </div>
                <ChevronRight size={16} className="mobile-nav-item-arrow" />
              </button>

              <button
                type="button"
                className={`mobile-nav-item ${viewMode === 'dashboard' ? 'active' : ''}`}
                onClick={handleOpenDashboard}
              >
                <div className="mobile-nav-item-icon">
                  <LayoutDashboard size={18} />
                </div>
                <div className="mobile-nav-item-label">
                  <span>User Dashboard</span>
                  <small>History, reading stats & metrics</small>
                </div>
                <ChevronRight size={16} className="mobile-nav-item-arrow" />
              </button>
            </div>

            {/* Mobile Nav User Section */}
            <div className="mobile-nav-user-section">
              {user ? (
                <div className="mobile-user-card">
                  <div className="mobile-user-info">
                    <div className="user-avatar-circle">
                      <User size={15} />
                    </div>
                    <div className="mobile-user-text">
                      <div className="mobile-user-name">{user.email?.split('@')[0]}</div>
                      <div className="mobile-user-email">{user.email}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-mobile-signout"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-mobile-signin"
                  onClick={() => {
                    openAuthModal('Sign in to analyze and store research papers');
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogIn size={16} />
                  <span>Sign In / Create Account</span>
                </button>
              )}
            </div>

            {/* Mobile Nav Footer */}
            <div className="mobile-nav-footer">
              <div className="pill-version-badge" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
                <span>AI RESEARCH ENGINE</span>
                <span className="free-tag">ONLINE</span>
              </div>
              <div className="mobile-theme-switch-row">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Theme:</span>
                <button
                  type="button"
                  className="btn-theme-toggle-compact"
                  onClick={onToggleTheme}
                >
                  {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                  <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
