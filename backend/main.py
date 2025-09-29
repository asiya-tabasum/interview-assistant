from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sqlite3
import os
import shutil
from datetime import datetime
from app.services.resume_parser import ResumeParser
from app.services.llm_service import LLMService

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
resume_parser = ResumeParser()
llm_service = LLMService()

# Database initialization
def init_db():
    conn = sqlite3.connect('interview.db')
    c = conn.cursor()
    
    # Create candidates table
    c.execute('''
        CREATE TABLE IF NOT EXISTS candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            resume_path TEXT,
            score INTEGER,
            summary TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create interviews table
    c.execute('''
        CREATE TABLE IF NOT EXISTS interviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_id INTEGER,
            question TEXT NOT NULL,
            answer TEXT,
            score INTEGER,
            time_spent INTEGER,
            difficulty TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (candidate_id) REFERENCES candidates (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    os.makedirs('uploads', exist_ok=True)

# Pydantic models
class CandidateBase(BaseModel):
    name: str
    email: str
    phone: str

class CandidateCreate(CandidateBase):
    resume_path: Optional[str] = None

class Candidate(CandidateBase):
    id: int
    score: Optional[int] = None
    summary: Optional[str] = None
    created_at: str

class InterviewQuestion(BaseModel):
    question: str
    difficulty: str
    time_limit: int

class InterviewAnswer(BaseModel):
    candidate_id: int
    question: str
    answer: str
    time_spent: int
    difficulty: str

# API Endpoints
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    # Validate file type
    if not file.filename.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="File must be PDF or DOCX")
    
    # Save file
    file_path = f"uploads/{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Extract information
    try:
        if file.filename.endswith('.pdf'):
            info = resume_parser.extract_from_pdf(file_path)
        else:
            info = resume_parser.extract_from_docx(file_path)
        
        return {
            "success": True,
            "data": {
                "extracted_info": info,
                "resume_path": file_path
            }
        }
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/candidates", response_model=Candidate)
async def create_candidate(candidate: CandidateCreate):
    conn = sqlite3.connect('interview.db')
    c = conn.cursor()
    
    try:
        c.execute('''
            INSERT INTO candidates (name, email, phone, resume_path)
            VALUES (?, ?, ?, ?)
        ''', (candidate.name, candidate.email, candidate.phone, candidate.resume_path))
        
        candidate_id = c.lastrowid
        conn.commit()
        
        c.execute('SELECT * FROM candidates WHERE id = ?', (candidate_id,))
        row = c.fetchone()
        
        return {
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "phone": row[3],
            "resume_path": row[4],
            "score": row[5],
            "summary": row[6],
            "created_at": row[7]
        }
    finally:
        conn.close()

@app.get("/next-question/{candidate_id}")
async def get_next_question(candidate_id: int):
    conn = sqlite3.connect('interview.db')
    c = conn.cursor()
    
    try:
        # Get previous questions for this candidate
        c.execute('SELECT question FROM interviews WHERE candidate_id = ?', (candidate_id,))
        previous_questions = [row[0] for row in c.fetchall()]
        
        # Determine difficulty based on number of questions answered
        num_questions = len(previous_questions)
        if num_questions < 2:
            difficulty = "easy"
            time_limit = 20
        elif num_questions < 4:
            difficulty = "medium"
            time_limit = 60
        elif num_questions < 6:
            difficulty = "hard"
            time_limit = 120
        else:
            return {"complete": True}
        
        # Generate next question
        question = llm_service.generate_question(difficulty, previous_questions)
        
        return {
            "question": question,
            "difficulty": difficulty,
            "time_limit": time_limit
        }
    finally:
        conn.close()

@app.post("/submit-answer")
async def submit_answer(answer: InterviewAnswer):
    conn = sqlite3.connect('interview.db')
    c = conn.cursor()
    
    try:
        # Evaluate the answer
        evaluation = llm_service.evaluate_answer(
            answer.question,
            answer.answer,
            answer.difficulty
        )
        
        # Store the answer and evaluation
        c.execute('''
            INSERT INTO interviews (candidate_id, question, answer, score, time_spent, difficulty)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            answer.candidate_id,
            answer.question,
            answer.answer,
            evaluation['score'],
            answer.time_spent,
            answer.difficulty
        ))
        
        # Check if this was the last question
        c.execute('SELECT COUNT(*) FROM interviews WHERE candidate_id = ?', (answer.candidate_id,))
        question_count = c.fetchone()[0]
        
        if question_count >= 6:
            # Get all answers for final evaluation
            c.execute('''
                SELECT question, answer, score 
                FROM interviews 
                WHERE candidate_id = ?
            ''', (answer.candidate_id,))
            answers = [{
                'question': row[0],
                'answer': row[1],
                'score': row[2]
            } for row in c.fetchall()]
            
            # Generate final summary
            summary = llm_service.generate_summary(answers)
            final_score = sum(a['score'] for a in answers) // len(answers)
            
            # Update candidate with final results
            c.execute('''
                UPDATE candidates 
                SET score = ?, summary = ? 
                WHERE id = ?
            ''', (final_score, summary['summary'], answer.candidate_id))
            
            conn.commit()
            return {
                "complete": True,
                "score": final_score,
                "summary": summary['summary']
            }
        
        conn.commit()
        return {
            "success": True,
            "evaluation": evaluation,
            "complete": False
        }
    finally:
        conn.close()

@app.get("/candidates", response_model=List[Candidate])
async def get_candidates():
    conn = sqlite3.connect('interview.db')
    c = conn.cursor()
    
    try:
        c.execute('SELECT * FROM candidates ORDER BY score DESC')
        rows = c.fetchall()
        
        return [{
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "phone": row[3],
            "resume_path": row[4],
            "score": row[5],
            "summary": row[6],
            "created_at": row[7]
        } for row in rows]
    finally:
        conn.close()

@app.get("/candidates/{candidate_id}")
async def get_candidate_details(candidate_id: int):
    conn = sqlite3.connect('interview.db')
    c = conn.cursor()
    
    try:
        # Get candidate info
        c.execute('SELECT * FROM candidates WHERE id = ?', (candidate_id,))
        candidate = c.fetchone()
        
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Get interview details
        c.execute('SELECT * FROM interviews WHERE candidate_id = ? ORDER BY created_at', (candidate_id,))
        interviews = [{
            "question": row[2],
            "answer": row[3],
            "score": row[4],
            "time_spent": row[5],
            "difficulty": row[6],
            "created_at": row[7]
        } for row in c.fetchall()]
        
        return {
            "candidate": {
                "id": candidate[0],
                "name": candidate[1],
                "email": candidate[2],
                "phone": candidate[3],
                "resume_path": candidate[4],
                "score": candidate[5],
                "summary": candidate[6],
                "created_at": candidate[7]
            },
            "interviews": interviews
        }
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)