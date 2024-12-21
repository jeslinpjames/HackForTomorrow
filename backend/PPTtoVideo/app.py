from flask import Flask, request, jsonify
from PPT_Script import generate_scripts
import os
import google.generativeai as genai  # Add Generative AI import

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
AUDIO_FOLDER = 'static/audios'
PDF_FOLDER = 'static/pdfs'  # Ensure PDF folder is defined

genai.configure(api_key='YOUR_API_KEY')  # Initialize Generative AI with your API key

@app.route('/api/upload-ppt', methods=['POST'])
def upload_ppt():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    ppt_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(ppt_path)
    slides = generate_scripts(ppt_path)
    return jsonify({'slides': slides, 'pdf_url': f"/static/pdfs/{os.path.splitext(file.filename)[0]}.pdf"})

# ...existing code...

@app.route('/api/scene-description', methods=['POST'])
def scene_description():
    if 'image' not in request.files:
        return jsonify({"error": "No image file uploaded"}), 400

    image = request.files['image']
    if not image:
        return jsonify({"error": "No file provided"}), 400

    image_path = os.path.join(UPLOAD_FOLDER, image.filename)
    image.save(image_path)

    try:
        with open(image_path, 'rb') as img_file:
            image_data = img_file.read()
        
        prompt = (
            "Describe this image as if narrating to a blind user for 15 seconds. Provide a short and concise scene description. "
            "Avoid any visual references like 'look at that' or 'you can see.' Instead, focus on auditory and descriptive language that conveys the context. "
            "If there is an interesting item, name it explicitly and add the following dialog: 'There is [interesting item] in this scene. Do you want to learn about it?' "
            "Additionally, provide a teaching-style explanation about the interesting item."
        )
        
        response = genai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=150
        )
        
        scene_description = response.choices[0].text.strip()
        
        has_learning = bool(scene_description)  # Adjust based on response structure
        learning_content = scene_description  # Modify if separate learning content is needed

        return jsonify({
            "scene_description": scene_description,
            "has_learning": has_learning,
            "learning": learning_content
        })
    finally:
        if os.path.exists(image_path):
            os.remove(image_path)

# ...existing code...

if __name__ == '__main__':
    app.run(debug=True)
