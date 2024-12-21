import os
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import magic
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai
import numpy as np
from typing import List, Optional
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.embeddings import HuggingFaceEmbeddings

app = Flask(__name__)
load_dotenv()

# Add configuration for file uploads
UPLOAD_FOLDER = 'uploaded_documents'
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'doc', 'docx'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class RAGSystem:
    def __init__(self, 
                 pdf_path: str, 
                 api_key: Optional[str] = None,
                 model_name: str = "gemini-pro"):
        """Initialize RAG system with PDF and Gemini"""
        if api_key:
            genai.configure(api_key=api_key)
        
        self.model = genai.GenerativeModel(model_name)
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vector_store = None
        self._process_pdf(pdf_path)

    def _process_pdf(self, pdf_path: str) -> None:
        pdf_reader = PdfReader(pdf_path)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_text(text=text)
        self.vector_store = FAISS.from_texts(chunks, self.embeddings)

    def retrieve_context(self, query: str, top_k: int = 3) -> List[str]:
        """Retrieve most relevant chunks for a query"""
        relevant_chunks = self.vector_store.similarity_search(query, k=top_k)
        return [chunk.page_content for chunk in relevant_chunks]

    def generate_response(self, query: str, context: Optional[List[str]] = None) -> str:
        """Generate response using Gemini with optional context"""
        if context is None:
            context = self.retrieve_context(query)
        
        augmented_prompt = f"""
        Context: {' '.join(context)}
        
        Query: {query}
        
        Based on the context, provide a comprehensive and precise answer to the query.
        If the answer cannot be found in the context, state that clearly.
        """
        
        try:
            response = self.model.generate_content(augmented_prompt)
            return response.text
        except Exception as e:
            return f"Error generating response: {str(e)}"

GOOGLE_AI_API_KEY = os.getenv('GOOGLE_AI_API_KEY')
if not GOOGLE_AI_API_KEY:
    raise ValueError("GOOGLE_AI_API_KEY is not set in the .env file")

# Document upload endpoint
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
            
            # Initialize RAG system with uploaded file
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

# List documents endpoint
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

# Delete document endpoint
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

# Update existing RAG query endpoint to use uploaded files
@app.route('/rag_query', methods=['POST'])
def rag_query():
    try:
        data = request.get_json()
        query = data.get("query")
        filename = data.get("filename")  # Now expecting filename instead of pdf_path
        
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
