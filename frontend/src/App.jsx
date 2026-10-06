import { useEffect, useState } from "react";

function App() {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/questions")
      .then((response) => response.json())
      .then((data) => setQuestions(data));
  }, []);

  return (
    <div>
      <h1>AI InterviewMate</h1>

      {questions.map((question) => (
        <div key={question.id}>
          <h3>{question.text}</h3>
          <p>
            {question.jobRole} - {question.difficultyLevel}
          </p>
        </div>
      ))}
    </div>
  );
}

export default App;