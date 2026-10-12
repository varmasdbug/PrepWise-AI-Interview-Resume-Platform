import re
import fitz

# Canonical skill names and common aliases. Matching is keyword-based.
SKILL_ALIASES = {
    "python": ["python", "python3"],
    "java": ["java"],
    "javascript": ["javascript", "js"],
    "react": ["react", "react.js"],
    "fastapi": ["fastapi", "fast api"],
    "sql": ["sql"],
    "mysql": ["mysql"],
    "postgresql": ["postgresql", "postgres"],
    "machine learning": ["machine learning", "ml"],
    "deep learning": ["deep learning"],
    "nlp": ["nlp", "natural language processing"],
    "pandas": ["pandas"],
    "numpy": ["numpy"],
    "scikit-learn": ["scikit-learn", "scikit learn", "sklearn"],
    "tensorflow": ["tensorflow"],
    "pytorch": ["pytorch", "torch"],
    "docker": ["docker"],
    "aws": ["aws", "amazon web services"],
    "git": ["git", "github"],
    "html": ["html"],
    "css": ["css"],
    "streamlit": ["streamlit"],
    "data analysis": ["data analysis", "data analytics"],
    "data visualization": ["data visualization", "data visualisation"],
    "power bi": ["power bi", "powerbi"],
    "tableau": ["tableau"],
    "excel": ["excel", "microsoft excel"],
    "statistics": ["statistics", "statistical analysis"],
    "communication": ["communication", "communication skills"],
    "problem-solving": ["problem-solving", "problem solving"],
    "data cleaning": ["data cleaning", "data cleansing"],
    "eda": ["eda", "exploratory data analysis"],
    "mongodb": ["mongodb", "mongo db"],
    "c": ["c"],
    "c++": ["c++"],
}

SKILL_CATEGORIES = {
    "Programming languages": ["python", "java", "javascript", "c", "c++"],
    "Web development": ["html", "css", "javascript", "react", "fastapi"],
    "Data and machine learning": [
        "machine learning", "deep learning", "nlp", "pandas", "numpy",
        "scikit-learn", "tensorflow", "pytorch", "data analysis",
        "data visualization", "statistics", "eda",
    ],
    "Databases": ["sql", "mysql", "postgresql", "mongodb"],
    "Tools and platforms": [
        "git", "docker", "aws", "streamlit", "power bi", "tableau", "excel"
    ],
    "Professional skills": ["communication", "problem-solving", "data cleaning"],
}


def extract_pdf_text(file_bytes: bytes) -> str:
    """Extract selectable text from a PDF. OCR for scanned PDFs is not included."""
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            if not doc.page_count:
                raise ValueError("The PDF contains no pages.")
            text = "\n".join(page.get_text("text") for page in doc).strip()
            if not text:
                raise ValueError(
                    "No selectable text found. This may be a scanned PDF; OCR is not included yet."
                )
            return text
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("Could not read this PDF. Please upload a valid PDF.") from exc


def _contains_term(text: str, term: str) -> bool:
    """Match an alias without matching it inside a larger word."""
    pattern = r"(?<![a-z0-9+#])" + re.escape(term.lower()) + r"(?![a-z0-9+#])"
    return bool(re.search(pattern, text.lower()))


def detect_skills(text: str) -> list[str]:
    """Return canonical skill names, recognizing common aliases."""
    normalized = (text or "").lower()
    return sorted(
        canonical
        for canonical, aliases in SKILL_ALIASES.items()
        if any(_contains_term(normalized, alias) for alias in aliases)
    )


def categorize_skills(skills: list[str]) -> dict[str, list[str]]:
    """Group detected skills into categories. A skill may appear in more than one category."""
    categories = {}
    skill_set = set(skills)
    for category, category_skills in SKILL_CATEGORIES.items():
        present = sorted(skill_set.intersection(category_skills))
        if present:
            categories[category] = present
    return categories


def check_resume_quality(resume_text: str) -> list[dict]:
    """Heuristic checks for common resume sections and basic completeness."""
    text = resume_text or ""
    normalized = text.lower()
    checks = [
        {
            "name": "Email address",
            "passed": bool(re.search(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", text, re.I)),
            "tip": "Add a professional email address to your contact details.",
        },
        {
            "name": "Phone number",
            "passed": bool(re.search(r"(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)(?!\w)", text)),
            "tip": "Add a valid contact phone number.",
        },
        {
            "name": "Education section",
            "passed": bool(re.search(r"\b(education|academic background|qualifications|b\.?tech|bachelor|master|university|college)\b", normalized)),
            "tip": "Include your degree, institution, and graduation details where applicable.",
        },
        {
            "name": "Projects section",
            "passed": bool(re.search(r"\b(projects|academic projects|personal projects|project experience)\b", normalized)),
            "tip": "Add relevant projects and describe your contribution and technologies used.",
        },
        {
            "name": "Work experience or internships",
            "passed": bool(re.search(r"\b(experience|internship|internships|employment|work history|professional experience)\b", normalized)),
            "tip": "Include relevant work experience or internships, if applicable.",
        },
        {
            "name": "Skills section",
            "passed": bool(re.search(r"\b(skills|technical skills|core competencies|technologies)\b", normalized)),
            "tip": "Add a clearly labeled Skills section with relevant abilities.",
        },
        {
            "name": "Measurable achievements",
            "passed": bool(re.search(r"\b\d+(?:\.\d+)?\s*%|\b\d+\s*(?:users|records|customers|projects|hours|days)\b", normalized)),
            "tip": "Where accurate, add measurable project outcomes such as performance gains or dataset sizes.",
        },
    ]
    return checks


def analyze_resume(resume_text: str, job_description: str = "") -> dict:
    """Compare resume skills to a job description and provide structural checks."""
    resume_text = resume_text or ""
    job_description = job_description or ""
    skills = detect_skills(resume_text)
    job_skills = detect_skills(job_description) if job_description.strip() else []
    matched = sorted(set(job_skills).intersection(skills))
    missing = sorted(set(job_skills) - set(skills))
    score = round(len(matched) / len(job_skills) * 100) if job_skills else None

    suggestions = []
    if len(resume_text.split()) < 100:
        suggestions.append(
            "Your resume text is short. Add relevant projects, experience, and measurable outcomes where appropriate."
        )
    if not skills:
        suggestions.append(
            "No recognized skills were detected. Check the extracted text and include a clear Skills section."
        )
    if not job_description.strip():
        suggestions.append("Add a target job description for a more useful skill comparison.")
    elif not job_skills:
        suggestions.append("No supported skills were recognized in the job description. Try including its technical requirements as text.")
    elif missing:
        suggestions.append(
            "Review these job-related skills: " + ", ".join(missing) + ". If you genuinely have them, demonstrate them in projects or experience."
        )
    else:
        suggestions.append("All recognized job skills were found. Strengthen your evidence with specific project outcomes.")

    quality_checks = check_resume_quality(resume_text)
    failed_checks = [item["name"] for item in quality_checks if not item["passed"]]
    if failed_checks:
        suggestions.append("Review resume completeness checks: " + ", ".join(failed_checks) + ". These are heuristic prompts, so verify them manually.")

    return {
        "word_count": len(resume_text.split()),
        "detected_skills": skills,
        "job_skills": sorted(set(job_skills)),
        "matched_skills": matched,
        "missing_skills": missing,
        "match_score": score,
        "skill_categories": categorize_skills(skills),
        "quality_checks": quality_checks,
        "suggestions": suggestions,
        "disclaimer": (
            "This is a keyword-matching estimate, not a certified ATS score or hiring recommendation. "
            "Quality checks are heuristic and do not verify the truth or quality of resume content."
        ),
    }
