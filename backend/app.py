from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import os
from dotenv import load_dotenv
from Topic.LlmResponse import get_response, ask_mor
import tempfile
import uuid
from SignLanguage.sentenceToSignLanguage import fail_safe_translate, model
import sign_language_translator as slt
from SignLanguage.TopicLearnSignLang import generate_psl_text
import base64
import io
import json

from pathlib import Path
import google.generativeai as genai
from werkzeug.utils import secure_filename
from TalkToPDF.rag import RAGSystem, allowed_file


app = Flask(__name__)
CORS(app)

# scene description
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Add new config for document uploads
DOCUMENT_UPLOAD_FOLDER = 'uploaded_documents'
os.makedirs(DOCUMENT_UPLOAD_FOLDER, exist_ok=True)
app.config['DOCUMENT_UPLOAD_FOLDER'] = DOCUMENT_UPLOAD_FOLDER

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

# Split allowed extensions by file type
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_DOCUMENT_EXTENSIONS = {'pdf', 'doc', 'docx'}

def allowed_image_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def allowed_document_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_DOCUMENT_EXTENSIONS

@app.route('/api/scene-description', methods=['POST'])
def scene_description():
    if 'image' not in request.files:
        return jsonify({"error": "No image file uploaded"}), 400

    image = request.files['image']
    
    # Validate file
    if not image or not allowed_image_file(image.filename):
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

@app.route('/api/ask_more', methods=['POST'])
def handle_ask_more():
    """
    Endpoint to handle conversation queries.
    """
    data = request.get_json()
    previous_query = data.get('previous_query')
    previous_response = data.get('previous_response')
    current_query = data.get('query')
    print(data)
    
    response = ask_mor(previous_query, previous_response, current_query)
    return jsonify(response)

@app.route('/api/get_response', methods=['POST'])
def handle_get_response():
    data = request.json
    response = get_response(data['topic'])
    return jsonify({'response': response})

@app.route("/generate_psl_text", methods=["POST"])
def generate_psl_text_api():
    data = request.json
    topic = data.get("topic")
    if not topic:
        return jsonify({"error": "Topic is required"}), 400
    
    generated_text = generate_psl_text(topic)
    return jsonify({"generated_text": generated_text})

@app.route("/translate_to_sign", methods=["POST"])
def translate_to_sign_api():
    data = request.json
    text = data.get("text")
    if not text:
        return jsonify({"error": "Text is required"}), 400

    def generate_signs():
        try:
            signs = fail_safe_translate(model, text)
            for sign in signs:
                try:
                    if isinstance(sign, slt.Video):
                        # Generate a unique filename
                        unique_filename = f"{uuid.uuid4()}.mp4"
                        temp_path = os.path.join(tempfile.gettempdir(), unique_filename)

                        try:
                            # Save the video with overwrite option if available
                            try:
                                sign.save(temp_path, overwrite=True)
                            except TypeError:
                                sign.save(temp_path)  # Fallback if overwrite not supported

                            # Read and encode the video
                            with open(temp_path, "rb") as video_file:
                                video_base64 = base64.b64encode(video_file.read()).decode("utf-8")

                            response = {
                                "type": "video",
                                "data": f"data:video/mp4;base64,{video_base64}"
                            }
                            print(f"Successfully processed video: {unique_filename}")
                            
                        finally:
                            # Clean up temp file
                            if os.path.exists(temp_path):
                                try:
                                    os.remove(temp_path)
                                except Exception as e:
                                    print(f"Warning: Could not remove temp file {temp_path}: {e}")

                    else:
                        response = {
                            "type": "text",
                            "data": str(sign)
                        }
                        print(f"Processing text sign: {str(sign)}")

                    yield json.dumps(response) + "\n"

                except Exception as e:
                    error_msg = f"Error processing sign: {str(e)}"
                    print(error_msg)
                    yield json.dumps({
                        "type": "text",
                        "data": error_msg
                    }) + "\n"

        except Exception as e:
            error_msg = f"Translation error: {str(e)}"
            print(error_msg)
            yield json.dumps({
                "type": "text",
                "data": error_msg
            }) + "\n"

    return Response(
        generate_signs(),
        mimetype='application/x-ndjson',
        headers={
            'X-Accel-Buffering': 'no',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    )

# Add TalkToPDF routes
@app.route('/api/upload_document', methods=['POST'])
def upload_document():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'}), 400
        
        if file and allowed_document_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['DOCUMENT_UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            try:
                rag_system = RAGSystem(pdf_path=file_path, api_key=GOOGLE_AI_API_KEY)
                return jsonify({
                    'success': True,
                    'message': 'File uploaded and processed successfully',
                    'filename': filename
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': f'Error processing document: {str(e)}'
                }), 500
                
        return jsonify({'success': False, 'message': f'Invalid file type. Allowed types: {", ".join(ALLOWED_DOCUMENT_EXTENSIONS)}'}), 400
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Upload failed: {str(e)}'}), 500

@app.route('/api/rag_query', methods=['POST'])
def rag_query():
    try:
        data = request.get_json()
        query = data.get("query")
        filename = data.get("filename")
        
        if not query or not filename:
            return jsonify({
                "status": "error",
                "message": "Query and filename are required"
            }), 400
        
        file_path = os.path.join(app.config['DOCUMENT_UPLOAD_FOLDER'], secure_filename(filename))
        if not os.path.exists(file_path):
            return jsonify({
                "status": "error",
                "message": f"File not found: {filename}"
            }), 404
        
        rag_system = RAGSystem(pdf_path=file_path, api_key=GOOGLE_AI_API_KEY)
        response = rag_system.generate_response(query)
        return jsonify({
            "status": "success",
            "response": response
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/summarize', methods=['POST'])
def summarize():
    try:
        data = request.get_json()
        filename = data.get("filename")
        
        if not filename:
            return jsonify({
                "status": "error",
                "message": "Filename is required"
            }), 400
        
        file_path = os.path.join(app.config['DOCUMENT_UPLOAD_FOLDER'], secure_filename(filename))
        if not os.path.exists(file_path):
            return jsonify({
                "status": "error",
                "message": f"File not found: {filename}"
            }), 404
        
        rag_system = RAGSystem(pdf_path=file_path, api_key=GOOGLE_AI_API_KEY)
        summary = rag_system.generate_response("Please provide a comprehensive summary of this document.")
        
        return jsonify({
            "status": "success",
            "summary": summary
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
