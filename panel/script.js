// State Management
class PanelController {
    constructor() {
        this.currentState = 'connect';
        this.roomData = {
            roomId: '',
            attackerName: '',
            template: '',
            logo: null,
            music: null,
            description: '',
            teamMembers: []
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.showState('connect');
        this.startMatrixEffect();
    }

    // State Management
    showState(stateName) {
        // Hide all states
        document.querySelectorAll('.state').forEach(state => {
            state.classList.remove('active');
        });

        // Show target state
        const targetState = document.getElementById(`${stateName}-state`);
        if (targetState) {
            targetState.classList.add('active');
            this.currentState = stateName;
        }
    }

    // Event Bindings
    bindEvents() {
        // Connect button
        const connectBtn = document.getElementById('connect-btn');
        connectBtn.addEventListener('click', () => this.handleConnect());

        // Room ID input - Enter key support and sanitization
        const roomIdInput = document.getElementById('room-id');
        roomIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleConnect();
            }
        });
        
        // Sanitize room ID input in real-time
        roomIdInput.addEventListener('input', (e) => {
            const sanitized = e.target.value.replace(/[^a-zA-Z0-9]/g, '_');
            if (sanitized !== e.target.value) {
                e.target.value = sanitized;
            }
        });

        // Save button
        const saveBtn = document.getElementById('save-btn');
        saveBtn.addEventListener('click', () => this.handleSave());

        // Disconnect button
        const disconnectBtn = document.getElementById('disconnect-btn');
        disconnectBtn.addEventListener('click', () => this.handleDisconnect());

        // File upload handling
        const logoInput = document.getElementById('logo-upload');
        logoInput.addEventListener('change', (e) => this.handleLogoUpload(e));
        
        const musicInput = document.getElementById('music-upload');
        musicInput.addEventListener('change', (e) => this.handleMusicUpload(e));
        
        // Copy intercept code button
        const copyCodeBtn = document.getElementById('copy-code-btn');
        copyCodeBtn.addEventListener('click', () => this.handleCopyInterceptCode());
    }

    // Connection Handler
    handleConnect() {
        const roomIdInput = document.getElementById('room-id');
        const roomId = roomIdInput.value.trim();

        if (!roomId) {
            this.showError('Please enter a Room ID');
            return;
        }

        // Validate room ID format (optional)
        if (roomId.length < 3) {
            this.showError('Room ID must be at least 3 characters');
            return;
        }

        this.roomData.roomId = roomId;
        
        // Show loading state
        this.showLoading('connect-btn', 'CONNECTING...');
        
        // Simulate connection process
        setTimeout(() => {
            this.hideLoading('connect-btn', 'CONNECT');
            this.showState('setup');
            this.addLogEntry('Connected to room: ' + roomId);
        }, 1500);
    }

    // Setup Form Handler
    handleSave() {
        const attackerName = document.getElementById('attacker-name').value.trim();
        const template = document.getElementById('template-select').value;
        const description = document.getElementById('description').value.trim();
        const teamInput = document.getElementById('team-members').value.trim();

        // Validation
        if (!attackerName) {
            this.showError('Please enter attacker name (required)');
            return;
        }
        
        if (!template) {
            this.showError('Please select a template (required)');
            return;
        }
        
        if (!this.roomData.logo) {
            this.showError('Please upload a logo (required)');
            return;
        }

        if (!description) {
            this.showError('Please enter a description (required)');
            return;
        }

        if (!teamInput) {
            this.showError('Please enter team members (required)');
            return;
        }

        // Process team members
        const teamMembers = teamInput.split(';')
            .map(member => member.trim())
            .filter(member => member.length > 0);

        if (teamMembers.length === 0) {
            this.showError('Please enter at least one team member');
            return;
        }

        // Save data
        this.roomData.attackerName = attackerName;
        this.roomData.template = template;
        this.roomData.description = description;
        this.roomData.teamMembers = teamMembers;

        // Show loading state
        this.showLoading('save-btn', 'SAVING...');

        // Simulate save process
        setTimeout(() => {
            this.hideLoading('save-btn', 'SAVE CONFIGURATION');
            this.updateListeningState();
            this.showState('listening');
            this.addLogEntry('Configuration saved successfully');
            this.addLogEntry(`Team size: ${teamMembers.length} members`);
            this.addLogEntry('System now listening for commands');
        }, 2000);
    }

    // Disconnect Handler
    handleDisconnect() {
        this.showLoading('disconnect-btn', 'DISCONNECTING...');
        
        setTimeout(() => {
            this.hideLoading('disconnect-btn', 'DISCONNECT');
            this.resetForm();
            this.showState('connect');
            this.addLogEntry('Disconnected from system');
        }, 1000);
    }

    // Logo Upload Handler
    handleLogoUpload(event) {
        const file = event.target.files[0];
        const fileNameSpan = document.getElementById('file-name');
        
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showError('Please select an image file');
                event.target.value = '';
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showError('File size must be less than 5MB');
                event.target.value = '';
                return;
            }

            this.roomData.logo = file;
            fileNameSpan.textContent = file.name;
            this.addLogEntry(`Logo uploaded: ${file.name}`);
        } else {
            fileNameSpan.textContent = 'Choose file...';
            this.roomData.logo = null;
        }
    }
    
    // Music Upload Handler
    handleMusicUpload(event) {
        const file = event.target.files[0];
        const fileNameSpan = document.getElementById('music-file-name');
        
        if (file) {
            // Validate file type
            if (!file.type.startsWith('audio/')) {
                this.showError('Please select an audio file');
                event.target.value = '';
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                this.showError('Music file size must be less than 10MB');
                event.target.value = '';
                return;
            }

            this.roomData.music = file;
            fileNameSpan.textContent = file.name;
            this.addLogEntry(`Music uploaded: ${file.name}`);
        } else {
            fileNameSpan.textContent = 'Choose music file...';
            this.roomData.music = null;
        }
    }
    
    // Copy Intercept Code Handler
    handleCopyInterceptCode() {
        const interceptCode = this.generateInterceptCode();
        
        // Copy to clipboard
        navigator.clipboard.writeText(interceptCode).then(() => {
            this.showSuccess('Intercept code copied to clipboard!');
            this.addLogEntry('Intercept code copied to clipboard');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = interceptCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showSuccess('Intercept code copied to clipboard!');
            this.addLogEntry('Intercept code copied to clipboard');
        });
    }
    
    // Generate Intercept Code
    generateInterceptCode() {
        const baseUrl = window.location.origin;
        const roomId = this.roomData.roomId;
        const template = this.roomData.template;
        
        return `// HEKBAI Intercept Code\n// Room: ${roomId}\n// Template: ${this.getTemplateDisplayName(template)}\n\nconst ws = new WebSocket('${baseUrl.replace('http', 'ws')}/ws');\nws.onopen = () => {\n    console.log('Connected to HEKBAI room: ${roomId}');\n};\nws.onmessage = (event) => {\n    const data = JSON.parse(event.data);\n    console.log('Intercepted:', data);\n};`;
    }

    // Update Listening State Display
    updateListeningState() {
        document.getElementById('current-room').textContent = this.roomData.roomId;
        document.getElementById('current-template').textContent = 
            this.getTemplateDisplayName(this.roomData.template);
        document.getElementById('team-size').textContent = this.roomData.teamMembers.length;
    }

    // Helper Methods
    getTemplateDisplayName(template) {
        const templates = {
            'anonymous_legion': 'Anonymous Legion',
            'cyber_ghost': 'Cyber Ghost',
            'shadow_strike': 'Shadow Strike',
            'black_terminal': 'Black Terminal',
            'blood_eagle': 'Blood Eagle',
            'dark_legion': 'Dark Legion',
            'elite_squad': 'Elite Squad',
            'phantom_collective': 'Phantom Collective',
            'digital_rebels': 'Digital Rebels',
            'cyber_warriors': 'Cyber Warriors'
        };
        return templates[template] || template;
    }

    showLoading(buttonId, text) {
        const button = document.getElementById(buttonId);
        const span = button.querySelector('span');
        span.innerHTML = `<div class="loading"></div> ${text}`;
        button.disabled = true;
    }

    hideLoading(buttonId, originalText) {
        const button = document.getElementById(buttonId);
        const span = button.querySelector('span');
        span.textContent = originalText;
        button.disabled = false;
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = `ERROR: ${message}`;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 0, 64, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            border: 1px solid #ff0040;
            font-family: 'Courier Prime', monospace;
            font-size: 0.9rem;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(errorDiv);

        // Auto remove after 3 seconds
        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 300);
        }, 3000);

        this.addLogEntry(`ERROR: ${message}`);
    }
    
    showSuccess(message) {
        // Create success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.textContent = `SUCCESS: ${message}`;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 255, 0, 0.9);
            color: black;
            padding: 15px 20px;
            border-radius: 5px;
            border: 1px solid #00ff00;
            font-family: 'Courier Prime', monospace;
            font-size: 0.9rem;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(successDiv);

        // Auto remove after 3 seconds
        setTimeout(() => {
            successDiv.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 300);
        }, 3000);

        this.addLogEntry(`SUCCESS: ${message}`);
    }

    addLogEntry(message) {
        const logContainer = document.querySelector('.log-container');
        if (!logContainer) return;

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${timestamp}] ${message}`;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;

        // Limit log entries to prevent memory issues
        const entries = logContainer.querySelectorAll('.log-entry');
        if (entries.length > 50) {
            entries[0].remove();
        }
    }

    resetForm() {
        // Reset all form fields
        document.getElementById('room-id').value = '';
        document.getElementById('attacker-name').value = '';
        document.getElementById('template-select').value = '';
        document.getElementById('description').value = '';
        document.getElementById('team-members').value = '';
        document.getElementById('logo-upload').value = '';
        document.getElementById('music-upload').value = '';
        document.getElementById('file-name').textContent = 'Choose file...';
        document.getElementById('music-file-name').textContent = 'Choose music file...';

        // Reset room data
        this.roomData = {
            roomId: '',
            attackerName: '',
            template: '',
            logo: null,
            music: null,
            description: '',
            teamMembers: []
        };
    }

    // Matrix Background Effect
    startMatrixEffect() {
        // Add dynamic matrix characters
        const matrixBg = document.querySelector('.matrix-bg');
        
        // Create matrix characters periodically
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance every interval
                this.createMatrixChar();
            }
        }, 200);
    }

    createMatrixChar() {
        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        const span = document.createElement('span');
        span.textContent = char;
        span.style.cssText = `
            position: fixed;
            color: #00ff00;
            font-family: 'Courier Prime', monospace;
            font-size: ${Math.random() * 10 + 10}px;
            left: ${Math.random() * 100}vw;
            top: -20px;
            opacity: ${Math.random() * 0.5 + 0.3};
            pointer-events: none;
            z-index: -1;
            animation: matrixFall ${Math.random() * 3 + 2}s linear forwards;
        `;

        document.body.appendChild(span);

        // Remove after animation
        setTimeout(() => {
            if (span.parentNode) {
                span.parentNode.removeChild(span);
            }
        }, 5000);
    }
}

// CSS Animations for notifications and matrix effect
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes matrixFall {
        to { 
            transform: translateY(100vh); 
            opacity: 0; 
        }
    }
`;
document.head.appendChild(style);

// Initialize the panel controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.panelController = new PanelController();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key to go back to previous state
    if (e.key === 'Escape') {
        const controller = window.panelController;
        if (controller) {
            if (controller.currentState === 'setup') {
                controller.showState('connect');
            } else if (controller.currentState === 'listening') {
                controller.showState('setup');
            }
        }
    }
});