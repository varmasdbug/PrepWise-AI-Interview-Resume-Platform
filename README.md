# PrepWise — AI Interview & Resume Intelligence Platform

PrepWise is a web application designed to help job seekers analyze resumes, identify skill gaps, practice technical interviews, and track interview performance through a unified dashboard.

## Features

- **Resume Analyzer:** Extracts resume content from PDF files and compares skills against a target job description.
- **Skill Gap Analysis:** Identifies matched and missing skills to help users focus their preparation.
- **Mock Interview:** Provides role-based interview questions and answer review.
- **Answer Evaluation:** Generates scores, strengths, and improvement suggestions using AI evaluation when available, with rule-based fallback evaluation when the AI service is unavailable.
- **Performance Dashboard:** Tracks interview scores, session history, and performance metrics.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Python, FastAPI |
| Resume Processing | PyMuPDF |
| Validation | Pydantic |
| HTTP Client | HTTPX |
| Interview Evaluation | OpenAI API when configured, with rule-based fallback |
| Session History | Browser localStorage |

## Project Structure

```text
prepwise-ai-evaluation-upgrade/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   └── services/
│   │       ├── interview_service.py
│   │       └── resume_service.py
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md
```

## Prerequisites

- Python 3.10 or a compatible version supported by the installed dependencies
- Node.js and npm
- Git
- OpenAI API credentials and available API credits if using AI-powered evaluation

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/varmasdbug/PrepWise-AI-Interview-Resume-Platform.git
cd PrepWise-AI-Interview-Resume-Platform
```

### 2. Configure the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` and configure the environment variables used by the application. For example:

```dotenv
APP_ENV=development
OPENAI_API_KEY=your_actual_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Keep the real `.env` file private. Never commit API keys to GitHub.

Start the backend from the `backend` directory:

```bash
python3 -m uvicorn app.main:app --reload
```

Backend API documentation:

http://127.0.0.1:8000/docs

### 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Configure the frontend API URL according to the application's environment-variable implementation. The example configuration uses:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite, typically:

http://localhost:5173

## Testing

Verify the following workflows:

1. Upload a valid PDF resume and analyze it against a job description.
2. Review matched skills and missing skills.
3. Complete a mock interview and inspect answer feedback.
4. Verify rule-based evaluation when the AI service is unavailable.
5. Complete multiple interviews and check dashboard statistics.
6. Refresh the browser and verify locally stored session history.
7. Run the frontend production build:

```bash
cd frontend
npm run build
```

## Security

- Store API credentials in local environment files.
- Keep `.env`, virtual environments, and `node_modules` out of version control.
- Use environment templates containing placeholders rather than secrets.
- Never expose a private API key in frontend code or public repositories.

## Limitations

- Resume matching depends on extracted text and the skills recognized by the application.
- Rule-based interview evaluation is a fallback and does not provide the same contextual reasoning as a capable AI model.
- Session history is stored in browser localStorage rather than a central database.
- AI evaluation depends on valid API credentials, available credits, and network access.

## Future Enhancements

- User authentication and secure cloud-based storage.
- More advanced semantic resume-to-job matching.
- Personalized interview question generation.
- Interview analytics and progress visualizations.
- Additional resume formats and exportable feedback reports.

## Author

**D. Manoj**

GitHub: https://github.com/varmasdbug

LinkedIn: https://www.linkedin.com/in/manojdommati/

LeetCode: https://leetcode.com/u/manojdommati/

---

Developed as an AI and Machine Learning project to support resume analysis, interview preparation, and performance tracking.