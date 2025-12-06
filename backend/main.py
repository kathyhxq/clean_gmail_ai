from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
from gmail_service import list_emails, delete_email, archive_email
from ai_service import analyze_filter_intent
from fastapi import HTTPException

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/emails")
def fetch_emails(q: str = ""):
    return list_emails(query=q)


@app.post("/clean")
async def ai_clean(body: dict):
    """
    Expects: { "userPrompt": "<what the user typed in the UI>" }
    """
    user_prompt = body.get("userPrompt", "").strip()
    if not user_prompt:
        raise HTTPException(status_code=400, detail="userPrompt is required")
    print("Received cleaning request:", user_prompt)
    # Call AI to analyze intent
    try:
        ai_result = analyze_filter_intent(user_prompt)
    except Exception as e:
        print("Error calling analyze_filter_intent:", e)
        raise HTTPException(status_code=500, detail=str(e))

    gmail_query = ai_result.get("gmailQuery", "") or ""
    criteria = ai_result.get("localFilterCriteria", {}) or {}
    explanation = ai_result.get("explanation", "")
    print("AI-built Gmail query:", gmail_query)
    print("Local filter criteria:", criteria)
    if not gmail_query:
        gmail_query = "Category:primary -in:spam -label:important"

    # fetch emails matching AI-built query
    emails = list_emails(gmail_query)

    # actions to perform - simple example:
    cleaned_ids = []
    for email in emails:
        delete_email(email["id"])
        cleaned_ids.append(email["id"])
       

    return {
        "userPrompt": user_prompt,
        "gmailQuery": gmail_query,
        "criteria": criteria,
        "explanation": explanation,
        "affectedEmails": cleaned_ids,
        "previewCount": len(emails),
    }