import os
import google.generativeai as genai

# API Configuration
api_key = os.getenv('GENAI_API_KEY')
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

# Store short contexts for chat history
short_contexts = ["test context ignore"]

# Function to get initial response based on the subject
def get_response(subject):
    prompt = f"""
    The user is visually impaired and has difficulty learning. They would like to learn about the subject: {subject}.
    Provide a brief description of the topic and suggest a follow-up question if the user would like to explore further.
    Highlight interesting aspects they could learn more about. Keep it concise and engaging.

    Response:
    """
    try:
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text.strip()
        return "No response generated."
    except Exception as e:
        return f"An error occurred: {str(e)}"


# Function to shorten and store chat context
def shorten_context(user, ai,query):
    prompt = f"""
    The user is visually impaired and has difficulty learning.
    Based on the previous chat history:
    context : {short_contexts[-1]}
    User: {user}
    AI: {ai}
    current query : {query}

    Summarize this interaction in 2-3 lines, making it precise and useful for context in future responses.
    """
    try:
        response = model.generate_content(prompt)
        if response and response.text:
            short_contexts.append(response.text.strip())
            return response.text.strip()
        return "Context could not be shortened."
    except Exception as e:
        return f"An error occurred: {str(e)}"


# Function to handle follow-up questions or new queries
def ask_mor(user, ai, query):
    try:
        # Summarize context if history exists
        context = shorten_context(user, ai ,query) if short_contexts else ""
        print(context)
        
        # Generate response
        prompt = f"""
        The user is visually impaired. Analyze the context carefully and respond based on it.
        Context: {context}
        new user Query: {query}
        Provide a brief, friendly, and clear response. If the query is entirely new, handle it accordingly.
        """
        response = model.generate_content(prompt)
        if response and response.text:
            return {
                "info": response.text.strip(),
                "context": context
            }
        return {
            "info": "I'm not sure about that.",
            "context": context
        }
    except Exception as e:
        return {
            "info": f"Sorry, an error occurred: {str(e)}",
            "context": ""
        }