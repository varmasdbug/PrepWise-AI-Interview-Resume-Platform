# AI Interview & Resume Intelligence Platform

A beginner-friendly MVP for a final-year B.Tech AIML project.

## Features in this starter
- React + Vite frontend
- FastAPI backend
- PDF resume text extraction
- Basic skill detection and transparent resume/job-description matching
- Role-based mock interview questions
- Rule-based answer feedback (no paid AI API required yet)
- Telugu/English language selection in the UI (questions/feedback currently use English templates)

## Requirements
- Python 3.10+
- Node.js 18+
- npm

## 1. Run the backend
Open Terminal in this folder:

```bash
cd backend
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell:
# .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at http://127.0.0.1:8000
API docs: http://127.0.0.1:8000/docs

## 2. Run the frontend
Open a second Terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

## Project structure

```text
ai-interview-resume-platform/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   └── services/
│   │       ├── resume_service.py
│   │       └── interview_service.py
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── styles.css
```

## Important notes
- Resume matching is a simple keyword-based baseline, not a certified ATS score.
- Answer evaluation is a demo rubric. It should be improved and validated before being used for real hiring decisions.
- Do not upload sensitive personal information while testing.
- Never commit API keys or `.env` files to GitHub.

## Next milestones
1. Add database and user accounts.
2. Add an LLM provider behind a backend service (API key stored in `.env`).
3. Add voice recording and speech-to-text.
4. Add interview history, analytics, and PDF reports.
5. Add tests and deploy.


## Mock interview session upgrade

The mock interview now supports question-by-question navigation, saved answer drafts, rule-based question keyword feedback, session completion summaries, and local browser history on the Performance page. History uses browser `localStorage` on this device/browser; it is not synced to a server or account. Evaluation is a transparent practice heuristic and does not verify technical correctness.


## Real AI interview evaluation

The interview evaluator now uses the OpenAI API when `OPENAI_API_KEY` is configured. Otherwise, it clearly labels its response as a rule-based fallback. AI evaluation sends the interview question, role, category, and candidate answer to the configured provider. Do not send confidential personal data.

### Configure on macOS

1. Open a terminal in the `backend` folder.
2. Create a local `.env` file by copying `.env.example` to `.env`.
3. Put your own OpenAI API key in `backend/.env` and optionally change `OPENAI_MODEL`. Never paste the key into frontend code or commit `.env` to Git. API usage may incur charges.
4. Install updated dependencies with `python -m pip install -r requirements.txt`.
5. Restart the backend: `python -m uvicorn app.main:app --reload`.
6. Open `http://127.0.0.1:8000/api/health`. `ai_evaluation_configured` should be `true` when the key is loaded.
7. In PrepWise, generate an interview, submit an answer, and check whether the result says `AI answer evaluation`.

If no API key is configured, the app still works using the explicitly labeled rule-based fallback. If a key is configured but the provider call fails, the API returns a clear error instead of silently pretending AI was used.
