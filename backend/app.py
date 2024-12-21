from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from Topic.LlmResponse import get_response , ask_mor

app = Flask(__name__)
CORS(app)


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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
