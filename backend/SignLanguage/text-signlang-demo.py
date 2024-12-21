import sign_language_translator as slt

def text_to_sign_video(text):
    """
    Translates English text into sign language and displays the corresponding video.
    
    Parameters:
        text (str): The English text to translate into sign language.
    """
    # Initialize the model for English text and sign language video
    model = slt.models.ConcatenativeSynthesis(
        text_language="english", sign_language="pk-sl", sign_format="video"
    )
    
    try:
        # Translate the text into sign language
        sign = model.translate(text)
        
        # Display the video
        print("Showing sign language video...")
        sign.show()
    except Exception as e:
        print(f"An error occurred: {e}")

# Example usage
text_to_sign_video("This is an apple.")
