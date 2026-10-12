import json
import os
import re
from typing import Any

import httpx

QUESTIONS = {
    "Python Developer": {
        "Technical": [
            "Explain the difference between a list and a tuple in Python.",
            "What is a Python decorator, and when would you use one?",
            "How does exception handling work in Python?",
            "What is the difference between a shallow copy and a deep copy?",
            "Explain Python generators and the yield keyword.",
        ],
        "HR": [
            "Tell me about yourself and the skills relevant to this role.",
            "Describe a project challenge and how you addressed it.",
            "How do you respond to constructive feedback?",
        ],
        "Aptitude": [
            "A value increases from 80 to 100. What is the percentage increase?",
            "If five workers finish a task in ten days, how long would ten equally productive workers take?",
            "A product costs 800 rupees and has a 15% discount. What is the final price?",
        ],
    },
    "AIML Engineer": {
        "Technical": [
            "Explain the difference between supervised and unsupervised learning.",
            "What is overfitting, and how can you reduce it?",
            "Why do we split data into training, validation, and test sets?",
            "Explain precision, recall, and the F1 score, and when each is useful.",
            "What is data leakage in machine learning, and how can you prevent it?",
        ],
        "HR": [
            "Why are you interested in an AI/ML role?",
            "Describe an AI/ML project and how you evaluated its results.",
            "How would you explain a machine-learning model's limitations to a non-technical stakeholder?",
        ],
        "Aptitude": [
            "A classifier makes 90 correct predictions out of 100. What is its accuracy?",
            "Why can accuracy be misleading on an imbalanced dataset?",
            "A dataset has 1,000 rows and 20% are used for testing. How many test rows are there?",
        ],
    },
    "Java Developer": {
        "Technical": [
            "Explain the difference between an interface and an abstract class in Java.",
            "What is the difference between == and equals() in Java?",
            "Explain the four pillars of object-oriented programming.",
            "What is the difference between checked and unchecked exceptions in Java?",
            "Explain the purpose of the Java Collections Framework.",
        ],
        "HR": [
            "Tell me about a project where you used object-oriented programming.",
            "How do you approach learning an unfamiliar technology?",
            "Describe a time you worked with a team to solve a problem.",
        ],
        "Aptitude": [
            "What is the time complexity of binary search on a sorted array?",
            "A product costs 800 rupees and has a 15% discount. What is the final price?",
            "If a program processes 500 records in 5 seconds at a constant rate, how long would 2,000 records take?",
        ],
    },
}

STOPWORDS = {
    "explain", "what", "when", "where", "which", "would", "could", "should",
    "does", "your", "about", "from", "into", "that", "this", "with", "have",
    "been", "being", "there", "their", "they", "them", "then", "than", "also",
    "and", "the", "for", "are", "was", "were", "how", "why", "can", "you",
    "use", "used", "using", "between", "difference", "give", "example", "role"
}


def get_questions(role: str, category: str, count: int = 5) -> list[str]:
    role_questions = QUESTIONS.get(role, QUESTIONS["Python Developer"])
    category_questions = role_questions.get(category, role_questions["Technical"])
    return category_questions[:max(1, min(count, len(category_questions)))]


def _keywords(text: str) -> list[str]:
    words = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]*", (text or "").lower())
    return sorted({word.strip(".-") for word in words if len(word.strip(".-")) > 2 and word.strip(".-") not in STOPWORDS})


def _rule_based_evaluation(question: str, answer: str) -> dict:
    """Transparent fallback rubric. This does not validate factual correctness."""
    clean_answer = (answer or "").strip()
    lower_answer = clean_answer.lower()
    words = re.findall(r"\b[\w+#.-]+\b", clean_answer)
    word_count = len(words)
    question_terms = _keywords(question)
    answer_terms = set(_keywords(clean_answer))
    matched_terms = sorted(set(question_terms) & answer_terms)
    coverage = round(len(matched_terms) / len(question_terms) * 100) if question_terms else 0
    length_score = 0 if word_count == 0 else 5 if word_count < 15 else 10 if word_count < 35 else 15 if word_count < 60 else 20
    relevance_score = round(40 * coverage / 100)
    has_example = any(p in lower_answer for p in ["for example", "such as", "e.g.", "for instance", "in my project", "in a project"])
    has_reasoning = any(w in lower_answer for w in ["because", "therefore", "so that", "which means", "as a result"])
    example_score = 15 if has_example else 0
    reasoning_score = 10 if has_reasoning else 0
    has_structure = any(m in lower_answer for m in ["first", "second", "finally", "in summary", "the main", "there are"]) or clean_answer.count("\n") >= 2
    structure_score = 15 if has_structure else 0
    punctuation_score = 10 if word_count >= 10 and any(mark in clean_answer for mark in [".", ",", ";", ":"]) else 0
    score = min(100, length_score + relevance_score + example_score + reasoning_score + structure_score + punctuation_score)
    strengths, improvements = [], []
    if not clean_answer:
        improvements.append("Write a direct response before requesting feedback.")
    else:
        if word_count >= 35:
            strengths.append("The answer provides enough detail for a useful practice review.")
        else:
            improvements.append("Add more explanation: aim for a definition, reasoning, and example where appropriate.")
        if matched_terms:
            strengths.append("Your answer includes question-related terms: " + ", ".join(matched_terms[:8]) + ".")
        else:
            improvements.append("Address the main concepts in the question more directly.")
        if has_example:
            strengths.append("You included a practical example or use case.")
        else:
            improvements.append("Add a concrete example from a project, coursework, or a real use case.")
        if has_reasoning:
            strengths.append("You explained a reason or consequence.")
        else:
            improvements.append("Explain why the concept matters or how it works.")
        if not improvements:
            improvements.append("Review factual accuracy and mention a limitation or trade-off where relevant.")
    return {
        "score": score,
        "mode": "rule_based",
        "word_count": word_count,
        "strengths": strengths,
        "improvements": improvements,
        "relevance": {"coverage_percent": coverage, "matched_keywords": matched_terms, "question_keywords": question_terms},
        "sample_structure": "Direct answer/definition → key concept → reasoning → practical example → limitation or trade-off",
        "disclaimer": "Rule-based fallback: this score reflects answer length, keyword overlap, examples, reasoning, and structure. It does not verify technical correctness. Configure OPENAI_API_KEY to enable AI evaluation."
    }


def _parse_ai_json(content: str) -> dict[str, Any]:
    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError("The AI provider returned an unreadable evaluation. Please retry.") from exc
    score = max(0, min(100, int(round(float(data.get("score", 0))))))
    strengths = data.get("strengths", [])
    improvements = data.get("improvements", [])
    key_concepts = data.get("key_concepts", [])
    if not isinstance(strengths, list) or not isinstance(improvements, list) or not isinstance(key_concepts, list):
        raise ValueError("The AI provider returned an invalid feedback structure. Please retry.")
    return {
        "score": score,
        "mode": "ai",
        "word_count": len(re.findall(r"\b[\w+#.-]+\b", data.get("answer_text_for_count", ""))),
        "strengths": [str(x)[:500] for x in strengths[:6]],
        "improvements": [str(x)[:500] for x in improvements[:6]],
        "key_concepts": [str(x)[:100] for x in key_concepts[:12]],
        "correctness_summary": str(data.get("correctness_summary", "Review the feedback and verify important facts."))[:1200],
        "relevance": {"coverage_percent": max(0, min(100, int(data.get("relevance_percent", 0)))), "matched_keywords": [], "question_keywords": []},
        "sample_structure": str(data.get("sample_structure", "Direct answer → explanation → example → limitation or trade-off"))[:500],
        "disclaimer": "AI-generated practice feedback. It can make mistakes; verify important technical details and do not treat this score as a hiring decision."
    }


def _evaluate_with_openai(question: str, answer: str, role: str = "", category: str = "") -> dict:
    """Try OpenAI first; fall back to the transparent local rubric if unavailable."""
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        result = _rule_based_evaluation(question, answer)
        result["fallback_reason"] = "OPENAI_API_KEY is not configured; local rule-based evaluation was used."
        return result

    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip() or "gpt-4.1-mini"
    system_prompt = """You are a fair, constructive interview practice evaluator. Evaluate the candidate's answer for technical/factual correctness, relevance to the question, important concepts, reasoning, clarity, and useful examples. Do not reward length alone. Be honest about uncertainty; do not invent credentials or claim you verified anything outside the answer. For aptitude questions, check the reasoning and result. For HR questions, evaluate specificity, reflection, and relevance without judging personality. Scores are practice guidance, not hiring decisions. Return ONLY valid JSON with keys: score (integer 0-100), correctness_summary (string), strengths (array of 1-4 concise strings), improvements (array of 1-5 actionable strings), key_concepts (array of strings), relevance_percent (integer 0-100), sample_structure (string)."""
    user_prompt = f"Role: {role or 'Not specified'}\nQuestion category: {category or 'Not specified'}\nInterview question: {question}\nCandidate answer:\n{answer}\n\nEvaluate the answer, distinguish correct points from errors or omissions, and give actionable feedback. If the answer is blank or too vague, score it accordingly."

    fallback_reason = "AI evaluation was unavailable; local rule-based evaluation was used."
    try:
        with httpx.Client(timeout=httpx.Timeout(35.0, connect=10.0)) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                },
            )

        if response.status_code >= 400:
            # Do not fail the interview review when the provider reports exhausted
            # credits, quota limits, invalid model access, or another API error.
            try:
                provider_message = response.json().get("error", {}).get("message", "")
                provider_code = response.json().get("error", {}).get("code", "")
                if provider_code:
                    fallback_reason = f"OpenAI API error ({provider_code}): {provider_message[:220]} Local rule-based evaluation was used."
                elif provider_message:
                    fallback_reason = f"OpenAI API error: {provider_message[:220]} Local rule-based evaluation was used."
                else:
                    fallback_reason = f"OpenAI returned HTTP {response.status_code}. Local rule-based evaluation was used."
            except (ValueError, TypeError, AttributeError):
                fallback_reason = f"OpenAI returned HTTP {response.status_code}. Local rule-based evaluation was used."
            result = _rule_based_evaluation(question, answer)
            result["fallback_reason"] = fallback_reason
            return result

        payload = response.json()
        content = payload["choices"][0]["message"]["content"]
        result = _parse_ai_json(content)
        result["word_count"] = len(re.findall(r"\b[\w+#.-]+\b", answer or ""))
        result["relevance"]["matched_keywords"] = []
        result["relevance"]["question_keywords"] = []
        return result

    except (httpx.TimeoutException, httpx.RequestError) as exc:
        result = _rule_based_evaluation(question, answer)
        result["fallback_reason"] = "Could not reach the AI evaluation service. Local rule-based evaluation was used."
        return result
    except (KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError):
        result = _rule_based_evaluation(question, answer)
        result["fallback_reason"] = "The AI provider returned an unreadable response. Local rule-based evaluation was used."
        return result


def evaluate_answer(question: str, answer: str, role: str = "", category: str = "") -> dict:
    """Use OpenAI when configured; otherwise use a clearly labeled rule-based fallback."""
    return _evaluate_with_openai(question, answer, role, category)
