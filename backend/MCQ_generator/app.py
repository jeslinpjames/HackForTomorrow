from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import json
import re
from dotenv import load_dotenv

# Flask App Initialization
app = Flask(__name__)
CORS(app)

# ---------------------------
# MCQ Generator Class
# ---------------------------
class MCQGenerator:
    def __init__(self):
        load_dotenv()
        genai.configure(api_key=os.getenv('GOOGLE_AI_API_KEY'))
        self.model = genai.GenerativeModel("gemini-1.5-flash")
    
    def generate_mcq_for_chapter(self, chapter_name):
        """
        Generate MCQs for the given chapter name.
        """
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
        
        # Extract JSON from the response
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
        """
        Extract JSON from the API response text.
        """
        text = text.replace('json', '').strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Attempt to extract JSON using regex
            json_match = re.search(r'\[.*\]', text, re.DOTALL | re.MULTILINE | re.UNICODE)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except json.JSONDecodeError:
                    pass
        return None

    def save_answers(self, chapter_name, mcqs):
        """
        Save MCQs to a local JSON file.
        """
        filename = f"answers_{chapter_name.replace(' ', '_')}.json"
        with open(filename, 'w') as file:
            json.dump(mcqs, file, indent=4)
        print(f"Answers saved to {filename}")

# ---------------------------
# Flask Routes
# ---------------------------
@app.route('/mcq/generatemcq/', methods=['POST'])
def generate_mcq():
    """
    API Endpoint to generate MCQs.
    """
    if request.method == 'POST':
        try:
            # Parse incoming JSON data
            data = request.get_json()
            chapter_name = data.get('chapter_name')
        except (json.JSONDecodeError, TypeError):
            return jsonify({'error': 'Invalid JSON format'}), 400
        
        # Validate chapter name
        if not chapter_name:
            return jsonify({'error': 'Chapter name is required'}), 400
        
        # Create MCQ Generator instance
        generator = MCQGenerator()
        
        try:
            # Generate MCQs
            mcqs = generator.generate_mcq_for_chapter(chapter_name)
            
            # Optionally save answers
            generator.save_answers(chapter_name, mcqs)
            
            # Return full MCQ details
            return jsonify({
                'message': 'MCQs generated successfully', 
                'answer_key': mcqs
            })
        except Exception as e:
            # Log the error
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid request method'}), 405

# ---------------------------
# Run the Flask App
# ---------------------------
if __name__ == '__main__':
    app.run(port=5001, debug=True)
