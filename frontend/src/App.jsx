import React from 'react';

import { useState } from "react";

import {

  Activity, ArrowRight, BrainCircuit, BriefcaseBusiness, CheckCircle2,

  ChevronDown, CircleHelp, FileText, Gauge, Headphones, LayoutDashboard,

  Menu, Mic, Search, Settings, ShieldCheck, Sparkles, Target, UploadCloud,

  UserRound, X

} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function App() {

  const [active, setActive] = useState("Overview");

  const [role, setRole] = useState("Python Developer");

  const [category, setCategory] = useState("Technical");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("prepwise-interview-history") || "[]");
    } catch {
      return [];
    }
  });

  const [resumeFile, setResumeFile] = useState(null);

  const [jobDescription, setJobDescription] = useState("");

  const [resumeResult, setResumeResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [mobileOpen, setMobileOpen] = useState(false);

  async function request(path, options) {

    const response = await fetch(`${API}${path}`, options);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.detail || "Request failed. Is the backend running?");

    return data;

  }

  async function loadQuestions() {
    setLoading(true);
    setError("");
    setEvaluation(null);
    setSessionComplete(false);
    try {
      const data = await request("/api/interview/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, category, count: 10 })
      });
      const nextQuestions = data.questions || [];
      if (!nextQuestions.length) throw new Error("No questions were returned. Try another role or category.");
      setQuestions(nextQuestions);
      setQuestionIndex(0);
      setQuestion(nextQuestions[0]);
      setAnswers({});
      setEvaluations({});
      setAnswer("");
      setActive("Mock Interview");
    } catch (e) {
      setError(e.message || "Could not load interview questions.");
    } finally {
      setLoading(false);
    }
  }

  function goToQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    setAnswers((previous) => ({ ...previous, [questionIndex]: answer }));
    setQuestionIndex(index);
    setQuestion(questions[index]);
    setAnswer(answers[index] || "");
    setEvaluation(evaluations[index] || null);
    setError("");
  }

  async function evaluate() {
    if (!question) {
      setError("Generate an interview session first.");
      return;
    }
    if (!answer.trim()) {
      setError("Write an answer before requesting feedback.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await request("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer, role, category })
      });
      setEvaluation(data);
      setAnswers((previous) => ({ ...previous, [questionIndex]: answer }));
      setEvaluations((previous) => ({ ...previous, [questionIndex]: data }));
    } catch (e) {
      setError(e.message || "Could not evaluate this answer.");
    } finally {
      setLoading(false);
    }
  }

  function finishSession() {
    const completedEvaluations = questions.map((_, index) => evaluations[index]).filter(Boolean);
    if (!questions.length || completedEvaluations.length !== questions.length) {
      setError("Review every question before finishing the session.");
      return;
    }
    const averageScore = Math.round(
      completedEvaluations.reduce((sum, item) => sum + Number(item.score || 0), 0) /
      completedEvaluations.length
    );
    const session = {
      id: Date.now(),
      role,
      category,
      completedAt: new Date().toISOString(),
      questionCount: questions.length,
      averageScore,
      results: questions.map((text, index) => ({
        question: text,
        answer: answers[index] || "",
        score: Number(evaluations[index]?.score || 0),
        strengths: evaluations[index]?.strengths || [],
        improvements: evaluations[index]?.improvements || []
      }))
    };
    const nextHistory = [session, ...history].slice(0, 50);
    setHistory(nextHistory);
    try {
      localStorage.setItem("prepwise-interview-history", JSON.stringify(nextHistory));
    } catch {
      setError("Session finished, but this browser could not save history. Check browser storage settings.");
    }
    setSessionComplete(true);
    setError("");
  }

  function clearInterviewSession() {
    setQuestions([]);
    setQuestionIndex(0);
    setQuestion("");
    setAnswer("");
    setAnswers({});
    setEvaluations({});
    setEvaluation(null);
    setSessionComplete(false);
    setError("");
  }

  async function analyzeResume() {

    if (!resumeFile) { setError("Choose a PDF resume first."); return; }

    setLoading(true); setError(""); setResumeResult(null);

    const form = new FormData();

    form.append("file", resumeFile);

    form.append("job_description", jobDescription);

    try {

      const data = await request("/api/resume/analyze", { method: "POST", body: form });

      setResumeResult(data);

    } catch (e) { setError(e.message); }

    finally { setLoading(false); }

  }

  const navItems = [

    { label: "Overview", icon: LayoutDashboard },

    { label: "Resume Analyzer", icon: FileText },

    { label: "Mock Interview", icon: BrainCircuit },

    { label: "Performance", icon: Activity },

  ];

  return (

    <div className="app-shell">

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>

        <div className="brand">

          <div className="brand-mark"><Sparkles size={21} /></div>

          <div><strong>PrepWise</strong><span>AI CAREER COACH</span></div>

          <button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)}><X size={18}/></button>

        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav>

          {navItems.map(({label, icon: Icon}) => (

            <button key={label} className={`nav-item ${active === label ? "active" : ""}`}

              onClick={() => {setActive(label); setMobileOpen(false); setError("");}}>

              <Icon size={18}/><span>{label}</span>{label === "Resume Analyzer" && <span className="nav-dot"/>}

            </button>

          ))}

        </nav>

        <div className="sidebar-bottom">

          <div className="upgrade-card">

            <div className="upgrade-icon"><Target size={18}/></div>

            <strong>Your next opportunity starts here</strong>

            <p>Practice a little every day. Improve with every answer.</p>

            <button onClick={() => setActive("Mock Interview")}>Start practicing <ArrowRight size={15}/></button>

          </div>

          <button className="nav-item muted"><Settings size={18}/><span>Settings</span></button>

          <div className="profile">

            <div className="avatar">M</div><div className="profile-info"><strong>My Workspace</strong><span>Student account</span></div><ChevronDown size={16}/>

          </div>

        </div>

      </aside>

      <main className="main-area">

        <header className="topbar">

          <button className="icon-btn menu-btn" onClick={() => setMobileOpen(!mobileOpen)}><Menu size={20}/></button>

          <div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div>

          <div className="topbar-right"><span className="status-pill"><span/> AI services ready</span><button className="icon-btn"><CircleHelp size={18}/></button><div className="avatar small">M</div></div>

        </header>

        <div className="page-content">

          {error && <div className="alert-error">{error}<button onClick={() => setError("")}><X size={15}/></button></div>}

          {active === "Overview" && <>

            <section className="welcome-row">

              <div><div className="eyebrow"><Sparkles size={14}/> YOUR PERSONAL AI CAREER COACH</div><h1>Make your next interview<br/><span>your best one yet.</span></h1><p>Build confidence, sharpen your answers, and take the next step in your career.</p></div>

              <div className="welcome-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-core"><BrainCircuit size={48}/></div><div className="float-chip chip-one"><CheckCircle2 size={15}/> Answer feedback</div><div className="float-chip chip-two"><Gauge size={15}/> Skill insights</div></div>

            </section>

            <section className="stats-grid">

              <Stat icon={Target} label="Interviews completed" value={history.length} note="Saved practice sessions" />

              <Stat icon={Gauge} label="Average score" value={history.length ? `${Math.round(history.reduce((sum, item) => sum + item.averageScore, 0) / history.length)}/100` : "—"} note={history.length ? "Across saved sessions" : "Complete an interview to see"} />

              <Stat icon={BriefcaseBusiness} label="Resume match" value="—" note="Analyze a resume to begin" />

              <Stat icon={Activity} label="Questions reviewed" value={history.reduce((sum, item) => sum + item.questionCount, 0)} note="Across saved sessions" />

            </section>

            <div className="section-heading"><div><h2>Your preparation workspace</h2><p>Choose where you want to start.</p></div><span className="muted-label">MVP PREVIEW</span></div>

            <section className="feature-grid">

              <Feature icon={FileText} number="01" title="Resume Analyzer" description="Discover your skills, compare against a job description, and get actionable resume suggestions." tag="PDF analysis" onClick={() => setActive("Resume Analyzer")}/>

              <Feature icon={Mic} number="02" title="AI Mock Interview" description="Practise technical, HR, and aptitude questions tailored to your target role." tag="Interactive practice" onClick={() => setActive("Mock Interview")}/>

              <Feature icon={Activity} number="03" title="Performance insights" description="Review answer structure, identify improvement areas, and plan your next practice session." tag="Personal growth" onClick={() => setActive("Performance")}/>

            </section>

            <section className="bottom-banner"><div className="banner-icon"><ShieldCheck size={22}/></div><div><strong>Practice in a safe learning space</strong><p>Scores in this starter are learning indicators, not hiring decisions.</p></div><span className="banner-link">Built for learners <Sparkles size={15}/></span></section>

          </>}

          {active === "Resume Analyzer" && <section className="tool-page">

            <div className="eyebrow"><FileText size={14}/> RESUME INTELLIGENCE</div><h1>Make your resume <span>work harder.</span></h1><p className="page-lead">Upload your PDF and optionally paste a job description to find matching and missing skills.</p>

            <div className="tool-grid">

              <div className="panel">

                <h3><UploadCloud size={19}/> Upload your resume</h3><p className="panel-sub">PDF only · Maximum 5 MB · Text-based PDFs</p>

                <label className="upload-zone"><input type="file" accept="application/pdf,.pdf" onChange={e => {setResumeFile(e.target.files?.[0] || null); setResumeResult(null);}}/><UploadCloud size={28}/><strong>{resumeFile ? resumeFile.name : "Choose a PDF file"}</strong><span>{resumeFile ? `${(resumeFile.size/1024).toFixed(0)} KB · Ready to analyze` : "Click to browse your device"}</span></label>

                <label className="field-label" htmlFor="job-description">JOB DESCRIPTION <span>OPTIONAL</span></label>

                <textarea id="job-description" rows="6" placeholder="Paste the job description here to compare required skills..." value={jobDescription} onChange={e => setJobDescription(e.target.value)}/>

                <button className="primary-btn full-btn" disabled={loading} onClick={analyzeResume}>{loading ? "Analyzing..." : "Analyze resume"} <ArrowRight size={17}/></button>

              </div>

              <div className="panel result-panel"><h3><Sparkles size={19}/> Analysis results</h3>

                {!resumeResult ? <div className="empty-state"><div className="empty-icon"><Search size={26}/></div><strong>Your insights will appear here</strong><p>Upload a resume to see detected skills, job matches, and suggestions.</p><div className="empty-list"><span><CheckCircle2 size={15}/> Skills detected</span><span><CheckCircle2 size={15}/> Job skill match</span><span><CheckCircle2 size={15}/> Improvement tips</span></div></div> :

                <div className="results">

                  <div className="result-score"><div><span className="result-label">JOB SKILL MATCH</span><strong>{resumeResult.match_score == null ? "—" : `${resumeResult.match_score}%`}</strong><span className="muted-label">{resumeResult.match_score == null ? "Add a job description for matching" : "Keyword overlap estimate"}</span></div><div className="score-ring"><span>{resumeResult.detected_skills.length}</span><small>skills</small></div></div>

                  {resumeResult.job_skills?.length > 0 && (
                    <div className="score-breakdown">
                      <div className="score-breakdown-header">
                        <strong>Match score breakdown</strong>
                        <span>
                          {(resumeResult.matched_skills || []).length} of {resumeResult.job_skills.length} required skills
                        </span>
                      </div>
                      <div
                        className="score-progress-track"
                        role="progressbar"
                        aria-label="Job skill match"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={resumeResult.match_score ?? 0}
                      >
                        <div
                          className="score-progress-fill"
                          style={{ width: `${Math.max(0, Math.min(100, resumeResult.match_score ?? 0))}%` }}
                        />
                      </div>
                      <p>
                        {(resumeResult.matched_skills || []).length} matched · {(resumeResult.missing_skills || []).length} to review
                      </p>
                    </div>
                  )}

                  <ResultList title="Detected skills" items={resumeResult.detected_skills} empty="No known skills detected yet."/>

                 {resumeResult.skill_categories &&
                   Object.keys(resumeResult.skill_categories).length > 0 && (
                     <div className="result-list">
                       <strong>
                         Skills by category
                         <span>{Object.keys(resumeResult.skill_categories).length}</span>
                       </strong>
                       <div className="skill-categories">
                         {Object.entries(resumeResult.skill_categories).map(
                           ([categoryName, categorySkills]) => (
                             <div className="skill-category" key={categoryName}>
                               <h4>{categoryName}</h4>
                               <div className="skill-chips">
                                 {categorySkills.map((skill) => (
                                   <span key={skill}>{skill}</span>
                                 ))}
                               </div>
                             </div>
                           )
                         )}
                       </div>
                     </div>
                   )}

                  {resumeResult.quality_checks?.length > 0 && (
                    <div className="result-list quality-checks">
                      <strong>
                        Resume quality checks
                        <span>
                          {resumeResult.quality_checks.filter((item) => item.passed).length}/
                          {resumeResult.quality_checks.length}
                        </span>
                      </strong>
                      <div className="quality-check-items">
                        {resumeResult.quality_checks.map((item) => (
                          <div className="quality-check-item" key={item.name}>
                            <div className="quality-check-heading">
                              <span className={`quality-status ${item.passed ? "quality-status-passed" : "quality-status-missing"}`}>
                                {item.passed ? "✓" : "!"}
                              </span>
                              <strong>{item.name}</strong>
                            </div>
                            {!item.passed && <p>{item.tip}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resumeResult.job_skills.length > 0 && <><ResultList title="Matched skills" items={resumeResult.matched_skills} empty="No matching skills detected."/><ResultList title="Skills to review" items={resumeResult.missing_skills} empty="All detected job skills matched by keywords."/></>}

                  <div className="suggestions"><strong>Suggestions</strong>{resumeResult.suggestions.map((s,i)=><p key={i}>• {s}</p>)}</div>

                  <p className="disclaimer">{resumeResult.disclaimer}</p>

                </div>}

              </div>

            </div>

          </section>}

          {active === "Mock Interview" && <section className="tool-page">
            <div className="eyebrow"><BrainCircuit size={14}/> INTERVIEW PRACTICE</div>
            <h1>Think clearly. Answer <span>confidently.</span></h1>
            <p className="page-lead">Practise role-specific questions, review structured feedback, and finish with a session summary.</p>

            <div className="tool-grid interview-grid">
              <div className="panel">
                <h3><Settings size={19}/> Interview setup</h3>
                <label className="field-label" htmlFor="target-role">TARGET ROLE</label>
                <select id="target-role" value={role} onChange={e => setRole(e.target.value)} disabled={questions.length > 0 && !sessionComplete}>
                  <option>Python Developer</option><option>AIML Engineer</option><option>Java Developer</option>
                </select>
                <label className="field-label">QUESTION CATEGORY</label>
                <div className="category-options">{["Technical", "HR", "Aptitude"].map(c => <button key={c} className={category === c ? "selected" : ""} disabled={questions.length > 0 && !sessionComplete} onClick={() => setCategory(c)}>{c}</button>)}</div>
                <button className="primary-btn full-btn" disabled={loading} onClick={loadQuestions}>{loading ? "Preparing session..." : questions.length && !sessionComplete ? "Restart with new questions" : "Generate questions"} <Sparkles size={16}/></button>
                <div className="helper-note"><ShieldCheck size={17}/><span>Feedback uses a transparent rule-based practice rubric. It helps with structure and keyword relevance, but it does not prove technical correctness.</span></div>
                {questions.length > 0 && !sessionComplete && <div className="session-progress-card"><div className="session-progress-heading"><strong>Session progress</strong><span>{Object.keys(evaluations).length}/{questions.length} reviewed</span></div><div className="session-progress-track"><div className="session-progress-fill" style={{ width: `${questions.length ? Object.keys(evaluations).length / questions.length * 100 : 0}%` }}/></div><p>Review every answer to unlock the final summary.</p></div>}
              </div>

              <div className="panel">
                <h3><Headphones size={19}/> Your practice session</h3>
                {questions.length === 0 ? <div className="empty-state compact"><div className="empty-icon"><BrainCircuit size={26}/></div><strong>Ready when you are</strong><p>Choose a role and question type, then generate a session to begin.</p></div> : sessionComplete ? (
                  <div className="session-summary">
                    <div className="summary-icon"><CheckCircle2 size={28}/></div>
                    <span className="result-label">SESSION COMPLETED</span>
                    <h2>Good work. Keep improving.</h2>
                    <div className="summary-score">{Math.round(questions.reduce((sum, _, index) => sum + Number(evaluations[index]?.score || 0), 0) / questions.length)}<small>/100 average</small></div>
                    <p>You reviewed {questions.length} questions for {role} ({category}). Your session has been saved in this browser's local history.</p>
                    <div className="summary-question-scores">{questions.map((q, index) => <div className="summary-question-row" key={`${q}-${index}`}><span>Q{index + 1}</span><span>{q}</span><strong>{evaluations[index]?.score ?? 0}/100</strong></div>)}</div>
                    <button className="primary-btn full-btn" onClick={clearInterviewSession}>Set up another session <ArrowRight size={16}/></button>
                    <button className="secondary-btn full-btn" onClick={() => setActive("Performance")}>View performance history</button>
                  </div>
                ) : (
                  <>
                    <div className="question-picker">{questions.map((q, i) => <button key={`${q}-${i}`} className={questionIndex === i ? "question-active" : ""} onClick={() => goToQuestion(i)}><span>Q{i + 1}</span><span className="question-picker-text">{q}</span><span className={`question-state ${evaluations[i] ? "question-state-done" : ""}`}>{evaluations[i] ? "Reviewed" : answers[i]?.trim() ? "Draft" : "Pending"}</span></button>)}</div>
                    <div className="session-progress-heading current-progress-label"><span>QUESTION {questionIndex + 1} OF {questions.length}</span><span>{Math.round(((questionIndex + 1) / questions.length) * 100)}%</span></div>
                    <div className="session-progress-track"><div className="session-progress-fill" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}/></div>
                    <div className="current-question"><span className="result-label">CURRENT QUESTION</span><strong>{question}</strong><label className="field-label" htmlFor="answer">YOUR ANSWER</label><textarea id="answer" rows="6" value={answer} onChange={e => { setAnswer(e.target.value); setEvaluation(null); setAnswers(previous => ({ ...previous, [questionIndex]: e.target.value })); setEvaluations(previous => { const copy = { ...previous }; delete copy[questionIndex]; return copy; }); }} placeholder="Write your answer here. Aim for a definition, explanation, and example..."/><div className="answer-meta"><span>{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</span><span>Tip: explain the concept and add a practical example.</span></div><button className="primary-btn full-btn" disabled={loading} onClick={evaluate}>{loading ? "Reviewing answer..." : evaluation ? "Update feedback" : "Review my answer"} <ArrowRight size={17}/></button></div>
                    {evaluation && <div className="evaluation"><div className="evaluation-score"><span>{evaluation.mode === "ai" ? "AI answer evaluation" : "Rule-based practice score"}</span><strong>{evaluation.score}/100</strong></div><p>{evaluation.disclaimer}</p>{evaluation.correctness_summary && <div className="evaluation-relevance"><span>Technical review</span><p>{evaluation.correctness_summary}</p></div>}{evaluation.key_concepts?.length > 0 && <div className="evaluation-relevance"><span>Key concepts assessed</span><p>{evaluation.key_concepts.join(", ")}</p></div>}{evaluation.relevance && <div className="evaluation-relevance"><span>Question keyword coverage</span><strong>{evaluation.relevance.coverage_percent}%</strong><p>{evaluation.relevance.matched_keywords?.length ? `Recognized: ${evaluation.relevance.matched_keywords.join(", ")}` : "Try using the main concepts from the question in your answer."}</p></div>}<strong>Feedback</strong><ul>{(evaluation.strengths || []).map((x, i) => <li key={i}>{x}</li>)}</ul><strong>Next steps</strong><ul>{(evaluation.improvements || []).map((x, i) => <li key={i}>{x}</li>)}</ul><div className="sample-structure">{evaluation.sample_structure}</div></div>}
                    <div className="question-navigation"><button className="secondary-btn" disabled={questionIndex === 0} onClick={() => goToQuestion(questionIndex - 1)}>← Previous</button><button className="secondary-btn" disabled={questionIndex === questions.length - 1} onClick={() => goToQuestion(questionIndex + 1)}>Next question →</button></div>
                    <button className="primary-btn full-btn finish-session-btn" disabled={Object.keys(evaluations).length !== questions.length} onClick={finishSession}>Finish session and view summary <CheckCircle2 size={16}/></button>
                    {Object.keys(evaluations).length !== questions.length && <p className="finish-hint">Review {questions.length - Object.keys(evaluations).length} more question(s) to finish.</p>}
                  </>
                )}
              </div>
            </div>
          </section>}

          {active === "Performance" && <section className="tool-page">
            <div className="eyebrow"><Activity size={14}/> PERFORMANCE CENTER</div>
            <h1>Small improvements. <span>Real progress.</span></h1>
            <p className="page-lead">Track your mock interview results, review trends, and identify what to practise next. History is stored in this browser.</p>
            {history.length === 0 ? <div className="panel performance-empty"><div className="empty-icon"><Activity size={28}/></div><h3>Your progress story starts here</h3><p>Complete a mock interview to see your average score, score trends, session history, and areas to improve. History is stored in this browser, not a cloud account.</p><button className="primary-btn" onClick={() => setActive("Mock Interview")}>Start a mock interview <ArrowRight size={16}/></button></div> : <>
              {(() => {
                const totalQuestions = history.reduce((sum, item) => sum + Number(item.questionCount || 0), 0);
                const averageScore = Math.round(history.reduce((sum, item) => sum + Number(item.averageScore || 0), 0) / history.length);
                const bestScore = Math.max(...history.map(item => Number(item.averageScore || 0)));
                const recent = history.slice(0, 8).reverse();
                const recentAverage = recent.length ? Math.round(recent.reduce((sum, item) => sum + Number(item.averageScore || 0), 0) / recent.length) : 0;
                const previous = history.slice(8, 16);
                const previousAverage = previous.length ? Math.round(previous.reduce((sum, item) => sum + Number(item.averageScore || 0), 0) / previous.length) : null;
                const trend = previousAverage === null ? null : recentAverage - previousAverage;
                const allResults = history.flatMap(item => item.results || []);
                const weakResults = [...allResults].sort((a, b) => Number(a.score || 0) - Number(b.score || 0)).slice(0, 3);
                const strongestResults = [...allResults].sort((a, b) => Number(b.score || 0) - Number(a.score || 0)).slice(0, 3);
                return <>
                  <div className="stats-grid performance-stats">
                    <Stat icon={Target} label="Sessions completed" value={history.length} note="Saved in this browser"/>
                    <Stat icon={Gauge} label="Average score" value={`${averageScore}/100`} note="Across completed sessions"/>
                    <Stat icon={CheckCircle2} label="Best session" value={`${bestScore}/100`} note="Highest session average"/>
                    <Stat icon={Activity} label="Questions reviewed" value={totalQuestions} note="Across saved sessions"/>
                  </div>

                  <div className="performance-grid">
                    <div className="panel performance-chart-panel">
                      <div className="history-header"><div><h3><Activity size={18}/> Score progress</h3><p>Up to your 8 most recent sessions, shown oldest to newest</p></div><span className="chart-average">{recentAverage}<small>/100 avg</small></span></div>
                      <div className="score-chart" role="img" aria-label="Average scores for recent interview sessions">
                        {recent.map((item, index) => <div className="score-chart-column" key={item.id || `${item.completedAt}-${index}`}>
                          <span className="score-chart-value">{Number(item.averageScore || 0)}</span>
                          <div className="score-chart-bar-track"><div className="score-chart-bar" style={{height: `${Math.max(3, Math.min(100, Number(item.averageScore || 0)))}%`}}/></div>
                          <span className="score-chart-label">{new Date(item.completedAt).toLocaleDateString(undefined, {month:"short", day:"numeric"})}</span>
                        </div>)}
                      </div>
                      <div className="chart-legend"><span><i/> Session average score</span><span>Scale: 0–100</span></div>
                    </div>
                    <div className="panel insight-panel">
                      <h3><Sparkles size={18}/> Practice insights</h3>
                      <p className="insight-intro">Use these learning indicators to decide what to practise next.</p>
                      <div className="insight-item"><strong>{trend === null ? "Build your baseline" : trend > 0 ? `Score average up ${trend} points` : trend < 0 ? `Score average down ${Math.abs(trend)} points` : "Score average unchanged"}</strong><p>{trend === null ? "Complete at least nine sessions to compare your most recent eight sessions with earlier practice." : "This compares your most recent eight sessions with the preceding sessions available in your history."}</p></div>
                      <div className="insight-item"><strong>Review lower-scoring answers</strong>{weakResults.length ? <ul>{weakResults.map((item, index) => <li key={`weak-${index}`}>{item.question} <span>{Number(item.score || 0)}/100</span></li>)}</ul> : <p>Complete more questions to find topics to review.</p>}</div>
                      <div className="insight-item"><strong>Keep using your strengths</strong>{strongestResults.length ? <ul>{strongestResults.map((item, index) => <li key={`strong-${index}`}>{item.question} <span>{Number(item.score || 0)}/100</span></li>)}</ul> : <p>Your strongest answers will appear here.</p>}</div>
                      <p className="disclaimer">Scores are based on the app's rule-based practice rubric, not verified technical correctness or hiring outcomes.</p>
                    </div>
                  </div>

                  <div className="panel history-panel"><div className="history-header"><div><h3><Activity size={18}/> Session history</h3><p>Most recent sessions first · {history.length} saved</p></div><button className="secondary-btn" onClick={() => { if (window.confirm("Delete all saved interview history from this browser? This cannot be undone.")) { setHistory([]); localStorage.removeItem("prepwise-interview-history"); } }}>Clear history</button></div>
                    <div className="history-list">{history.map((item) => <article className="history-card" key={item.id}><div className="history-card-top"><div><strong>{item.role}</strong><span>{item.category} · {new Date(item.completedAt).toLocaleString()}</span></div><div className="history-score">{item.averageScore}<small>/100</small></div></div><p>{item.questionCount} questions reviewed</p><div className="history-question-list">{(item.results || []).map((result, index) => <div key={`${item.id}-${index}`}><span>Q{index + 1}</span><p>{result.question}</p><strong>{result.score}/100</strong></div>)}</div></article>)}</div>
                  </div>
                </>;
              })()}
            </>}
          </section>}

          <footer><span>PrepWise · AI Interview & Resume Intelligence Platform</span><span>Learning prototype <span className="footer-dot">•</span> v0.1.0</span></footer>

        </div>

      </main>

      {mobileOpen && <button className="mobile-scrim" onClick={()=>setMobileOpen(false)} aria-label="Close menu"/>}

    </div>

  );

}

function Stat({icon: Icon,label,value,note}) { return <div className="stat-card"><div className="stat-top"><span className="stat-icon"><Icon size={18}/></span><span className="stat-label">{label}</span></div><strong className="stat-value">{value}</strong><span className="stat-note">{note}</span></div>; }

function Feature({icon: Icon,number,title,description,tag,onClick}) { return <button className="feature-card" onClick={onClick}><div className="feature-top"><span className="feature-icon"><Icon size={20}/></span><span className="feature-number">{number}</span></div><h3>{title}</h3><p>{description}</p><div className="feature-bottom"><span>{tag}</span><ArrowRight size={17}/></div></button>; }

function ResultList({title,items,empty}) { return <div className="result-list"><strong>{title} <span>{items.length}</span></strong>{items.length?<div className="skill-chips">{items.map(item=><span key={item}>{item}</span>)}</div>:<p>{empty}</p>}</div>; }
