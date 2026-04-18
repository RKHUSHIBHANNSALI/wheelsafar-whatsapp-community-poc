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
WHATSAPP_FORWARD_MODE = os.getenv("WHATSAPP_FORWARD_MODE", "mock").lower()
WHATSAPP_SENDER_URL = os.getenv("WHATSAPP_SENDER_URL", "http://127.0.0.1:3001/send")
WHATSAPP_TARGET_CHAT_ID = os.getenv("WHATSAPP_TARGET_CHAT_ID", "community-announcements@g.us")

app = FastAPI(title="Wheelsafar Garage Sale POC")


class ListingSubmission(BaseModel):
    category: str = Field(min_length=2, max_length=40)
    type: str = Field(default="", max_length=80)
    custom_type_title: str = Field(default="", max_length=80)
    size: str = Field(default="", max_length=40)
    size_system: str = Field(default="", max_length=20)
    brand: str = Field(default="", max_length=80)
    model: str = Field(default="", max_length=120)
    purchase_year: str = Field(default="", max_length=20)
    condition: str = Field(default="", max_length=40)
    colour: str = Field(default="", max_length=40)
    price: str = Field(default="", max_length=20)
    price_type: str = Field(default="fixed", max_length=20)
    used: str = Field(default="", max_length=10)
    owner_count: str = Field(default="", max_length=20)
    year: str = Field(default="", max_length=20)
    location: str = Field(default="", max_length=140)
    sale_timeline: str = Field(default="", max_length=40)
    mfg: str = Field(default="", max_length=20)
    odo: str = Field(default="", max_length=20)
    reg: str = Field(default="", max_length=20)
    description: str = Field(default="", max_length=1000)
    photos_names: list[str] = Field(default_factory=list, max_length=2)
    reason: str = Field(default="", max_length=600)
    seller_name: str = Field(min_length=2, max_length=100)
    seller_phone: str = Field(min_length=8, max_length=20)
    location_consent: bool = False
    call_preference: str = Field(default="", max_length=20)


def get_db_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with closing(get_db_connection()) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS listings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                listing_title TEXT NOT NULL,
                category TEXT NOT NULL,
                seller_name TEXT NOT NULL,
                seller_phone TEXT NOT NULL,
                price TEXT NOT NULL,
                location TEXT NOT NULL,
                details_json TEXT NOT NULL,
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


def build_listing_title(payload: ListingSubmission) -> str:
    type_label = payload.custom_type_title or payload.type or payload.category
    name_bits = " ".join(part for part in [payload.brand, payload.model] if part).strip()
    if name_bits:
        return f"{name_bits} • {type_label}"
    return type_label


def format_whatsapp_message(payload: ListingSubmission) -> str:
    type_label = payload.custom_type_title or payload.type or "General"
    lines = ["New Garage Sale Listing", f"Category: {payload.category}", f"Type: {type_label}"]

    brand_model = " ".join(part for part in [payload.brand, payload.model] if part).strip()
    if brand_model:
        lines.append(f"Brand/Model: {brand_model}")

    if payload.price:
        price_line = f"Price: INR {payload.price}"
        if payload.price_type:
            price_line += f" ({payload.price_type})"
        lines.append(price_line)

    if payload.location:
        lines.append(f"Location: {payload.location}")

    if payload.size:
        lines.append(f"Size/Capacity: {payload.size}")
    if payload.purchase_year:
        lines.append(f"Purchase year: {payload.purchase_year}")
    if payload.condition:
        lines.append(f"Condition: {payload.condition}")
    if payload.used:
        lines.append(f"Used: {payload.used}")
    if payload.owner_count:
        lines.append(f"Owner count: {payload.owner_count}")
    if payload.odo:
        lines.append(f"Odometer: {payload.odo} km")
    if payload.mfg:
        lines.append(f"Mfg year: {payload.mfg}")
    if payload.reg:
        lines.append(f"Registration year: {payload.reg}")
    if payload.sale_timeline:
        lines.append(f"Sale timeline: {payload.sale_timeline}")
    if payload.description:
        lines.append(f"Details: {payload.description}")

    if payload.reason:
        lines.append(f"Reason for sale: {payload.reason}")

    lines.extend([f"Seller: {payload.seller_name}", f"Phone: {payload.seller_phone}"])

    if payload.call_preference:
        lines.append(f"Contact preference: {payload.call_preference}")

    if payload.photos_names:
        lines.append(f"Photos attached: {', '.join(payload.photos_names)}")

    return "\n".join(lines)


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


def forward_listing_to_whatsapp(payload: ListingSubmission) -> dict[str, Any]:
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
            "detail": "POC mock mode accepted the listing for forwarding.",
            "message_preview": message,
        }

    try:
        sender_response = send_to_sender_service(message)
        return {
            "status": "forwarded",
            "target": WHATSAPP_TARGET_CHAT_ID,
            "detail": "Listing forwarded to the Node sender service.",
            "sender_response": sender_response,
        }
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        return {
            "status": "failed",
            "target": WHATSAPP_TARGET_CHAT_ID,
            "detail": f"Sender service error: {exc}",
        }


def insert_listing(payload: ListingSubmission, forward_result: dict[str, Any]) -> dict[str, Any]:
    created_at = datetime.now(timezone.utc).isoformat()
    details_json = payload.model_dump_json()
    response_json = json.dumps(forward_result)
    listing_title = build_listing_title(payload)

    with closing(get_db_connection()) as connection:
        cursor = connection.execute(
            """
            INSERT INTO listings (
                listing_title,
                category,
                seller_name,
                seller_phone,
                price,
                location,
                details_json,
                created_at,
                forward_status,
                forward_target,
                forward_response
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                listing_title,
                payload.category,
                payload.seller_name,
                payload.seller_phone,
                payload.price or "",
                payload.location or "",
                details_json,
                created_at,
                forward_result["status"],
                forward_result["target"],
                response_json,
            ),
        )
        connection.commit()
        listing_id = cursor.lastrowid

    return {
        "id": listing_id,
        "listing_title": listing_title,
        **payload.model_dump(),
        "created_at": created_at,
        "forward_status": forward_result["status"],
        "forward_target": forward_result["target"],
        "forward_response": forward_result,
    }


def fetch_recent_listings(limit: int = 20) -> list[dict[str, Any]]:
    with closing(get_db_connection()) as connection:
        rows = connection.execute(
            """
            SELECT
                id,
                listing_title,
                category,
                seller_name,
                seller_phone,
                price,
                location,
                details_json,
                created_at,
                forward_status,
                forward_target,
                forward_response
            FROM listings
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    listings: list[dict[str, Any]] = []
    for row in rows:
        details = json.loads(row["details_json"] or "{}")
        listings.append(
            {
                "id": row["id"],
                "listing_title": row["listing_title"],
                "category": row["category"],
                "seller_name": row["seller_name"],
                "seller_phone": row["seller_phone"],
                "price": row["price"],
                "location": row["location"],
                "details": details,
                "created_at": row["created_at"],
                "forward_status": row["forward_status"],
                "forward_target": row["forward_target"],
                "forward_response": json.loads(row["forward_response"] or "{}"),
            }
        )
    return listings


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


@app.get("/api/listings")
async def list_listings() -> JSONResponse:
    return JSONResponse({"items": fetch_recent_listings()})


@app.get("/api/events")
async def list_events_alias() -> JSONResponse:
    return JSONResponse({"items": fetch_recent_listings()})


@app.post("/api/listings")
async def create_listing(payload: ListingSubmission) -> JSONResponse:
    forward_result = forward_listing_to_whatsapp(payload)
    listing = insert_listing(payload, forward_result)

    response = {
        "ok": True,
        "message": "Listing saved successfully.",
        "listing": listing,
    }
    status_code = 200 if forward_result["status"] != "failed" else 202
    return JSONResponse(response, status_code=status_code)


@app.post("/api/events")
async def create_event_alias(payload: ListingSubmission) -> JSONResponse:
    return await create_listing(payload)


@app.get("/")
async def read_root() -> JSONResponse:
    raise HTTPException(status_code=404, detail="Open /index.html for the frontend.")


app.mount("/", StaticFiles(directory=PUBLIC_DIR, html=True), name="public")
