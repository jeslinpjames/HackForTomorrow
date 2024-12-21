from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import tempfile
import os
import uuid
from sentenceToSignLanguage import fail_safe_translate, model
import sign_language_translator as slt
from TopicLearnSignLang import generate_psl_text
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

if __name__ == "__main__":
    app.run(debug=True)
