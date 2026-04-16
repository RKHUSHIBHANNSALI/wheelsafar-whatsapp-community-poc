import json
import os
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
DATABASE_PATH = Path(os.getenv("EVENTS_DB_PATH", BASE_DIR / "events.db"))
WHATSAPP_SENDER_URL = os.getenv("WHATSAPP_SENDER_URL", "http://127.0.0.1:3001/send")
WHATSAPP_TARGET_CHAT_ID = os.getenv("WHATSAPP_TARGET_CHAT_ID", "community-announcements@g.us")
WHATSAPP_FORWARD_MODE = os.getenv("WHATSAPP_FORWARD_MODE", "mock").lower()

app = FastAPI(title="Community Event POC")


class EventSubmission(BaseModel):
    organizer_name: str = Field(min_length=2, max_length=100)
    phone_number: str = Field(min_length=8, max_length=20)
    title: str = Field(min_length=3, max_length=140)
    event_date: str = Field(min_length=3, max_length=40)
    location: str = Field(min_length=2, max_length=140)
    description: str = Field(min_length=10, max_length=1000)


def get_db_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with closing(get_db_connection()) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                organizer_name TEXT NOT NULL,
                phone_number TEXT NOT NULL,
                title TEXT NOT NULL,
                event_date TEXT NOT NULL,
                location TEXT NOT NULL,
                description TEXT NOT NULL,
                created_at TEXT NOT NULL,
                forward_status TEXT NOT NULL,
                forward_target TEXT NOT NULL,
                forward_response TEXT
            )
            """
        )
        connection.commit()


@app.on_event("startup")
def startup() -> None:
    init_db()


def format_whatsapp_message(payload: EventSubmission) -> str:
    return (
        "New Community Event Submission\n"
        f"Organizer: {payload.organizer_name}\n"
        f"Phone: {payload.phone_number}\n"
        f"Title: {payload.title}\n"
        f"Date: {payload.event_date}\n"
        f"Location: {payload.location}\n"
        f"Details: {payload.description}"
    )


def send_to_sender_service(message: str) -> dict[str, Any]:
    body = json.dumps(
        {
            "chatId": WHATSAPP_TARGET_CHAT_ID,
            "message": message,
        }
    ).encode("utf-8")
    request = Request(
        WHATSAPP_SENDER_URL,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=15) as response:
        response_payload = response.read().decode("utf-8")
        return json.loads(response_payload) if response_payload else {"ok": True}


def forward_event_to_whatsapp(payload: EventSubmission) -> dict[str, Any]:
    message = format_whatsapp_message(payload)

    if WHATSAPP_FORWARD_MODE == "off":
        return {
            "status": "skipped",
            "target": WHATSAPP_TARGET_CHAT_ID,
            "detail": "WhatsApp forwarding is disabled.",
        }

    if WHATSAPP_FORWARD_MODE == "mock":
        return {
            "status": "mocked",
            "target": WHATSAPP_TARGET_CHAT_ID,
            "detail": "POC mock mode accepted the event for forwarding.",
            "message_preview": message,
        }

    try:
        sender_response = send_to_sender_service(message)
        return {
            "status": "forwarded",
            "target": WHATSAPP_TARGET_CHAT_ID,
            "detail": "Event forwarded to the Node sender service.",
            "sender_response": sender_response,
        }
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        return {
            "status": "failed",
            "target": WHATSAPP_TARGET_CHAT_ID,
            "detail": f"Sender service error: {exc}",
        }


def insert_event(payload: EventSubmission, forward_result: dict[str, Any]) -> dict[str, Any]:
    created_at = datetime.now(timezone.utc).isoformat()
    response_json = json.dumps(forward_result)

    with closing(get_db_connection()) as connection:
        cursor = connection.execute(
            """
            INSERT INTO events (
                organizer_name,
                phone_number,
                title,
                event_date,
                location,
                description,
                created_at,
                forward_status,
                forward_target,
                forward_response
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.organizer_name,
                payload.phone_number,
                payload.title,
                payload.event_date,
                payload.location,
                payload.description,
                created_at,
                forward_result["status"],
                forward_result["target"],
                response_json,
            ),
        )
        connection.commit()
        event_id = cursor.lastrowid

    return {
        "id": event_id,
        **payload.model_dump(),
        "created_at": created_at,
        "forward_status": forward_result["status"],
        "forward_target": forward_result["target"],
        "forward_response": forward_result,
    }


def fetch_recent_events(limit: int = 20) -> list[dict[str, Any]]:
    with closing(get_db_connection()) as connection:
        rows = connection.execute(
            """
            SELECT
                id,
                organizer_name,
                phone_number,
                title,
                event_date,
                location,
                description,
                created_at,
                forward_status,
                forward_target,
                forward_response
            FROM events
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    events: list[dict[str, Any]] = []
    for row in rows:
        events.append(
            {
                "id": row["id"],
                "organizer_name": row["organizer_name"],
                "phone_number": row["phone_number"],
                "title": row["title"],
                "event_date": row["event_date"],
                "location": row["location"],
                "description": row["description"],
                "created_at": row["created_at"],
                "forward_status": row["forward_status"],
                "forward_target": row["forward_target"],
                "forward_response": json.loads(row["forward_response"] or "{}"),
            }
        )
    return events


@app.get("/api/health")
async def health() -> JSONResponse:
    return JSONResponse(
        {
            "ok": True,
            "database": str(DATABASE_PATH),
            "whatsapp_forward_mode": WHATSAPP_FORWARD_MODE,
            "whatsapp_sender_url": WHATSAPP_SENDER_URL,
            "target_chat_id": WHATSAPP_TARGET_CHAT_ID,
        }
    )


@app.get("/api/events")
async def list_events() -> JSONResponse:
    return JSONResponse({"items": fetch_recent_events()})


@app.post("/api/events")
async def create_event(payload: EventSubmission) -> JSONResponse:
    forward_result = forward_event_to_whatsapp(payload)
    event = insert_event(payload, forward_result)

    response = {
        "ok": True,
        "message": "Event saved successfully.",
        "event": event,
    }
    status_code = 200 if forward_result["status"] != "failed" else 202
    return JSONResponse(response, status_code=status_code)


@app.get("/")
async def read_root() -> JSONResponse:
    raise HTTPException(status_code=404, detail="Open /index.html for the frontend.")


app.mount("/", StaticFiles(directory=PUBLIC_DIR, html=True), name="public")
