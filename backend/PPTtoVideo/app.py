from flask import Flask, request, jsonify
from PPT_Script import generate_scripts
from flask import Flask, request, jsonify
from flask_cors import CORS
from PPT_Script import generate_scripts
import os
import google.generativeai as genai  # Add Generative AI import

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'ppt', 'pptx'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Configure logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        # Check if the post request has the file part
        if 'file' not in request.files:
            return jsonify({
                'error': 'No file part',
                'details': 'Request must include a file field'
            }), 400
        
        file = request.files['file']
        edited_script = request.form.get('script')  # Get edited script if provided
        
        # Check if a file was selected
        if file.filename == '':
            return jsonify({
                'error': 'No selected file',
                'details': 'A file must be selected'
            }), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file type',
                'details': f'Allowed file types are: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400

        filename = secure_filename(file.filename)
        ppt_path = os.path.join(UPLOAD_FOLDER, filename)
        output_path = os.path.join(OUTPUT_FOLDER, filename.rsplit('.', 1)[0] + '.mp4')
        
        # Save the file
        file.save(ppt_path)
        
        logger.info(f"Processing file: {filename}")
        
        # Parse edited script if provided
        script_list = None
        if edited_script:
            script_list = edited_script.split('|||')  # Assuming slides are separated by |||
        
        # Process the file with edited script
        processor = PPTProcessor()
        output_file = processor.process_ppt(ppt_path, output_path, script_list)
        
        logger.info(f"Successfully processed file: {filename}")
        # Cleanup
        os.remove(ppt_path)
        
        return jsonify({
            'status': 'success',
            'message': 'Video generated successfully',
            'data': {
                'video_path': output_file,
                'original_filename': filename,
                'output_filename': os.path.basename(output_file)
            }
        }), 200

    except ConnectionError as e:
        logger.error(f"Connection error: {str(e)}")
        return jsonify({
            'error': 'Connection failed',
            'details': f"Connection error: {str(e)}"
        }), 503
    except Exception as e:
        logger.error(f"Processing error: {str(e)}", exc_info=True)
        # Cleanup on error
        if os.path.exists(ppt_path):
            os.remove(ppt_path)
        
        return jsonify({
            'error': 'Processing failed',
            'details': str(e)
        }), 500

# Add error handler for large files
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        'error': 'File too large',
        'details': f'File size cannot exceed {MAX_CONTENT_LENGTH/(1024*1024)}MB'
    }), 413

@app.route('/download/<filename>')
def download_file(filename):
    file_path = os.path.join(OUTPUT_FOLDER, filename)
    if not os.path.exists(file_path):
        return jsonify({
            'error': 'File not found',
            'message': f'The file {filename} does not exist'
        }), 404
        
    try:
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({
            'error': 'Download failed',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
