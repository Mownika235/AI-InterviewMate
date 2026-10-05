# Implementation Plan: AI InterviewMate

## Overview

Implement a full-stack AI interview preparation platform with a React SPA frontend and a Node.js/Express backend. The backend serves questions from a static JSON question bank and integrates with OpenAI GPT for answer evaluation. Session state is held on the client (stateless backend). Property-based tests use fast-check (Node.js).

---

## Tasks

- [ ] 1. Set up project structure, dependencies, and configuration
  - [ ] 1.1 Initialise the backend Node.js/Express project
    - Create `backend/` directory with `package.json` (Express, dotenv, cors, openai, fast-check, jest)
    - Add `backend/.env.example` with `OPENAI_API_KEY=`, `PORT=5000`
    - Add `backend/server.js` entry point with Express app, JSON middleware, CORS, and `PORT` from env
    - _Requirements: 8.4, 8.8_

  - [ ] 1.2 Initialise the React frontend project
    - Create `frontend/` with Vite + React template (`npm create vite@latest frontend -- --template react`)
    - Add proxy config (`vite.config.js`) forwarding `/api` and `/health` to `http://localhost:5000`
    - _Requirements: 8.4, 8.9_

  - [ ] 1.3 Create the static question bank JSON file
    - Create `backend/data/questions.json` with at least 75 questions (5 roles × 3 difficulty levels × 5 questions minimum per combination)
    - Each entry: `{ "id": "q_NNN", "jobRole": "...", "difficultyLevel": "...", "text": "..." }`
    - Cover all five roles: Java Developer, Software Developer, Frontend Developer, Backend Developer, Full Stack Developer
    - _Requirements: 2.1, 2.2_

- [-] 2. Implement the backend health-check and global error handler
  - [-] 2.1 Add `GET /health` route
    - Create `backend/routes/health.js` returning `{ "status": "ok" }` with HTTP 200
    - Mount route in `server.js`
    - _Requirements: 8.3_

  - [-] 2.2 Add global error handler middleware
    - Create `backend/middleware/errorHandler.js` that catches all unhandled errors
    - Returns HTTP 500 `{ "error": "<message>" }` — no `stack` field in response
    - Register as last middleware in `server.js`
    - _Requirements: 8.10_

  - [ ]* 2.3 Write property test for global error handler (Property 18)
    - **Property 18: Unhandled Internal Error Returns HTTP 500 Without Stack Trace**
    - Use fast-check to generate arbitrary error messages thrown inside a route; assert response is HTTP 500, body has `error` field, body has no `stack` field
    - **Validates: Requirements 8.10**

- [ ] 3. Implement question selection service and `/api/questions` endpoint
  - [ ] 3.1 Create `questionService.js` — question selection logic
    - Load `questions.json` at startup
    - Export `selectQuestion(jobRole, difficultyLevel, askedQuestionIds)`:
      - Filters bank to matching role + difficulty
      - Removes IDs in `askedQuestionIds`
      - Returns a random unasked question with `repeated: false`; if none remain, returns a random question with `repeated: true`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 3.2 Write property test for question selection — matches role/difficulty (Property 2)
    - **Property 2: Question Retrieval Matches Requested Role and Difficulty**
    - Use fast-check to generate valid role/difficulty pairs and arbitrary `askedQuestionIds`; assert every returned question has matching `jobRole` and `difficultyLevel`
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 3.3 Write property test for question selection — avoids asked questions (Property 3)
    - **Property 3: Question Retrieval Avoids Previously Asked Questions**
    - Use fast-check to generate `askedQuestionIds` that do not exhaust the bank; assert returned question id is not in `askedQuestionIds`
    - **Validates: Requirements 2.3**

  - [ ]* 3.4 Write property test for question selection — exhausted bank signals repetition (Property 4)
    - **Property 4: Exhausted Question Bank Signals Repetition**
    - Use fast-check to generate all question IDs for a role/difficulty as `askedQuestionIds`; assert response includes `repeated: true`
    - **Validates: Requirements 2.4**

  - [ ] 3.5 Create `backend/routes/questions.js` — `POST /api/questions` endpoint
    - Validate `jobRole` (required, one of 5 valid values), `difficultyLevel` (required, one of 3 valid values), `askedQuestionIds` (required, array of strings)
    - Return 400 with `{ "error": "..." }` on validation failure
    - Call `selectQuestion` and return question object with HTTP 200
    - Mount route in `server.js`
    - _Requirements: 2.1, 2.3, 2.4, 8.2, 8.5_

  - [ ]* 3.6 Write property test for invalid request payload → HTTP 400 (Property 17)
    - **Property 17: Invalid Request Payload Returns HTTP 400 with Error Field**
    - Use fast-check to generate requests with missing or invalid `jobRole`/`difficultyLevel`; assert HTTP 400 and `error` field present
    - **Validates: Requirements 8.5**

- [ ] 4. Implement evaluation service and `/api/evaluate` endpoint
  - [ ] 4.1 Create `evaluationService.js` — LLM prompt construction and response parsing
    - Build structured prompt from `jobRole`, `difficultyLevel`, `question`, `answer`
    - Call OpenAI Chat Completions API with a 10-second timeout (using `openai` SDK)
    - Parse JSON from LLM response; validate: `score` is integer 0–10, `strengths` non-empty array, `improvements` non-empty array
    - Throw typed errors: `ParseError` on invalid response → 502; `TimeoutError` on timeout → 504
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 4.2 Write property test for evaluation response parse validity (Property 7)
    - **Property 7: Evaluation Response Parse Validity**
    - Use fast-check to generate valid LLM JSON payloads (score 0–10, non-empty arrays); assert parse function returns an `EvaluationResult` with all required fields in range
    - **Validates: Requirements 4.2, 4.3, 4.4**

  - [ ]* 4.3 Write property test for unparseable evaluator response → 502 (Property 8)
    - **Property 8: Unparseable Evaluator Response Produces 502**
    - Use fast-check to generate non-JSON strings, JSON missing required fields, out-of-range scores, and empty arrays; assert each produces `ParseError` / HTTP 502
    - **Validates: Requirements 4.5**

  - [ ] 4.4 Create `backend/routes/evaluate.js` — `POST /api/evaluate` endpoint
    - Validate presence of `question`, `answer` (non-empty, non-whitespace-only, ≤ 2000 chars), `jobRole`, `difficultyLevel`
    - Return 400 for empty/whitespace `answer`; 400 for missing fields
    - Call `evaluationService`; map `ParseError` → 502, `TimeoutError` → 504
    - Return `{ score, feedback: { strengths, improvements } }` on success
    - Mount route in `server.js`
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.9, 8.2, 8.5_

  - [ ]* 4.5 Write property test for whitespace-only answer → HTTP 400 (Property 10)
    - **Property 10: Whitespace-Only Answer Rejected with HTTP 400**
    - Use fast-check to generate strings of whitespace characters (space, tab, newline); assert HTTP 400 with `error` field
    - **Validates: Requirements 4.9**

- [ ] 5. Checkpoint — verify backend is fully functional
  - Ensure all backend unit and property tests pass: `cd backend && npm test`
  - Manually verify `GET /health`, `POST /api/questions`, and `POST /api/evaluate` with a REST client (curl or Postman)
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement frontend core: state management and API client
  - [ ] 6.1 Create session state and API client module
    - Create `frontend/src/api.js` with `fetchQuestion(jobRole, difficultyLevel, askedQuestionIds)` and `evaluateAnswer(payload)` using `fetch`
    - Create `frontend/src/hooks/useSession.js` (or equivalent context) managing `SessionState`: `jobRole`, `difficultyLevel`, `currentQuestion`, `currentAnswer`, `evaluationResult`, `askedQuestionIds`, `history`, `view`
    - _Requirements: 1.3, 2.1, 5.4, 5.5, 6.1_

  - [ ]* 6.2 Write property test for next-question API call uses correct session parameters (Property 12)
    - **Property 12: Next Question API Call Uses Current Session Parameters**
    - Use fast-check to generate `jobRole`/`difficultyLevel` pairs; spy on the API client and assert the outgoing request carries the exact current session values
    - **Validates: Requirements 5.4, 5.5**

- [ ] 7. Implement frontend SelectionScreen component
  - [ ] 7.1 Build `SelectionScreen` with `JobRoleSelector`, `DifficultySelector`, and `StartButton`
    - Render all 5 job role options and all 3 difficulty levels
    - Keep "Start" button disabled until both fields are selected (controlled component)
    - On confirm, call `fetchQuestion` and transition `view` to `"question"`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 8. Implement frontend SessionScreen — question and answer panels
  - [ ] 8.1 Build `SessionHeader`, `QuestionPanel`, and `AnswerPanel` components
    - `SessionHeader`: display active `jobRole` and `difficultyLevel` labels
    - `QuestionPanel`: render question text fully visible
    - `AnswerTextArea`: controlled input with live character count display (`{n} / 2000`)
    - Block input beyond 2000 characters; show character limit warning in real time
    - `SubmitButton`: disabled while loading; `LoadingIndicator` visible during API call
    - Inline validation message when submit is attempted with empty answer
    - _Requirements: 1.5, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 8.2 Write property test for answer character limit enforcement (Property 5)
    - **Property 5: Answer Character Limit Enforcement**
    - Use fast-check to generate strings of length 1–2000 and > 2000; assert that inputs within limit are accepted and inputs beyond limit are blocked
    - **Validates: Requirements 3.2, 3.4**

  - [ ]* 8.3 Write property test for character count display accuracy (Property 6)
    - **Property 6: Character Count Display Accuracy**
    - Use fast-check to generate strings up to 2000 chars; render `AnswerTextArea` with React Testing Library; assert displayed count equals `string.length`
    - **Validates: Requirements 3.8**

  - [ ]* 8.4 Write property test for session header displays active role/difficulty (Property 1)
    - **Property 1: Session Header Always Shows Active Role and Difficulty**
    - Use fast-check to generate valid role/difficulty pairs; render `SessionHeader` and assert both values appear as visible text
    - **Validates: Requirements 1.5**

- [ ] 9. Implement frontend EvaluationPanel and NextQuestion flow
  - [ ] 9.1 Build `EvaluationPanel` component
    - Display score as `"{score} / 10"`
    - Display two labeled sections: "Strengths" and "Areas for Improvement"
    - Show after successful evaluation; handle and display API errors
    - Re-enable submit button and remove loading indicator on success or failure/timeout (30 s)
    - _Requirements: 4.7, 4.8, 3.6, 3.7_

  - [ ]* 9.2 Write property test for evaluation results display format (Property 9)
    - **Property 9: Evaluation Results Display Format**
    - Use fast-check to generate `EvaluationResult` objects with score in [0,10] and non-empty arrays; render `EvaluationPanel` and assert `"{score} / 10"` text and both section labels are present
    - **Validates: Requirements 4.7, 4.8**

  - [ ] 9.3 Implement "Next Question" button and behaviour
    - After evaluation, render `NextQuestionButton`
    - On click: clear `currentAnswer`, hide evaluation results, show loading indicator, call `fetchQuestion` with current session params and updated `askedQuestionIds`
    - Handle 30 s timeout and error states; show error message on failure
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 9.4 Write property test for next question clears answer field (Property 11)
    - **Property 11: Next Question Clears Answer Field**
    - Use fast-check to generate non-empty answer strings; simulate clicking "Next Question" via state; assert `currentAnswer` becomes `""`
    - **Validates: Requirements 5.2**

- [ ] 10. Implement frontend HistoryPanel
  - [ ] 10.1 Build `HistoryPanel` and `HistoryEntry` components
    - Show panel only when `history.length > 0`; hide when empty
    - Render entries in reverse chronological order (most recent first)
    - Each entry expanded by default; toggle collapse/expand on click
    - Each entry displays: question text, user answer, score in `"X / 10"`, strengths, improvements
    - Add new entry to top of history immediately after evaluation completes (no page reload)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 10.2 Write property test for history ordering and completeness (Property 13)
    - **Property 13: Session History Ordering and Completeness**
    - Use fast-check to generate sequences of `HistoryEntry` objects; assert panel renders them newest-first and that count equals input length
    - **Validates: Requirements 6.1, 6.2, 6.4**

  - [ ]* 10.3 Write property test for history entry displays all required fields (Property 14)
    - **Property 14: History Entry Displays All Required Fields**
    - Use fast-check to generate `HistoryEntry` values; render `HistoryEntry` and assert question text, answer, `"X / 10"` score, and feedback sections are visible
    - **Validates: Requirements 6.3**

- [ ] 11. Implement New Session / Reset flow
  - [ ] 11.1 Build `NewSessionButton` and `ConfirmationDialog`
    - `NewSessionButton`: always visible and enabled from question view
    - On click: show `ConfirmationDialog`
    - On confirm: clear all session state (history, current question, answer, evaluation result) and navigate to `"selection"` view, clearing history
    - On cancel: dismiss dialog; all session state remains intact
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 6.6_

  - [ ]* 11.2 Write property test for new session clears all state (Property 15)
    - **Property 15: New Session Clears All Session State**
    - Use fast-check to generate non-empty session states; simulate confirm action and assert history is empty, current fields are null/empty, view is `"selection"`
    - **Validates: Requirements 6.6, 7.3**

  - [ ]* 11.3 Write property test for cancelling new session preserves state (Property 16)
    - **Property 16: Cancelling New Session Preserves All Session State**
    - Use fast-check to generate arbitrary session states; simulate cancel action and assert every field is unchanged
    - **Validates: Requirements 7.4**

- [ ] 12. Apply responsive layout and WCAG 2.1 AA colour contrast
  - [ ] 12.1 Add responsive CSS / styling
    - Ensure layout renders without horizontal scrolling at 375 px, 768 px, and 1280 px
    - Apply colour palette that meets WCAG 2.1 AA contrast ratios (4.5:1 normal text, 3:1 large text)
    - _Requirements: 8.1, 8.7_

- [ ] 13. Wire environment variable handling and security hardening
  - [ ] 13.1 Secure API key handling
    - Backend reads `OPENAI_API_KEY` exclusively from `process.env` (via dotenv)
    - Confirm no key reference exists in any frontend file or network response
    - Add startup check: if `OPENAI_API_KEY` is missing, log a clear error and exit
    - _Requirements: 8.6_

- [ ] 14. Final checkpoint — end-to-end verification
  - Run full test suite: `cd backend && npm test && cd ../frontend && npm test -- --run`
  - Verify `npm run dev` (frontend) and `node server.js` (backend) are the only two commands needed to run the platform locally
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check and must run a minimum of 100 iterations each
- The 18 correctness properties from the design document are each covered by a corresponding `*` sub-task
- Checkpoints (tasks 5 and 14) ensure incremental, verified progress
- The backend is stateless — `askedQuestionIds` is always sent by the frontend with each request
- The LLM API key must never appear in any frontend bundle or API response

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1"] },
    { "id": 2, "tasks": ["2.3", "3.2", "3.3", "3.4", "3.5", "4.1", "6.1"] },
    { "id": 3, "tasks": ["3.6", "4.2", "4.3", "4.4", "6.2", "7.1"] },
    { "id": 4, "tasks": ["4.5", "8.1", "9.3", "10.1", "11.1"] },
    { "id": 5, "tasks": ["8.2", "8.3", "8.4", "9.1", "9.4", "10.2", "10.3", "11.2", "11.3"] },
    { "id": 6, "tasks": ["9.2", "12.1", "13.1"] }
  ]
}
```
