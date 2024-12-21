from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
import google.generativeai as genai
import os  # Added for environment variables

app = Flask(__name__)
# Configure CORS with specific settings
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],  # Allow requests from Next.js development server
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

class MCQGenerator:
    # ...existing code...
    def __init__(self):
        genai.configure(api_key=os.getenv("GENAI_API_KEY"))  # Use environment variable
        self.model = genai.GenerativeModel("gemini-1.5-flash")
    
    def generate_mcq_for_chapter(self, chapter_name):
        prompt = f"""Generate 10 multiple-choice questions (2 questions each from 5 important topics) 
        for the chapter: {chapter_name}. 
        Strictly follow this JSON format:
        [
            {{
                "question": "Question text",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "A or B or C or D"
            }},
            ...
        ]
        Ensure:
        - Questions cover different aspects of {chapter_name}
        - Options are plausible
        - Correct answer is clearly marked
        """
        response = self.model.generate_content(prompt)
        
        questions_data = self.extract_json_from_text(response.text)
        
        if not questions_data:
            raise ValueError(f"Could not parse questions. Response: {response.text}")
        
        # Transform the questions to include full details
        full_mcqs = []
        for i, q in enumerate(questions_data, 1):
            full_mcq = {
                "question_number": i,
                "question": q['question'],
                "options": q['options'],
                "correct_answer_option": q['correct_answer']
            }
            full_mcqs.append(full_mcq)
        
        return full_mcqs

    def extract_json_from_text(self, text):
        # Clean the text and attempt to extract JSON
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to find JSON-like structure using regex
            json_match = re.search(r'\[.*\]', text, re.DOTALL | re.MULTILINE | re.UNICODE)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except json.JSONDecodeError:
                    pass
        return None

    def save_answers(self, chapter_name, answer_key):
        # Optional method to save answers locally
        safe_filename = ''.join(c if c.isalnum() or c in [' ', ''] else '' for c in chapter_name)
        safe_filename = safe_filename.replace(' ', '_').lower()
        
        answers_filename = f"{safe_filename}_answers.json"
        with open(answers_filename, 'w', encoding='utf-8') as f:
            json.dump(answer_key, f, indent=2)
        
        print(f"\nAnswers saved to {answers_filename}")

@app.route('/mcq/generatemcq/', methods=['POST', 'OPTIONS'])  # Add OPTIONS method
def generate_mcq():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        return response
        
    # Handle POST request
    if request.method == 'POST':
        try:
            data = request.get_json()
            chapter_name = data.get('chapter_name')
            
            if not chapter_name:
                return jsonify({'error': 'Chapter name is required'}), 400
            
            generator = MCQGenerator()
            mcqs = generator.generate_mcq_for_chapter(chapter_name)           
            generator.save_answers(chapter_name, mcqs)
            return jsonify({'message': 'MCQs generated successfully', 'answer_key': mcqs})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Invalid request method'}), 405

# Added block to run the Flask app
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=True)  # Added debug=True for better error messages
