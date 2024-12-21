import os
from pptx import Presentation
import google.generativeai as genai  # Replace gemini with google.generativeai
import subprocess  # For PDF conversion

UPLOAD_FOLDER = 'uploads'
AUDIO_FOLDER = 'static/audios'
PDF_FOLDER = 'static/pdfs'  # New folder for PDFs

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)
os.makedirs(PDF_FOLDER, exist_ok=True)  # Create PDF folder

genai.configure(api_key='YOUR_API_KEY')  # Initialize Generative AI with your API key

def generate_scripts(ppt_path):
    prs = Presentation(ppt_path)
    slides_data = []
    pdf_path = os.path.join(PDF_FOLDER, os.path.splitext(os.path.basename(ppt_path))[0] + '.pdf')
    
    # Convert PPT to PDF using LibreOffice
    subprocess.run(['libreoffice', '--headless', '--convert-to', 'pdf', '--outdir', PDF_FOLDER, ppt_path], check=True)
    
    for index, slide in enumerate(prs.slides):
        image = slide.shapes[0].image
        image_path = os.path.join(UPLOAD_FOLDER, f"slide_{index + 1}.png")
        with open(image_path, 'wb') as f:
            f.write(image.blob)
        
        # Generate concise scene description using Generative AI
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
        
        # Generate voiceover (implementation depends on TTS service)
        audio_filename = f"slide_{index + 1}.mp3"
        audio_url = f"/{AUDIO_FOLDER}/{audio_filename}"
        generate_voiceover(scene_description, os.path.join(AUDIO_FOLDER, audio_filename))
        
        slides_data.append({
            'filename': os.path.basename(ppt_path),
            'slide_no': index + 1,
            'image_url': f"/{image_path}",
            'script': scene_description,
            'audio_url': audio_url,
            'pdf_url': f"/{pdf_path}"  # Add PDF URL
        })
    return slides_data

def generate_voiceover(text, audio_path):
    # Implement text-to-speech conversion using a suitable library or API
    # Example using gTTS:
    from gtts import gTTS
    tts = gTTS(text)
    tts.save(audio_path)
