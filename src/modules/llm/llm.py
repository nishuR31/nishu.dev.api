#!/usr/bin/env python3
"""
Python LLM Runner for Nishan Rajak's Portfolio Chatbot.
Uses Gemini with zero external dependencies (pure Python standard library).
"""

import sys
import os
import json
import urllib.request
import urllib.error
from pathlib import Path

# Locate .env file
current_dir = Path(__file__).resolve().parent
env_file = current_dir.parent.parent.parent / ".env"

api_key = None
if env_file.exists():
    with open(env_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("GOOGLE_API_KEY="):
                api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                break

if not api_key:
    api_key = os.environ.get("GOOGLE_API_KEY")

if not api_key:
    print("Error: GOOGLE_API_KEY is not set in .env or environment!", file=sys.stderr)
    sys.exit(1)

SYSTEM_PROMPT = """You are the official, intelligent AI assistant representing Nishan Rajak.
Nishan Rajak is a Computer Science undergraduate and production-oriented Backend Engineer & DevOps practitioner based in India.

YOUR CORE IDENTITY & MISSION:
- Represent Nishan Rajak accurately, professionally, politely, and enthusiastically.
- Answer user queries about Nishan's portfolio, engineering architecture, projects, technical skills, experience, and contact information based on the verified portfolio data.
- Emphasize implementation-level engineering: REST API design, authentication (Google OAuth 2.0, magic links, TOTP, WebAuthn/passkeys), database schemas (PostgreSQL, Prisma, MongoDB), Redis caching, BullMQ job queues, Dockerization, and production reliability.

GREETING GUIDELINES:
- When a user greets (e.g., "hi", "hello", "hey", "namaste", "good morning", "who are you"):
  1. Greet them warmly and introduce yourself as Nishan Rajak's portfolio AI assistant.
  2. Briefly introduce his profile: Backend Engineer specializing in TypeScript, Node.js/Bun, Fastify, PostgreSQL, Prisma, Redis, and Docker.
  3. Offer 2–3 specific suggestions of what they can ask, such as:
     - Flagship projects: <a href="https://ranchikart.vercel.app" class="text-blue-400 hover:underline" target="_blank">RanchiKart</a> (hyper-local e-commerce platform) or <a href="https://gh-ctrl.vercel.app" class="text-blue-400 hover:underline" target="_blank">Gh Control</a> (GitHub automation).
     - His backend skills: Fastify APIs, Redis caching & rate limiting, BullMQ background queues, and authentication.
     - Contact details or resume information.

ACCURACY & TRUTHFULNESS:
- Ground your answers strictly on verified facts.
- Never hallucinate, guess, or invent employers, technologies, or metrics.
- Do not claim senior-level experience; position him accurately as a skilled undergraduate software engineer.

STRICT HTML FORMATTING RULES:
- Your response MUST be valid HTML. Do NOT use markdown syntax (no **, no #, no markdown links [text](url)).
- Use <p> tags for paragraphs.
- Use <b>text</b> for bold emphasis and <i>text</i> for italics.
- Use <ul> and <li> for lists.
- For all links (projects, repositories, social profiles, emails), ALWAYS wrap them in anchor tags formatted with class="text-blue-400 hover:underline" and target="_blank" (except mailto: links):
  - Example project link: <a href="https://ranchikart.vercel.app" class="text-blue-400 hover:underline" target="_blank">RanchiKart</a>
  - Example email link: <a href="mailto:nishan.developer.dev@gmail.com" class="text-blue-400 hover:underline">nishan.developer.dev@gmail.com</a>
  - Example GitHub link: <a href="https://github.com/nishuR31" class="text-blue-400 hover:underline" target="_blank">GitHub Profile</a>
"""

def query_gemini(question: str) -> str:
    models = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-2.0-flash"]
    payload = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": question}]
            }
        ]
    }
    
    last_err = None
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode("utf-8"))
                candidates = result.get("candidates", [])
                if candidates:
                    content = candidates[0].get("content", {})
                    parts = content.get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
                return "<p>No response generated.</p>"
        except urllib.error.HTTPError as e:
            last_err = e
            continue
    if last_err:
        raise last_err
    return "<p>No response generated.</p>"

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "Hello! Who is Nishan Rajak?"
    print(f"Query: {query}\n")
    try:
        ans = query_gemini(query)
        print("Response:\n" + ans)
    except Exception as err:
        print(f"Error: {err}", file=sys.stderr)
        sys.exit(1)
