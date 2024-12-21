from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai
import sign_language_translator as slt

# Flask App Configuration
app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()
GENAI_API_KEY = os.getenv("GENAI_API_KEY")

if not GENAI_API_KEY:
    raise ValueError("GENAI_API_KEY is not set in the .env file")

genai.configure(api_key=GENAI_API_KEY)

generation_config = {
    "temperature": 0.7,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 100,
}

# Gemini Model Initialization
text_model = genai.GenerativeModel("gemini-1.5-flash", generation_config=generation_config)

# Sign Language Translator Initialization
sign_model = slt.models.ConcatenativeSynthesis(
    text_language=slt.languages.text.English(), sign_language="pk-sl", sign_format="video"
)

@app.route('/api/topic-to-sign', methods=['POST'])
def topic_to_sign():
    try:
        # Extract the topic from the request
        data = request.json
        topic = data.get("topic")
        if not topic:
            return jsonify({"error": "No topic provided"}), 400

        # Generate a short description using the Gemini model
        prompt = (
            "This prompt is for creating a video in Pakistan Sign Language (PSL) to educate and inform viewers about a given topic. "
            "Please ensure that the output text contains only words that exist in the Pakistan Sign Language vocabulary. "
            "If any word is not available in PSL, skip it and do not include it in the response. The generated text should be concise and informative.\n\n"
            f"Topic: {topic}\n\n"
            "Response format:\n"
            "- Words in PSL vocabulary only.\n"
            "- A short informative description about the topic.\n\n"
            "Please ensure the text is PSL-compliant and excludes unsupported words."
        )

        response = text_model.generate_text(prompt)
        description = response.text.strip()

        if not description:
            return jsonify({"error": "Failed to generate a description for the topic"}), 500

        # Tokenize the description and generate the sign video
        tokens = sign_model.tokenizer.tokenize(description)
        signs = []

        for token in tokens:
            try:
                # Attempt to get the sign for the token
                sign = sign_model.sign_dictionary.get_sign(token)
                signs.append(sign)
            except Exception:
                print(f"Skipping unsupported token: {token}")

        if not signs:
            return jsonify({"error": "No valid signs could be generated for the description"}), 500

        # Combine the signs into a video sequence
        final_sign_video = slt.models.VideoSequence.concatenate(signs)

        # Save the generated video
        video_path = os.path.join("uploads", f"{topic.replace(' ', '_')}_sign_video.mp4")
        final_sign_video.save(video_path, overwrite=True)

        return jsonify({
            "topic": topic,
            "description": description,
            "video_path": video_path,
            "message": "Sign language video generated successfully"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    os.makedirs("uploads", exist_ok=True)  # Ensure uploads folder exists
    app.run(debug=True)
