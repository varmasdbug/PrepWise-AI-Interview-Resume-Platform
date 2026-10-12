from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from dotenv import load_dotenv
import os

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from app.services.resume_service import analyze_resume, extract_pdf_text
from app.services.interview_service import get_questions, evaluate_answer

app = FastAPI(
    title="AI Interview & Resume Intelligence API",
    description="MVP API for resume analysis and mock interview practice.",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResumeTextRequest(BaseModel):
    resume_text: str = Field(min_length=1, max_length=50000)
    job_description: str = Field(default="", max_length=20000)

class QuestionRequest(BaseModel):
    role: str = "Python Developer"
    category: str = "Technical"
    count: int = Field(default=5, ge=1, le=10)

class AnswerRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    answer: str = Field(default="", max_length=10000)
    role: str = Field(default="", max_length=100)
    category: str = Field(default="", max_length=50)

@app.get("/")
def root():
    return {"message": "AI Interview & Resume Intelligence API is running", "docs": "/docs"}

@app.get("/api/health")
def health():
    return {"status": "ok", "ai_evaluation_configured": bool(os.getenv("OPENAI_API_KEY", "").strip()), "evaluation_model": os.getenv("OPENAI_MODEL", "gpt-4.1-mini")}

@app.post("/api/resume/analyze")
async def analyze_uploaded_resume(
    file: UploadFile = File(...),
    job_description: str = Form(default="")
):
    if file.content_type != "application/pdf" and not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="PDF must be 5 MB or smaller.")
    try:
        text = extract_pdf_text(content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not text:
        raise HTTPException(status_code=422, detail="No readable text found. Scanned PDFs are not supported in this MVP.")
    result = analyze_resume(text, job_description)
    result["extracted_text_preview"] = text[:1200]
    return result

@app.post("/api/resume/analyze-text")
def analyze_resume_text(payload: ResumeTextRequest):
    return analyze_resume(payload.resume_text, payload.job_description)

@app.post("/api/interview/questions")
def interview_questions(payload: QuestionRequest):
    return {"role": payload.role, "category": payload.category,
            "questions": get_questions(payload.role, payload.category, payload.count)}

@app.post("/api/interview/evaluate")
def interview_evaluate(payload: AnswerRequest):
    try:
        return evaluate_answer(payload.question, payload.answer, payload.role, payload.category)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
