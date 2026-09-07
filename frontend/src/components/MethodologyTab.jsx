import React from 'react';
import { Search } from 'lucide-react';

export default function MethodologyTab({ methodology, methodStructured, onSelectGrounding }) {
  return (
    <div className="glass-panel insight-content-box">
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px' }}>
        Research Methodology Breakdown
      </h3>

      {methodStructured && methodStructured.length > 0 ? (
        <div className="cards-list">
          {methodStructured.map((item) => (
            <div key={item.id} className="item-card">
              <span className="item-badge badge-scope">
                {item.category}
              </span>
              <div style={{ flex: 1 }}>
                {item.title && (
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: '4px', fontSize: '1rem' }}>
                    {item.title}
                  </h4>
                )}
                <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {item.detail}
                </p>

                {item.grounding && onSelectGrounding && (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => onSelectGrounding(item.grounding)}
                      className="btn-verify-grounding"
                      title={`Jump to Page ${item.grounding.page} in PDF Split Reader`}
                    >
                      <Search size={13} />
                      <span>Verify in PDF [p. {item.grounding.page}]</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="summary-card-text" style={{ whitespace: 'pre-wrap' }}>
          {methodology}
        </div>
      )}
    </div>
  );
}

