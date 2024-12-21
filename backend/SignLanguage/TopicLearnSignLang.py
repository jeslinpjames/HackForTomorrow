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
        "We are creating a video in Pakistan Sign Language (PSL). "
        "We have a simplified vocabulary in PSL. "
        "Please ensure your text only contains the following words or synonyms that are PSL-friendly:\n\n"
        "PSL-friendly words examples : [sun, tree, car, apple,  ...] dont just use these words use more words  \n\n"
        "Write a short, simple summary about the given topic focusing on its use case or importance.\n"
        # "- Use as few unique words as possible\n"
        "- Choose from the PSL-friendly words or their simplest forms\n"
        "- Keep it under 3 sentences\n"
        "- Avoid punctuation like ! ? ,\n"
        "- Use straightforward, basic language\n\n"
        f"Topic: {topic}\n\n"
        "Response format:\n"
        "- Short description of the topic\n"
        "- Explanation of its use case or importance\n\n"
        "Please ensure the text is PSL-compliant, straightforward, and avoids unnecessary details. make sure to not just use the words i have given in example"
    )

    # prompt = (
    #     "We are creating a video in Pakistan Sign Language (PSL) to educate and inform viewers about various topics. "
    #     "Please generate a short and simple summary about the given topic, focusing on its use case or importance. "
    #     "The description should use only essential words in the correct order to ensure clarity. "
    #     "Avoid punctuation like exclamation marks (!), question marks (?), or commas (,). "
    #     "Grammar does not need to be formal; use single, straightforward words that exist in PSL. "
    #     "For example, use 'tree' instead of 'trees' or 'go' instead of 'goes'. The text should be concise and relevant, ideally under 3 sentences.\n\n"
    #     f"Topic: {topic}\n\n"
    #     "Response format:\n"
    #     "- A short description of the topic\n"
    #     "- A simple explanation of its use case or importance\n\n"
    #     "Ensure the text avoids unnecessary details and uses only PSL-compatible words."
    # )

    # prompt = (
    #     "We are creating a video in Pakistan Sign Language (PSL). "
    #     "We have a simplified vocabulary in PSL. "
    #     "Please ensure your text only contains the following words or synonyms that are PSL-friendly:\n\n"
    #     "PSL-friendly words examples: [sun, tree, car, apple, ...] do not just use these examples; expand to include more PSL-compliant words.\n\n"
    #     "Write a short, simple, and informative summary about the given topic focusing on its use case, importance, and a key fact or concept that helps viewers understand the topic better.\n"
    #     "- Choose from the PSL-friendly words or their simplest forms.\n"
    #     "- Keep it under 4 sentences.\n"
    #     "- Avoid punctuation like ! ? ,\n"
    #     "- Use straightforward, basic language that explains the concept clearly and adds value to learning.\n\n"
    #     f"Topic: {topic}\n\n"
    #     "Response format:\n"
    #     "- A short description of the topic.\n"
    #     "- An explanation of its use case or importance.\n"
    #     "- One key fact or concept to help viewers understand the topic better.\n\n"
    #     "Please ensure the text is PSL-compliant, clear, and provides educational value without unnecessary details. Avoid repeating the same ideas."
    # )

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
