import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LogIn, UserPlus, X, Mail, Lock, AlertCircle, CheckCircle,
  ArrowRight, Sparkles, Check, FileText, BarChart3, TrendingUp, Brain
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AuthModal({ onAuthSuccess }) {
  const {
    isAuthModalOpen,
    authReason,
    authRedirectTarget,
    closeAuthModal,
    signInWithEmail,
    signUpWithEmail,
    resetPassword
  } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSuccessAnim, setIsSuccessAnim] = useState(false);

  if (!isAuthModalOpen) return null;

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b'],
      });
    } catch (e) {
      console.warn('Confetti effect ignored:', e);
    }
  };

  const executeSuccessfulAuth = (targetDest) => {
    setIsSuccessAnim(true);
    triggerCelebration();

    setTimeout(() => {
      setIsSuccessAnim(false);
      closeAuthModal();
      if (onAuthSuccess) {
        onAuthSuccess(targetDest || authRedirectTarget || 'dashboard');
      }
    }, 1800);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Please enter your email address');
      return;
    }

    if (mode === 'forgot') {
      try {
        setLoading(true);
        await resetPassword(email);
        setSuccessMsg('Password reset instructions sent to your email.');
      } catch (err) {
        setErrorMsg(err.message || 'Failed to send reset email');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        executeSuccessfulAuth(authRedirectTarget);
      } else if (mode === 'signup') {
        const res = await signUpWithEmail(email, password);
        if (res.user && !res.session) {
          triggerCelebration();
          setSuccessMsg('Account created successfully! Check your email to verify if required, or sign in now.');
          setMode('signin');
        } else {
          executeSuccessfulAuth(authRedirectTarget);
        }
      }
    } catch (err) {
      const msg = err.message || 'Authentication error';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setErrorMsg('Invalid credentials. If you haven\'t created an account yet, switch to Sign Up above!');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const targetName = authRedirectTarget === 'analyzer' ? 'Analyzer Studio' : 'User Dashboard';

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal}>
      {/* 1. Dynamic Floating Research & Chart Celebration Overlay */}
      {isSuccessAnim ? (
        <div className="auth-celebration-container animate-fadeIn" onClick={(e) => e.stopPropagation()}>
          
          {/* Floating Element 1: Research Paper Card */}
          <div className="floating-card float-paper">
            <div className="floating-card-header">
              <FileText size={16} color="#38bdf8" />
              <span className="floating-card-title">arXiv:2403.1189</span>
            </div>
            <div className="floating-paper-bars">
              <div className="paper-line full" />
              <div className="paper-line mid" />
              <div className="paper-line short" />
            </div>
            <div className="floating-card-tag">Rigor 9.2/10</div>
          </div>

          {/* Floating Element 2: Live Analysis Chart Card */}
          <div className="floating-card float-chart">
            <div className="floating-card-header">
              <BarChart3 size={16} color="#818cf8" />
              <span className="floating-card-title">Analysis Velocity</span>
            </div>
            <div className="floating-chart-bars">
              <div className="chart-col col-1" />
              <div className="chart-col col-2" />
              <div className="chart-col col-3" />
              <div className="chart-col col-4" />
            </div>
            <div className="floating-card-tag green">+340% Speedup</div>
          </div>

          {/* Floating Element 3: Key Insights Node */}
          <div className="floating-card float-insights">
            <div className="floating-card-header">
              <Brain size={16} color="#ec4899" />
              <span className="floating-card-title">Concepts Extracted</span>
            </div>
            <span className="floating-metric-val">18 Findings</span>
          </div>

          {/* Floating Formula Badge */}
          <div className="floating-chip float-formula">
            <span>∑ Insight(x) &bull; λ=0.98</span>
          </div>

          {/* Central Success Card */}
          <div className="auth-success-card animate-scaleUp">
            <div className="success-icon-halo">
              <Check size={36} strokeWidth={2.8} />
            </div>

            <h2 className="success-heading">
              {mode === 'signup' ? 'Account Created!' : 'Login Successful!'}
            </h2>

            <p className="success-user-text">
              Welcome, <span className="highlight-gradient">{email.split('@')[0]}</span>
            </p>

            <div className="redirect-notice">
              <Sparkles size={14} color="#818cf8" />
              <span>Redirecting to your <strong>{targetName}</strong>...</span>
            </div>

            {/* Smooth animated progress bar */}
            <div className="redirect-progress-track">
              <div className="redirect-progress-fill" />
            </div>
          </div>
        </div>
      ) : (
        /* 2. Standard Auth Form Card */
        <div 
          className="auth-modal-card"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ambient Glows */}
          <div className="auth-modal-glow auth-glow-1" />
          <div className="auth-modal-glow auth-glow-2" />

          {/* Close Button */}
          <button
            type="button"
            onClick={closeAuthModal}
            className="auth-modal-close"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="auth-modal-header">
            <div className="auth-modal-icon-badge">
              <Sparkles size={22} />
            </div>
            <h2 className="auth-modal-title">
              {mode === 'signin' && 'Welcome Back'}
              {mode === 'signup' && 'Create Your Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
            <p className="auth-modal-subtitle">
              {authReason ? (
                <span className="auth-reason-banner">
                  {authReason}
                </span>
              ) : (
                mode === 'signin' 
                  ? 'Sign in to access your analyzed papers and workspace'
                  : mode === 'signup'
                  ? 'Sign up to analyze research papers and save your reading history'
                  : 'Enter your email to receive recovery instructions'
              )}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          {mode !== 'forgot' && (
            <div className="auth-tabs">
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              >
                <UserPlus size={15} />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          {/* Error / Success Notifications */}
          {errorMsg && (
            <div className="auth-alert-box error">
              <AlertCircle size={16} className="shrink-0" />
              <div style={{ flex: 1 }}>
                <span>{errorMsg}</span>
                {errorMsg.includes('Invalid credentials') && mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setErrorMsg(''); }}
                    style={{
                      display: 'block',
                      marginTop: '6px',
                      color: '#60a5fa',
                      textDecoration: 'underline',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}
                  >
                    Click here to Create an Account &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert-box success">
              <CheckCircle size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label className="auth-label">
                Email Address
              </label>
              <div className="auth-input-wrapper">
                <Mail size={16} className="auth-input-icon" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="researcher@university.edu"
                  className="auth-input"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="auth-form-group">
                <div className="auth-label-row">
                  <label className="auth-label">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="auth-forgot-link"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="auth-input"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="auth-form-group">
                <label className="auth-label">
                  Confirm Password
                </label>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="auth-input"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? (
                <div className="auth-spinner" />
              ) : (
                <>
                  <span>
                    {mode === 'signin' && 'Sign In to Workspace'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot' && 'Send Reset Instructions'}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {mode === 'forgot' && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                className="auth-forgot-link"
              >
                Back to Sign In
              </button>
            </div>
          )}

          <div className="auth-modal-footer">
            <p>Protected by End-to-End Encryption &bull; Cloud Vault Storage</p>
          </div>
        </div>
      )}
    </div>
  );
}
