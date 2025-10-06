import fs from "fs";
import path from "path";
import http from "http";
import { v4 as uuidv4 } from "uuid";

import { WebSocket, WebSocketServer } from "ws";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// compiled
import { getDecodedFile as getDecodedFilePanel } from "./panel_compiled";
import { templates } from "./template_compiled";

// const roomPath = path.join(__dirname, "room");
// if (!fs.existsSync(roomPath)) {
//   fs.mkdirSync(roomPath);
// }

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const websocket = new WebSocketServer({ server });

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
const attackers = new Map<string, WebSocket>(); // room_id
const targets = new Map<string, WebSocket>(); // random uuid
interface RoomField {
  attacker_name: string;
  template_key: string;
  logo?: string;
  music?: string;
  message: string;
  teams: string[];
}
interface Room {
  attacker_id?: string;
  target_id?: string;
  is_target_close?: boolean;
  fields?: RoomField;
}
const rooms = new Map<string, Room>(); // room_id
websocket.on("connection", (ws: WebSocket) => {
  const id = uuidv4();
  const path = ws.url;
  console.log(`Client ${id} connected to ${path}`);

  ws.on("join_attacker", () => {
    attackers.set(id, ws);
    rooms.set(path, {
      attacker_id: id,
    });
  });
  ws.on("join_target", () => {
    targets.set(id, ws);
    const room = rooms.get(path);
    if (room) {
      room.target_id = id;
    }
  });
  ws.on("close", () => {
    console.log("Client disconnected");
    const is_attacker = attackers.get(id);
    if (is_attacker) {
      attackers.delete(id);
      rooms.delete(path);
    }
    const is_target = targets.get(id);
    if (is_target) {
      targets.delete(id);
      const room = rooms.get(path);
      if (room) {
        room.is_target_close = true;
      }
    }
  });

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
    // websocket.clients.forEach((client) => {
    //   if (client.readyState === WebSocket.OPEN) {
    //     client.send(JSON.stringify(msg));
    //   }
    // });
  });

  // Optional: kirim pesan saat connect
  const welcome: Message = {
    type: "attacker",
    device_id: "abc123",
    content: "Welcome!",
  };
  ws.send(JSON.stringify(welcome));
});

app.get("/api/templates", (req, res) => {
  res.json({
    message: "success",
    data: Object.keys(templates),
  });
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
