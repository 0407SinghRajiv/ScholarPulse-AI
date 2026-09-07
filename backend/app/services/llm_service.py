"""LLM service for paper analysis and insight synthesis using Groq API."""
import os
from groq import Groq
from app.config import settings

client = None
if settings.GROQ_API_KEY:
    client = Groq(api_key=settings.GROQ_API_KEY)

# Fallback candidate models in order of quality, speed & availability
FALLBACK_MODELS = [
    settings.GROQ_MODEL,
    "groq/compound-mini",
    "groq/compound",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
]


def _clean_json_response(content: str) -> str:
    """Robustly clean thinking tags, markdown fences, and conversational text to extract valid JSON."""
    content_clean = content.strip()
    
    # 1. Handle think/reasoning tags
    if "<think>" in content_clean:
        if "</think>" in content_clean:
            content_clean = content_clean.split("</think>")[-1].strip()
        else:
            # If think tag is open but not closed, find the first '{' and keep everything after it
            first_brace = content_clean.find("{")
            if first_brace != -1:
                content_clean = content_clean[first_brace:].strip()

    # 2. Extract json match
    import re
    json_match = re.search(r'\{.*\}', content_clean, re.DOTALL)
    if json_match:
        content_clean = json_match.group(0)
    else:
        # Fallback to markdown code fence removal
        if content_clean.startswith("```"):
            lines = content_clean.split("\n")
            if lines[0].strip().startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            content_clean = "\n".join(lines).strip()
            
    return content_clean


ACADEMIC_SYSTEM_PROMPT = (
    "You are an elite Principal Scientific Fellow and Senior Peer-Review Editor for premier scientific venues "
    "(NeurIPS, ICML, ICLR, IEEE TPAMI, ACM SIGKDD, Nature, Science).\n"
    "Your analysis is delivered to university professors, principal research scientists, and doctoral/graduate students "
    "who demand publication-grade precision, mathematical exactness, methodological transparency, and critical intellectual skepticism.\n\n"
    "CORE OPERATIONAL PROTOCOLS:\n"
    "1. ZERO CONVERSATIONAL FILLER: Never output conversational introductions or closings ('Certainly!', 'In this paper...', 'Here is the summary'). "
    "Begin immediately with dense, publication-grade academic substance.\n"
    "2. EMPIRICAL GROUNDING & EXACT REPRODUCIBILITY: Never make vague claims. Extract concrete technical details: exact equations, objective functions, "
    "hyperparameter configurations, dataset names and sample splits, exact quantitative metrics with deltas over baselines, and computational complexity bounds. "
    "If a specific metric or hyperparameter is absent from the text, state 'Not reported in manuscript' rather than estimating.\n"
    "3. ADVERSARIAL PEER-REVIEW SCRUTINY: Scrutinize the manuscript with scholarly skepticism. Differentiate empirical evidence from speculative claims. "
    "Identify unstated assumptions, baseline selection omissions, computational bottlenecks (e.g., O(N^2) memory, GPU scaling limits), and domain-shift vulnerabilities.\n"
    "4. DISSERTATION-GRADE INSIGHTS: Formulate research gaps and future directions as publication-caliber research questions and PhD dissertation topics "
    "that advance the scientific state of the art."
)


def _call_llm(prompt: str, max_tokens: int = 600, system_prompt: str = None) -> str:
    """Execute LLM chat completion request with automatic model fallback and dedicated academic system role."""
    if not client:
        raise ValueError("GROQ_API_KEY environment variable is not configured.")

    last_error = None
    # Deduplicate fallback list preserving order
    models_to_try = []
    for m in FALLBACK_MODELS:
        if m and m not in models_to_try:
            models_to_try.append(m)

    system_instruction = system_prompt or ACADEMIC_SYSTEM_PROMPT

    for model in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=max_tokens,
                temperature=0.2,
            )
            content = response.choices[0].message.content.strip()
            # Clean up thinking tokens if model outputs reasoning tags
            if "<think>" in content and "</think>" in content:
                content = content.split("</think>")[-1].strip()
            return content
        except Exception as e:
            print(f"Model {model} failed: {e}")
            last_error = e
            continue

    raise RuntimeError(f"All LLM candidate models failed. Last error: {last_error}")


def generate_summary(context: str) -> str:
    """Generate concise executive summary of the paper."""
    prompt = (
        "Synthesize an authoritative, high-density executive synthesis of this academic manuscript (200-280 words) "
        "tailored for university professors, research scientists, and peer-reviewers.\n"
        "Strictly address these 4 analytical pillars:\n"
        "1. Core Theoretical/Empirical Bottleneck: The fundamental problem, mathematical limitation, or baseline failure in existing SOTA being tackled.\n"
        "2. Methodological & Architectural Innovation: The exact mechanisms, mathematical formulations, neural/statistical architectures, or data structures introduced.\n"
        "3. Grounded Benchmark Performance: Exact empirical metrics (e.g., accuracy, F1, perplexity, BLEU, latency, memory, p-values) achieved against specific named baselines.\n"
        "4. Paradigmatic Significance: How this work advances theoretical foundations or practical engineering boundaries in the field.\n\n"
        f"Manuscript Context:\n<<<\n{context[:18000]}\n>>>"
    )
    return _call_llm(prompt, max_tokens=700)


def generate_methodology_detail(context: str) -> str:
    """Extract structured methodology points."""
    prompt = (
        "Extract a rigorous, publication-grade research methodology breakdown in exactly 4 distinct bullet points starting with '-'. "
        "Each bullet must begin with the exact category name followed by a colon:\n"
        "- Corpus Curation & Data Hygiene: Exact dataset names, scale (sample counts, tokens, hours, modality), splits (train/val/test), curation protocols, and data hygiene.\n"
        "- Architecture Design & Baseline Controls: Exact neural/statistical architectures, parameter counts, backbone models, control configurations, and baseline systems benchmarked against.\n"
        "- Mathematical Formulations & Optimization: Explicit loss functions, regularizers, optimization algorithms (e.g., AdamW with learning rate, warmup, weight decay schedules), and computational complexity.\n"
        "- Evaluation Protocols & Reliability: Concrete quantitative metrics, validation protocols (e.g., k-fold cross-validation, bootstrap sampling, confidence intervals), ablation study designs, and statistical significance tests.\n\n"
        "Ensure maximum technical precision and empirical grounding. Do NOT invent missing details.\n\n"
        f"Manuscript Context:\n<<<\n{context[:18000]}\n>>>"
    )
    return _call_llm(prompt, max_tokens=850)


def generate_formal_limitations(context: str) -> str:
    """Extract limitations explicitly mentioned in the text."""
    prompt = (
        "Analyze the formal limitations of this paper with adversarial peer-review scrutiny. "
        "Extract 3-4 concrete formal limitations EXPLICITLY acknowledged by the authors or inherent to their methodology/experimental setup "
        "(e.g., computational complexity, memory bottlenecks, dataset bias/constraints, baseline failure modes, hyperparameter sensitivity, or domain shift vulnerabilities).\n"
        "Do NOT invent generic limitations — state only what is strictly grounded in the manuscript text.\n"
        "Format each bullet as: '- Category: In-depth technical critique grounded strictly in the manuscript.' "
        "Use categories like 'Computational Bottleneck', 'Generalization & Domain Shift', 'Corpus & Annotation Bias', or 'Theoretical Boundary & Assumptions'.\n\n"
        f"Manuscript Context:\n<<<\n{context[:18000]}\n>>>"
    )
    return _call_llm(prompt, max_tokens=650)


def generate_research_gap(context: str) -> str:
    """Extract domain research gaps."""
    prompt = (
        "Acting as a Senior Doctoral Advisor and Research Director, identify 3-4 profound open research gaps in the broader domain that remain unsolved after this work. "
        "Formulate each as a substantive academic open challenge suitable for a doctoral dissertation proposal or subsequent peer-reviewed publication.\n"
        "Format each bullet as: '- Gap Title: In-depth scholarly analysis of why this remains an unresolved open problem and where existing literature/this paper falls short.' "
        "Use titles like 'Dissertation Frontier: ...', 'Theoretical Open Question: ...', 'Methodological Frontier: ...', or 'Benchmark Frontier: ...'.\n\n"
        f"Manuscript Context:\n<<<\n{context[:18000]}\n>>>"
    )
    return _call_llm(prompt, max_tokens=650)


def generate_future_scope(context: str) -> str:
    """Extract concrete future directions."""
    prompt = (
        "Formulate 3-4 concrete, actionable, publication-grade future research trajectories based on the paper's findings, limitations, and theoretical implications. "
        "Strictly avoid generic statements like 'more research is needed'. Tie each point directly to a specific architectural modification, "
        "multi-modal expansion, theoretical formalization, cross-domain adaptation, or novel hybrid loss objective.\n"
        "Format each bullet as: '- Horizon Tier: Concrete methodology and expected scientific impact.' "
        "Use Horizon Tiers such as 'Horizon I: Empirical Scaling & Ablation', 'Horizon II: Architectural & Algorithmic Extension', 'Horizon III: Cross-Domain & Multi-Modal Transfer', or 'Horizon IV: Theoretical Formalization & Bounds'.\n\n"
        f"Manuscript Context:\n<<<\n{context[:18000]}\n>>>"
    )
    return _call_llm(prompt, max_tokens=700)


def rank_important_references(reference_text: str, top_n: int = 5) -> str:
    """Rank seminal/important references from the paper's reference section."""
    if not reference_text.strip():
        return "No references section detected."
    prompt = (
        f"From this list of references, identify the {top_n} most foundational or seminal citations that form the theoretical or "
        "methodological lineage of this paper (e.g., seminal method papers vs incidental citations). "
        "Return them as a numbered list with the reference text as given, plus a brief explanation of its seminal significance: "
        "'1. Authors (Year). Title. Venue. — Seminal significance: Exact technical contribution, foundational theorem, or architecture that this paper builds upon or critiques.'\n\n"
        f"References:\n<<<\n{reference_text[:5000]}\n>>>"
    )
    return _call_llm(prompt, max_tokens=750)


def generate_all_insights(context: str, reference_text: str) -> dict:
    """Generate all paper insights, references ranking, and keywords in a single LLM call to save tokens and avoid rate limits."""
    prompt = (
        "Perform an exhaustive, publication-grade peer-review and technical extraction on the manuscript provided below.\n"
        "Target Audience: University Professors, Research Scientists, and Doctoral/Master's Students who demand "
        "uncompromising technical rigor, mathematical accuracy, reproducible details, and critical intellectual depth.\n\n"
        f"Manuscript Context:\n<<<\n{context[:18000]}\n>>>\n\n"
        f"References Section:\n<<<\n{reference_text[:4500]}\n>>>\n\n"
        "INSTRUCTIONS:\n"
        "Return your response strictly as a valid JSON object matching the exact keys below. "
        "Do NOT include any markdown code block wrappers (like ```json), commentary, or conversational filler. Output ONLY the raw JSON object.\n\n"
        "JSON Keys & Extraction Specifications:\n"
        '1. "summary": An authoritative, information-dense executive synthesis (200-280 words) addressing:\n'
        "   - Core Theoretical/Empirical Bottleneck: The exact problem or limitation in existing literature motivating this work.\n"
        "   - Methodological & Architectural Innovation: The exact mechanisms, mathematical formulations, neural/statistical architectures, or algorithms proposed.\n"
        "   - Quantitative Benchmark Performance: Exact empirical metrics (accuracy, F1, BLEU, perplexity, latency, p-values) achieved against specific named baselines.\n"
        "   - Paradigmatic Impact: How this work advances theoretical landscape or shifts practical boundaries in the field.\n"
        '2. "methodology": A rigorous research methodology breakdown in exactly 4 distinct bullet points starting with "-". Format each item with the exact pillar name followed by a colon:\n'
        "   - Corpus Curation & Data Hygiene: Exact dataset names, scale (sample counts, tokens, hours), splits, curation protocols, and data hygiene.\n"
        "   - Architecture Design & Baseline Controls: Exact neural/statistical architectures, parameter counts, backbone models, control configurations, and baseline systems benchmarked against.\n"
        "   - Mathematical Formulations & Optimization: Core loss functions, regularizers, optimization algorithms (e.g., AdamW schedules, warmup, weight decay), attention mechanics, and complexity bounds.\n"
        "   - Evaluation Protocols & Reliability: Concrete quantitative metrics, validation protocols (k-fold cross-validation, bootstrap, confidence intervals), ablation study designs, and statistical significance tests.\n"
        '3. "formal_limitations": 3-4 concrete formal limitations explicitly acknowledged by the authors or inherent to the methodology/experiments '
        '(e.g., computational complexity, memory bottlenecks, dataset bias, baseline edge cases, unrealistic assumptions, or hyperparameter sensitivity). '
        "Start each bullet with '- Category: Specific technical limitation grounded directly in the paper text.' (e.g., '- Computational Bottleneck: ...', '- Generalization & Domain Shift: ...', '- Corpus & Annotation Bias: ...', '- Theoretical Boundary & Assumptions: ...'). Strictly forbid generic hand-waving.\n"
        '4. "research_gap": 3-4 profound open research gaps that remain unsolved in the broader domain despite this work. '
        'Formulate each as a substantive academic open question suitable for a doctoral dissertation proposal or subsequent tier-1 paper. '
        "Start each with '- Gap Title: In-depth scholarly analysis of why this remains an unresolved open problem and why current state-of-the-art approaches fall short.' (e.g., '- Dissertation Frontier: ...', '- Theoretical Open Question: ...', '- Methodological Frontier: ...', '- Benchmark Frontier: ...').\n"
        '5. "future_scope": 3-4 concrete, actionable, publication-grade future research trajectories. Suggest specific architectural extensions, multi-modal expansions, '
        'theoretical formalizations, cross-domain adaptation, or novel hybrid models. '
        "Start each with '- Horizon Tier: Concrete methodology and expected scientific contribution.' (e.g., '- Horizon I: Empirical Scaling & Ablation: ...', '- Horizon II: Architectural & Algorithmic Extension: ...', '- Horizon III: Cross-Domain & Multi-Modal Transfer: ...', '- Horizon IV: Theoretical Formalization & Bounds: ...'). Strictly avoid generic statements like 'more research is needed'.\n"
        '6. "keywords": A list of the top 8-10 most important technical keywords and domain concepts, sorted in descending order of conceptual relevance. '
        'Each keyword should be an object with "keyword" (string, title-cased, e.g., "Contrastive Representation Learning") and "score" (float relevance percentage between 75.0 and 99.0).\n'
        '7. "important_references": A numbered list identifying the top 5 most foundational or seminal references that form the theoretical or methodological '
        "lineage of this work, formatted as: '1. Authors (Year). Title. Venue. — Seminal significance: Exact foundational theorem, architecture, or benchmark that this paper builds upon or critiques.'\n"
    )

    import json
    raw_response = _call_llm(prompt, max_tokens=2800)
    
    try:
        raw_json_clean = _clean_json_response(raw_response)
        data = json.loads(raw_json_clean)
        
        required_keys = ["summary", "methodology", "formal_limitations", "research_gap", "future_scope", "keywords", "important_references"]
        for key in required_keys:
            if key not in data:
                data[key] = ""
            elif key != "keywords" and isinstance(data[key], list):
                # Robustly join list elements with newline if LLM returned lists
                data[key] = "\n".join(str(item).strip() for item in data[key])
                
        if not isinstance(data["keywords"], list):
            data["keywords"] = [
                {"keyword": "Research Paper", "score": 92.0},
                {"keyword": "Academic Study", "score": 87.0},
                {"keyword": "Methodology", "score": 82.0}
            ]
        else:
            validated = []
            for item in data["keywords"][:10]:
                if isinstance(item, dict) and "keyword" in item and "score" in item:
                    validated.append({
                        "keyword": str(item["keyword"]).title(),
                        "score": round(float(item["score"]), 1)
                    })
            data["keywords"] = validated if validated else [
                {"keyword": "Research Paper", "score": 92.0},
                {"keyword": "Academic Study", "score": 87.0},
                {"keyword": "Methodology", "score": 82.0}
            ]
            
        return data
        
    except Exception as e:
        print(f"Failed to parse unified LLM response: {e}. Raw response: {raw_response}")
        return {
            "summary": "Analysis failed to parse LLM response. Please try again.",
            "methodology": "- Corpus Curation & Data Hygiene: Failed to parse.\n- Architecture Design & Baseline Controls: Failed to parse.",
            "formal_limitations": "- Parse Error: The model output could not be parsed as JSON.",
            "research_gap": "- Parse Error: The model output could not be parsed as JSON.",
            "future_scope": "- Parse Error: The model output could not be parsed as JSON.",
            "keywords": [
                {"keyword": "Parse Error", "score": 100.0}
            ],
            "important_references": "1. Reference Parse Error."
        }


def parse_structured_insights(summary_raw: str, method_raw: str, gap_raw: str, lim_raw: str, scope_raw: str, ref_raw: str) -> dict:
    """Parse raw LLM responses into structured JSON items for UI consumption with academic peer-review taxonomy."""
    intro_fluff_keywords = ["here is", "here are", "based on", "the following", "in summary", "below is", "below are"]

    all_gap_lines = []
    lim_lines = [line.strip().lstrip("-•*123456789. ") for line in lim_raw.split("\n") if line.strip()]
    for line in lim_lines:
        if len(line) > 10 and not any(line.lower().startswith(fluff) for fluff in intro_fluff_keywords):
            all_gap_lines.append((line, "limitation"))

    gap_lines = [line.strip().lstrip("-•*123456789. ") for line in gap_raw.split("\n") if line.strip()]
    for line in gap_lines:
        if len(line) > 10 and not any(line.lower().startswith(fluff) for fluff in intro_fluff_keywords):
            all_gap_lines.append((line, "gap"))

    gap_items = []
    for idx, (text, item_type) in enumerate(all_gap_lines):
        text_lower = text.lower()

        if item_type == "limitation":
            if any(w in text_lower for w in ["complex", "memory", "comput", "latency", "bottleneck", "quadratic", "hardware", "gpu"]):
                badge = "Computational Bottleneck"
            elif any(w in text_lower for w in ["generaliz", "shift", "ood", "transfer", "domain", "unseen", "distribution"]):
                badge = "Domain Generalization"
            elif any(w in text_lower for w in ["data", "dataset", "sample", "corpus", "label", "annotation", "bias", "imbalance"]):
                badge = "Corpus & Bias Constraint"
            elif any(w in text_lower for w in ["hypothes", "assum", "convex", "linear", "bound", "simplif"]):
                badge = "Theoretical Boundary"
            else:
                badge = "Critical Limitation"
        else:
            if any(w in text_lower for w in ["data", "dataset", "corpus", "benchmark", "modality", "cross-lingual"]):
                badge = "Benchmark Frontier"
            elif any(w in text_lower for w in ["method", "algorithm", "architecture", "mechanism", "hybrid", "loss"]):
                badge = "Methodological Frontier"
            elif any(w in text_lower for w in ["theor", "proof", "guarantee", "convergence", "formal", "math"]):
                badge = "Theoretical Open Question"
            else:
                badge = "Dissertation Frontier"

        if ":" in text and len(text.split(":")[0]) < 60:
            parts = text.split(":", 1)
            item_title = parts[0].strip()
            item_desc = parts[1].strip()
        else:
            item_title = ""
            item_desc = text

        gap_items.append({
            "id": idx + 1,
            "title": item_title,
            "description": item_desc,
            "badge": badge,
            "quote": item_desc
        })

    method_lines = [line.strip().lstrip("-•*123456789. ") for line in method_raw.split("\n") if line.strip()]
    method_items = []
    standard_categories = [
        "Corpus & Data Hygiene",
        "Architecture & Baselines",
        "Mathematical Formulations",
        "Evaluation & Reliability"
    ]
    
    valid_m_lines = [l for l in method_lines if len(l) > 10 and not any(l.lower().startswith(fluff) for fluff in intro_fluff_keywords)]
    for idx, m_line in enumerate(valid_m_lines):
        m_lower = m_line.lower()

        if ":" in m_line and len(m_line.split(":")[0]) < 60:
            parts = m_line.split(":", 1)
            raw_title = parts[0].strip()
            m_detail = parts[1].strip()
            m_title = raw_title
        else:
            raw_title = ""
            m_title = ""
            m_detail = m_line

        # Map to standard peer-review pillars
        if any(w in m_lower for w in ["corpus", "curation", "hygiene", "dataset", "sample", "split", "token", "cleaning"]):
            cat = "Corpus & Data Hygiene"
        elif any(w in m_lower for w in ["architecture", "baseline", "model", "network", "backbone", "layer", "transformer", "encoder"]):
            cat = "Architecture & Baselines"
        elif any(w in m_lower for w in ["mathematical", "loss", "optim", "equation", "formulation", "gradient", "adamw", "regulariz"]):
            cat = "Mathematical Formulations"
        elif any(w in m_lower for w in ["evaluation", "metric", "reliability", "benchmark", "validation", "f1", "accuracy", "bleu", "ablation"]):
            cat = "Evaluation & Reliability"
        elif raw_title and len(raw_title) < 35:
            cat = raw_title
        else:
            cat = standard_categories[idx % len(standard_categories)]

        method_items.append({
            "id": idx + 1,
            "category": cat,
            "title": m_title,
            "detail": m_detail,
            "quote": m_detail
        })

    scope_lines = [line.strip().lstrip("-•*123456789. ") for line in scope_raw.split("\n") if line.strip()]
    valid_scope_lines = [l for l in scope_lines if len(l) > 10 and not any(l.lower().startswith(fluff) for fluff in intro_fluff_keywords)]
    scope_items = []
    horizon_tiers = [
        "Horizon I: Empirical Scaling & Ablation",
        "Horizon II: Architectural & Algorithmic Extension",
        "Horizon III: Cross-Domain & Multi-Modal Transfer",
        "Horizon IV: Theoretical Formalization & Bounds"
    ]
    for idx, scope in enumerate(valid_scope_lines):
        if ":" in scope and len(scope.split(":")[0]) < 60:
            parts = scope.split(":", 1)
            horizon_tag = parts[0].strip()
            direction_desc = parts[1].strip()
        else:
            horizon_tag = horizon_tiers[idx % len(horizon_tiers)]
            direction_desc = scope

        scope_items.append({
            "id": idx + 1,
            "direction": direction_desc,
            "horizon": horizon_tag,
            "quote": direction_desc
        })

    ref_lines = [line.strip() for line in ref_raw.split("\n") if line.strip() and len(line.strip()) > 15]
    ref_items = []
    for idx, ref in enumerate(ref_lines[:5]):
        clean_ref = ref.lstrip("0123456789.[] ")
        ref_items.append({
            "rank": idx + 1,
            "citation": clean_ref,
            "impact_score": round(99.0 - (idx * 5.5), 1),
            "quote": clean_ref
        })

    return {
        "summary": summary_raw,
        "methodology": method_raw,
        "formal_limitations": lim_raw,
        "method_structured": method_items,
        "gaps_structured": gap_items,
        "scope_structured": scope_items,
        "references_structured": ref_items
    }

