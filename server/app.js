const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const PROJECTS_DIR = path.join(__dirname, 'projects');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/api/projects', (req, res) => {
  try {
    const files = fs.readdirSync(PROJECTS_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

app.get('/api/projects/:name', (req, res) => {
  try {
    const projectPath = path.join(PROJECTS_DIR, `${req.params.name}.json`);
    if (fs.existsSync(projectPath)) {
      const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
      res.json(project);
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to load project' });
  }
});

app.post('/api/projects/:name', (req, res) => {
  try {
    const projectPath = path.join(PROJECTS_DIR, `${req.params.name}.json`);
    fs.writeFileSync(projectPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save project' });
  }
});

// Store room data and user info
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (data) => {
    const { roomName, userName = `User-${socket.id.substring(0, 6)}` } = data;
    
    // Leave previous room if any
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
      if (rooms.has(socket.currentRoom)) {
        const room = rooms.get(socket.currentRoom);
        room.users.delete(socket.id);
        socket.to(socket.currentRoom).emit('user-left', { 
          userId: socket.id, 
          userName: socket.userName 
        });
      }
    }

    // Join new room
    socket.join(roomName);
    socket.currentRoom = roomName;
    socket.userName = userName;

    // Initialize room if it doesn't exist
    if (!rooms.has(roomName)) {
      rooms.set(roomName, {
        users: new Map(),
        shapes: []
      });
    }

    const room = rooms.get(roomName);
    room.users.set(socket.id, { id: socket.id, name: userName });

    console.log(`User ${userName} (${socket.id}) joined room: ${roomName}`);
    
    // Send current room state to new user
    socket.emit('room-state', {
      shapes: room.shapes,
      users: Array.from(room.users.values())
    });

    // Notify other users
    socket.to(roomName).emit('user-joined', { 
      userId: socket.id, 
      userName: userName 
    });
  });

  socket.on('shape-added', (data) => {
    if (socket.currentRoom && rooms.has(socket.currentRoom)) {
      const room = rooms.get(socket.currentRoom);
      room.shapes.push(data);
      socket.to(socket.currentRoom).emit('shape-added', data);
    }
  });

  socket.on('shape-moved', (data) => {
    if (socket.currentRoom && rooms.has(socket.currentRoom)) {
      const room = rooms.get(socket.currentRoom);
      const shapeIndex = room.shapes.findIndex(s => s.id === data.id);
      if (shapeIndex !== -1) {
        room.shapes[shapeIndex].position = data.position;
      }
      socket.to(socket.currentRoom).emit('shape-moved', data);
    }
  });

  socket.on('shape-deleted', (data) => {
    if (socket.currentRoom && rooms.has(socket.currentRoom)) {
      const room = rooms.get(socket.currentRoom);
      room.shapes = room.shapes.filter(s => s.id !== data.id);
      socket.to(socket.currentRoom).emit('shape-deleted', data);
    }
  });

  socket.on('cursor-move', (data) => {
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit('cursor-move', {
        userId: socket.id,
        userName: socket.userName,
        position: data.position,
        color: data.color
      });
    }
  });

  socket.on('user-action', (data) => {
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit('user-action', {
        userId: socket.id,
        userName: socket.userName,
        action: data.action,
        target: data.target
      });
    }
  });

  socket.on('get-room-list', () => {
    const roomList = Array.from(rooms.keys()).map(roomName => ({
      name: roomName,
      userCount: rooms.get(roomName).users.size
    }));
    socket.emit('room-list', roomList);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.currentRoom && rooms.has(socket.currentRoom)) {
      const room = rooms.get(socket.currentRoom);
      room.users.delete(socket.id);
      
      socket.to(socket.currentRoom).emit('user-left', { 
        userId: socket.id, 
        userName: socket.userName 
      });

      // Clean up empty rooms
      if (room.users.size === 0) {
        rooms.delete(socket.currentRoom);
        console.log(`Room ${socket.currentRoom} deleted (no users)`);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});