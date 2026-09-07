import React from 'react';

export default function ReferencesTab({ importantReferences, referencesStructured }) {
  return (
    <div className="glass-panel insight-content-box">
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px' }}>
        Foundational & Seminal Reference Rankings
      </h3>

      {referencesStructured && referencesStructured.length > 0 ? (
        <div className="cards-list">
          {referencesStructured.map((ref) => (
            <div key={ref.rank} className="item-card">
              <div className="ref-rank-badge">#{ref.rank}</div>
              <div className="ref-text" style={{ flex: 1 }}>{ref.citation}</div>
              <div className="impact-score-pill">Impact {ref.impact_score}%</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="summary-card-text" style={{ whitespace: 'pre-wrap' }}>
          {importantReferences}
        </div>
      )}
    </div>
  );
}
