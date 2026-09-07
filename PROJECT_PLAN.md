# Research Paper Insight Generator — Build Plan (2-Day Sprint)

## 1. Goal
Upload a research paper PDF → get:
- Summary
- Keywords
- Research Gap
- Future Scope
- Important References

## 2. Tech Stack

| Layer | Tool | Why |
|---|---|---|
| PDF extraction | PyMuPDF (fitz) | Fast, keeps section structure |
| Keyword extraction | KeyBERT + sentence-transformers | Real embedding-based NLP, not just LLM output |
| Summary / Gap / Future Scope | Groq API (Llama 3.1-8b-instant or 3.3-70b) | Free tier, very fast, good reasoning |
| Reference parsing | Regex + LLM cleanup | References section is inconsistent, needs both |
| Backend | FastAPI | You already know it (matches flood project) |
| Frontend | Streamlit | Fastest working UI in 2 days, native file upload |
| Env/secrets | python-dotenv | Keep API key out of code |

**Why Groq, not OpenAI:** free tier, no card needed, low latency — good for a 2-day demo build.
Alternative if you already have a key: Gemini 1.5 Flash (also free tier) — swap is a 5-line change.

## 3. Architecture

```
[Streamlit UI]
     |  upload PDF
     v
[PDF Extractor] --> raw_text, sections (abstract, intro, conclusion, references)
     |
     +--> [KeyBERT] --> keywords
     |
     +--> [LLM Prompt: Summary]        --> summary
     +--> [LLM Prompt: Research Gap]   --> gap
     +--> [LLM Prompt: Future Scope]   --> future_scope
     +--> [Reference Parser + LLM rank]--> top references
     |
     v
[Streamlit renders all 5 outputs]
```

Keep it a single FastAPI backend (`main.py`) with one `/analyze` endpoint, and Streamlit calling it via `requests`. This separation matters for your resume (shows API design), and it's still buildable in 2 days.

## 4. Section Detection Strategy
Papers are inconsistent, so don't try to perfectly parse. Instead:
1. Extract full text with PyMuPDF, page by page.
2. Use regex/heading match for common headers: `Abstract`, `Introduction`, `Conclusion`, `References` / `Bibliography`.
3. If detection fails, fall back to: first 1500 words = "intro context", last 20% before references = "conclusion context". This fallback matters more than perfect parsing — don't over-engineer here.
4. References section: split by lines, use regex to detect reference-like patterns (starts with `[n]` or `n.` or author-year pattern).

## 5. LLM Prompts (core of the "insight" quality)

**Summary prompt:**
"Summarize this research paper in 150-200 words for someone unfamiliar with the field. Cover: problem, method, key result. Paper text: {text}"

**Research Gap prompt:**
"Based on this paper's introduction and conclusion, identify 2-3 specific research gaps or limitations the authors acknowledge or that are implied. Be specific, not generic. Text: {text}"

**Future Scope prompt:**
"Based on this paper, list 3-4 concrete future research directions. Avoid generic statements like 'more research is needed' — tie each to a specific limitation in the paper. Text: {text}"

**Reference ranking prompt:**
"From this list of references, identify the 5 most likely foundational/important ones (based on how central the citation appears in the text, e.g. seminal method papers). References: {ref_list}"

Only send the sections you extracted (abstract+intro+conclusion), not the whole paper, to stay within token limits and reduce cost/latency.

## 6. Day-by-Day Plan

### Day 1 — Core pipeline working end-to-end
- [ ] Hour 1: Project scaffold (folders below), venv, requirements install, Groq API key setup
- [ ] Hour 2-3: PDF extractor module — text + section splitting
- [ ] Hour 4-5: Keyword extraction with KeyBERT — test on 2-3 sample papers
- [ ] Hour 6-7: LLM summary + gap + future scope functions, test prompts directly
- [ ] Hour 8: Wire into a bare FastAPI endpoint `/analyze`, test with curl/Postman
- **End of Day 1 goal:** Upload PDF via API, get JSON back with all 5 fields (even if rough)

### Day 2 — UI, reference logic, polish, testing
- [ ] Hour 1-2: Reference extraction + LLM ranking
- [ ] Hour 3-4: Streamlit UI — upload box, loading state, 5 result sections styled
- [ ] Hour 5: Error handling (bad PDF, scanned/image-only PDF, huge file, no API response)
- [ ] Hour 6: Test on 5-6 real papers across domains (CS, bio, social science) — check quality
- [ ] Hour 7: README, requirements.txt lock, screenshots
- [ ] Hour 8: Buffer for bugs + demo rehearsal

## 7. Folder Structure
```
research-insight-gen/
├── backend/
│   ├── main.py              # FastAPI app, /analyze endpoint
│   ├── pdf_extractor.py     # PyMuPDF text + section extraction
│   ├── keyword_extractor.py # KeyBERT logic
│   ├── llm_service.py       # Groq API calls, prompts
│   ├── reference_parser.py  # regex + ranking
│   └── config.py            # env vars
├── frontend/
│   └── app.py                # Streamlit UI
├── .env                      # GROQ_API_KEY=...
├── requirements.txt
└── README.md
```

## 8. Known Risks (plan around these now)
- **Scanned/image-only PDFs**: PyMuPDF returns empty text. Add a check: if extracted text < 200 chars, show error "This PDF appears to be scanned — OCR not supported in this version."
- **Very long papers**: LLM context limits. Truncate to abstract+intro+conclusion+first 2 pages, not full text.
- **API rate limits (free tier)**: add retry with backoff, or cache results per PDF hash during demo.
- **KeyBERT model download**: first run downloads a small sentence-transformers model (~80MB) — do this once ahead of time, don't rely on venue wifi during a demo.

## 9. What to tell Claude Code / Antigravity
Feed this file directly as the project brief. Suggested first prompt:
"Build this project following PROJECT_PLAN.md exactly. Start with the backend folder structure and pdf_extractor.py first, then keyword_extractor.py, then llm_service.py, then main.py wiring them together. Use the requirements.txt provided. Ask me for my Groq API key placement, don't hardcode it."

Build in the order listed — each module is testable standalone before wiring together, which keeps debugging fast within the 2-day window.
