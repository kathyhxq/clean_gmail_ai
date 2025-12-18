import os
import json
from typing import List, Dict
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

TOKEN_FILE = "token.json"
SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

print("ENV CHECK:", os.getenv("GMAIL_CREDENTIALS_JSON") is not None)
def get_gmail_service():
    """
    Authenticate and return a Gmail API service instance.
    Priority:
    1.If GMAIL_TOKEN_JSON env var is set, use it.
    2.If token.json file exists, use it.
    3.Otherwise, go through OAuth flow.
    """
    creds = None
    token_json_env = os.getenv("GMAIL_TOKEN_JSON")
    credentials_json_env = os.getenv("GMAIL_CREDENTIALS_JSON")

    if token_json_env:
        creds = Credentials.from_authorized_user_info(json.loads(token_json_env), SCOPES)
    elif os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    # If no valid credentials, go through OAuth flow
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not credentials_json_env:
                raise Exception("GMAIL_CREDENTIALS_JSON environment variable is not set.")
            flow = InstalledAppFlow.from_client_config(
                json.loads(credentials_json_env), SCOPES
            )
            creds = flow.run_local_server(port=8080)
        # Save the token for next time
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())    

    # # Load saved token if available
    # if os.path.exists(TOKEN_FILE):
    #     creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    # # If no valid credentials, go through OAuth flow
    # if not creds or not creds.valid:
    #     if creds and creds.expired and creds.refresh_token:
    #         creds.refresh(Request())
    #     else:
    #         flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
    #         creds = flow.run_local_server(port=8080)
    #     # Save the token for next time
    #     with open(TOKEN_FILE, "w") as f:
    #         f.write(creds.to_json())

    service = build("gmail", "v1", credentials=creds)
    return service


def list_emails(query: str = ""):
    """
    Return a simple list of emails: [{id, subject, sender, snippet}, ...]
    """
    service = get_gmail_service()
    results = service.users().messages().list(
        userId="me", q=query, maxResults=100
    ).execute()
    messages = results.get("messages", [])

    emails = []
    for m in messages:
        msg = service.users().messages().get(userId="me", id=m["id"]).execute()
        payload = msg.get("payload", {})
        headers = payload.get("headers", [])

        subject = ""
        sender = ""

        for h in headers:
            if h["name"].lower() == "subject":
                subject = h["value"]
            if h["name"].lower() == "from":
                sender = h["value"]

        snippet = msg.get("snippet", "")

        emails.append(
            {
                "id": m["id"],
                "subject": subject,
                "sender": sender,
                "snippet": snippet,
            }
        )

    return emails


def delete_email(msg_id: str):
    service = get_gmail_service()
    service.users().messages().trash(userId="me", id=msg_id).execute()


def archive_email(msg_id: str):
    service = get_gmail_service()
    service.users().messages().modify(
        userId="me",
        id=msg_id,
        body={"removeLabelIds": ["INBOX"]},
    ).execute()