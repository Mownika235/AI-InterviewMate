async function loadQuestions() {
    const response = await fetch("http://127.0.0.1:8000/questions");
    const questions = await response.json();

    console.log(questions);
}

loadQuestions();