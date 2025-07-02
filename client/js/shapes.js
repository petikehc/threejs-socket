class ShapeManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.shapeId = 0;
    }
    
    generateId() {
        return `shape_${Date.now()}_${this.shapeId++}`;
    }
    
    createShape(type, id = null) {
        const shapeId = id || this.generateId();
        let geometry, material, mesh;
        
        switch (type) {
            case 'cube':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(0.5, 32, 16);
                material = new THREE.MeshLambertMaterial({ color: 0x0099ff });
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
                material = new THREE.MeshLambertMaterial({ color: 0xff9900 });
                break;
            default:
                console.error('Unknown shape type:', type);
                return null;
        }
        
        mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { 
            type: type, 
            id: shapeId 
        };
        
        // Position randomly on the grid
        mesh.position.set(
            Math.floor(Math.random() * 10) - 5,
            0.5,
            Math.floor(Math.random() * 10) - 5
        );
        
        return mesh;
    }
    
    addShape(type) {
        const shape = this.createShape(type);
        if (shape) {
            this.sceneManager.addObject(shape);
            
            // Emit to other clients if socket is connected
            if (window.socketManager && window.socketManager.socket) {
                window.socketManager.emit('shape-added', {
                    type: type,
                    position: shape.position.toArray(),
                    rotation: shape.rotation.toArray(),
                    scale: shape.scale.toArray(),
                    id: shape.userData.id
                });
            }
            
            return shape;
        }
        return null;
    }
    
    deleteSelected() {
        if (this.sceneManager.selectedObject) {
            const shapeId = this.sceneManager.selectedObject.userData.id;
            
            // Emit to other clients if socket is connected
            if (window.socketManager && window.socketManager.socket) {
                window.socketManager.emit('shape-deleted', { id: shapeId });
            }
            
            this.sceneManager.removeObject(this.sceneManager.selectedObject);
            this.sceneManager.selectedObject = null;
            document.getElementById('selected-info').textContent = 'None';
        }
    }
    
    moveShape(id, position) {
        const shape = this.sceneManager.objects.find(obj => obj.userData.id === id);
        if (shape) {
            shape.position.fromArray(position);
        }
    }
    
    deleteShape(id) {
        const shape = this.sceneManager.objects.find(obj => obj.userData.id === id);
        if (shape) {
            if (this.sceneManager.selectedObject === shape) {
                this.sceneManager.selectedObject = null;
                document.getElementById('selected-info').textContent = 'None';
            }
            this.sceneManager.removeObject(shape);
        }
    }
    
    addRemoteShape(data) {
        const shape = this.createShape(data.type, data.id);
        if (shape) {
            shape.position.fromArray(data.position);
            shape.rotation.fromArray(data.rotation);
            shape.scale.fromArray(data.scale);
            this.sceneManager.addObject(shape);
        }
    }
}