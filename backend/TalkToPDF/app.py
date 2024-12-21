
import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
from dotenv import load_dotenv

from rag import RAGSystem, allowed_file

app = Flask(__name__)
load_dotenv()

# Configuration
UPLOAD_FOLDER = 'uploaded_documents'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load API key
GOOGLE_AI_API_KEY = os.getenv('GOOGLE_AI_API_KEY')
if not GOOGLE_AI_API_KEY:
    raise ValueError("GOOGLE_AI_API_KEY is not set in the .env file")

@app.route('/upload_document', methods=['POST'])
def upload_document():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
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
                
        return jsonify({'success': False, 'message': 'Invalid file type'}), 400
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Upload failed: {str(e)}'}), 500

@app.route('/list_documents', methods=['GET'])
def list_documents():
    try:
        documents = []
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            documents.append({
                'filename': filename,
                'uploaded_at': datetime.fromtimestamp(os.path.getctime(file_path)).isoformat(),
                'file_path': file_path
            })
        return jsonify({'success': True, 'documents': documents})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/delete_document/<filename>', methods=['DELETE'])
def delete_document(filename):
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({'success': True, 'message': 'Document deleted successfully'})
        return jsonify({'success': False, 'message': 'Document not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error deleting document: {str(e)}'}), 500

@app.route('/rag_query', methods=['POST'])
def rag_query():
    try:
        data = request.get_json()
        query = data.get("query")
        filename = data.get("filename")
        
        if not query or not filename:
            return jsonify({"error": "Query and filename are required"}), 400
        
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
        if not os.path.exists(file_path):
            return jsonify({"error": f"File not found: {filename}"}), 404
        
        rag_system = RAGSystem(pdf_path=file_path, api_key=GOOGLE_AI_API_KEY)
        response = rag_system.generate_response(query)
        return jsonify({"response": response})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)