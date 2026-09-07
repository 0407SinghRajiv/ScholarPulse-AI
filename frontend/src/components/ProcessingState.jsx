import React from 'react';

export default function ProcessingState({ stepMessage }) {
  return (
    <div className="glass-panel analyzing-box">
      <div className="spinner-glow"></div>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
        Analyzing Research Paper
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
        {stepMessage || 'Extracting PDF structure & generating AI insights...'}
      </p>
    </div>
  );
}
