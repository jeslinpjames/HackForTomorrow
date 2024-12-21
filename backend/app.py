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

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

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

def process_sign(sign, caption):
    """Helper function to process a sign video and attach a caption."""
    unique_filename = f"{uuid.uuid4()}.mp4"
    temp_path = os.path.join(tempfile.gettempdir(), unique_filename)

    try:
        if isinstance(sign, slt.Video):
            try:
                sign.save(temp_path, overwrite=True)
            except TypeError:
                sign.save(temp_path)

            with open(temp_path, "rb") as video_file:
                video_base64 = base64.b64encode(video_file.read()).decode("utf-8")

            return json.dumps({
                "type": "video",
                "data": f"data:video/mp4;base64,{video_base64}",
                "caption": caption
            }) + "\n"
        else:
            return json.dumps({
                "type": "text",
                "data": str(sign),
                "caption": caption
            }) + "\n"
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route("/translate_to_sign", methods=["POST"])
def translate_to_sign_api():
    data = request.json
    text = data.get("text")
    if not text:
        return jsonify({"error": "Text is required"}), 400

    def generate_signs():
        try:
            # Now returns (sign, caption) tuples
            signs_with_captions = fail_safe_translate(model, text)
            
            for sign, caption in signs_with_captions:
                try:
                    yield process_sign(sign, caption)
                except Exception as e:
                    print(f"Error processing sign: {e}")
                    yield json.dumps({
                        "type": "text",
                        "data": f"Error with sign: {e}",
                        "caption": caption
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
