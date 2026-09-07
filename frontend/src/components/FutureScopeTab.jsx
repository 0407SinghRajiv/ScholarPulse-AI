import React from 'react';
import { Search } from 'lucide-react';

export default function FutureScopeTab({ futureScope, scopeStructured, onSelectGrounding }) {
  return (
    <div className="glass-panel insight-content-box">
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px' }}>
        Strategic Future Scope & Research Directions
      </h3>

      {scopeStructured && scopeStructured.length > 0 ? (
        <div className="cards-list">
          {scopeStructured.map((item) => (
            <div key={item.id} className="item-card">
              <span className="item-badge badge-scope">
                {item.horizon}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {item.direction}
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

        <div className="summary-card-text">
          {futureScope}
        </div>
      )}
    </div>
  );
}
