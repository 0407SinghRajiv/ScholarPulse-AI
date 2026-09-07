# 📚 ScholarPulse AI

**ScholarPulse AI** is an AI-powered research paper analysis platform designed to help students, researchers, and professors quickly understand lengthy academic papers and extract meaningful insights.

Instead of manually reading and analyzing an entire research paper, users can upload a PDF and receive a structured analysis including summaries, key concepts, methodology details, limitations, research gaps, future research directions, and important references.

## 🚀 Features

* 📄 Upload and analyze research paper PDFs
* 🔍 Automatic PDF text extraction and section detection
* 🧠 AI-generated research paper summaries
* 🔑 Keyword extraction using KeyBERT and Sentence Transformers
* 📊 Document statistics and readability analysis
* 🧪 Methodology breakdown
* ⚠️ Identification of limitations and constraints
* 🔎 Research gap analysis
* 🚀 Future research scope suggestions
* 📚 Important reference analysis
* 📈 Interactive visualizations and dashboards
* 📑 Export analysis reports as PDF
* 🎯 Sample/demo mode for instant exploration

## 🏗️ Architecture

The project follows a modular architecture consisting of:

**Frontend → FastAPI Backend → PDF Processing → NLP Analysis → LLM Insights → Structured JSON → Interactive Dashboard**

### Core Processing Pipeline

1. User uploads a research paper PDF.
2. PyMuPDF extracts text and document sections.
3. Document statistics and readability metrics are calculated.
4. KeyBERT extracts important keywords and concepts.
5. The processed content is sent to an LLM for deeper analysis.
6. The system generates structured insights such as summaries, methodology, limitations, research gaps, and future scope.
7. Results are displayed through an interactive dashboard.

## 🛠️ Tech Stack

### Frontend

* React 19
* Vite
* Recharts
* Lucide React
* jsPDF
* html2canvas

### Backend

* FastAPI
* Uvicorn
* Python
* CORS Middleware

### AI & NLP

* Groq API
* Llama 3.3 70B
* KeyBERT
* Sentence Transformers
* HuggingFace
* PyTorch

### Document Processing

* PyMuPDF (fitz)
* Regex-based Section Detection

## 🎯 Project Goal

The goal of ScholarPulse AI is to reduce the time required to understand complex academic research papers by transforming lengthy documents into structured, meaningful, and actionable insights.

> **Note:** This project is currently under active development. The current version focuses on building a functional prototype, with future improvements planned for more accurate document understanding, better research gap detection, scanned PDF support, evaluation mechanisms, and scalability.

## 🔮 Future Improvements

* Advanced OCR support for scanned research papers
* Multi-paper comparison
* Research paper recommendation system
* Citation network analysis
* Semantic search across multiple papers
* Improved research gap detection
* Paper-to-paper similarity analysis
* RAG-based research assistant
* User authentication and saved analysis history
* Improved accuracy evaluation and validation
* Cloud deployment and scalable architecture

---

## 🌐 Cloud Deployment (Vercel & Render)

ScholarPulse AI is production-ready for decoupled cloud deployment:
- **Backend (FastAPI)**: Deploy to **Render** via Blueprint (`render.yaml`) or as a Python Web Service.
- **Frontend (React + Vite)**: Deploy to **Vercel** (Set Root Directory to `frontend`).

👉 For comprehensive step-by-step instructions, see the **[Deployment Guide](DEPLOYMENT.md)**.

---

**ScholarPulse AI — Transforming Research Papers into Meaningful Insights. 🚀**
