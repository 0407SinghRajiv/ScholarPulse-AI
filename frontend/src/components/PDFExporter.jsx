import React, { useState } from 'react';
import { Download, RefreshCw, GraduationCap, CheckCircle2, BookOpen } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PDFExporter({ data, onReset }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadPDF = async () => {
    if (!data) return;

    setDownloading(true);
    try {
      // -------------------------------------------------------------
      // 0. TEXT SANITIZATION FOR STANDARD PDF FONTS (WINANSI ENCODING)
      // Fixes stretched letter-spacing & overflowing text caused by
      // non-breaking hyphens (U+2011), em-dashes, and special Unicode.
      // -------------------------------------------------------------
      const sanitizeText = (str) => {
        if (!str) return '';
        return String(str)
          // Normalize Unicode hyphens, dashes, and minus signs to standard ASCII hyphen
          .replace(/[\u2010\u2011\u2012\u2212]/g, '-')
          .replace(/[\u2013\u2014\u2015]/g, ' - ')
          // Smart single quotes and apostrophes
          .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
          // Smart double quotes
          .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
          // Ellipsis
          .replace(/\u2026/g, '...')
          // Spaces (non-breaking, narrow, zero-width)
          .replace(/[\u00A0\u202F\u2007\u2002\u2003\u2004\u2005\u2006\u2008\u2009\u200A]/g, ' ')
          .replace(/\u200B|\u200C|\u200D|\uFEFF|\u00AD/g, '')
          // Bullets
          .replace(/[\u2022\u25AA\u25AB\u2023\u2043]/g, '-')
          // Common math and Greek symbols
          .replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/≠/g, '!=').replace(/±/g, '+/-')
          .replace(/×/g, 'x').replace(/÷/g, '/').replace(/≈/g, '~')
          .replace(/→/g, '->').replace(/←/g, '<-')
          // Retain only printable characters (ASCII printable + Latin-1 Supplement + newline/tab)
          .replace(/[^\u0020-\u007E\u00A0-\u00FF\n\r\t]/g, '')
          // Clean duplicate spaces
          .replace(/[ \t]+/g, ' ')
          .trim();
      };

      const doc = new jsPDF('p', 'mm', 'a4');
      doc.setLineHeightFactor(1.25);

      const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
      const margin = 16;
      const contentWidth = pageWidth - (margin * 2); // 178mm
      let y = 0;
      let currentSectionTitle = '';

      // Color Palette
      const C_NAVY = [15, 37, 75];        // #0f254b (Primary academic navy)
      const C_BLUE = [37, 99, 235];       // #2563eb (Accent sapphire)
      const C_LIGHT_BG = [248, 250, 252]; // #f8fafc (Card background)
      const C_BORDER = [226, 232, 240];   // #e2e8f0 (Card border)
      const C_TEXT = [30, 41, 59];        // #1e293b (Body charcoal)
      const C_MUTED = [100, 116, 139];    // #64748b (Muted caption)
      const C_WHITE = [255, 255, 255];

      // Running header for pages >= 2
      const drawRunningHeader = (continued = false) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...C_MUTED);
        doc.text('SCHOLARPULSE AI  |  ACADEMIC RESEARCH EVALUATION REPORT', margin, 12);
        
        const rawName = data.filename || 'Research Manuscript';
        const docName = sanitizeText(rawName);
        const truncatedDoc = docName.length > 40 ? docName.substring(0, 37) + '...' : docName;
        doc.text(truncatedDoc, pageWidth - margin, 12, { align: 'right' });
        
        doc.setDrawColor(...C_BORDER);
        doc.setLineWidth(0.3);
        doc.line(margin, 15, pageWidth - margin, 15);

        if (continued && currentSectionTitle) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(...C_BLUE);
          doc.text(`${currentSectionTitle} (Continued)`, margin, 20);
          y = 25;
        } else {
          y = 21;
        }
      };

      // Space checking with automatic page breaks
      const ensureSpace = (neededHeight) => {
        if (y + neededHeight > pageHeight - 22) {
          doc.addPage();
          drawRunningHeader(true);
        }
      };

      // Professional Section Header
      const addSectionHeading = (numberStr, titleStr) => {
        currentSectionTitle = `${numberStr}. ${titleStr.toUpperCase()}`;
        ensureSpace(22);
        y += 4;
        
        // Section Number Badge
        doc.setFillColor(...C_BLUE);
        doc.roundedRect(margin, y, 6, 6, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...C_WHITE);
        doc.text(numberStr, margin + 3, y + 4.2, { align: 'center' });

        // Section Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(...C_NAVY);
        doc.text(titleStr.toUpperCase(), margin + 9, y + 4.5);

        y += 8;
        doc.setDrawColor(...C_BORDER);
        doc.setLineWidth(0.4);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
      };

      // ==========================================
      // PAGE 1: MASTHEAD & EXECUTIVE METADATA
      // ==========================================
      doc.setFillColor(...C_NAVY);
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setFillColor(...C_BLUE);
      doc.rect(0, 28, pageWidth, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(...C_WHITE);
      doc.text('SCHOLARPULSE AI', margin, 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text('ENTERPRISE RESEARCH PAPER INSIGHT & METHODOLOGY REPORT', margin, 19);
      doc.text('Document Standard: Peer-Reviewed Evaluation Brief  |  Classification: Academic Research', margin, 24);

      const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...C_WHITE);
      doc.text(`DATE: ${formattedDate.toUpperCase()}`, pageWidth - margin, 13, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text('STATUS: COMPLETED', pageWidth - margin, 18, { align: 'right' });

      y = 36;

      // Document Title Card
      doc.setFillColor(...C_LIGHT_BG);
      doc.setDrawColor(...C_BORDER);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...C_BLUE);
      doc.text('ANALYZED RESEARCH MANUSCRIPT', margin + 5, y + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...C_TEXT);
      const safeFilename = sanitizeText(data.filename || 'Academic_Research_Paper.pdf');
      const filenameLines = doc.splitTextToSize(safeFilename, contentWidth - 10);
      doc.text(filenameLines[0] || safeFilename, margin + 5, y + 12.5);

      y += 23;

      // 4-Column Executive Metrics Grid
      const cardW = (contentWidth - 9) / 4;
      const cardH = 16;
      const metrics = [
        { label: 'PAGES', val: `${data.stats?.page_count || 1}` },
        { label: 'EST. READ TIME', val: `${data.stats?.estimated_read_time_mins || 5} min` },
        { label: 'COMPLEXITY INDEX', val: `${data.stats?.complexity_score || 70} / 100` },
        { label: 'TOTAL WORD COUNT', val: `${(data.stats?.total_words || 0).toLocaleString()}` }
      ];

      metrics.forEach((m, idx) => {
        const cx = margin + (idx * (cardW + 3));
        doc.setFillColor(...C_LIGHT_BG);
        doc.setDrawColor(...C_BORDER);
        doc.setLineWidth(0.3);
        doc.roundedRect(cx, y, cardW, cardH, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...C_MUTED);
        doc.text(m.label, cx + 4, y + 5.2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...C_NAVY);
        doc.text(m.val, cx + 4, y + 11.5);
      });

      y += cardH + 7;

      // Key Domain Concepts Tag Strip
      if (data.keywords && data.keywords.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...C_MUTED);
        doc.text('EXTRACTED KEY CONCEPTS & DOMAIN RELEVANCE:', margin, y);
        y += 4.5;

        let kwX = margin;
        const topKw = data.keywords.slice(0, 8);

        topKw.forEach((kw) => {
          const cleanKw = sanitizeText(kw.keyword);
          const textStr = `${cleanKw} (${kw.score}%)`;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          const strWidth = doc.getTextWidth(textStr) + 7;

          // Wrap to next line if pill exceeds right margin
          if (kwX + strWidth > pageWidth - margin) {
            kwX = margin;
            y += 6.5;
          }

          doc.setFillColor(238, 242, 255);
          doc.setDrawColor(199, 210, 254);
          doc.setLineWidth(0.2);
          doc.roundedRect(kwX, y, strWidth, 5.2, 1, 1, 'FD');

          doc.setTextColor(49, 46, 129);
          doc.text(textStr, kwX + 3.5, y + 3.6);
          kwX += strWidth + 3;
        });
        y += 10;
      }

      // ==========================================
      // 1. EXECUTIVE SUMMARY & CORE SYNTHESIS
      // ==========================================
      addSectionHeading('1', 'Executive Summary & Core Synthesis');
      
      const summaryText = sanitizeText(data.summary || 'No executive summary synthesized for this document.');
      const padX = 7;
      const usableSummaryW = contentWidth - (padX * 2); // 164mm
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const summaryLines = doc.splitTextToSize(summaryText, usableSummaryW);
      const lineHeightMm = doc.getLineHeight() / doc.internal.scaleFactor; // ~3.8mm
      const summaryBoxHeight = (summaryLines.length * lineHeightMm) + 9;

      ensureSpace(summaryBoxHeight + 5);
      
      doc.setFillColor(...C_LIGHT_BG);
      doc.setDrawColor(...C_BORDER);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, summaryBoxHeight, 1.5, 1.5, 'FD');

      // Blue vertical accent bar on left border
      doc.setFillColor(...C_BLUE);
      doc.rect(margin, y, 2.5, summaryBoxHeight, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...C_TEXT);
      doc.text(summaryLines, margin + padX, y + 5.5);
      
      y += summaryBoxHeight + 6;

      // ==========================================
      // 2. DOCUMENT STRUCTURE & SECTION BREAKDOWN
      // ==========================================
      if (data.stats?.section_breakdown && data.stats.section_breakdown.length > 0) {
        addSectionHeading('2', 'Sectional Distribution & Word Count Analysis');

        const totalSecWords = data.stats.section_breakdown.reduce((acc, curr) => acc + (curr.words || 0), 0) || 1;
        const colW = [48, 36, 34, contentWidth - 118];
        
        ensureSpace(12 + (data.stats.section_breakdown.length * 6));

        // Table Header
        doc.setFillColor(...C_NAVY);
        doc.rect(margin, y, contentWidth, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...C_WHITE);
        doc.text('SECTION NAME', margin + 4, y + 4.2);
        doc.text('WORD COUNT', margin + colW[0] + 4, y + 4.2);
        doc.text('PROPORTION', margin + colW[0] + colW[1] + 4, y + 4.2);
        doc.text('DISTRIBUTION VISUAL', margin + colW[0] + colW[1] + colW[2] + 4, y + 4.2);
        y += 6;

        // Table Rows
        data.stats.section_breakdown.forEach((sec, idx) => {
          ensureSpace(6.5);
          const isEven = idx % 2 === 0;
          doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
          doc.rect(margin, y, contentWidth, 6, 'F');

          doc.setDrawColor(...C_BORDER);
          doc.setLineWidth(0.2);
          doc.line(margin, y + 6, margin + contentWidth, y + 6);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...C_TEXT);
          const cleanSecName = sanitizeText(sec.name || 'Section');
          doc.text(cleanSecName, margin + 4, y + 4.2);

          doc.setFont('helvetica', 'normal');
          doc.text(`${(sec.words || 0).toLocaleString()} words`, margin + colW[0] + 4, y + 4.2);

          const pct = Math.round(((sec.words || 0) / totalSecWords) * 100);
          doc.text(`${pct}%`, margin + colW[0] + colW[1] + 4, y + 4.2);

          // Vector Progress Bar
          const barMaxWidth = colW[3] - 14;
          const barFillWidth = Math.max(1, (pct / 100) * barMaxWidth);
          const barX = margin + colW[0] + colW[1] + colW[2] + 4;
          doc.setFillColor(226, 232, 240);
          doc.roundedRect(barX, y + 2, barMaxWidth, 2.4, 0.5, 0.5, 'F');
          doc.setFillColor(...C_BLUE);
          doc.roundedRect(barX, y + 2, barFillWidth, 2.4, 0.5, 0.5, 'F');

          y += 6;
        });
        y += 6;
      }

      // Visual Charts Embed (if present in DOM)
      const chartElem = document.getElementById('section-breakdown-charts');
      if (chartElem) {
        try {
          const canvas = await html2canvas(chartElem, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
          });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = contentWidth;
          const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 68);

          ensureSpace(imgHeight + 10);
          
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(...C_MUTED);
          doc.text('Figure 2.1: Section Word Count Distribution & Comparative Proportion Breakdown', margin, y + 3);
          y += 5;

          doc.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
          y += imgHeight + 7;
        } catch (chartErr) {
          console.warn('DOM chart capture skipped:', chartErr);
        }
      }

      // ==========================================
      // 3. DETAILED METHODOLOGY BREAKDOWN
      // ==========================================
      addSectionHeading('3', 'Structured Methodology Breakdown');

      const methodItems = data.structured?.method_structured || [];
      const mPadX = 7;
      const mUsableW = contentWidth - (mPadX * 2); // 164mm

      if (methodItems.length > 0) {
        methodItems.forEach((item, idx) => {
          const rawTitle = item.title ? `${item.category}: ${item.title}` : (item.category || `Methodology Pillar ${idx + 1}`);
          const titleText = sanitizeText(rawTitle);
          const detailText = sanitizeText(item.detail || '');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          const titleLines = doc.splitTextToSize(titleText, mUsableW);
          const titleH = titleLines.length * (doc.getLineHeight() / doc.internal.scaleFactor);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.2);
          const detailLines = doc.splitTextToSize(detailText, mUsableW);
          const detailH = detailLines.length * (doc.getLineHeight() / doc.internal.scaleFactor);

          const cardHeight = 4 + titleH + 2.5 + detailH + 4.5;

          ensureSpace(cardHeight + 4);

          // Card Background
          doc.setFillColor(...C_LIGHT_BG);
          doc.setDrawColor(...C_BORDER);
          doc.setLineWidth(0.3);
          doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'FD');

          // Left indicator bar (Navy)
          doc.setFillColor(...C_NAVY);
          doc.rect(margin, y, 2.2, cardHeight, 'F');

          // Title
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(...C_NAVY);
          doc.text(titleLines, margin + mPadX, y + 4.5);

          // Detail
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.2);
          doc.setTextColor(...C_TEXT);
          doc.text(detailLines, margin + mPadX, y + 4.5 + titleH + 2.5);

          y += cardHeight + 3.5;
        });
      } else {
        const rawMethod = sanitizeText(data.methodology || 'No detailed methodology specified.');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const methodLines = doc.splitTextToSize(rawMethod, mUsableW);
        const mH = methodLines.length * (doc.getLineHeight() / doc.internal.scaleFactor) + 8;
        ensureSpace(mH);
        doc.setFillColor(...C_LIGHT_BG);
        doc.roundedRect(margin, y, contentWidth, mH, 1.5, 1.5, 'FD');
        doc.text(methodLines, margin + mPadX, y + 5.5);
        y += mH + 4;
      }
      y += 3;

      // ==========================================
      // 4. CRITICAL LIMITATIONS & RESEARCH GAPS
      // ==========================================
      addSectionHeading('4', 'Formal Limitations & Open Research Gaps');

      const gapItems = data.structured?.gaps_structured || [];
      const gPadX = 7;
      const gUsableW = contentWidth - (gPadX * 2); // 164mm

      if (gapItems.length > 0) {
        gapItems.forEach((gap) => {
          const badgeText = sanitizeText(gap.badge || 'Scope Constraint');
          const cleanTitle = sanitizeText(gap.title || '');
          const titleText = cleanTitle ? `[ ${badgeText.toUpperCase()}: ${cleanTitle} ]` : `[ ${badgeText.toUpperCase()} ]`;
          const descText = sanitizeText(gap.description || '');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          const titleLines = doc.splitTextToSize(titleText, gUsableW);
          const titleH = titleLines.length * (doc.getLineHeight() / doc.internal.scaleFactor);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.2);
          const descLines = doc.splitTextToSize(descText, gUsableW);
          const descH = descLines.length * (doc.getLineHeight() / doc.internal.scaleFactor);

          const cardHeight = 4 + titleH + 2.5 + descH + 4.5;

          ensureSpace(cardHeight + 4);

          // Color classification based on badge
          let badgeColor = C_BLUE;
          let badgeBg = [239, 246, 255];
          if (badgeText.includes('Limitation')) {
            badgeColor = [225, 29, 72];     // Rose
            badgeBg = [255, 241, 242];
          } else if (badgeText.includes('Methodological')) {
            badgeColor = [124, 58, 237];    // Purple
            badgeBg = [245, 243, 255];
          } else if (badgeText.includes('Scope')) {
            badgeColor = [217, 119, 6];     // Amber
            badgeBg = [254, 243, 199];
          }

          doc.setFillColor(...badgeBg);
          doc.setDrawColor(...C_BORDER);
          doc.setLineWidth(0.3);
          doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'FD');

          // Left border accent line
          doc.setFillColor(...badgeColor);
          doc.rect(margin, y, 2.5, cardHeight, 'F');

          // Badge Title
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...badgeColor);
          doc.text(titleLines, margin + gPadX, y + 4.5);

          // Description
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.2);
          doc.setTextColor(...C_TEXT);
          doc.text(descLines, margin + gPadX, y + 4.5 + titleH + 2.5);

          y += cardHeight + 3.5;
        });
      } else {
        const gapText = sanitizeText(`Formal Limitations:\n${data.formal_limitations || 'None documented.'}\n\nBroader Research Gaps:\n${data.research_gap || 'None documented.'}`);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const gapLines = doc.splitTextToSize(gapText, gUsableW);
        const gH = gapLines.length * (doc.getLineHeight() / doc.internal.scaleFactor) + 8;
        ensureSpace(gH);
        doc.setFillColor(...C_LIGHT_BG);
        doc.roundedRect(margin, y, contentWidth, gH, 1.5, 1.5, 'FD');
        doc.text(gapLines, margin + gPadX, y + 5.5);
        y += gH + 4;
      }
      y += 3;

      // ==========================================
      // 5. STRATEGIC FUTURE DIRECTIONS
      // ==========================================
      addSectionHeading('5', 'Strategic Future Research Horizons');

      const scopeItems = data.structured?.scope_structured || [];
      const sPadLeft = 14; // Left space for number badge
      const sPadRight = 7;
      const sUsableW = contentWidth - sPadLeft - sPadRight; // 157mm

      if (scopeItems.length > 0) {
        scopeItems.forEach((sc, idx) => {
          const horizonText = sanitizeText((sc.horizon || `Direction ${idx + 1}`).toUpperCase());
          const dirText = sanitizeText(sc.direction || '');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          const horizonLines = doc.splitTextToSize(horizonText, sUsableW);
          const horizonH = horizonLines.length * (doc.getLineHeight() / doc.internal.scaleFactor);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.2);
          const dirLines = doc.splitTextToSize(dirText, sUsableW);
          const dirH = dirLines.length * (doc.getLineHeight() / doc.internal.scaleFactor);

          const cardHeight = Math.max(12, 4 + horizonH + 2 + dirH + 4.5);

          ensureSpace(cardHeight + 4);

          doc.setFillColor(...C_LIGHT_BG);
          doc.setDrawColor(...C_BORDER);
          doc.setLineWidth(0.3);
          doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'FD');

          // Number Box (Left)
          doc.setFillColor(...C_NAVY);
          doc.roundedRect(margin + 3, y + 3, 7.5, 5.5, 1, 1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(...C_WHITE);
          doc.text(`0${idx + 1}`, margin + 6.75, y + 6.8, { align: 'center' });

          // Horizon Tag
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(...C_BLUE);
          doc.text(horizonLines, margin + sPadLeft, y + 4.5);

          // Direction Body Text
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.2);
          doc.setTextColor(...C_TEXT);
          doc.text(dirLines, margin + sPadLeft, y + 4.5 + horizonH + 2);

          y += cardHeight + 3;
        });
      } else {
        const rawScope = sanitizeText(data.future_scope || 'No specific future directions documented.');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const scopeLines = doc.splitTextToSize(rawScope, contentWidth - 14);
        const scH = scopeLines.length * (doc.getLineHeight() / doc.internal.scaleFactor) + 8;
        ensureSpace(scH);
        doc.setFillColor(...C_LIGHT_BG);
        doc.roundedRect(margin, y, contentWidth, scH, 1.5, 1.5, 'FD');
        doc.text(scopeLines, margin + 7, y + 5.5);
        y += scH + 4;
      }
      y += 3;

      // ==========================================
      // 6. FOUNDATIONAL REFERENCE RANKINGS
      // ==========================================
      addSectionHeading('6', 'Foundational Reference Rankings & Citation Index');

      const refItems = data.structured?.references_structured || [];
      const rankBadgeW = 9;
      const scoreBadgeW = 16;
      const textPadLeft = rankBadgeW + 5; // 14mm from margin
      const textPadRight = scoreBadgeW + 7; // 23mm from right edge
      const usableCitationW = contentWidth - textPadLeft - textPadRight; // 141mm

      if (refItems.length > 0) {
        refItems.forEach((rf) => {
          const cleanCitation = sanitizeText(rf.citation || '');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          const citLines = doc.splitTextToSize(cleanCitation, usableCitationW);
          const citH = citLines.length * (doc.getLineHeight() / doc.internal.scaleFactor);
          const refRowHeight = Math.max(10, citH + 6.5);

          ensureSpace(refRowHeight + 3);

          // Card Background
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(...C_BORDER);
          doc.setLineWidth(0.2);
          doc.roundedRect(margin, y, contentWidth, refRowHeight, 1, 1, 'FD');

          // Left Rank Badge
          doc.setFillColor(...C_BLUE);
          doc.roundedRect(margin + 2.5, y + 2.5, rankBadgeW, 5.5, 0.8, 0.8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(...C_WHITE);
          doc.text(`#${rf.rank}`, margin + 2.5 + (rankBadgeW / 2), y + 6.3, { align: 'center' });

          // Citation Text (Safely bounded between rank and score badge)
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...C_TEXT);
          doc.text(citLines, margin + textPadLeft, y + 4.8);

          // Right Impact Score Badge
          const scoreX = pageWidth - margin - scoreBadgeW - 2.5;
          doc.setFillColor(241, 245, 249);
          doc.roundedRect(scoreX, y + 2.5, scoreBadgeW, 5.5, 1, 1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(...C_NAVY);
          doc.text(`${rf.impact_score}%`, scoreX + (scoreBadgeW / 2), y + 6.3, { align: 'center' });

          y += refRowHeight + 2.5;
        });
      } else {
        const rawRef = sanitizeText(data.important_references || 'No primary references identified.');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const refLines = doc.splitTextToSize(rawRef, contentWidth - 12);
        const rH = refLines.length * (doc.getLineHeight() / doc.internal.scaleFactor) + 8;
        ensureSpace(rH);
        doc.setFillColor(...C_LIGHT_BG);
        doc.roundedRect(margin, y, contentWidth, rH, 1.5, 1.5, 'FD');
        doc.text(refLines, margin + 6, y + 5.5);
        y += rH + 4;
      }

      // ==========================================
      // RUNNING FOOTERS & PAGE NUMBERING (ALL PAGES)
      // ==========================================
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);

        // Footer rule
        doc.setDrawColor(...C_BORDER);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

        // Footer metadata
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...C_MUTED);
        doc.text('SCHOLARPULSE AI  —  CONFIDENTIAL & PEER-REVIEW PREPARED', margin, pageHeight - 7);

        doc.setFont('helvetica', 'bold');
        doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
      }

      // Clean, professional output filename
      const cleanDocName = sanitizeText(data.filename || 'research_paper')
        .replace(/\.pdf$/i, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 40);
      const outputFilename = `${cleanDocName}_ScholarPulse_Report.pdf`;

      doc.save(outputFilename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate professional PDF report:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginTop: '32px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-blue)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px' }}>
            <GraduationCap size={14} />
            <span>PUBLICATION-GRADE ACADEMIC EXPORT</span>
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            Export Professional Research Evaluation Report
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '640px' }}>
            Formatted specifically for students, researchers, and educators. Generates an A4 evaluation brief complete with executive synthesis, methodology pillars, limitation taxonomies, future research roadmaps, and formatted reference tables.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <BookOpen size={14} />
            <span>Ready for thesis, lab reviews & classroom citations</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--panel-border)', paddingTop: '18px' }}>
        <button className="action-btn" onClick={onReset} style={{ cursor: 'pointer' }}>
          <RefreshCw size={15} />
          <span>Analyze Another Paper</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {downloadSuccess && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              Report Downloaded Successfully!
            </span>
          )}

          <button
            className="btn-sample"
            onClick={handleDownloadPDF}
            disabled={downloading}
            style={{
              padding: '10px 22px',
              fontSize: '0.92rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: downloading ? 'not-allowed' : 'pointer',
              opacity: downloading ? 0.7 : 1
            }}
          >
            <Download size={16} />
            <span>{downloading ? 'Formatting & Generating PDF...' : 'Download Professional PDF Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

