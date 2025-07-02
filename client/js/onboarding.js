class OnboardingManager {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = null;
        this.tooltip = null;
        
        this.steps = [
            {
                target: '#project-name',
                title: 'Enter Room Name',
                text: 'Type a room name to create or join a collaboration space. Share this name with others to work together!',
                position: 'bottom',
                action: 'highlight'
            },
            {
                target: '#join-room',
                title: 'Join Room',
                text: 'Click here to enter your room. You can optionally set a username when joining.',
                position: 'bottom',
                action: 'highlight'
            },
            {
                target: '#list-rooms',
                title: 'Browse Active Rooms',
                text: 'See what rooms are currently active and how many people are in each one.',
                position: 'bottom',
                action: 'highlight'
            },
            {
                target: '#shape-tools',
                title: 'Create 3D Shapes',
                text: 'Add cubes, spheres, and cylinders to your 3D scene. Try the keyboard shortcuts: 1, 2, 3!',
                position: 'bottom',
                action: 'highlight'
            },
            {
                target: '#canvas-container',
                title: 'Interactive 3D Scene',
                text: 'Left-click to select shapes, drag to move them. Right-click and drag to rotate the camera. Mouse wheel to zoom.',
                position: 'center',
                action: 'highlight'
            },
            {
                target: '#save-project',
                title: 'Save Your Work',
                text: 'Save your 3D scene as a project file. Load it later or share the room name with collaborators.',
                position: 'bottom',
                action: 'highlight'
            }
        ];
        
        this.init();
    }
    
    init() {
        if (this.hasSeenOnboarding()) {
            this.showHelpButton();
            return;
        }
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.showWelcomeModal());
        } else {
            this.showWelcomeModal();
        }
    }
    
    hasSeenOnboarding() {
        return localStorage.getItem('threejs-onboarding-complete') === 'true';
    }
    
    markOnboardingComplete() {
        localStorage.setItem('threejs-onboarding-complete', 'true');
    }
    
    showWelcomeModal() {
        const modal = document.createElement('div');
        modal.className = 'onboarding-modal';
        modal.innerHTML = `
            <div class="onboarding-modal-content">
                <div class="onboarding-header">
                    <h2>🎨 Welcome to 3D Collaboration!</h2>
                </div>
                <div class="onboarding-body">
                    <div class="feature-list">
                        <div class="feature-item">
                            <span class="feature-icon">🔶</span>
                            <span>Create & edit 3D shapes together</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">⚡</span>
                            <span>Real-time collaboration</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">💾</span>
                            <span>Save & share your projects</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">👥</span>
                            <span>See other users' cursors live</span>
                        </div>
                    </div>
                </div>
                <div class="onboarding-footer">
                    <button id="skip-onboarding" class="onboarding-btn secondary">Skip Tour</button>
                    <button id="start-onboarding" class="onboarding-btn primary">Get Started</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('skip-onboarding').addEventListener('click', () => {
            this.skipOnboarding();
        });
        
        document.getElementById('start-onboarding').addEventListener('click', () => {
            this.startTour();
        });
        
        // Animate in
        setTimeout(() => modal.classList.add('show'), 100);
    }
    
    skipOnboarding() {
        this.markOnboardingComplete();
        this.closeModal();
        this.showHelpButton();
    }
    
    startTour() {
        this.closeModal();
        this.isActive = true;
        this.currentStep = 0;
        this.showStep();
    }
    
    closeModal() {
        const modal = document.querySelector('.onboarding-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }
    
    showStep() {
        if (this.currentStep >= this.steps.length) {
            this.completeOnboarding();
            return;
        }
        
        const step = this.steps[this.currentStep];
        const target = document.querySelector(step.target);
        
        if (!target) {
            this.nextStep();
            return;
        }
        
        this.createOverlay();
        this.highlightElement(target);
        this.showTooltip(target, step);
    }
    
    createOverlay() {
        if (this.overlay) {
            this.overlay.remove();
        }
        
        this.overlay = document.createElement('div');
        this.overlay.className = 'onboarding-overlay';
        document.body.appendChild(this.overlay);
        
        // Click overlay to continue
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.nextStep();
            }
        });
    }
    
    highlightElement(element) {
        // Remove previous highlights
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight');
        });
        
        // Add highlight to current element
        element.classList.add('onboarding-highlight');
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    showTooltip(target, step) {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'onboarding-tooltip';
        this.tooltip.innerHTML = `
            <div class="tooltip-content">
                <h3>${step.title}</h3>
                <p>${step.text}</p>
                <div class="tooltip-footer">
                    <span class="step-counter">${this.currentStep + 1} of ${this.steps.length}</span>
                    <div class="tooltip-buttons">
                        <button id="prev-step" class="tooltip-btn" ${this.currentStep === 0 ? 'disabled' : ''}>Previous</button>
                        <button id="next-step" class="tooltip-btn primary">Next</button>
                    </div>
                </div>
            </div>
            <div class="tooltip-arrow"></div>
        `;
        
        document.body.appendChild(this.tooltip);
        
        // Position tooltip
        this.positionTooltip(target, step.position);
        
        // Event listeners
        document.getElementById('prev-step').addEventListener('click', () => this.prevStep());
        document.getElementById('next-step').addEventListener('click', () => this.nextStep());
        
        // Animate in
        setTimeout(() => this.tooltip.classList.add('show'), 100);
    }
    
    positionTooltip(target, position) {
        const rect = target.getBoundingClientRect();
        const tooltip = this.tooltip;
        const arrow = tooltip.querySelector('.tooltip-arrow');
        
        if (position === 'center') {
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            arrow.style.display = 'none';
        } else {
            const tooltipRect = tooltip.getBoundingClientRect();
            
            switch (position) {
                case 'bottom':
                    tooltip.style.top = (rect.bottom + 10) + 'px';
                    tooltip.style.left = (rect.left + rect.width / 2 - tooltipRect.width / 2) + 'px';
                    arrow.className = 'tooltip-arrow arrow-top';
                    break;
                case 'top':
                    tooltip.style.top = (rect.top - tooltipRect.height - 10) + 'px';
                    tooltip.style.left = (rect.left + rect.width / 2 - tooltipRect.width / 2) + 'px';
                    arrow.className = 'tooltip-arrow arrow-bottom';
                    break;
                case 'right':
                    tooltip.style.top = (rect.top + rect.height / 2 - tooltipRect.height / 2) + 'px';
                    tooltip.style.left = (rect.right + 10) + 'px';
                    arrow.className = 'tooltip-arrow arrow-left';
                    break;
                case 'left':
                    tooltip.style.top = (rect.top + rect.height / 2 - tooltipRect.height / 2) + 'px';
                    tooltip.style.left = (rect.left - tooltipRect.width - 10) + 'px';
                    arrow.className = 'tooltip-arrow arrow-right';
                    break;
            }
        }
    }
    
    nextStep() {
        this.currentStep++;
        this.showStep();
    }
    
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep();
        }
    }
    
    completeOnboarding() {
        this.markOnboardingComplete();
        this.cleanup();
        this.showCompletionMessage();
        this.showHelpButton();
        
        // Auto-create a demo room with sample content
        this.createDemoRoom();
    }
    
    cleanup() {
        this.isActive = false;
        
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        
        // Remove highlights
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight');
        });
    }
    
    showCompletionMessage() {
        const notification = document.createElement('div');
        notification.className = 'onboarding-completion';
        notification.innerHTML = `
            <div class="completion-content">
                <h3>🎉 You're all set!</h3>
                <p>Ready to start collaborating? We've created a demo room for you to try.</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
    
    createDemoRoom() {
        // Set demo room name
        document.getElementById('project-name').value = 'Demo Room';
        
        // Join the demo room
        if (window.socketManager) {
            window.socketManager.joinRoom('Demo Room', 'New User');
            document.getElementById('current-room').textContent = 'Demo Room';
        }
        
        // Add a sample cube after a short delay
        setTimeout(() => {
            if (window.shapeManager) {
                const cube = window.shapeManager.addShape('cube');
                if (cube) {
                    // Make it pulse to draw attention
                    this.pulseShape(cube);
                }
            }
        }, 1000);
    }
    
    pulseShape(shape) {
        const originalScale = shape.scale.clone();
        let time = 0;
        
        const animate = () => {
            time += 0.05;
            const scale = 1 + Math.sin(time) * 0.2;
            shape.scale.copy(originalScale).multiplyScalar(scale);
            
            if (time < Math.PI * 4) { // Pulse for 4 cycles
                requestAnimationFrame(animate);
            } else {
                shape.scale.copy(originalScale);
            }
        };
        
        animate();
    }
    
    showHelpButton() {
        if (document.getElementById('help-button')) return;
        
        const helpButton = document.createElement('button');
        helpButton.id = 'help-button';
        helpButton.className = 'help-button';
        helpButton.innerHTML = '❓';
        helpButton.title = 'Show help tour (Press H)';
        
        helpButton.addEventListener('click', () => this.restartTour());
        
        document.body.appendChild(helpButton);
        
        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.tagName === 'INPUT') return;
                
                this.restartTour();
                e.preventDefault();
            }
        });
    }
    
    restartTour() {
        this.currentStep = 0;
        this.isActive = true;
        this.showStep();
    }
}

// Initialize onboarding when page loads
window.onboardingManager = new OnboardingManager();