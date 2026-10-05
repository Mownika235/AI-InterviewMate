# Requirements Document

## Introduction

AI InterviewMate is an AI-powered interview preparation platform targeted at students and fresh graduates. The platform allows users to select a job role and difficulty level, receive interview questions generated or retrieved for that context, submit written answers, and receive AI-evaluated scores and structured feedback. Users can continue practicing across multiple questions in a session and review a history of their past attempts.

The MVP consists of three layers:
- A clean, beginner-friendly frontend UI
- A backend REST API that orchestrates questions and answer evaluation
- An AI evaluation layer (powered by an LLM API) that scores answers and generates feedback

---

## Glossary

- **User**: A student or fresh graduate using the platform to prepare for job interviews.
- **Platform**: The AI InterviewMate web application (frontend + backend together).
- **Backend**: The server-side REST API layer of the Platform.
- **Frontend**: The browser-based UI layer of the Platform.
- **AI_Evaluator**: The AI evaluation layer that receives answers and returns scores and feedback, backed by an LLM API (e.g., OpenAI GPT).
- **Job_Role**: A predefined category representing a target engineering role (e.g., "Java Developer", "Software Developer", "Frontend Developer").
- **Difficulty_Level**: One of three preset values — Easy, Medium, or Hard — representing the complexity of an interview question.
- **Question**: An interview question associated with a specific Job_Role and Difficulty_Level.
- **Answer**: The text submitted by the User in response to a Question.
- **Score**: An integer between 0 and 10 (inclusive) representing how well the User's Answer addressed the Question.
- **Feedback**: A structured text response from the AI_Evaluator containing identified strengths and specific areas for improvement.
- **Session**: A single continuous usage period starting when the User selects a Job_Role and Difficulty_Level.
- **History**: A persistent, ordered list of past Question–Answer–Score–Feedback records associated with the User.

---

## Requirements

### Requirement 1: Job Role and Difficulty Selection

**User Story:** As a User, I want to select a Job_Role and Difficulty_Level before starting, so that I receive questions relevant to the position and difficulty I am targeting.

#### Acceptance Criteria

1. THE Frontend SHALL display a selection interface containing exactly the following Job_Role options: "Java Developer", "Software Developer", "Frontend Developer", "Backend Developer", and "Full Stack Developer".
2. THE Frontend SHALL display exactly three Difficulty_Level options: "Easy", "Medium", and "Hard".
3. WHEN the User selects a Job_Role and a Difficulty_Level and confirms the selection, THE Frontend SHALL transition to the question view.
4. IF the User has not selected both a Job_Role and a Difficulty_Level, THEN THE Frontend SHALL disable the confirm button, preventing submission until both fields are selected.
5. WHILE a Session is active, THE Frontend SHALL display the selected Job_Role and Difficulty_Level as visible labels in the interface header on every view within the Session.

---

### Requirement 2: Question Retrieval

**User Story:** As a User, I want to receive an interview question based on my selected Job_Role and Difficulty_Level, so that I can practice answering targeted questions.

#### Acceptance Criteria

1. WHEN the User confirms a Job_Role and Difficulty_Level selection, THE Backend SHALL return exactly one Question matching the selected Job_Role and Difficulty_Level.
2. WHEN the User requests a new question during an active Session, THE Backend SHALL return a Question matching the active Session's Job_Role and Difficulty_Level.
3. IF at least one Question matching the selected Job_Role and Difficulty_Level has not been displayed to the User in the current Session, THEN THE Backend SHALL return one of those unasked Questions.
4. IF no unused Questions remain for the selected Job_Role and Difficulty_Level combination, THEN THE Backend SHALL return a previously asked Question and include a boolean `repeated` field set to `true` in the response body.
5. WHEN the Backend returns a Question, THE Frontend SHALL display the retrieved Question text fully visible without scrolling, before the Answer input area.
6. WHEN the Backend processes a single concurrent question retrieval request, THE Backend SHALL respond within 3 seconds.

---

### Requirement 3: Answer Submission

**User Story:** As a User, I want to type and submit my answer to the displayed question, so that the platform can evaluate my response.

#### Acceptance Criteria

1. THE Frontend SHALL provide a text input area for the User to enter an Answer.
2. THE Frontend SHALL allow Answer text of between 1 and 2000 characters.
3. IF the User attempts to submit an empty Answer, THEN THE Frontend SHALL display a validation message indicating that an Answer is required before submission.
4. WHEN the User's Answer reaches 2000 characters while typing, THE Frontend SHALL prevent further character input and display a character limit warning in real time.
5. WHEN the User submits a valid Answer, THE Frontend SHALL disable the submit button and display a loading indicator.
6. WHEN evaluation results are returned successfully, THE Frontend SHALL re-enable the submit button and remove the loading indicator.
7. IF evaluation fails or the loading state exceeds 30 seconds without a response, THEN THE Frontend SHALL re-enable the submit button, remove the loading indicator, and display an error message.
8. WHEN the User types in the Answer input area, THE Frontend SHALL display a character count indicator showing characters entered out of 2000 maximum.

---

### Requirement 4: AI-Powered Answer Evaluation

**User Story:** As a User, I want my submitted answer evaluated by AI, so that I receive an objective Score and actionable Feedback.

#### Acceptance Criteria

1. WHEN the Backend receives a submitted Answer along with its associated Question, Job_Role, and Difficulty_Level, THE Backend SHALL forward these to the AI_Evaluator and return an evaluation result.
2. THE AI_Evaluator SHALL return a Score that is an integer value between 0 and 10 inclusive.
3. THE AI_Evaluator SHALL return Feedback containing at least one identified strength and at least one area for improvement.
4. THE Backend SHALL parse the AI_Evaluator response and extract a Score (integer 0–10) and Feedback (containing at least one strength and one improvement) before returning results to the Frontend.
5. IF the AI_Evaluator returns a response that cannot be parsed into a valid Score and Feedback, THEN THE Backend SHALL return an error response with HTTP status 502 and an error message indicating the evaluation service returned an unparseable response.
6. IF the AI_Evaluator does not respond within 10 seconds, THEN THE Backend SHALL return HTTP status 504 with a JSON error body indicating a timeout.
7. THE Frontend SHALL display the Score as a numeric value in the format "X / 10".
8. THE Frontend SHALL display the Feedback in two labeled sections: one labeled "Strengths" and one labeled "Areas for Improvement".
9. IF the Backend receives an Answer submission with an empty or whitespace-only Answer field, THEN THE Backend SHALL return HTTP 400 with a JSON error body indicating the Answer field is required.

---

### Requirement 5: Continue Practicing (Next Question)

**User Story:** As a User, I want to request another question after receiving feedback, so that I can continue practicing without restarting the session.

#### Acceptance Criteria

1. WHEN evaluation results are displayed, THE Frontend SHALL present a "Next Question" button.
2. WHEN the User clicks "Next Question", THE Frontend SHALL clear the previous Answer input field.
3. WHEN the User clicks "Next Question", THE Frontend SHALL hide the previous evaluation results.
4. WHEN the User clicks "Next Question", THE Frontend SHALL request a new Question from the Backend using the current Session's Job_Role and Difficulty_Level.
5. THE Frontend SHALL not require the User to re-select Job_Role or Difficulty_Level between questions within the same Session.
6. WHEN the User clicks "Next Question", THE Frontend SHALL display a loading indicator until the new Question is returned or the request fails.
7. IF the loading state for the next question exceeds 30 seconds or the Backend returns an error, THEN THE Frontend SHALL remove the loading indicator and display an error message to the User.

---

### Requirement 6: Session History

**User Story:** As a User, I want to view a history of the questions I have answered in my current session along with their scores and feedback, so that I can track my progress.

#### Acceptance Criteria

1. THE Platform SHALL maintain an ordered History of all Question–Answer–Score–Feedback records for the current Session.
2. WHEN at least one evaluation has been completed in the current Session, THE Frontend SHALL display the Session History showing entries in reverse chronological order (most recent first); WHEN no evaluations have been completed, THE Frontend SHALL hide the Session History panel.
3. THE Frontend SHALL display the following fields for each History entry: the Question text, the User's Answer, the Score (in "X / 10" format), and the Feedback.
4. WHEN a new evaluation is completed, THE Frontend SHALL add the new entry to the top of the Session History without requiring a page reload.
5. THE Frontend SHALL render each History entry expanded by default and allow the User to collapse or expand individual entries to manage screen space.
6. WHEN the User starts a new Session by changing Job_Role or Difficulty_Level, THE Frontend SHALL immediately clear the existing Session History before generating the next question.

---

### Requirement 7: New Session / Reset

**User Story:** As a User, I want to start a new session with a different job role or difficulty, so that I can practice for a different target.

#### Acceptance Criteria

1. THE Frontend SHALL provide a "Start New Session" control that is visible and enabled from the question view.
2. WHEN the User activates "Start New Session", THE Frontend SHALL display a confirmation dialog asking the User to confirm discarding current Session data.
3. WHEN the User confirms the dialog, THE Frontend SHALL clear all current Session data including History, the current Question, and the current Answer, and return to the selection interface.
4. WHEN the User cancels the dialog, THE Frontend SHALL dismiss the dialog and return the User to the question view with all Session data intact.

---

### Requirement 8: Non-Functional Requirements

**User Story:** As a User, I want the platform to be responsive, reliable, and easy to run locally, so that I can focus on practicing without technical friction.

#### Acceptance Criteria

1. THE Frontend SHALL render correctly on screen widths of 375px (mobile), 768px (tablet), and 1280px (desktop) without horizontal scrolling.
2. THE Backend SHALL expose a REST API that accepts and returns JSON payloads and uses HTTP status codes 200, 400, 404, 500, 502, and 504 appropriately.
3. THE Backend SHALL include a health-check endpoint at `GET /health` that returns HTTP 200 and a JSON body `{"status": "ok"}` when the service is running.
4. THE Platform SHALL be startable locally by running no more than two commands after dependencies are installed (one for the Frontend, one for the Backend).
5. THE Backend SHALL validate all incoming request payloads and return HTTP 400 with a JSON body containing an `error` field that identifies the missing or invalid field(s).
6. THE Platform SHALL store the LLM API key exclusively in a server-side environment variable and SHALL NOT expose it to the Frontend at any point.
7. THE Frontend SHALL apply color contrast between text and background meeting WCAG 2.1 AA requirements: a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text (18pt or 14pt bold).
8. THE Backend SHALL be implemented as a Node.js (Express) or Python (FastAPI/Flask) application.
9. THE Frontend SHALL be implemented as a React or plain HTML/CSS/JS application.
10. WHEN the Backend encounters an unhandled internal error, THE Backend SHALL return HTTP 500 with a JSON body containing an `error` field with a non-empty message and SHALL NOT include a stack trace in the response body.
