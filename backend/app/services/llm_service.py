import os
from typing import List, Dict, Any
from google.cloud import aiplatform
from google.cloud.aiplatform import gapic as aip
from dotenv import load_dotenv

load_dotenv()

class LLMService:
    def __init__(self):
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        aiplatform.init(project=self.project_id, location=self.location)

    def generate_question(self, difficulty: str, previous_questions: List[str]) -> str:
        prompt = f"""Generate a {difficulty} level technical interview question for a full-stack developer position.
        The question should be about React/Node.js development.
        Previous questions asked: {', '.join(previous_questions)}
        Please ensure the new question is different from the previous ones.
        """
        
        response = self._call_llm(prompt)
        return self._extract_question(response)

    def evaluate_answer(self, question: str, answer: str, difficulty: str) -> Dict[str, Any]:
        prompt = f"""Evaluate the following answer for a {difficulty} level technical interview question.
        Question: {question}
        Answer: {answer}
        
        Please provide:
        1. A score between 0-100
        2. A brief explanation of the score
        3. Key points covered
        4. Areas for improvement
        """
        
        response = self._call_llm(prompt)
        return self._parse_evaluation(response)

    def generate_summary(self, answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        formatted_qa = "\n".join([
            f"Q: {a['question']}\nA: {a['answer']}\nScore: {a['score']}"
            for a in answers
        ])
        
        prompt = f"""Based on the following interview responses, provide a comprehensive summary of the candidate:
        
        {formatted_qa}
        
        Please include:
        1. Overall score (average of individual scores)
        2. Key strengths
        3. Areas for improvement
        4. Final recommendation
        """
        
        response = self._call_llm(prompt)
        return self._parse_summary(response)

    def _call_llm(self, prompt: str) -> str:
        # Initialize Vertex AI API
        client = aiplatform.gapic.VertexAIClient(
            client_options={"api_endpoint": f"{self.location}-aiplatform.googleapis.com"}
        )
        
        # Set up the model parameters
        model_name = "text-bison@001"  # or your preferred model
        parameters = {
            "temperature": 0.7,
            "max_output_tokens": 1024,
            "top_p": 0.8,
            "top_k": 40
        }
        
        # Create the request
        request = aip.PredictRequest(
            endpoint=f"projects/{self.project_id}/locations/{self.location}/publishers/google/models/{model_name}",
            instances=[{"prompt": prompt}],
            parameters=parameters
        )
        
        # Make the request
        response = client.predict(request=request)
        return response.predictions[0]

    def _extract_question(self, response: str) -> str:
        # Implement logic to extract the question from the LLM response
        # For now, return the whole response
        return response.strip()

    def _parse_evaluation(self, response: str) -> Dict[str, Any]:
        # Implement logic to parse the evaluation response
        # This is a simplified version
        lines = response.split('\n')
        score = 0
        explanation = ""
        
        for line in lines:
            if line.startswith("Score:"):
                try:
                    score = int(line.split(":")[1].strip())
                except:
                    pass
            elif line.startswith("Explanation:"):
                explanation = line.split(":")[1].strip()
        
        return {
            "score": score,
            "explanation": explanation,
            "raw_feedback": response
        }

    def _parse_summary(self, response: str) -> Dict[str, Any]:
        # Implement logic to parse the summary response
        # This is a simplified version
        return {
            "summary": response.strip(),
            "raw_response": response
        }