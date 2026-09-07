"""Analysis API endpoints module handling paper uploads and sample demo generation."""
import os
import tempfile
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.pdf_service import (
    extract_text,
    is_scanned_pdf,
    split_sections,
    get_context_for_llm,
    extract_metadata_and_stats,
)
from app.services.keyword_service import extract_keywords
from app.services.llm_service import (
    generate_summary,
    generate_methodology_detail,
    generate_formal_limitations,
    generate_research_gap,
    generate_future_scope,
    rank_important_references,
    parse_structured_insights,
    generate_all_insights,
)
from app.services.grounding_service import ground_structured_insights
from app.schemas.analysis import AnalysisResponse


router = APIRouter()


@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "ScholarPulse AI Backend"}


@router.get("/sample", response_model=AnalysisResponse)
def sample_demo():
    """Return realistic analysis data for instant UI demonstration."""
    methodology_text = (
        "- Dataset Analysis: Synthesizes a benchmark dataset of 4.5M sentence pairs from WMT 2014, evaluating academic vs corporate training corpus distinctions.\n"
        "- Citation Analysis: Ranks foundational prior works including sequence-to-sequence alignment and attention models.\n"
        "- Comparative Corporate vs Academic Analysis: Compares Google Research team benchmarks against open academic research baselines.\n"
        "- Regression Analysis & Modeling: Categorizes paper outputs into performance reliability zones, analyzing BLEU score stability against sequence length degradation."
    )
    formal_limitations_text = (
        "- Quadratic Time and Memory Complexity: Self-attention matrix calculation scales O(N^2) with context length N.\n"
        "- Limited Context Length Extrapolation: Encodings degrade when evaluation sequence length exceeds training sequence limits.\n"
        "- Autoregressive Inference Bottleneck: Sequential token generation cannot leverage GPU parallelism during decoding."
    )
    research_gap_text = (
        "- Generalization to long-form document synthesis beyond fixed context windows.\n"
        "- Cross-modal transferability without Task-Specific Recurrent Architectures."
    )
    future_scope_text = (
        "- Linear and sparse attention variants (e.g. FlashAttention, Linformer).\n"
        "- Universal pre-training across image, audio, and code modalities.\n"
        "- Hardware-aware KV-cache quantization for low-latency inference."
    )
    summary_text = (
        "This landmark paper introduces the Transformer, a novel neural network architecture "
        "based entirely on attention mechanisms, discarding recurrent and convolutional networks. "
        "By relying on self-attention to compute representations of input and output sequences, "
        "the Transformer allows for significantly greater parallelization and establishes a new state of "
        "the art in translation quality (28.4 BLEU on English-to-German) with dramatically reduced training time."
    )
    ref_text = (
        "1. Vaswani et al. (2017) - Attention Is All You Need\n"
        "2. Bahdanau et al. (2014) - Neural Machine Translation by Jointly Learning to Align and Translate\n"
        "3. Hochreiter & Schmidhuber (1997) - Long Short-Term Memory\n"
        "4. Sutskever et al. (2014) - Sequence to Sequence Learning with Neural Networks\n"
        "5. Gehring et al. (2017) - Convolutional Sequence to Sequence Learning"
    )

    structured = parse_structured_insights(
        summary_text, methodology_text, research_gap_text, formal_limitations_text, future_scope_text, ref_text
    )

    sample_groundings = [
        {"page": 1, "quote": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks", "rects": [{"x0": 54.0, "y0": 195.0, "x1": 558.0, "y1": 218.0}], "page_width": 612.0, "page_height": 792.0, "snippet": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration."},
        {"page": 3, "quote": "Scaled Dot-Product Attention", "rects": [{"x0": 54.0, "y0": 260.0, "x1": 280.0, "y1": 275.0}], "page_width": 612.0, "page_height": 792.0, "snippet": "We call our particular attention 'Scaled Dot-Product Attention'. The input consists of queries and keys of dimension d_k, and values of dimension d_v."},
        {"page": 4, "quote": "Self-attention layers in a transformer scale quadratically", "rects": [{"x0": 54.0, "y0": 340.0, "x1": 550.0, "y1": 365.0}], "page_width": 612.0, "page_height": 792.0, "snippet": "A self-attention layer connects all positions with a constant number of sequentially executed operations, whereas a recurrent layer requires O(n) sequential operations."},
        {"page": 5, "quote": "Training Data and Batching", "rects": [{"x0": 54.0, "y0": 420.0, "x1": 490.0, "y1": 442.0}], "page_width": 612.0, "page_height": 792.0, "snippet": "We trained on the standard WMT 2014 English-German dataset consisting of about 4.5 million sentence pairs."}
    ]
    if structured.get("method_structured"):
        structured["method_structured"][0]["grounding"] = sample_groundings[3]
        if len(structured["method_structured"]) > 1:
            structured["method_structured"][1]["grounding"] = sample_groundings[1]
    if structured.get("gaps_structured"):
        structured["gaps_structured"][0]["grounding"] = sample_groundings[2]
    structured["summary_groundings"] = [sample_groundings[0]]


    return {
        "filename": "Attention_Is_All_You_Need_Transformer_Paper.pdf",
        "keywords": [
            {"keyword": "Transformer Architecture", "score": 96.5},
            {"keyword": "Self-Attention Mechanism", "score": 92.4},
            {"keyword": "Sequence-To-Sequence", "score": 88.1},
            {"keyword": "Multi-Head Attention", "score": 84.7},
            {"keyword": "Positional Encoding", "score": 79.3},
            {"keyword": "Neural Machine Translation", "score": 74.0},
            {"keyword": "Parallel Computing", "score": 68.5},
            {"keyword": "BLEU Score Benchmark", "score": 62.1},
        ],
        "summary": summary_text,
        "methodology": methodology_text,
        "formal_limitations": formal_limitations_text,
        "research_gap": research_gap_text,
        "future_scope": future_scope_text,
        "important_references": ref_text,
        "stats": {
            "page_count": 15,
            "total_words": 6420,
            "estimated_read_time_mins": 29,
            "avg_sentence_length": 18.4,
            "avg_word_length": 5.12,
            "complexity_score": 78,
            "section_breakdown": [
                {"name": "Abstract", "words": 280, "color": "#38bdf8"},
                {"name": "Introduction", "words": 940, "color": "#818cf8"},
                {"name": "Methodology", "words": 2150, "color": "#c084fc"},
                {"name": "Main Body", "words": 1300, "color": "#a855f7"},
                {"name": "Conclusion", "words": 520, "color": "#34d399"},
                {"name": "References", "words": 1230, "color": "#f43f5e"},
            ],
        },
        "structured": structured,
    }


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_paper(file: UploadFile = File(...)):
    """Extract text from uploaded research PDF, process insights with LLM, and return structured analysis."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a valid PDF file.")

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    tmp_path = tmp.name

    try:
        tmp.write(await file.read())
        tmp.close()  # Crucial on Windows to release file handle before PyMuPDF accesses it

        text = extract_text(tmp_path)

        if is_scanned_pdf(text):
            raise HTTPException(
                status_code=422,
                detail="This PDF appears to be scanned or image-based — text extraction failed."
            )

        sections = split_sections(text)
        context = get_context_for_llm(sections)
        stats = extract_metadata_and_stats(tmp_path, text, sections)
        ref_input = sections.get("references", "")

        loop = asyncio.get_running_loop()
        with ThreadPoolExecutor(max_workers=2) as executor:
            insights = await loop.run_in_executor(
                executor, generate_all_insights, context, ref_input
            )

        keywords = insights["keywords"]
        summary = insights["summary"]
        methodology = insights["methodology"]
        formal_limitations = insights["formal_limitations"]
        gap = insights["research_gap"]
        future_scope = insights["future_scope"]
        ref_text = insights["important_references"]

        structured = parse_structured_insights(
            summary, methodology, gap, formal_limitations, future_scope, ref_text
        )

        # Ground extracted insights into exact PDF coordinates and bounding boxes
        structured = ground_structured_insights(tmp_path, structured)

        return {

            "filename": file.filename,
            "keywords": keywords,
            "summary": summary,
            "methodology": methodology,
            "formal_limitations": formal_limitations,
            "research_gap": gap,
            "future_scope": future_scope,
            "important_references": ref_text,
            "stats": stats,
            "structured": structured,
        }

    finally:
        if os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


