"""PDF processing, section splitting, and text metadata calculation service."""
import re
import pymupdf as fitz

SECTION_HEADERS = [
    "abstract", "introduction", "methodology", "methods", "materials and methods",
    "proposed method", "model architecture", "experiments", "experimental setup",
    "results", "discussion", "limitations", "conclusion", "conclusions",
    "future work", "references", "bibliography"
]


def extract_text(pdf_path: str) -> str:
    """Extract raw text from all pages of a PDF file."""
    doc = fitz.open(pdf_path)
    text = "\n".join(page.get_text() for page in doc)
    doc.close()
    return text


def is_scanned_pdf(text: str, min_chars: int = 200) -> bool:
    """Check if the extracted text length indicates a scanned image-only PDF."""
    return len(text.strip()) < min_chars


def split_sections(text: str) -> dict:
    """Split extracted text into structured paper sections based on section headers."""
    lower = text.lower()
    positions = {}
    for header in SECTION_HEADERS:
        # Match standalone headers or numbered headers like "1. Introduction" or "7. References" or "References:"
        pattern = rf"(?im)^\s*(?:\d+[\.\s]+|[IVXLCDM]+[\.\s]+)?{re.escape(header)}[\s:\.]*$"
        match = re.search(pattern, text)
        if not match:
            # Fallback search for header appearing at start of line with word boundary
            pattern = rf"(?im)^\s*(?:\d+[\.\s]+)?{re.escape(header)}\b"
            match = re.search(pattern, text)
        if match:
            positions[header] = match.start()

    # Special robust fallback search for references if not matched by standard regex
    if "references" not in positions and "bibliography" not in positions:
        search_start = int(len(text) * 0.5)
        ref_match = re.search(r"(?im)^\s*(?:\d+[\.\s]+)?(references|bibliography|citations|references and notes)\b", text[search_start:])
        if ref_match:
            positions["references"] = search_start + ref_match.start()

    sections = {}

    def get_slice(headers_list, default_len=4000):
        found = [h for h in headers_list if h in positions]
        if not found:
            return ""
        primary = found[0]
        start = positions[primary]
        subsequent = [v for k, v in positions.items() if v > start + 20]
        end = min(subsequent) if subsequent else start + default_len
        return text[start:end].strip()

    sections["abstract"] = get_slice(["abstract"], 2000)
    sections["introduction"] = get_slice(["introduction"], 4000)
    sections["methods"] = get_slice(["methodology", "methods", "materials and methods", "proposed method", "model architecture"], 5000)
    sections["experiments"] = get_slice(["experiments", "experimental setup", "results"], 5000)
    sections["discussion"] = get_slice(["discussion"], 3000)
    sections["limitations"] = get_slice(["limitations"], 3000)
    sections["conclusion"] = get_slice(["conclusion", "conclusions"], 3000)
    sections["future_work"] = get_slice(["future work"], 2000)
    sections["references"] = get_slice(["references", "bibliography"], 10000)

    # Robust fallbacks
    if not sections["abstract"] and not sections["introduction"]:
        sections["introduction"] = text[:2000]

    if not sections["methods"]:
        mid_point = len(text) // 3
        sections["methods"] = text[mid_point: mid_point + 3000]

    if not sections["conclusion"]:
        ref_start = positions.get("references", positions.get("bibliography", len(text)))
        conclusion_start = max(0, ref_start - 2000)
        sections["conclusion"] = text[conclusion_start:ref_start]

    if not sections["references"] or len(sections["references"]) < 50:
        sections["references"] = text[-5000:].strip()

    return sections



def get_context_for_llm(sections: dict, max_chars: int = 16000) -> str:
    """Combine structured sections into a bounded context for LLM prompts."""
    parts = []
    if sections.get("abstract"):
        parts.append(f"=== ABSTRACT ===\n{sections['abstract']}")
    if sections.get("introduction"):
        parts.append(f"=== INTRODUCTION ===\n{sections['introduction']}")
    if sections.get("methods"):
        parts.append(f"=== METHODOLOGY & ARCHITECTURE ===\n{sections['methods']}")
    if sections.get("experiments"):
        parts.append(f"=== EXPERIMENTAL RESULTS ===\n{sections['experiments']}")
    if sections.get("discussion"):
        parts.append(f"=== DISCUSSION ===\n{sections['discussion']}")
    if sections.get("limitations"):
        parts.append(f"=== FORMAL LIMITATIONS ===\n{sections['limitations']}")
    if sections.get("conclusion"):
        parts.append(f"=== CONCLUSION ===\n{sections['conclusion']}")
    if sections.get("future_work"):
        parts.append(f"=== FUTURE WORK ===\n{sections['future_work']}")

    combined = "\n\n".join(parts)
    return combined[:max_chars]


def extract_metadata_and_stats(pdf_path: str, text: str, sections: dict) -> dict:
    """Calculate page count, word metrics, and section stats."""
    doc = fitz.open(pdf_path)
    page_count = len(doc)
    doc.close()

    words = text.split()
    total_words = len(words)
    estimated_read_time = max(1, round(total_words / 220))

    abstract_words = len(sections.get("abstract", "").split())
    intro_words = len(sections.get("introduction", "").split())
    method_words = len(sections.get("methods", "").split())
    concl_words = len(sections.get("conclusion", "").split())
    ref_words = len(sections.get("references", "").split())
    body_words = max(0, total_words - (abstract_words + intro_words + method_words + concl_words + ref_words))

    section_breakdown = [
        {"name": "Abstract", "words": abstract_words, "color": "#38bdf8"},
        {"name": "Introduction", "words": intro_words, "color": "#818cf8"},
        {"name": "Methodology", "words": method_words, "color": "#c084fc"},
        {"name": "Main Body", "words": body_words, "color": "#a855f7"},
        {"name": "Conclusion", "words": concl_words, "color": "#34d399"},
        {"name": "References", "words": ref_words, "color": "#f43f5e"},
    ]
    section_breakdown = [s for s in section_breakdown if s["words"] > 0]

    sentences = [s for s in re.split(r'[.!?]+', text) if len(s.strip()) > 3]
    avg_sentence_len = round(total_words / max(1, len(sentences)), 1)
    avg_word_len = round(sum(len(w) for w in words[:1000]) / max(1, len(words[:1000])), 2)
    complexity_score = min(100, max(20, int(avg_sentence_len * 2.2 + avg_word_len * 5)))

    return {
        "page_count": page_count,
        "total_words": total_words,
        "estimated_read_time_mins": estimated_read_time,
        "avg_sentence_length": avg_sentence_len,
        "avg_word_length": avg_word_len,
        "complexity_score": complexity_score,
        "section_breakdown": section_breakdown,
    }
