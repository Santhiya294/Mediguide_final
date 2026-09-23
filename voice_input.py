import speech_recognition as sr
from googletrans import Translator

import re

r = sr.Recognizer()
translator = Translator()



def normalize(text):
    text = text.lower()
    text = re.sub(r'[^a-z ]', '', text)
    return text.strip()




def get_voice_input(language="english"):
    
    lang_map = {
        "english": "en-IN",
        "tamil": "ta-IN",
        "hindi": "hi-IN"
    }
    
    speech_lang = lang_map.get(language.lower(), "en-IN")

    with sr.Microphone() as source:
        print(f"🎙 Listening ({language})...")
        r.adjust_for_ambient_noise(source, duration=2)
        try:
            audio = r.listen(source, timeout=4, phrase_time_limit=5)
        except sr.WaitTimeoutError:
            print("❌ Listening timed out.")
            return None

    try:
        original_text = r.recognize_google(audio, language=speech_lang)
        print("📝 Recognized:", original_text)

        # Translate only if not English
        if not speech_lang.startswith("en"):
            translated = translator.translate(original_text, dest="en")
            english_text = translated.text
        else:
            english_text = original_text

        return {
            "original_text": original_text,
            "english_text": normalize(english_text)
        }

    except Exception as e:
        print(" Voice Error:", str(e))
        return None


   


if __name__ == "__main__":
    result = get_voice_input()
    print(result)
