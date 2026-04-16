const http = require("http");

const PORT = Number(process.env.PORT || 3001);
const CHAT_ID = process.env.WHATSAPP_TARGET_CHAT_ID || "community-announcements@g.us";
const MODE = (process.env.WHATSAPP_SENDER_MODE || "mock").toLowerCase();

let client = null;
let clientReady = false;

function log(message) {
  console.log(`[sender] ${message}`);
}

async function setupWhatsAppClient() {
  if (MODE !== "real") {
    log(`running in ${MODE} mode; whatsapp-web.js client not started`);
    return;
  }

  const { Client, LocalAuth } = require("whatsapp-web.js");
  const qrcode = require("qrcode-terminal");

  client = new Client({
    authStrategy: new LocalAuth({ clientId: "community-poc" }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", (qr) => {
    log("scan this QR in WhatsApp to connect the sender service");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    clientReady = true;
    log("whatsapp client is ready");
  });

  client.on("authenticated", () => {
    log("whatsapp client authenticated");
  });

  client.on("auth_failure", (message) => {
    clientReady = false;
    log(`authentication failed: ${message}`);
  });

  client.on("disconnected", (reason) => {
    clientReady = false;
    log(`whatsapp client disconnected: ${reason}`);
  });

  await client.initialize();
}

async function forwardMessage(chatId, message) {
  if (MODE !== "real") {
    log(`mock forward to ${chatId}: ${message}`);
    return {
      ok: true,
      mode: MODE,
      target: chatId,
      detail: "Message accepted in mock mode.",
    };
  }

  if (!client || !clientReady) {
    throw new Error("WhatsApp client is not ready yet. Scan the QR and wait for readiness.");
  }

  const chat = await client.getChatById(chatId);
  const sentMessage = await chat.sendMessage(message);

  return {
    ok: true,
    mode: MODE,
    target: chatId,
    messageId: sentMessage.id?._serialized || null,
  };
}

async function listChats() {
  if (MODE !== "real") {
    return [
      {
        id: CHAT_ID,
        name: "mock-chat",
        isGroup: true,
      },
    ];
  }

  if (!client || !clientReady) {
    throw new Error("WhatsApp client is not ready yet. Scan the QR and wait for readiness.");
  }

  const chats = await client.getChats();
  return chats.slice(0, 100).map((chat) => ({
    id: chat.id?._serialized || null,
    name: chat.name || chat.formattedTitle || "Unnamed chat",
    isGroup: Boolean(chat.isGroup),
  }));
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    return sendJson(response, 200, {
      ok: true,
      mode: MODE,
      clientReady,
      targetChatId: CHAT_ID,
    });
  }

  if (request.method === "GET" && request.url === "/chats") {
    try {
      const chats = await listChats();
      return sendJson(response, 200, {
        ok: true,
        items: chats,
      });
    } catch (error) {
      return sendJson(response, 500, {
        ok: false,
        error: error.message,
      });
    }
  }

  if (request.method !== "POST" || request.url !== "/send") {
    return sendJson(response, 404, { ok: false, error: "Not found" });
  }

  let body = "";
  request.on("data", (chunk) => {
    body += chunk;
  });

  request.on("end", async () => {
    try {
      const payload = JSON.parse(body || "{}");
      const chatId = payload.chatId || CHAT_ID;
      const message = payload.message;

      if (!message || typeof message !== "string") {
        return sendJson(response, 400, {
          ok: false,
          error: "A non-empty message string is required.",
        });
      }

      const result = await forwardMessage(chatId, message);
      return sendJson(response, 200, result);
    } catch (error) {
      log(`send failed: ${error.message}`);
      return sendJson(response, 500, {
        ok: false,
        error: error.message,
      });
    }
  });
});

setupWhatsAppClient()
  .then(() => {
    server.listen(PORT, () => {
      log(`sender service listening on http://127.0.0.1:${PORT}`);
    });
  })
  .catch((error) => {
    log(`startup failed: ${error.message}`);
    process.exit(1);
  });
