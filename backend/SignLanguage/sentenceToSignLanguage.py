import sign_language_translator as slt
import re  # For extracting text inside brackets

# Fallback mapping for single letters to their corresponding representation
SINGLE_LETTER_MAPPING = {
    "a": "a(single-handed-letter)",
    "b": "b(single-handed-letter)",
    "c": "c(single-handed-letter)",
    "d": "d(single-handed-letter)",
    "e": "e(single-handed-letter)",
    "f": "f(single-handed-letter)",
    "g": "g(single-handed-letter)",
    "h": "h(single-handed-letter)",
    "i": "i(single-handed-letter)",
    "j": "j(single-handed-letter)",
    "k": "k(single-handed-letter)",
    "l": "l(single-handed-letter)",
    "m": "m(single-handed-letter)",
    "n": "n(single-handed-letter)",
    "o": "o(single-handed-letter)",
    "p": "p(single-handed-letter)",
    "q": "q(single-handed-letter)",
    "r": "r(single-handed-letter)",
    "s": "s(single-handed-letter)",
    "t": "t(single-handed-letter)",
    "u": "u(single-handed-letter)",
    "v": "v(single-handed-letter)",
    "w": "w(single-handed-letter)",
    "x": "x(single-handed-letter)",
    "y": "y(single-handed-letter)",
    "z": "z(single-handed-letter)"
}

def preprocess_text(text):
    """
    Preprocesses the input text to replace ambiguous tokens like 'my(میرے)' with 'میرے'.
    """
    return re.sub(r'\w+\((.*?)\)', r'\1', text)

def has_word_sign(model, word):
    """Check if word exists in dictionary."""
    try:
        model.translate(word)
        return True
    except ValueError:
        return False

def fail_safe_translate(model, text):
    """Translates text with word-level or letter-level signs."""
    preprocessed_text = preprocess_text(text)
    words = preprocessed_text.split()
    translated_signs = []

    for word in words:
        try:
            if has_word_sign(model, word):
                # We have a sign for the whole word
                sign = model.translate(word)
                translated_signs.append((sign, word))  # (sign, caption)
            else:
                # Split into letters
                spelled_signs = spell_out_and_translate(model, word)
                translated_signs.extend(spelled_signs)
        except ValueError:
            spelled_signs = spell_out_and_translate(model, word)
            translated_signs.extend(spelled_signs)

    return translated_signs

def spell_out_and_translate(model, word):
    """Returns list of (sign, letter) tuples."""
    spelled_signs = []
    for char in word:
        mapped_char = SINGLE_LETTER_MAPPING.get(char.lower(), char)
        try:
            translated_sign = model.translate(mapped_char)
            spelled_signs.append((translated_sign, char))  # (sign, caption)
        except ValueError:
            spelled_signs.append((f"Sign for '{char}' not found.", char))
    return spelled_signs

# Initialize the rule-based text-to-sign translator model for English
model = slt.models.ConcatenativeSynthesis(
    text_language="english", sign_language="pk-sl", sign_format="video"
)

if __name__ == "__main__":
    # Initialize the rule-based text-to-sign translator model for English
    model = slt.models.ConcatenativeSynthesis(
        text_language="english", sign_language="pk-sl", sign_format="video"
    )

    # Example translation
    text_english = "This is my car"  # Input English sentence
    translated_signs = fail_safe_translate(model, text_english)

    # Display the result
    for sign, caption in translated_signs:
        if isinstance(sign, slt.Video):  # If translation succeeded and returned a video object
            sign.show()
        else:
            print(sign)  # Print spelled-out signs or error messages

    print("Translation complete.")
