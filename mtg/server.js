const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname)));

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
