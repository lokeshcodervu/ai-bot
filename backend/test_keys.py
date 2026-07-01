import os
from dotenv import load_dotenv
from pinecone import Pinecone
from openai import OpenAI
import google.generativeai as genai

# Load environment variables
load_dotenv()

print("\n======================================")
print("   TESTING CORE API KEYS CONNECTION   ")
print("======================================\n")

openai_key = os.getenv("OPENAI_API_KEY")
pinecone_key = os.getenv("PINECONE_API_KEY")
gemini_key = os.getenv("GEMINI_API_KEY")

# 1. Test OpenAI Key
if not openai_key:
    print("[ERROR] [OPENAI] OPENAI_API_KEY is missing in your .env file.")
else:
    try:
        print("[CONNECTING] [OPENAI] Connecting to OpenAI and generating a test embedding...")
        client = OpenAI(api_key=openai_key)
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input="Testing CoderVu SalesAI Pinecone and OpenAI key connections."
        )
        print(f"[SUCCESS] [OPENAI] Connection OK. Embedding size: {len(response.data[0].embedding)}")
    except Exception as e:
        print(f"[ERROR] [OPENAI] Failed: {e}")

print("\n--------------------------------------\n")

# 2. Test Gemini Key
if not gemini_key:
    print("[ERROR] [GEMINI] GEMINI_API_KEY is missing in your .env file.")
else:
    try:
        print("[CONNECTING] [GEMINI] Connecting to Gemini and generating a test embedding...")
        genai.configure(api_key=gemini_key)
        response = genai.embed_content(
            model="models/gemini-embedding-001",
            content="Testing CoderVu SalesAI Gemini key connection."
        )
        print(f"[SUCCESS] [GEMINI] Connection OK. Embedding size: {len(response['embedding'])}")
    except Exception as e:
        print(f"[ERROR] [GEMINI] Failed: {e}")

print("\n--------------------------------------\n")

# 3. Test Pinecone Key
if not pinecone_key:
    print("[ERROR] [PINECONE] PINECONE_API_KEY is missing in your .env file.")
else:
    try:
        print("[CONNECTING] [PINECONE] Connecting to Pinecone and listing indexes...")
        pc = Pinecone(api_key=pinecone_key)
        indexes = pc.list_indexes()
        index_names = [idx.name for idx in indexes]
        print(f"[SUCCESS] [PINECONE] Connection OK. Found indexes: {index_names}")
    except Exception as e:
        print(f"[ERROR] [PINECONE] Failed: {e}")

print("\n======================================\n")
