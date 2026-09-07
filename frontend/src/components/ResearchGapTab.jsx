import React from 'react';
import { Search } from 'lucide-react';

export default function ResearchGapTab({
  formalLimitations,
  researchGap,
  gapsStructured,
  onSelectGrounding,
}) {
  return (
    <div className="glass-panel insight-content-box">
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px' }}>
        Critical Limitations & Unaddressed Research Gaps
      </h3>

      {gapsStructured && gapsStructured.length > 0 ? (
        <div className="cards-list">
          {gapsStructured.map((gap) => {
            const isCritical = gap.badge.toLowerCase().includes('critical') || gap.badge.toLowerCase().includes('limitation');
            const badgeClass = isCritical ? 'badge-critical' : 'badge-gap';
            return (
              <div key={gap.id} className="item-card">
                <span className={`item-badge ${badgeClass}`}>
                  {gap.badge}
                </span>
                <div style={{ flex: 1 }}>
                  {gap.title && (
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: '4px', fontSize: '1rem' }}>
                      {gap.title}
                    </h4>
                  )}
                  <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {gap.description}
                  </p>

                  {gap.grounding && onSelectGrounding && (
                    <div style={{ marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => onSelectGrounding(gap.grounding)}
                        className="btn-verify-grounding"
                        title={`Jump to Page ${gap.grounding.page} in PDF Split Reader`}
                      >
                        <Search size={13} />
                        <span>Verify in PDF [p. {gap.grounding.page}]</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="summary-card-text">
            <strong>Formal Limitations:</strong>
            <p style={{ marginTop: '8px' }}>{formalLimitations}</p>
          </div>
          <div className="summary-card-text">
            <strong>Research Gaps:</strong>
            <p style={{ marginTop: '8px' }}>{researchGap}</p>
          </div>
        </div>
      )}
    </div>
  );
}

