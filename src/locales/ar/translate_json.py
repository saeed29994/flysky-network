# translate_json.py
import json
from googletrans import Translator

translator = Translator()

def translate_recursive(data, src='ar', dest='fr'):
    if isinstance(data, dict):
        return {k: translate_recursive(v, src, dest) for k, v in data.items()}
    elif isinstance(data, list):
        return [translate_recursive(item, src, dest) for item in data]
    elif isinstance(data, str):
        try:
            translated = translator.translate(data, src=src, dest=dest).text
            print(f"{data} -> {translated}")
            return translated
        except:
            return data  # fallback if translation fails
    else:
        return data

# 1. اقرأ الملف العربي
with open('ar.json', 'r', encoding='utf-8') as infile:
    arabic_data = json.load(infile)

# 2. ترجم المحتوى
french_data = translate_recursive(arabic_data)

# 3. احفظ الملف الفرنسي
with open('fr.json', 'w', encoding='utf-8') as outfile:
    json.dump(french_data, outfile, ensure_ascii=False, indent=2)

print("✅ Translation complete! File saved as fr.json.")
