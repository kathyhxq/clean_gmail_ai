import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load .env file so we can read API_KEY
load_dotenv()

API_KEY = os.getenv("API_KEY")

if not API_KEY:
    raise ValueError("API_KEY missing from .env file")

# Configure Gemini client
genai.configure(api_key=API_KEY)

# Use a fast model – you can change if needed
model = genai.GenerativeModel("gemini-2.5-flash")


def analyze_filter_intent(user_prompt: str) -> str:
    """
    Call Gemini to analyze the user's cleaning prompt and return
    a JSON string with:
      - gmailQuery
      - explanation
      - localFilterCriteria
    (Same idea as your TypeScript analyzeFilterIntent.)
    """
    prompt = f"""
    You are a Gmail Search Expert.
    User wants to filter emails in Gmail. 
    Analyze this request: "{user_prompt}".

    Construct a highly effective Gmail search query (using operators like category:, -in:spam, -label:important, older_than:, etc.).

    CRITICAL RULES FOR GMAIL QUERIES:
    - If user mentions "Primary", use 'category:primary'.
    - If user wants "non-important", use '-label:important' (and optionally '-is:starred').
    - If user wants to clean "clutter", look for 'unsubscribe' OR 'category:updates' OR 'category:promotions'.
    - If user says "not spam", use '-in:spam'.

    You MUST respond ONLY as a valid JSON object with this shape:

    {{
    "gmailQuery": "string - Gmail search operator string",
    "explanation": "short human explanation of what this filter does",
    "localFilterCriteria": {{
        "senderContains": ["optional", "strings"],
        "subjectContains": ["optional", "strings"],
        "bodyContains": ["optional", "strings"],
        "olderThanDays": 90,
        "category": "primary|promotions|updates|social|all",
        "isUnread": false,
        "excludeImportant": true
    }}
    }}

    If some fields are not needed, you may omit them or set them to null/empty list.
    ONLY output the JSON object, with no extra text.
    """

    response = model.generate_content(
        prompt,
        generation_config={
            "response_mime_type": "application/json",
        },
    )

    text = response.text

    # Basic sanity check
    if not text:
        raise RuntimeError("Gemini returned empty response")

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Very defensive fallback
        data = {
            "gmailQuery": "",
            "explanation": f"Model did not return valid JSON. Raw: {text}",
            "localFilterCriteria": {},
        }

    # Log so you can see what Gemini is returning
    print("analyze_filter_intent ->", json.dumps(data, indent=2))

    return data
    