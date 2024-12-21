from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
from pathlib import Path
import google.generativeai as genai

# Flask App Configuration
app = Flask(__name__)
# Configure CORS with specific origin
CORS(app, resources={
    r"/api/*": {
        "origins": [os.getenv("FRONTEND_URL", "http://localhost:3000")],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load environment variables and configure Gemini AI
load_dotenv()
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")

if not GOOGLE_AI_API_KEY:
    raise ValueError("GOOGLE_AI_API_KEY is not set in the .env file")

genai.configure(api_key=GOOGLE_AI_API_KEY)

# Configure Gemini model parameters
generation_config = {
    "temperature": 0.9,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 300,
}

# Initialize Gemini model
scene_model = genai.GenerativeModel(
    "gemini-1.5-flash",
    generation_config=generation_config
)

# Add file validation
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/scene-description', methods=['POST'])
def scene_description():
    if 'image' not in request.files:
        return jsonify({"error": "No image file uploaded"}), 400

    image = request.files['image']
    
    # Validate file
    if not image or not allowed_file(image.filename):
        return jsonify({"error": "Invalid file type. Allowed types: png, jpg, jpeg, gif"}), 400

    try:
        filename = secure_filename(image.filename)
        image_path = Path(os.path.join(UPLOAD_FOLDER, filename))
        image.save(image_path)

        image_part = {
            "mime_type": image.content_type,
            "data": image_path.read_bytes()
        }

        prompt_parts = [
            "Describe this image as if narrating to a blind user for 15 seconds. "
            "Provide a short and concise scene description. Avoid any visual references "
            "like 'look at that' or 'you can see.' Instead, focus on auditory and "
            "descriptive language that conveys the context. If there is an interesting item, "
            "name it explicitly and add the following dialog: 'There is [interesting item] "
            "in this scene. Do you want to learn about it?'\n\n"
            "Scene Description: <short scene description ending with the interesting item and a dialog>\n"
            "Learning: <teaching-style explanation about the interesting item>\n\n",
            image_part
        ]

        response = scene_model.generate_content(prompt_parts)
        
        if not response.text:
            return jsonify({"error": "Could not generate description"}), 500

        # Process the response
        text = response.text
        scene_description = ""
        learning_content = ""
        
        if "Scene Description:" in text:
            scene_description = text.split("Scene Description:")[1].split("Learning:")[0].strip()
        if "Learning:" in text:
            learning_content = text.split("Learning:")[1].strip()

        if not scene_description:
            return jsonify({"error": "Could not generate scene description"}), 500

        return jsonify({
            "scene_description": scene_description,
            "has_learning": bool(learning_content),
            "learning": learning_content
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        # Clean up the uploaded file
        if image_path.exists():
            try:
                os.remove(image_path)
            except Exception as e:
                print(f"Error removing temporary file: {e}")

if __name__ == '__main__':
    app.run(debug=os.getenv("FLASK_ENV") == "development")
