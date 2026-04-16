# Community Event to WhatsApp POC

This project now validates a simple proof of concept:

1. A user fills an event form in the frontend.
2. FastAPI receives the payload and saves it in SQLite.
3. FastAPI then forwards the event to a Node.js sender service.
4. The sender service can stay in `mock` mode for testing or use `whatsapp-web.js` in `real` mode.

## Project pieces

- `public/index.html`
  Frontend event submission form.
- `main.py`
  FastAPI backend with SQLite persistence and forwarding logic.
- `whatsapp-sender/server.js`
  Node.js sender service for WhatsApp forwarding.

## Backend setup

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Optional environment variables:

```bash
export EVENTS_DB_PATH="/absolute/path/to/events.db"
export WHATSAPP_FORWARD_MODE="mock"
export WHATSAPP_SENDER_URL="http://127.0.0.1:3001/send"
export WHATSAPP_TARGET_CHAT_ID="community-announcements@g.us"
```

Start FastAPI:

```bash
uvicorn main:app --reload
```

Open the form:

```text
http://localhost:8000/index.html
```

## Sender service setup

Install the Node dependencies:

```bash
cd whatsapp-sender
npm install
```

Run in mock mode first:

```bash
WHATSAPP_SENDER_MODE=mock node server.js
```

For a real `whatsapp-web.js` session:

```bash
WHATSAPP_SENDER_MODE=real WHATSAPP_TARGET_CHAT_ID="<group-or-announcement-chat-id>" node server.js
```

Then:

1. Scan the QR code shown in the terminal.
2. Wait for the service to print that the WhatsApp client is ready.
3. Submit the form from the frontend.

## Notes for the POC

- The FastAPI app stores the event even if forwarding fails.
- `mock` mode is the fastest way to validate the frontend and backend path.
- For real forwarding, you need the correct chat ID for the announcement or target group.
- This uses `whatsapp-web.js`, which is useful for a POC but is not the official Meta business API.
