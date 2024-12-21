from flask import Flask, request, jsonify
from flask_cors import CORS
from utils import YouTubeBrailleTranslator

app = Flask(__name__)
CORS(app)

@app.route('/api/youtube-braille/', methods=['GET'])
def translate_to_braille():
    video_url = request.args.get('url')
    if not video_url:
        return jsonify({"error": "No URL provided"}), 400
    
    translator = YouTubeBrailleTranslator()
    video_id = translator.extract_video_id(video_url)
    
    if not video_id:
        return jsonify({"error": "Invalid YouTube URL"}), 400
    
    # Translate transcript to Braille
    braille_text = translator.translate_transcript_to_braille(video_id)
    
    if not braille_text:
        return jsonify({"error": "Braille translation failed"}), 500

    # Ensure braille_text is a string and handle potential object
    if isinstance(braille_text, dict):
        # Return both original and braille transcripts
        return jsonify({
            "translation": braille_text,
            "success": True
        })
    else:
        return jsonify({
            "translation": str(braille_text),
            "success": True
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
