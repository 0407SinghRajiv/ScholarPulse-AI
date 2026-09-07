"""Pydantic schemas for request and response validation."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class KeywordItem(BaseModel):
    keyword: str
    score: float


class SectionBreakdownItem(BaseModel):
    name: str
    words: int
    color: str


class PaperStats(BaseModel):
    page_count: int
    total_words: int
    estimated_read_time_mins: int
    avg_sentence_length: float
    avg_word_length: float
    complexity_score: int
    section_breakdown: List[SectionBreakdownItem]


class BoundingBox(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float


class GroundingCitation(BaseModel):
    page: int
    quote: str
    rects: List[BoundingBox]
    page_width: float
    page_height: float
    snippet: Optional[str] = None


class MethodItem(BaseModel):
    id: int
    category: str
    title: str
    detail: str
    grounding: Optional[GroundingCitation] = None


class GapItem(BaseModel):
    id: int
    title: str
    description: str
    badge: str
    grounding: Optional[GroundingCitation] = None


class ScopeItem(BaseModel):
    id: int
    direction: str
    horizon: str
    grounding: Optional[GroundingCitation] = None


class ReferenceItem(BaseModel):
    rank: int
    citation: str
    impact_score: float
    grounding: Optional[GroundingCitation] = None


class StructuredInsights(BaseModel):
    summary: str
    methodology: str
    formal_limitations: str
    method_structured: List[MethodItem]
    gaps_structured: List[GapItem]
    scope_structured: List[ScopeItem]
    references_structured: List[ReferenceItem]
    summary_groundings: Optional[List[GroundingCitation]] = None



class AnalysisResponse(BaseModel):
    filename: str
    keywords: List[KeywordItem]
    summary: str
    methodology: str
    formal_limitations: str
    research_gap: str
    future_scope: str
    important_references: str
    stats: PaperStats
    structured: StructuredInsights
