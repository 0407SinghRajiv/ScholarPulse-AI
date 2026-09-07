"""Service to ground extracted research paper insights into exact PDF page coordinates and bounding boxes."""
import re
from typing import Optional, List, Dict, Any
import pymupdf

STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "with", "by", "from", "as", "is", "was", "are", "were", "be", "been", "that",
    "this", "these", "those", "it", "its", "we", "our", "their", "they", "which"
}


def _clean_text_for_search(text: str) -> str:
    """Normalize whitespace and remove leading/trailing punctuation."""
    if not text:
        return ""
    cleaned = re.sub(r'[\r\n\t]+', ' ', text)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip(' "\'()[]{}.,;:-')


def _find_phrase_in_doc(
    doc: pymupdf.Document,
    page_texts: List[str],
    phrase: str,
    fallback_terms: Optional[List[str]] = None
) -> Optional[Dict[str, Any]]:
    """Search for a phrase or sliding n-gram across PDF pages and return exact page coordinates.
    Uses pre-cached page text for lightning fast O(1) page candidate filtering."""
    clean_phrase = _clean_text_for_search(phrase)
    if not clean_phrase or len(clean_phrase) < 4:
        return None

    total_pages = len(doc)
    clean_lower = clean_phrase.lower()

    # Strategy 1: Exact phrase search — check in-memory page text first
    for page_idx in range(total_pages):
        if clean_lower in page_texts[page_idx]:
            page = doc[page_idx]
            matches = page.search_for(clean_phrase)
            if matches:
                return _format_grounding(page, page_idx + 1, clean_phrase, matches)

    # Strategy 2: Sliding 4-6 word n-grams (handles cross-line breaks or slight phrasing shifts)
    words = clean_phrase.split()
    if len(words) >= 4:
        window_size = min(5, len(words))
        chunks = [" ".join(words[i:i + window_size]) for i in range(len(words) - window_size + 1)]

        for chunk in chunks:
            if len(chunk) < 8:
                continue
            chunk_lower = chunk.lower()
            for page_idx in range(total_pages):
                if chunk_lower in page_texts[page_idx]:
                    page = doc[page_idx]
                    matches = page.search_for(chunk)
                    if matches:
                        return _format_grounding(page, page_idx + 1, chunk, matches)

    # Strategy 3: Search for fallback salient keywords (e.g. key nouns, acronyms, or formulas)
    search_terms = fallback_terms or []
    if not search_terms:
        search_terms = [w.strip(' "\'()[]{}.,;:-') for w in words if len(w) > 4 and w.lower() not in STOP_WORDS][:4]

    for term in search_terms:
        if not term or len(term) < 4:
            continue
        term_lower = term.lower()
        for page_idx in range(total_pages):
            if term_lower in page_texts[page_idx]:
                page = doc[page_idx]
                matches = page.search_for(term)
                if matches:
                    return _format_grounding(page, page_idx + 1, term, matches)

    return None


def _format_grounding(page: pymupdf.Page, page_number: int, quote: str, matches: List[pymupdf.Rect]) -> Dict[str, Any]:
    """Format matching Rects into normalized JSON structure with context snippet."""
    page_w = round(float(page.rect.width), 2)
    page_h = round(float(page.rect.height), 2)

    # Limit to top 6 contiguous bounding box lines to avoid runaway overlays
    rect_list = []
    min_x, min_y, max_x, max_y = 9999.0, 9999.0, 0.0, 0.0

    for r in matches[:6]:
        x0 = round(float(r.x0), 2)
        y0 = round(float(r.y0), 2)
        x1 = round(float(r.x1), 2)
        y1 = round(float(r.y1), 2)

        min_x = min(min_x, x0)
        min_y = min(min_y, y0)
        max_x = max(max_x, x1)
        max_y = max(max_y, y1)

        rect_list.append({
            "x0": x0,
            "y0": y0,
            "x1": x1,
            "y1": y1,
        })

    # Extract surrounding text snippet by expanding bounding box
    clip_rect = pymupdf.Rect(
        max(0.0, min_x - 10.0),
        max(0.0, min_y - 8.0),
        min(page_w, max_x + 10.0),
        min(page_h, max_y + 8.0)
    )
    snippet = page.get_text("text", clip=clip_rect).strip()
    if not snippet:
        snippet = quote

    return {
        "page": page_number,
        "quote": quote,
        "rects": rect_list,
        "page_width": page_w,
        "page_height": page_h,
        "snippet": snippet
    }


def ground_structured_insights(pdf_path: str, structured: Dict[str, Any]) -> Dict[str, Any]:
    """Inspect all extracted structured items and attach grounded page citations and bounding boxes."""
    try:
        doc = pymupdf.open(pdf_path)
    except Exception as e:
        print(f"Could not open PDF for grounding: {e}")
        return structured

    try:
        # Pre-extract normalized text for all pages once
        page_texts = [
            re.sub(r'\s+', ' ', page.get_text()).lower()
            for page in doc
        ]

        # 1. Ground Methodology Items
        if "method_structured" in structured and isinstance(structured["method_structured"], list):
            for item in structured["method_structured"]:
                quote_to_search = item.get("quote") or item.get("detail", "")
                fallback = [item.get("title", "")] if item.get("title") else None
                grounding = _find_phrase_in_doc(doc, page_texts, quote_to_search, fallback)
                if grounding:
                    item["grounding"] = grounding

        # 2. Ground Limitations & Gaps Items
        if "gaps_structured" in structured and isinstance(structured["gaps_structured"], list):
            for item in structured["gaps_structured"]:
                quote_to_search = item.get("quote") or item.get("description", "")
                fallback = [item.get("title", "")] if item.get("title") else None
                grounding = _find_phrase_in_doc(doc, page_texts, quote_to_search, fallback)
                if grounding:
                    item["grounding"] = grounding

        # 3. Ground Future Scope Items
        if "scope_structured" in structured and isinstance(structured["scope_structured"], list):
            for item in structured["scope_structured"]:
                quote_to_search = item.get("quote") or item.get("direction", "")
                grounding = _find_phrase_in_doc(doc, page_texts, quote_to_search)
                if grounding:
                    item["grounding"] = grounding

        # 4. Ground Top References
        if "references_structured" in structured and isinstance(structured["references_structured"], list):
            for item in structured["references_structured"]:
                citation_text = item.get("citation", "")
                # Search for author or title part of citation
                first_few_words = " ".join(citation_text.split()[:4])
                grounding = _find_phrase_in_doc(doc, page_texts, first_few_words)
                if grounding:
                    item["grounding"] = grounding

        # 5. Ground Key Summary Statements (extract 2 key sentences from summary)
        summary_text = structured.get("summary", "")
        if summary_text:
            sentences = [s.strip() for s in re.split(r'[.!?]+', summary_text) if len(s.strip()) > 25]
            summary_groundings = []
            for s in sentences[:3]:
                g = _find_phrase_in_doc(doc, page_texts, s)
                if g:
                    summary_groundings.append(g)
            if summary_groundings:
                structured["summary_groundings"] = summary_groundings

    finally:
        doc.close()

    return structured
