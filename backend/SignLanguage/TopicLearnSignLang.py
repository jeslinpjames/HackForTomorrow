import os
from dotenv import load_dotenv
import google.generativeai as genai
from sentenceToSignLanguage import fail_safe_translate, model
import sign_language_translator as slt

# Load API Key
load_dotenv()
GENAI_API_KEY = os.getenv("GENAI_API_KEY")

if not GENAI_API_KEY:
    raise ValueError("GENAI_API_KEY is not set in the .env file")
genai.configure(api_key=GENAI_API_KEY)

# Configure Gemini Model
generation_config_text = {
    "temperature": 0.7,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 500,
}

text_model = genai.GenerativeModel(
    "gemini-1.5-flash",
    generation_config=generation_config_text
)

def generate_psl_text(topic):
    """
    Generates a short, simple, and PSL-friendly text about a given topic using the Gemini model.
    """
    prompt = (
        "We are creating a video in Pakistan Sign Language (PSL) to educate and inform viewers about various topics.Create a short, simple summary about the given topic, focusing on its use case or importance. "
        "The description should be clear, easy to understand, and avoid complex language. use simple words   "
        "The text should be concise and relevant to the topic, ideally under 3 sentences.\n\n"
        f"Topic: {topic}\n\n"
        "Response format:\n"
        "- Short description of the topic\n"
        "- Explanation of its use case or importance\n\n"
        "Please ensure the text is straightforward and avoids unnecessary details. make sure not to use ! or ? or , in the response also you dont have to follow proper gramer and stuff the word just  correct words in order for example use tree instead of trees etc just word by word in oder is enough"
    )

    # Generate text using Gemini model
    response = text_model.generate_content([prompt])
    generated_text = "".join(chunk.text for chunk in response)
    return generated_text.strip()


def main():
    """
    Main function to generate PSL-compliant text and translate it into sign language.
    """
    # Input topic from user
    topic = input("Enter a topic for PSL content: ")
    
    # Generate PSL-compliant text
    generated_text = generate_psl_text(topic)
    print(f"Generated PSL Text: {generated_text}")
    
    # Translate the generated text into sign language
    print("Translating text to sign language...")
    translated_signs = fail_safe_translate(model, generated_text)
    
    # Display the result
    for sign in translated_signs:
        if isinstance(sign, slt.Video):  # If translation succeeded and returned a video object
            sign.show()
        else:
            print(sign)  # Print spelled-out signs or error messages

    print("Translation complete.")

if __name__ == "__main__":
    main()
