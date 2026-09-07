import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';

// Configure PDF.js worker URL to use local public static asset
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

/**
 * Individual PDF Page Renderer with proper lifecycle management,
 * High-DPI canvas rendering, and Grounding Bounding Box overlays.
 */
function PDFPageItem({ pageNumber, pdfDoc, scale, activeGrounding }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let isCancelled = false;

    async function render() {
      if (!pdfDoc) return;

      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        setDimensions({
          width: Math.floor(viewport.width),
          height: Math.floor(viewport.height),
        });

        const ctx = canvas.getContext('2d');
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        // Cancel previous render task on this page if still executing
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore
          }
        }

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.warn(`Error rendering page ${pageNumber}:`, err);
        }
      }
    }

    render();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  const hasGrounding = activeGrounding && activeGrounding.page === pageNumber;

  return (
    <div
      id={`pdf-split-page-${pageNumber}`}
      className={`pdf-single-page-frame ${hasGrounding ? 'page-has-grounding' : ''}`}
      style={{
        position: 'relative',
        width: dimensions.width ? `${dimensions.width}px` : '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        minHeight: dimensions.height ? `${dimensions.height}px` : '400px',
        margin: '0 auto 20px',
      }}
    >
      {/* HTML5 Canvas Rendered by PDF.js */}
      <canvas ref={canvasRef} className="pdf-page-canvas" />

      {/* Synchronized Glowing Bounding Box Overlays */}
      {hasGrounding && activeGrounding.rects && (
        <div
          className="pdf-grounding-overlay-layer"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          {activeGrounding.rects.map((rect, rIdx) => {
            const baseW = activeGrounding.page_width || 612;
            const baseH = activeGrounding.page_height || 792;

            const leftPercent = (rect.x0 / baseW) * 100;
            const topPercent = (rect.y0 / baseH) * 100;
            const widthPercent = ((rect.x1 - rect.x0) / baseW) * 100;
            const heightPercent = ((rect.y1 - rect.y0) / baseH) * 100;

            return (
              <div
                key={rIdx}
                className="pdf-highlight-bounding-box"
                style={{
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  width: `${widthPercent}%`,
                  height: `${heightPercent}%`,
                }}
              >
                {rIdx === 0 && (
                  <div className="pdf-highlight-pill-tag">
                    <CheckCircle2 size={11} />
                    <span>Verified Evidence</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Page number watermark footer */}
      <div className="page-watermark-number">Page {pageNumber}</div>
    </div>
  );
}

export default function PDFSplitViewer({
  pdfUrl,
  pdfFile,
  activeGrounding,
  onClearGrounding,
  onClose,
  filename,
}) {
  const containerRef = useRef(null);
  const userZoomedRef = useRef(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Compute fit-to-width scale based on container width
  const computeFitScale = () => {
    const container = containerRef.current;
    if (!container) return;
    const availableWidth = Math.max(240, container.clientWidth - 40);
    const idealScale = Math.min(1.4, Math.max(0.5, availableWidth / 612));
    setScale(Number(idealScale.toFixed(2)));
  };

  // 1. Load the PDF Document with ArrayBuffer / Object URL support
  useEffect(() => {
    let isMounted = true;
    let loadingTask = null;

    async function loadDoc() {
      if (!pdfFile && !pdfUrl) {
        setError('No PDF document loaded for viewing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let docParams;
        if (pdfFile) {
          const arrayBuffer = await pdfFile.arrayBuffer();
          if (!isMounted) return;
          docParams = {
            data: new Uint8Array(arrayBuffer),
            cMapPacked: true,
          };
        } else {
          docParams = {
            url: pdfUrl,
            cMapPacked: true,
          };
        }

        loadingTask = pdfjsLib.getDocument(docParams);
        const doc = await loadingTask.promise;

        if (!isMounted) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error('PDF.js loading error:', err);
        setError(
          err.name === 'PasswordException'
            ? 'This PDF document is password-protected and cannot be displayed.'
            : `Could not render this PDF document: ${err.message || 'The file might be corrupted or protected.'}`
        );
        setLoading(false);
      }
    }

    loadDoc();

    return () => {
      isMounted = false;
      if (loadingTask && loadingTask.destroy) {
        loadingTask.destroy();
      }
    };
  }, [pdfFile, pdfUrl]);

  // Dynamic responsive scale observer: adapts smoothly to split view or window resize
  useEffect(() => {
    if (!containerRef.current || !pdfDoc) return;

    computeFitScale();

    let timeoutId;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!userZoomedRef.current) {
          computeFitScale();
        }
      }, 100);
    });

    resizeObserver.observe(containerRef.current);
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [pdfDoc]);

  // 2. Smoothly scroll to active grounding page strictly inside container (NO window jump)
  useEffect(() => {
    if (!activeGrounding || !activeGrounding.page) return;

    const targetPage = activeGrounding.page;
    setCurrentPage(targetPage);

    // Give DOM a frame to position before scrolling inside container
    const timer = setTimeout(() => {
      const pageEl = document.getElementById(`pdf-split-page-${targetPage}`);
      const container = containerRef.current;
      if (pageEl && container) {
        const containerRect = container.getBoundingClientRect();
        const pageRect = pageEl.getBoundingClientRect();
        const relativeTop = pageRect.top - containerRect.top + container.scrollTop;
        const targetScrollTop = relativeTop - (container.clientHeight - pageRect.height) / 2;

        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth',
        });

        // On mobile / stacked view (< 1024px), gently ensure the viewer card is in view without jumping
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          const viewerCard = container.closest('.pdf-split-viewer-card');
          if (viewerCard) {
            const vRect = viewerCard.getBoundingClientRect();
            if (vRect.bottom < 100 || vRect.top > window.innerHeight - 100) {
              viewerCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        }
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [activeGrounding]);

  // Zoom controls
  const handleZoomIn = () => {
    userZoomedRef.current = true;
    setScale((prev) => Math.min(2.4, Number((prev + 0.15).toFixed(2))));
  };
  const handleZoomOut = () => {
    userZoomedRef.current = true;
    setScale((prev) => Math.max(0.5, Number((prev - 0.15).toFixed(2))));
  };
  const handleResetZoom = () => {
    userZoomedRef.current = false;
    computeFitScale();
  };

  const handlePageJump = (newPage) => {
    const pageNum = Math.max(1, Math.min(numPages, newPage));
    setCurrentPage(pageNum);
    const pageEl = document.getElementById(`pdf-split-page-${pageNum}`);
    const container = containerRef.current;
    if (pageEl && container) {
      const containerRect = container.getBoundingClientRect();
      const pageRect = pageEl.getBoundingClientRect();
      const relativeTop = pageRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({
        top: Math.max(0, relativeTop - 12),
        behavior: 'smooth',
      });
    }
  };

  return (
    <aside className="pdf-split-viewer-card glass-panel" aria-label="Embedded PDF Viewer">
      {/* 1. TOP VIEWER TOOLBAR */}
      <div className="pdf-viewer-toolbar">
        <div className="toolbar-left-group">
          <div className="viewer-file-badge" title={filename || 'Research Manuscript'}>
            <FileText size={15} style={{ color: 'var(--primary-blue)' }} />
            <span className="viewer-filename-text">{filename || 'Paper Document'}</span>
          </div>

          <div className="viewer-page-nav">
            <button
              type="button"
              className="toolbar-icon-btn"
              onClick={() => handlePageJump(currentPage - 1)}
              disabled={currentPage <= 1}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="page-indicator-text">
              Page <strong>{currentPage}</strong> of {numPages || '—'}
            </span>

            <button
              type="button"
              className="toolbar-icon-btn"
              onClick={() => handlePageJump(currentPage + 1)}
              disabled={currentPage >= numPages}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="toolbar-right-group">
          <div className="zoom-controls-cluster">
            <button
              type="button"
              className="toolbar-icon-btn"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <span
              className="zoom-level-text"
              onClick={handleResetZoom}
              title="Click to reset to fit width"
            >
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              className="toolbar-icon-btn"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
          </div>

          <button
            type="button"
            className="toolbar-icon-btn"
            onClick={onClose}
            title="Expand to Full Dashboard Mode"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      {/* 2. GROUNDED CITATION EVIDENCE BANNER (If Active) */}
      {activeGrounding && (
        <div className="grounding-active-banner">
          <div className="grounding-banner-content">
            <div className="grounding-badge-glow">
              <Sparkles size={14} />
              <span>Grounded on Page {activeGrounding.page}</span>
            </div>
            <p className="grounding-quote-preview">
              &ldquo;{activeGrounding.snippet || activeGrounding.quote}&rdquo;
            </p>
          </div>
          {onClearGrounding && (
            <button
              type="button"
              className="grounding-clear-btn"
              onClick={onClearGrounding}
              title="Clear Highlight"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* 3. SCROLLABLE PDF PAGES CONTAINER */}
      <div className="pdf-pages-scroll-container" ref={containerRef}>
        {loading && (
          <div className="pdf-loading-box">
            <div className="spinner-glow" style={{ width: '40px', height: '40px' }} />
            <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Rendering PDF manuscript vector layers...
            </p>
          </div>
        )}

        {error && (
          <div className="pdf-error-box">
            <AlertCircle size={24} style={{ color: 'var(--accent-rose)' }} />
            <p style={{ marginTop: '8px', fontWeight: 600, color: 'var(--accent-rose)' }}>{error}</p>
          </div>
        )}

        {!loading && !error && numPages > 0 && (
          <div className="pdf-pages-stack">
            {Array.from({ length: numPages }, (_, idx) => (
              <PDFPageItem
                key={idx + 1}
                pageNumber={idx + 1}
                pdfDoc={pdfDoc}
                scale={scale}
                activeGrounding={activeGrounding}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
