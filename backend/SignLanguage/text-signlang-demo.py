import sign_language_translator as slt

# Initialize the rule-based text-to-sign translator model
model = slt.models.ConcatenativeSynthesis(
   text_language="english", sign_language="pk-sl", sign_format="video"
)

# English text-to-sign conversion
model.text_language = slt.languages.text.English()
text_english = " this is an apple "
sign_english = model.translate(text_english)
sign_english.show()

# Hindi text-to-sign conversion
# model.text_language = slt.TextLanguageCodes.HINDI
# text_hindi = "कैसे हैं आप?"  # "how-are-you"
# sign_hindi = model.translate(text_hindi)
# sign_hindi.show()
