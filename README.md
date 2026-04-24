# Wheelsafar WhatsApp Community POC

This repo contains a proof of concept for:

1. collecting event details from a frontend form
2. saving the event in a FastAPI backend (SQLite or PostgreSQL/RDS)
3. forwarding the saved event to a WhatsApp group through a separate Node.js sender service using `whatsapp-web.js`

## Repo structure

- `main.py`
  FastAPI backend with SQLite persistence and forwarding logic.
- `public/index.html`
  Frontend form UI.
- `whatsapp-sender/server.js`
  Node.js service that sends messages through a linked WhatsApp session.
- `deploy/ec2/`
  Example deployment files for EC2.

## Local development

### Backend

```bash
cd "/Users/24khushi/Documents/New project"
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
WHATSAPP_FORWARD_MODE=service WHATSAPP_TARGET_CHAT_ID="120363424869869589@g.us" python3 -m uvicorn main:app --reload
```

### Sender

```bash
cd "/Users/24khushi/Documents/New project/whatsapp-sender"
npm install
WHATSAPP_SENDER_MODE=real node server.js
```

After the sender starts:

1. scan the QR code from WhatsApp `Linked Devices`
2. wait for `whatsapp client is ready`
3. open `http://localhost:8000/index.html`
4. submit the form

## Environment variables

Copy `.env.example` and adapt values for your machine or EC2 host.

Backend values:

- `EVENTS_DB_PATH`
- `DATABASE_URL` (optional; if set, backend uses PostgreSQL/RDS)
- `LISTINGS_TABLE` (recommended: `poc_whatsapp_listings`)
- `WHATSAPP_FORWARD_MODE`
- `WHATSAPP_SENDER_URL`
- `WHATSAPP_TARGET_CHAT_ID`
- `BACKEND_PORT`
- `GOOGLE_CLIENT_ID` (optional; enables Google SSO button)

Sender values:

- `WHATSAPP_SENDER_MODE`
- `SENDER_PORT`

## Notes

- `whatsapp-web.js` is useful for a group-posting POC, but it is not the official Meta business API.
- The WhatsApp linked-device session is stored on disk. Keep the sender service on persistent storage.
- If you redeploy or wipe the auth folder, you may need to scan the QR again.
- For shared RDS, keep this POC on a dedicated table (default: `poc_whatsapp_listings`) to avoid touching production tables.
- Google SSO uses Google Identity Services in frontend and ID token verification in backend (`/api/auth/google`).
