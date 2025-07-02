class SocketManager {
    constructor() {
        this.socket = null;
        this.currentRoom = null;
        this.userName = null;
        this.connectedUsers = [];
        this.connect();
    }
    
    connect() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            document.getElementById('connection-status').textContent = 'Connected';
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            document.getElementById('connection-status').textContent = 'Disconnected';
        });
        
        this.socket.on('user-joined', (data) => {
            console.log('User joined:', data.userName);
            this.connectedUsers.push(data);
            this.updateUserList();
        });
        
        this.socket.on('user-left', (data) => {
            console.log('User left:', data.userName);
            this.connectedUsers = this.connectedUsers.filter(u => u.userId !== data.userId);
            this.updateUserList();
        });
        
        this.socket.on('room-state', (data) => {
            console.log('Received room state:', data);
            this.connectedUsers = data.users.filter(u => u.id !== this.socket.id);
            this.updateUserList();
            
            // Load shapes from room state
            if (data.shapes && data.shapes.length > 0) {
                data.shapes.forEach(shapeData => {
                    window.shapeManager.addRemoteShape(shapeData);
                });
            }
        });
        
        this.socket.on('shape-added', (data) => {
            window.shapeManager.addRemoteShape(data);
        });
        
        this.socket.on('shape-deleted', (data) => {
            window.shapeManager.deleteShape(data.id);
        });
        
        this.socket.on('shape-moved', (data) => {
            window.shapeManager.moveShape(data.id, data.position);
        });
        
        this.socket.on('room-list', (rooms) => {
            this.updateRoomList(rooms);
        });
        
        this.socket.on('cursor-move', (data) => {
            if (window.cursorManager) {
                window.cursorManager.updateUserCursor(data);
            }
        });
        
        this.socket.on('user-action', (data) => {
            if (window.cursorManager) {
                window.cursorManager.showUserAction(data);
            }
        });
    }
    
    joinRoom(roomName, userName = null) {
        this.currentRoom = roomName;
        this.userName = userName || `User-${Date.now().toString().slice(-4)}`;
        
        // Clear current scene when joining new room
        if (window.sceneManager) {
            window.sceneManager.objects.forEach(obj => window.sceneManager.scene.remove(obj));
            window.sceneManager.objects = [];
            window.sceneManager.selectedObject = null;
        }
        
        this.socket.emit('join-room', { 
            roomName: roomName, 
            userName: this.userName 
        });
        
        console.log(`Joined room: ${roomName} as ${this.userName}`);
    }
    
    emit(event, data) {
        if (this.socket && this.currentRoom) {
            this.socket.emit(event, data);
        }
    }
    
    getRoomList() {
        if (this.socket) {
            this.socket.emit('get-room-list');
        }
    }
    
    updateUserList() {
        const userList = document.getElementById('user-list');
        if (userList) {
            const userNames = this.connectedUsers.map(u => u.name || u.userName).join(', ');
            userList.textContent = userNames || 'None';
        }
    }
    
    updateRoomList(rooms) {
        const container = document.getElementById('room-list-container');
        if (container) {
            if (rooms.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #9ca3af;">No active rooms</p>';
                return;
            }
            
            container.innerHTML = '';
            rooms.forEach(room => {
                const roomDiv = document.createElement('div');
                roomDiv.className = 'room-item';
                roomDiv.innerHTML = `
                    <div class="room-name">${room.name}</div>
                    <div class="room-users">${room.userCount} users</div>
                `;
                roomDiv.addEventListener('click', () => {
                    const userName = prompt('Enter your name (optional):') || null;
                    this.joinRoom(room.name, userName);
                    document.getElementById('current-room').textContent = room.name;
                    document.getElementById('project-name').value = room.name;
                    document.getElementById('room-modal').style.display = 'none';
                });
                container.appendChild(roomDiv);
            });
        }
    }
}