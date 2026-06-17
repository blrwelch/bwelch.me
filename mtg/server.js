const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname)));

// ── OG social card PNG (no extra deps, pure zlib) ──
app.get('/og-image.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(buildOGPng());
});

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

function buildOGPng() {
  const W = 1200, H = 630;
  const px = Buffer.alloc(W * H * 3);

  function set(x, y, r, g, b) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 3;
    px[i] = r; px[i + 1] = g; px[i + 2] = b;
  }
  function rect(x0, y0, x1, y1, r, g, b) {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, r, g, b);
  }
  function circle(cx, cy, rad, r, g, b) {
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++)
      if (dx * dx + dy * dy <= rad * rad) set(cx + dx, cy + dy, r, g, b);
  }
  function ring(cx, cy, r1, r2, r, g, b) {
    for (let dy = -r2; dy <= r2; dy++) for (let dx = -r2; dx <= r2; dx++) {
      const d = dx * dx + dy * dy;
      if (d >= r1 * r1 && d <= r2 * r2) set(cx + dx, cy + dy, r, g, b);
    }
  }

  // Background gradient (#070d08 → #111e12)
  for (let y = 0; y < H; y++) {
    const t = y / H;
    const r = Math.round(7 + 10 * t), g = Math.round(13 + 17 * t), b = Math.round(8 + 10 * t);
    for (let x = 0; x < W; x++) set(x, y, r, g, b);
  }

  // Outer border (green #34e064)
  rect(0, 0, W, 10, 52, 224, 100);
  rect(0, H - 10, W, H, 52, 224, 100);
  rect(0, 0, 10, H, 52, 224, 100);
  rect(W - 10, 0, W, H, 52, 224, 100);

  // Inner border (subtle lighter green)
  rect(16, 16, W - 16, 20, 30, 80, 50);
  rect(16, H - 20, W - 16, H - 16, 30, 80, 50);
  rect(16, 16, 20, H - 16, 30, 80, 50);
  rect(W - 20, 16, W - 16, H - 16, 30, 80, 50);

  // Horizontal divider
  rect(40, 420, W - 40, 424, 52, 224, 100);

  // 5 mana circles, evenly spaced
  const mana = [
    [200, 260, 60, 232, 192, 48],   // W – gold
    [420, 260, 60, 72,  184, 236],  // U – blue
    [600, 260, 60, 180, 100, 210],  // B – purple
    [780, 260, 60, 225, 90,  40],   // R – red
    [1000,260, 60, 52,  224, 100],  // G – green
  ];
  for (const [cx, cy, rad, r, g, b] of mana) {
    // Glow ring
    ring(cx, cy, rad, rad + 10, Math.round(r * 0.35), Math.round(g * 0.35), Math.round(b * 0.35));
    circle(cx, cy, rad, r, g, b);
    // Inner dark circle
    circle(cx, cy, rad - 14, Math.round(r * 0.18), Math.round(g * 0.18), Math.round(b * 0.18));
  }

  // Scanlines with filter byte 0
  const rows = [];
  for (let y = 0; y < H; y++) {
    const row = Buffer.alloc(1 + W * 3);
    px.copy(row, 1, y * W * 3, (y + 1) * W * 3);
    rows.push(row);
  }
  const compressed = zlib.deflateSync(Buffer.concat(rows), { level: 6 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit depth, RGB

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// rooms[roomCode] = { players: { playerId: playerState }, hostId }
const rooms = {};

function generateRoomCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function generatePlayerId() {
  return crypto.randomBytes(8).toString('hex');
}

function broadcastRoom(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  const msg = JSON.stringify({ type: 'room_state', room: sanitizeRoom(room) });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.roomCode === roomCode) {
      client.send(msg);
    }
  });
}

function sanitizeRoom(room) {
  return {
    players: room.players,
    hostId: room.hostId,
  };
}

function makePlayer(name, color) {
  return {
    name,
    color: color || 'green',
    life: 40,
    poison: 0,
    commanderDamage: {},
    eliminated: false,
    eliminatedBy: null,
  };
}

// Heartbeat: ping all clients every 25s, drop dead ones
const PING_INTERVAL = 25000;
setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) { ws.terminate(); return; }
    ws.isAlive = false;
    ws.ping();
  });
}, PING_INTERVAL);

wss.on('connection', ws => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.playerId = null;
  ws.roomCode = null;

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'create_room') {
      const roomCode = generateRoomCode();
      const playerId = generatePlayerId();
      rooms[roomCode] = {
        players: { [playerId]: makePlayer(msg.name, msg.color) },
        hostId: playerId,
      };
      ws.playerId = playerId;
      ws.roomCode = roomCode;
      ws.send(JSON.stringify({ type: 'joined', roomCode, playerId }));
      broadcastRoom(roomCode);
    }

    else if (msg.type === 'join_room') {
      const roomCode = msg.roomCode.toUpperCase();
      if (!rooms[roomCode]) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found. Check your code.' }));
        return;
      }
      const playerId = generatePlayerId();
      rooms[roomCode].players[playerId] = makePlayer(msg.name, msg.color);
      ws.playerId = playerId;
      ws.roomCode = roomCode;
      ws.send(JSON.stringify({ type: 'joined', roomCode, playerId }));
      broadcastRoom(roomCode);
    }

    else if (msg.type === 'update_player') {
      const { roomCode, playerId } = ws;
      if (!roomCode || !rooms[roomCode] || !rooms[roomCode].players[playerId]) return;
      const player = rooms[roomCode].players[playerId];

      if (msg.field === 'life') {
        player.life = Math.max(-999, player.life + msg.delta);
        checkElimination(rooms[roomCode], playerId);
      } else if (msg.field === 'poison') {
        player.poison = Math.max(0, Math.min(10, player.poison + msg.delta));
        checkElimination(rooms[roomCode], playerId);
      } else if (msg.field === 'commander_damage') {
        const fromId = msg.fromId;
        player.commanderDamage[fromId] = Math.max(0, (player.commanderDamage[fromId] || 0) + msg.delta);
        checkElimination(rooms[roomCode], playerId);
      } else if (msg.field === 'reset') {
        const name = player.name;
        rooms[roomCode].players[playerId] = makePlayer(name);
      }
      broadcastRoom(roomCode);
    }

    else if (msg.type === 'reset_all') {
      const { roomCode, playerId } = ws;
      if (!roomCode || !rooms[roomCode]) return;
      if (rooms[roomCode].hostId !== playerId) return;
      Object.keys(rooms[roomCode].players).forEach(id => {
        const name = rooms[roomCode].players[id].name;
        rooms[roomCode].players[id] = makePlayer(name);
      });
      broadcastRoom(roomCode);
    }
  });

  ws.on('close', () => {
    const { roomCode, playerId } = ws;
    if (roomCode && rooms[roomCode]) {
      delete rooms[roomCode].players[playerId];
      if (Object.keys(rooms[roomCode].players).length === 0) {
        delete rooms[roomCode];
      } else {
        if (rooms[roomCode].hostId === playerId) {
          rooms[roomCode].hostId = Object.keys(rooms[roomCode].players)[0];
        }
        broadcastRoom(roomCode);
      }
    }
  });
});

function checkElimination(room, playerId) {
  const player = room.players[playerId];
  if (player.eliminated) return;

  if (player.life <= 0) {
    player.eliminated = true;
    player.eliminatedBy = 'life';
  } else if (player.poison >= 10) {
    player.eliminated = true;
    player.eliminatedBy = 'poison';
  } else {
    for (const [fromId, dmg] of Object.entries(player.commanderDamage)) {
      if (dmg >= 21) {
        player.eliminated = true;
        player.eliminatedBy = 'commander';
        break;
      }
    }
  }
}

const PORT = process.env.PORT || 3742;
server.listen(PORT, () => {
  console.log(`MTG Commander Tracker running on http://localhost:${PORT}`);
});
