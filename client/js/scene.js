class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedObject = null;
        this.objects = [];
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x222222);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Add grid
        const gridHelper = new THREE.GridHelper(20, 20);
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
        
        // Position camera
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
        
        // Add controls
        this.setupControls();
    }
    
    setupControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            if (event.button === 2) { // Right click for camera control
                isDragging = true;
                previousMousePosition = { x: event.clientX, y: event.clientY };
            }
        });
        
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (isDragging) {
                const deltaMove = {
                    x: event.clientX - previousMousePosition.x,
                    y: event.clientY - previousMousePosition.y
                };
                
                const deltaRotationQuaternion = new THREE.Quaternion()
                    .setFromEuler(new THREE.Euler(
                        toRadians(deltaMove.y * 1),
                        toRadians(deltaMove.x * 1),
                        0,
                        'XYZ'
                    ));
                
                this.camera.quaternion.multiplyQuaternions(deltaRotationQuaternion, this.camera.quaternion);
                previousMousePosition = { x: event.clientX, y: event.clientY };
            }
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Prevent context menu
        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        // Zoom with wheel
        this.renderer.domElement.addEventListener('wheel', (event) => {
            const zoomSpeed = 0.1;
            this.camera.position.multiplyScalar(1 + (event.deltaY > 0 ? zoomSpeed : -zoomSpeed));
        });
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        let isDraggingObject = false;
        let dragPlane = new THREE.Plane();
        let dragOffset = new THREE.Vector3();
        
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // Left click
                this.handleSelection(event);
                if (this.selectedObject) {
                    isDraggingObject = true;
                    
                    // Create a plane for dragging at the object's Y level
                    dragPlane.setFromNormalAndCoplanarPoint(
                        new THREE.Vector3(0, 1, 0), 
                        this.selectedObject.position
                    );
                    
                    // Calculate offset from object center to mouse
                    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                    this.raycaster.setFromCamera(this.mouse, this.camera);
                    
                    const intersection = new THREE.Vector3();
                    this.raycaster.ray.intersectPlane(dragPlane, intersection);
                    dragOffset.subVectors(this.selectedObject.position, intersection);
                }
            }
        });
        
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (isDraggingObject && this.selectedObject) {
                this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                this.raycaster.setFromCamera(this.mouse, this.camera);
                
                const intersection = new THREE.Vector3();
                if (this.raycaster.ray.intersectPlane(dragPlane, intersection)) {
                    this.selectedObject.position.copy(intersection.add(dragOffset));
                }
            }
        });
        
        this.renderer.domElement.addEventListener('mouseup', (event) => {
            if (isDraggingObject && this.selectedObject) {
                isDraggingObject = false;
                
                // Emit position change to other clients
                if (window.socketManager && window.socketManager.socket) {
                    window.socketManager.emit('shape-moved', {
                        id: this.selectedObject.userData.id,
                        position: this.selectedObject.position.toArray()
                    });
                }
            }
        });
    }
    
    handleSelection(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects);
        
        // Clear previous selection
        if (this.selectedObject) {
            this.selectedObject.material.emissive.setHex(0x000000);
        }
        
        if (intersects.length > 0) {
            this.selectedObject = intersects[0].object;
            this.selectedObject.material.emissive.setHex(0x444444);
            document.getElementById('selected-info').textContent = this.selectedObject.userData.type || 'Shape';
        } else {
            this.selectedObject = null;
            document.getElementById('selected-info').textContent = 'None';
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
    
    addObject(object) {
        this.scene.add(object);
        this.objects.push(object);
        object.castShadow = true;
        object.receiveShadow = true;
    }
    
    removeObject(object) {
        this.scene.remove(object);
        const index = this.objects.indexOf(object);
        if (index > -1) {
            this.objects.splice(index, 1);
        }
    }
    
    getSceneData() {
        return this.objects.map(obj => ({
            type: obj.userData.type,
            position: obj.position.toArray(),
            rotation: obj.rotation.toArray(),
            scale: obj.scale.toArray(),
            id: obj.userData.id
        }));
    }
    
    loadSceneData(data) {
        // Clear existing objects
        this.objects.forEach(obj => this.scene.remove(obj));
        this.objects = [];
        this.selectedObject = null;
        
        // Add objects from data
        data.forEach(objData => {
            const shape = window.shapeManager.createShape(objData.type, objData.id);
            shape.position.fromArray(objData.position);
            shape.rotation.fromArray(objData.rotation);
            shape.scale.fromArray(objData.scale);
            this.addObject(shape);
        });
    }
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}