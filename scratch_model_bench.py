import time
import json
from groq import Groq
from app.config import settings
from app.services.llm_service import _clean_json_response

client = Groq(api_key=settings.GROQ_API_KEY)

prompt = """You are an expert academic paper analyzer. Analyze the provided research paper text and references, and synthesize comprehensive insights.

Paper Text:
The Transformer is a novel neural network architecture based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task.

You must return your response strictly as a JSON object with the following keys. Output ONLY the raw JSON object.
JSON Keys:
1. "summary": Executive summary in 150 words.
2. "methodology": Exactly 4 bullet points starting with "-".
3. "formal_limitations": 2-3 formal limitations starting with "-".
4. "research_gap": 2-3 research gaps starting with "-".
5. "future_scope": 3-4 future directions starting with "-".
6. "keywords": List of 8 objects with "keyword" and "score".
7. "important_references": Numbered list of 5 references.
"""

for model_name in ["groq/compound-mini", "qwen/qwen3.8-27b"]:
    t0 = time.time()
    try:
        res = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.2,
        )
        elapsed = time.time() - t0
        content = res.choices[0].message.content
        cleaned = _clean_json_response(content)
        parsed = json.loads(cleaned)
        print(f"[{model_name}] SUCCESS in {elapsed:.2f}s! Keys: {list(parsed.keys())}")
        print(f"Summary: {parsed['summary'][:70]}...")
    except Exception as e:
        print(f"[{model_name}] FAILED in {time.time()-t0:.2f}s: {e}")
