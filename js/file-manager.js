        // API Base URL
        // const API_BASE = 'http://localhost:8000';

        let allFiles = [];
        let allTags = new Set();

        // 页面加载时自动获取文件列表
        document.addEventListener('DOMContentLoaded', function() {
            loadFiles();
        });

        // 加载文件列表
        async function loadFiles(tag = null) {
            const container = document.getElementById('filesContainer');
            container.innerHTML = '<div class="loading">正在加载文件列表...</div>';
            
            try {
                const url = tag ? `${API_BASE}/list-files?tag=${encodeURIComponent(tag)}` : `${API_BASE}/list-files`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const files = await response.json();
                allFiles = files;
                
                // 收集所有标签
                files.forEach(file => {
                    if (file.tag) allTags.add(file.tag);
                });
                
                displayFiles(files);
                updateStats(files);
                showMessage('文件列表加载成功', 'success');
                
            } catch (error) {
                console.error('加载文件列表失败:', error);
                container.innerHTML = `
                    <div class="error">
                        <strong>加载失败:</strong> ${error.message}
                        <br>请检查网络连接和API接口是否正常
                    </div>
                `;
                showMessage(`加载失败: ${error.message}`, 'error');
            }
        }

        // 显示文件列表
        function displayFiles(files) {
            const container = document.getElementById('filesContainer');
            
            if (files.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>暂无文件</h3>
                        <p>当前没有找到符合条件的文件</p>
                    </div>
                `;
                return;
            }

            const filesHTML = files.map(file => `
                <div class="file-card">
                    <div class="file-header">
                        <div class="file-info">
                            <div class="file-name">${escapeHtml(file.file_name)}</div>
                            <div class="file-meta">
                                <span>📅 ${file.upload_time}</span>
                                <span>🏷️ ID: ${file.id}</span>
                            </div>
                            ${file.tag ? `<span class="tag-badge">${escapeHtml(file.tag)}</span>` : ''}
                        </div>
                    </div>
                    ${file.tag ? `
                        <div class="file-actions">
                            <button class="btn btn-danger" onclick="deleteFileByTag('${escapeHtml(file.tag)}')">
                                删除此标签的所有文件
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join('');

            container.innerHTML = `<div class="files-grid">${filesHTML}</div>`;
        }

        // 按标签删除文件
        async function deleteFileByTag(tag) {
            if (!confirm(`确定要删除标签 "${tag}" 的所有文件吗？此操作不可撤销！`)) {
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/delete-file/${encodeURIComponent(tag)}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                showMessage(`删除成功: ${result.message}`, 'success');
                
                // 重新加载文件列表
                setTimeout(() => loadFiles(), 1000);
                
            } catch (error) {
                console.error('删除失败:', error);
                showMessage(`删除失败: ${error.message}`, 'error');
            }
        }

        // 显示消息
        function showMessage(message, type) {
            const messageArea = document.getElementById('messageArea');
            const messageDiv = document.createElement('div');
            messageDiv.className = type;
            messageDiv.textContent = message;
            
            messageArea.innerHTML = '';
            messageArea.appendChild(messageDiv);
            
            // 3秒后自动隐藏
            setTimeout(() => {
                messageDiv.style.opacity = '0';
                setTimeout(() => messageDiv.remove(), 300);
            }, 3000);
        }

        // 更新统计信息
        function updateStats(files) {
            document.getElementById('totalFiles').textContent = allFiles.length;
            document.getElementById('totalTags').textContent = allTags.size;
            document.getElementById('filteredFiles').textContent = files.length;
        }

        // HTML转义
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // 实时筛选功能
        document.getElementById('tagFilter').addEventListener('input', function(e) {
            const filterValue = e.target.value.toLowerCase();
            if (filterValue === '') {
                displayFiles(allFiles);
                updateStats(allFiles);
            } else {
                const filteredFiles = allFiles.filter(file => 
                    file.tag && file.tag.toLowerCase().includes(filterValue)
                );
                displayFiles(filteredFiles);
                updateStats(filteredFiles);
            }
        });

        // 回车键触发查询
        document.getElementById('tagFilter').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loadFiles(this.value);
            }
        });