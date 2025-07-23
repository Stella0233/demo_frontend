        // API Base URL
        const API_BASE = 'http://localhost:8000';
        
        // Current session ID
        let currentSessionId = 'default';

        // File upload functionality
        document.getElementById('uploadForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            const fileInput = document.getElementById('fileInput');
            const tagInput = document.getElementById('tagInput');
            const uploadLoading = document.getElementById('uploadLoading');
            const uploadResult = document.getElementById('uploadResult');
            const submitBtn = this.querySelector('button[type="submit"]');
            
            // Validate file
            if (!fileInput.files[0]) {
                showMessage(uploadResult, 'Please select a file', 'error');
                return;
            }
            
            // Validate tag
            if (!tagInput.value.trim()) {
                showMessage(uploadResult, 'Please enter a document tag', 'error');
                return;
            }
            
            // Show loading state
            uploadLoading.classList.add('show');
            submitBtn.disabled = true;
            uploadResult.innerHTML = '';
            
            // Prepare form data
            formData.append('file', fileInput.files[0]);
            formData.append('tag', tagInput.value.trim());
            
            try {
                const response = await fetch(`${API_BASE}/upload-data`, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showMessage(uploadResult, `✅ ${result.message}`, 'success');
                    // Reset form
                    fileInput.value = '';
                    tagInput.value = '';
                } else {
                    showMessage(uploadResult, `❌ Upload failed: ${result.detail || 'Unknown error'}`, 'error');
                }
                
            } catch (error) {
                console.error('Upload error:', error);
                showMessage(uploadResult, `❌ Upload failed: ${error.message}`, 'error');
            } finally {
                uploadLoading.classList.remove('show');
                submitBtn.disabled = false;
            }
        });

        // Chat functionality
        document.getElementById('queryForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const questionInput = document.getElementById('questionInput');
            const queryTagInput = document.getElementById('queryTagInput');
            const styleCheckbox = document.getElementById('styleCheckbox');
            const submitBtn = this.querySelector('button[type="submit"]');
            
            // Validate question
            if (!questionInput.value.trim()) {
                return;
            }
            
            const question = questionInput.value.trim();
            
            // Add user message to chat
            addMessage('user', question);
            
            // Show thinking message
            const thinkingMessageId = addMessage('thinking', 'Thinking...');
            
            // Clear input
            questionInput.value = '';
            submitBtn.disabled = true;
            
            // Prepare query parameters
            const params = new URLSearchParams();
            params.append('question', question);
            params.append('session_id', currentSessionId);
            
            if (queryTagInput.value.trim()) {
                params.append('tag', queryTagInput.value.trim());
            }
            
            if (styleCheckbox.checked) {
                params.append('style_needed', 'true');
            }
            
            try {
                const response = await fetch(`${API_BASE}/query?${params.toString()}`);
                const result = await response.json();
                
                // Remove thinking message
                removeMessage(thinkingMessageId);
                
                if (response.ok) {
                    // Show thinking process if available
                    if (result.thoughts && Array.isArray(result.thoughts) && result.thoughts.length > 0) {
                        const thinkingContent = formatThoughts(result.thoughts);
                        addMessage('thinking', `<strong>Thinking Process:</strong><br>${thinkingContent}`);
                    }
                    
                    // Show origin sources if available
                    let botMessageContent = '';
                    if (result.origin && Array.isArray(result.origin) && result.origin.length > 0) {
                        botMessageContent += formatOrigins(result.origin);
                    }
                    
                    // Add main answer
                    botMessageContent += `<strong>Answer:</strong><br>${result.answer || 'No answer generated.'}`;
                    
                    addMessage('bot', botMessageContent);
                } else {
                    addMessage('bot', `❌ Query failed: ${result.detail || 'Unknown error'}`);
                }
                
            } catch (error) {
                console.error('Query error:', error);
                removeMessage(thinkingMessageId);
                addMessage('bot', `❌ Query failed: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                questionInput.focus();
            }
        });

        // Add message to chat
        function addMessage(type, content) {
            const chatMessages = document.getElementById('chatMessages');
            const messageId = Date.now();
            
            let className = 'message ';
            let prefix = '';
            
            switch(type) {
                case 'user':
                    className += 'user-message';
                    prefix = '<strong>You:</strong><br>';
                    break;
                case 'bot':
                    className += 'bot-message';
                    prefix = '<strong>Assistant:</strong><br>';
                    break;
                case 'thinking':
                    className += 'thinking-message';
                    prefix = '🤔 ';
                    break;
            }
            
            const messageDiv = document.createElement('div');
            messageDiv.className = className;
            messageDiv.id = `message-${messageId}`;
            messageDiv.innerHTML = prefix + content;
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            return messageId;
        }

        // Remove message from chat
        function removeMessage(messageId) {
            const messageElement = document.getElementById(`message-${messageId}`);
            if (messageElement) {
                messageElement.remove();
            }
        }

        // Format thinking process
        function formatThoughts(thoughts) {
            if (!thoughts || thoughts.length === 0) {
                return 'No thinking process recorded';
            }
            
            return thoughts.map((thought, index) => {
                if (typeof thought === 'string') {
                    return `<div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.5); border-radius: 3px;"><strong>Step ${index + 1}:</strong> ${thought}</div>`;
                } else if (typeof thought === 'object') {
                    return `<div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.5); border-radius: 3px;"><strong>Step ${index + 1}:</strong> ${JSON.stringify(thought, null, 2)}</div>`;
                }
                return `<div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.5); border-radius: 3px;">${thought}</div>`;
            }).join('');
        }

        // Format origin sources
        function formatOrigins(origins) {
            if (!origins || origins.length === 0) {
                return '';
            }
            
            const originItems = origins.map(origin => {
                return `<div class="origin-item">${origin}</div>`;
            }).join('');
            
            return `<div class="origin-section">
                <h4>📚 Source References:</h4>
                ${originItems}
            </div>`;
        }

        // Start new session
        function startNewSession() {
            const sessionInput = document.getElementById('sessionIdInput');
            const newSessionId = sessionInput.value.trim() || `session-${Date.now()}`;
            
            currentSessionId = newSessionId;
            sessionInput.value = newSessionId;
            
            // Clear chat messages
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = `
                <div class="message bot-message">
                    <strong>Assistant:</strong><br>
                    New session started! Session ID: ${newSessionId}. How can I help you today?
                </div>
            `;
        }

        // Show message
        function showMessage(container, message, type) {
            container.innerHTML = `<div class="${type}">${message}</div>`;
        }

        // Page initialization
        document.addEventListener('DOMContentLoaded', function() {
            console.log('RAG Knowledge Base Q&A System loaded');
            
            // Update session ID input
            document.getElementById('sessionIdInput').value = currentSessionId;
            
            // Test API connection
            fetch(`${API_BASE}/`)
                .then(response => response.json())
                .then(data => {
                    console.log('API connection successful:', data);
                })
                .catch(error => {
                    console.error('API connection failed:', error);
                });

            // Focus on question input
            document.getElementById('questionInput').focus();
        });

        // Handle Enter key in chat input
        document.getElementById('questionInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('queryForm').dispatchEvent(new Event('submit'));
            }
        });