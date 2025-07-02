class CursorManager {
    constructor(sceneManager, socketManager) {
        this.sceneManager = sceneManager;
        this.socketManager = socketManager;
        this.userCursors = new Map();
        this.userColors = new Map();
        this.availableColors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
            '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9'
        ];
        this.colorIndex = 0;
        this.myColor = this.getNextColor();
        
        this.setupEventListeners();
    }
    
    getNextColor() {
        const color = this.availableColors[this.colorIndex % this.availableColors.length];
        this.colorIndex++;
        return color;
    }
    
    setupEventListeners() {
        // Track mouse movement and send cursor position
        this.sceneManager.renderer.domElement.addEventListener('mousemove', (event) => {
            if (this.socketManager.currentRoom) {
                const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                
                // Convert screen coordinates to world position
                const vector = new THREE.Vector3(x, y, 0.5);
                vector.unproject(this.sceneManager.camera);
                const dir = vector.sub(this.sceneManager.camera.position).normalize();
                const distance = -this.sceneManager.camera.position.y / dir.y;
                const worldPos = this.sceneManager.camera.position.clone().add(dir.multiplyScalar(distance));
                
                this.socketManager.emit('cursor-move', {
                    position: [worldPos.x, worldPos.y, worldPos.z],
                    color: this.myColor
                });
            }
        });
        
        // Setup socket listeners for other users' cursors
        this.socketManager.socket.on('cursor-move', (data) => {
            this.updateUserCursor(data);
        });
        
        this.socketManager.socket.on('user-action', (data) => {
            this.showUserAction(data);
        });
        
        this.socketManager.socket.on('user-left', (data) => {
            this.removeUserCursor(data.userId);
        });
    }
    
    updateUserCursor(data) {
        const { userId, userName, position, color } = data;
        
        if (!this.userCursors.has(userId)) {
            this.createUserCursor(userId, userName, color);
        }
        
        const cursor = this.userCursors.get(userId);
        cursor.position.fromArray(position);
        cursor.position.y = 0.1; // Slightly above ground
        
        // Update name label position
        const nameLabel = cursor.userData.nameLabel;
        if (nameLabel) {
            nameLabel.position.copy(cursor.position);
            nameLabel.position.y += 1;
        }
    }
    
    createUserCursor(userId, userName, color) {
        // Create cursor geometry (small sphere)
        const geometry = new THREE.SphereGeometry(0.1, 8, 6);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const cursor = new THREE.Mesh(geometry, material);
        cursor.userData = { userId, userName, type: 'cursor' };
        
        this.sceneManager.scene.add(cursor);
        this.userCursors.set(userId, cursor);
        this.userColors.set(userId, color);
        
        // Create name label
        this.createNameLabel(userId, userName, color);
        
        // Add pulsing animation
        this.animateCursor(cursor);
    }
    
    createNameLabel(userId, userName, color) {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        // Draw background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 10);
        context.fill();
        
        // Draw border
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 10);
        context.stroke();
        
        // Draw text
        context.fillStyle = 'white';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(userName || `User-${userId.substring(0, 6)}`, canvas.width / 2, canvas.height / 2 + 8);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 1, 1);
        sprite.userData = { userId, type: 'nameLabel' };
        
        this.sceneManager.scene.add(sprite);
        
        // Link to cursor
        const cursor = this.userCursors.get(userId);
        if (cursor) {
            cursor.userData.nameLabel = sprite;
        }
    }
    
    animateCursor(cursor) {
        const animate = () => {
            if (this.userCursors.has(cursor.userData.userId)) {
                cursor.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.2);
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    removeUserCursor(userId) {
        if (this.userCursors.has(userId)) {
            const cursor = this.userCursors.get(userId);
            
            // Remove name label
            if (cursor.userData.nameLabel) {
                this.sceneManager.scene.remove(cursor.userData.nameLabel);
            }
            
            // Remove cursor
            this.sceneManager.scene.remove(cursor);
            this.userCursors.delete(userId);
            this.userColors.delete(userId);
        }
    }
    
    showUserAction(data) {
        const { userId, userName, action, target } = data;
        
        // Create action notification
        const notification = document.createElement('div');
        notification.className = 'user-action-notification';
        notification.innerHTML = `
            <div class="action-user" style="color: ${this.userColors.get(userId) || '#fff'}">
                ${userName || `User-${userId.substring(0, 6)}`}
            </div>
            <div class="action-text">${action} ${target}</div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
    
    broadcastAction(action, target) {
        if (this.socketManager.currentRoom) {
            this.socketManager.emit('user-action', { action, target });
        }
    }
}

// Add roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}