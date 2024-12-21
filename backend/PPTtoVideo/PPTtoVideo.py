from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from pathlib import Path
from pptx import Presentation
import google.generativeai as genai
from gtts import gTTS
import base64
from pptx.util import Inches
from io import BytesIO
from PIL import Image

ppt_bp = Blueprint('ppt_bp', __name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pptx'}
GENAI_API_KEY = os.getenv("GENAI_API_KEY")
AUDIO_FOLDER = Path("static/audio")
AUDIO_FOLDER.mkdir(parents=True, exist_ok=True)  # Ensure the audio folder exists

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

genai.configure(api_key=GENAI_API_KEY)
model = genai.GenerativeModel(
    "gemini-1.5-flash",
    generation_config={
        "temperature": 0.7,
        "top_p": 1,
        "top_k": 1,
        "max_output_tokens": 500,
    }
)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_slide_to_image(slide):
    """Convert slide to image and return base64 encoded string"""
    # This requires additional libraries like python-pptx and PIL
    # Placeholder implementation
    # You might need to use a library like unoconv or an external service to convert slides to images
    img_io = BytesIO()
    image = Image.new('RGB', (1024, 768), color = (73, 109, 137)) # Placeholder image
    image.save(img_io, 'PNG')
    img_io.seek(0)
    return base64.b64encode(img_io.read()).decode('utf-8')

def extract_slide_content(slide):
    """Extract text content from a slide"""
    text_content = []
    for shape in slide.shapes:
        if hasattr(shape, "text"):
            text_content.append(shape.text)
    return " ".join(text_content)

def generate_voice_script(content):
    """Generate a narration script using Gemini"""
    prompt = f"Create a natural, conversational narration script for the following slide content: {content}"
    response = model.generate_content(prompt)
    return response.text

def text_to_speech(text, filename):
    """Convert text to speech using gTTS and return the URL path"""
    tts = gTTS(text=text, lang='en')
    file_path = AUDIO_FOLDER / filename
    tts.save(file_path)
    return f"/static/audio/{filename}"  # Return the URL path

@ppt_bp.route('/api/upload-ppt', methods=['POST'])
def upload_ppt():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        ppt_path = Path(os.path.join(UPLOAD_FOLDER, filename))
        file.save(ppt_path)

        try:
            prs = Presentation(ppt_path)
            slides_data = []

            for idx, slide in enumerate(prs.slides):
                content = extract_slide_content(slide)
                script = generate_voice_script(content)
                audio_filename = f"slide_{idx}.mp3"
                audio_url = text_to_speech(script, audio_filename)  # Returns URL

                slide_image = convert_slide_to_image(slide)  # Convert slide to image

                slides_data.append({
                    'index': idx,
                    'content': f"data:image/png;base64,{slide_image}",  # Base64 image
                    'script': script,
                    'audio': audio_url  # URL path
                })

            return jsonify({
                'success': True,
                'slides': slides_data
            })

        except Exception as e:
            return jsonify({'error': str(e)}), 500

        finally:
            if ppt_path.exists():
                os.remove(ppt_path)

    return jsonify({'error': 'Invalid file type'}), 400
