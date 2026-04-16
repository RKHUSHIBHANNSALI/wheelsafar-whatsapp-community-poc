# Community Event WhatsApp POC

This repo contains a simple proof of concept for:

1. collecting event details from a frontend form
2. saving the event in a FastAPI backend with SQLite
3. forwarding the saved event to a WhatsApp group through a separate Node.js sender service using `whatsapp-web.js`

## Repo structure

- `main.py`
  FastAPI backend with SQLite persistence and forwarding logic.
- `public/index.html`
  Frontend form UI.
- `whatsapp-sender/server.js`
  Node.js service that sends messages through a linked WhatsApp session.
- `deploy/ec2/`
  Example `systemd` and Nginx deployment files for EC2.

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
- `WHATSAPP_FORWARD_MODE`
- `WHATSAPP_SENDER_URL`
- `WHATSAPP_TARGET_CHAT_ID`
- `BACKEND_PORT`

Sender values:

- `WHATSAPP_SENDER_MODE`
- `SENDER_PORT`

## Push to GitHub

Create a new empty GitHub repository first, then run:

```bash
cd "/Users/24khushi/Documents/New project"
git add .
git commit -m "Initial community event WhatsApp POC"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Deploy to EC2

These deployment files assume:

- Ubuntu-based EC2 instance
- app code cloned to `/home/ubuntu/community-event-poc`
- backend runs on `127.0.0.1:8000`
- sender runs on `127.0.0.1:3001`
- Nginx proxies public traffic to the backend

### 1. Install system packages on EC2

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip nodejs npm nginx
```

### 2. Clone the repo

```bash
cd /home/ubuntu
git clone <your-github-repo-url> community-event-poc
cd community-event-poc
```

### 3. Backend setup

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

### 4. Sender setup

```bash
cd /home/ubuntu/community-event-poc/whatsapp-sender
npm install
```

Start it once manually to scan the QR:

```bash
WHATSAPP_SENDER_MODE=real node server.js
```

After QR login succeeds, stop it and continue with `systemd`.

### 5. Environment file

Create `/home/ubuntu/community-event-poc/.env`:

```bash
EVENTS_DB_PATH=/home/ubuntu/community-event-poc/events.db
WHATSAPP_FORWARD_MODE=service
WHATSAPP_SENDER_URL=http://127.0.0.1:3001/send
WHATSAPP_TARGET_CHAT_ID=120363424869869589@g.us
BACKEND_PORT=8000
WHATSAPP_SENDER_MODE=real
SENDER_PORT=3001
```

### 6. Install services

Copy the example files from `deploy/ec2/` into `/etc/systemd/system/` and update paths if needed:

```bash
sudo cp deploy/ec2/community-event-backend.service /etc/systemd/system/
sudo cp deploy/ec2/community-event-sender.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable community-event-backend
sudo systemctl enable community-event-sender
sudo systemctl start community-event-backend
sudo systemctl start community-event-sender
```

### 7. Nginx

```bash
sudo cp deploy/ec2/community-event.nginx.conf /etc/nginx/sites-available/community-event
sudo ln -s /etc/nginx/sites-available/community-event /etc/nginx/sites-enabled/community-event
sudo nginx -t
sudo systemctl reload nginx
```

Then open your EC2 public IP or domain.

## Notes

- `whatsapp-web.js` is good for a POC, but it is not the official Meta business API.
- The WhatsApp linked-device session is stored on disk. Keep the sender service on persistent storage.
- If you redeploy or wipe the auth folder, you may need to scan the QR again.
