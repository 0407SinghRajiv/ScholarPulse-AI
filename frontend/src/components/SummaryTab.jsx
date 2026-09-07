import React, { useState } from 'react';
import { Copy, CheckCircle2, Search } from 'lucide-react';

export default function SummaryTab({ summary, summaryGroundings, onSelectGrounding }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel insight-content-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800 }}>
          Executive Summary & Key Synthesis
        </h3>
        <button
          onClick={handleCopy}
          style={{
            background: 'var(--badge-bg)',
            border: '1px solid var(--badge-border)',
            color: 'var(--badge-text)',
            padding: '8px 16px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
          <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
        </button>
      </div>

      <div className="summary-card-text">
        {summary}
      </div>

      {summaryGroundings && summaryGroundings.length > 0 && onSelectGrounding && (
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--panel-border)', paddingTop: '16px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Auditable Evidence from Manuscript:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
            {summaryGroundings.map((g, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectGrounding(g)}
                className="btn-verify-grounding"
                title={`Jump to Page ${g.page}: "${g.quote}"`}
              >
                <Search size={13} />
                <span>Verify Source Excerpt [Page {g.page}]</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

