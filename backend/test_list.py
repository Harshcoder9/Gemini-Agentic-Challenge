import os
from google import genai

def main():
    from app.config import settings
    client = genai.Client(api_key=settings.gemini_api_key)
    for m in client.models.list():
        print(m.name)

main()
