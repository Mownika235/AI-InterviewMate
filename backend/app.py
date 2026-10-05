from fastapi import FastAPI
import json

app = FastAPI()

with open("data/questions.json", "r") as file:
    questions = json.load(file)

@app.get("/")
def home():
    return {"message": "Adaptive Tutor Backend Running"}

@app.get("/questions")
def get_questions():
    return questions