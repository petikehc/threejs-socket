// Initialize managers
window.sceneManager = new SceneManager();
window.shapeManager = new ShapeManager(window.sceneManager);
window.socketManager = new SocketManager();
window.cursorManager = new CursorManager(window.sceneManager, window.socketManager);

// UI Event Listeners
document.getElementById('add-cube').addEventListener('click', () => {
    window.shapeManager.addShape('cube');
    window.cursorManager.broadcastAction('added', 'cube');
});

document.getElementById('add-sphere').addEventListener('click', () => {
    window.shapeManager.addShape('sphere');
    window.cursorManager.broadcastAction('added', 'sphere');
});

document.getElementById('add-cylinder').addEventListener('click', () => {
    window.shapeManager.addShape('cylinder');
    window.cursorManager.broadcastAction('added', 'cylinder');
});

document.getElementById('delete-selected').addEventListener('click', () => {
    if (window.sceneManager.selectedObject) {
        const shapeType = window.sceneManager.selectedObject.userData.type;
        window.shapeManager.deleteSelected();
        window.cursorManager.broadcastAction('deleted', shapeType);
    }
});

document.getElementById('save-project').addEventListener('click', async () => {
    const projectName = document.getElementById('project-name').value.trim();
    if (!projectName) {
        alert('Please enter a project name');
        return;
    }
    
    const sceneData = window.sceneManager.getSceneData();
    
    try {
        const response = await fetch(`/api/projects/${projectName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ shapes: sceneData })
        });
        
        if (response.ok) {
            alert('Project saved successfully!');
        } else {
            alert('Failed to save project');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        alert('Error saving project');
    }
});

document.getElementById('load-project').addEventListener('click', async () => {
    const projectName = document.getElementById('project-name').value.trim();
    if (!projectName) {
        alert('Please enter a project name');
        return;
    }
    
    try {
        const response = await fetch(`/api/projects/${projectName}`);
        
        if (response.ok) {
            const projectData = await response.json();
            window.sceneManager.loadSceneData(projectData.shapes || []);
            alert('Project loaded successfully!');
        } else {
            alert('Project not found');
        }
    } catch (error) {
        console.error('Error loading project:', error);
        alert('Error loading project');
    }
});

document.getElementById('join-room').addEventListener('click', () => {
    const roomName = document.getElementById('project-name').value.trim();
    if (!roomName) {
        alert('Please enter a room name');
        return;
    }
    
    const userName = prompt('Enter your name (optional):') || null;
    window.socketManager.joinRoom(roomName, userName);
    document.getElementById('current-room').textContent = roomName;
});

document.getElementById('list-rooms').addEventListener('click', () => {
    window.socketManager.getRoomList();
    document.getElementById('room-modal').style.display = 'block';
});

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('room-modal').style.display = 'none';
});

// Close modal when clicking outside
document.getElementById('room-modal').addEventListener('click', (event) => {
    if (event.target === document.getElementById('room-modal')) {
        document.getElementById('room-modal').style.display = 'none';
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'Delete':
        case 'Backspace':
            if (window.sceneManager.selectedObject) {
                const shapeType = window.sceneManager.selectedObject.userData.type;
                window.shapeManager.deleteSelected();
                window.cursorManager.broadcastAction('deleted', shapeType);
            }
            event.preventDefault();
            break;
        case '1':
            window.shapeManager.addShape('cube');
            window.cursorManager.broadcastAction('added', 'cube');
            break;
        case '2':
            window.shapeManager.addShape('sphere');
            window.cursorManager.broadcastAction('added', 'sphere');
            break;
        case '3':
            window.shapeManager.addShape('cylinder');
            window.cursorManager.broadcastAction('added', 'cylinder');
            break;
    }
});