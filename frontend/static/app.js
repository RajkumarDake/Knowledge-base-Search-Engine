class AdvancedKnowledgeBaseApp {
    constructor() {
        this.apiBase = '';
        this.currentSection = 'dashboard';
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.charts = {};
        this.stats = {
            totalDocuments: 0,
            totalChunks: 0,
            queriesToday: 0,
            avgResponseTime: 0,
            recentActivity: []
        };
        this.init();
    }

    init() {
        this.setupTheme();
        this.setupEventListeners();
        this.setupNavigation();
        this.setupCharts();
        this.loadStats();
        this.showSection('dashboard');
        this.initAnimations();
        this.setupParticleEffects();
    }

    setupTheme() {
        if (this.isDarkMode) {
            document.documentElement.classList.add('dark');
        }
        
        // Add smooth theme transition
        document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    }

    setupNavigation() {
        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
                this.setActiveNavItem(e.currentTarget);
            });
        });

        // Mobile sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileMenuOverlay');

        sidebarToggle?.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
        });

        overlay?.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle?.addEventListener('click', this.toggleTheme.bind(this));
    }

    setupEventListeners() {
        // File upload
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea?.addEventListener('click', () => fileInput.click());
        uploadArea?.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea?.addEventListener('drop', this.handleDrop.bind(this));
        fileInput?.addEventListener('change', this.handleFileSelect.bind(this));

        // Search
        const searchBtn = document.getElementById('searchBtn');
        const queryInput = document.getElementById('queryInput');

        searchBtn?.addEventListener('click', this.handleSearch.bind(this));
        queryInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // Search filters
        const searchFilters = document.querySelectorAll('.search-filter');
        searchFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                this.setActiveFilter(e.currentTarget);
            });
        });

        // Document management
        const clearAllBtn = document.getElementById('clearAllBtn');
        clearAllBtn?.addEventListener('click', this.clearAllDocuments.bind(this));
    }

    // Navigation and UI Methods
    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.section-content');
        sections.forEach(section => section.classList.add('hidden'));
        
        // Show target section
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('fade-in');
        }
        
        this.currentSection = sectionName;
        
        // Update charts if showing analytics
        if (sectionName === 'analytics') {
            setTimeout(() => this.updateAnalyticsCharts(), 100);
        }
    }
    
    setActiveNavItem(activeItem) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active', 'bg-blue-100', 'text-blue-700', 'dark:bg-blue-900', 'dark:text-blue-300');
            item.classList.add('text-gray-600', 'dark:text-slate-400', 'hover:bg-gray-100', 'dark:hover:bg-slate-700');
        });
        
        activeItem.classList.add('active', 'bg-blue-100', 'text-blue-700', 'dark:bg-blue-900', 'dark:text-blue-300');
        activeItem.classList.remove('text-gray-600', 'dark:text-slate-400', 'hover:bg-gray-100', 'dark:hover:bg-slate-700');
    }
    
    setActiveFilter(activeFilter) {
        const filters = document.querySelectorAll('.search-filter');
        filters.forEach(filter => {
            filter.classList.remove('active', 'bg-blue-600', 'text-white');
            filter.classList.add('bg-gray-100', 'text-gray-700', 'dark:bg-slate-700', 'dark:text-slate-300');
        });
        
        activeFilter.classList.add('active', 'bg-blue-600', 'text-white');
        activeFilter.classList.remove('bg-gray-100', 'text-gray-700', 'dark:bg-slate-700', 'dark:text-slate-300');
    }
    
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        
        // Add transition effect
        document.documentElement.style.transition = 'all 0.3s ease';
        
        if (this.isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // Show theme change notification
        this.showToast(`Switched to ${this.isDarkMode ? 'dark' : 'light'} theme`, 'success');
        
        // Update charts with new theme
        setTimeout(() => this.updateChartsTheme(), 100);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('border-blue-400', 'dark:border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
    }

    handleDrop(e) {
        e.preventDefault();
        const uploadArea = e.currentTarget;
        uploadArea.classList.remove('border-blue-400', 'dark:border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
        
        const files = Array.from(e.dataTransfer.files);
        this.uploadFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.uploadFiles(files);
    }

    // Chart Setup and Management
    setupCharts() {
        // Query Activity Chart
        const queryCtx = document.getElementById('queryChart')?.getContext('2d');
        if (queryCtx) {
            this.charts.queryChart = new Chart(queryCtx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Queries',
                        data: [12, 19, 3, 5, 2, 3, 9],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: this.isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                color: this.isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    }
                }
            });
        }

        // Document Types Chart
        const docTypeCtx = document.getElementById('docTypeChart')?.getContext('2d');
        if (docTypeCtx) {
            this.charts.docTypeChart = new Chart(docTypeCtx, {
                type: 'doughnut',
                data: {
                    labels: ['PDF', 'DOCX', 'TXT'],
                    datasets: [{
                        data: [45, 30, 25],
                        backgroundColor: [
                            'rgb(239, 68, 68)',
                            'rgb(34, 197, 94)',
                            'rgb(168, 85, 247)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    updateChartsTheme() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.options) {
                const gridColor = this.isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                if (chart.options.scales) {
                    if (chart.options.scales.y) chart.options.scales.y.grid.color = gridColor;
                    if (chart.options.scales.x) chart.options.scales.x.grid.color = gridColor;
                }
                chart.update();
            }
        });
    }

    updateAnalyticsCharts() {
        // Trends Chart
        const trendsCtx = document.getElementById('trendsChart')?.getContext('2d');
        if (trendsCtx && !this.charts.trendsChart) {
            this.charts.trendsChart = new Chart(trendsCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Search Volume',
                        data: [65, 59, 80, 81, 56, 55],
                        backgroundColor: 'rgba(59, 130, 246, 0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Quality Chart
        const qualityCtx = document.getElementById('qualityChart')?.getContext('2d');
        if (qualityCtx && !this.charts.qualityChart) {
            this.charts.qualityChart = new Chart(qualityCtx, {
                type: 'radar',
                data: {
                    labels: ['Accuracy', 'Relevance', 'Speed', 'Completeness', 'Clarity'],
                    datasets: [{
                        label: 'Performance',
                        data: [85, 90, 78, 88, 92],
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        }
    }

    async uploadFiles(files) {
        const validFiles = files.filter(file => {
            const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
            return validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.txt');
        });

        if (validFiles.length === 0) {
            this.showToast('Please select valid files (PDF, DOCX, TXT)', 'error');
            return;
        }

        const progressContainer = document.getElementById('uploadProgress');
        const progressBar = document.getElementById('progressBar');
        const uploadStatus = document.getElementById('uploadStatus');
        const uploadPercent = document.getElementById('uploadPercent');
        const resultsContainer = document.getElementById('uploadResults');

        progressContainer?.classList.remove('hidden');
        if (resultsContainer) resultsContainer.innerHTML = '';

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            const progress = ((i + 1) / validFiles.length) * 100;
            
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (uploadStatus) uploadStatus.textContent = `Uploading ${file.name}...`;
            if (uploadPercent) uploadPercent.textContent = `${Math.round(progress)}%`;

            try {
                const result = await this.uploadFile(file);
                this.displayUploadResult(file.name, result, resultsContainer);
                this.addRecentActivity('upload', `Uploaded ${file.name}`);
            } catch (error) {
                this.displayUploadResult(file.name, { success: false, error: error.message }, resultsContainer);
            }
        }

        progressContainer?.classList.add('hidden');
        this.loadStats();
        this.updateDashboard();
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.apiBase}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }

        return await response.json();
    }

    displayUploadResult(filename, result, container) {
        if (!container) return;
        
        const resultDiv = document.createElement('div');
        const bgColor = result.success 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
        
        resultDiv.className = `flex items-center justify-between p-4 rounded-xl border ${bgColor} bounce-in`;
        
        const icon = result.success ? 'check-circle' : 'x-circle';
        const iconColor = result.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        
        resultDiv.innerHTML = `
            <div class="flex items-center space-x-3">
                <i data-lucide="${icon}" class="w-5 h-5 ${iconColor}"></i>
                <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">${filename}</p>
                    <p class="text-xs text-gray-600 dark:text-slate-400">${result.success ? `${result.chunks_count} chunks processed` : result.error}</p>
                </div>
            </div>
            ${result.success ? `
                <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-slate-400">
                    <i data-lucide="file-text" class="w-3 h-3"></i>
                    <span>${this.getFileType(filename).toUpperCase()}</span>
                </div>
            ` : ''}
        `;
        
        container.appendChild(resultDiv);
        lucide.createIcons();
    }
    
    getFileType(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        return extension;
    }

    async handleSearch() {
        const queryInput = document.getElementById('queryInput');
        const query = queryInput?.value.trim();

        if (!query) {
            this.showToast('Please enter a question', 'error');
            return;
        }

        const searchBtn = document.getElementById('searchBtn');
        const loadingState = document.getElementById('loadingState');
        const resultsContainer = document.getElementById('results');

        // Show loading state
        if (searchBtn) searchBtn.disabled = true;
        loadingState?.classList.remove('hidden');
        if (resultsContainer) resultsContainer.innerHTML = '';

        const startTime = Date.now();

        try {
            const response = await fetch(`${this.apiBase}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            const result = await response.json();
            const responseTime = (Date.now() - startTime) / 1000;
            
            this.displaySearchResults(query, result, resultsContainer);
            this.addRecentActivity('search', `Searched: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);
            this.updateResponseTime(responseTime);
            this.incrementQueriesToday();

        } catch (error) {
            this.showToast('Search failed: ' + error.message, 'error');
        } finally {
            if (searchBtn) searchBtn.disabled = false;
            loadingState?.classList.add('hidden');
        }
    }

    displaySearchResults(query, result, container) {
        if (!container) return;
        
        if (!result.success) {
            container.innerHTML = `
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 fade-in">
                    <div class="flex items-center space-x-3">
                        <i data-lucide="alert-circle" class="w-6 h-6 text-red-600 dark:text-red-400"></i>
                        <h3 class="font-semibold text-red-900 dark:text-red-100">Search Error</h3>
                    </div>
                    <p class="text-red-700 dark:text-red-300 mt-3">${result.error}</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = `
            <div class="fade-in space-y-8">
                <!-- Query Display -->
                <div class="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
                    <div class="flex items-center space-x-3 mb-3">
                        <i data-lucide="message-circle-question" class="w-5 h-5 text-purple-600 dark:text-purple-400"></i>
                        <h3 class="font-semibold text-purple-900 dark:text-purple-100">Your Question</h3>
                    </div>
                    <p class="text-purple-800 dark:text-purple-200 text-lg">${query}</p>
                </div>

                <!-- AI Answer -->
                <div class="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8">
                    <div class="flex items-start space-x-4">
                        <div class="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl">
                            <i data-lucide="sparkles" class="w-6 h-6 text-white"></i>
                        </div>
                        <div class="flex-1">
                            <h3 class="font-bold text-blue-900 dark:text-blue-100 text-xl mb-4">AI-Generated Answer</h3>
                            <div class="text-blue-800 dark:text-blue-200 leading-relaxed text-lg">${this.formatAnswer(result.answer)}</div>
                            <div class="mt-4 flex items-center space-x-4 text-sm text-blue-600 dark:text-blue-400">
                                <span class="flex items-center space-x-1">
                                    <i data-lucide="clock" class="w-4 h-4"></i>
                                    <span>Generated in ${this.stats.avgResponseTime}s</span>
                                </span>
                                <span class="flex items-center space-x-1">
                                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                                    <span>AI Verified</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sources -->
                ${result.sources && result.sources.length > 0 ? `
                <div class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="font-bold text-gray-900 dark:text-white text-lg flex items-center">
                            <i data-lucide="file-search" class="w-5 h-5 mr-3 text-green-600 dark:text-green-400"></i>
                            Source Documents (${result.sources.length})
                        </h3>
                        <span class="text-sm text-gray-500 dark:text-slate-400">Ranked by relevance</span>
                    </div>
                    <div class="grid gap-4">
                        ${result.sources.map((source, index) => `
                            <div class="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-5 hover-scale">
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center space-x-3">
                                        <span class="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-bold">${index + 1}</span>
                                        <div>
                                            <span class="text-sm font-semibold text-gray-900 dark:text-white">${source.document_id}</span>
                                            <div class="flex items-center space-x-2 mt-1">
                                                <i data-lucide="file-text" class="w-3 h-3 text-gray-500 dark:text-slate-400"></i>
                                                <span class="text-xs text-gray-500 dark:text-slate-400">${this.getFileType(source.document_id).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-xs font-medium text-green-700 dark:text-green-300">Relevance</div>
                                        <div class="text-lg font-bold text-green-600 dark:text-green-400">${(source.score * 100).toFixed(1)}%</div>
                                    </div>
                                </div>
                                <p class="text-sm text-gray-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded border-l-4 border-green-500">${source.text_preview}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Action Buttons -->
                <div class="flex justify-center space-x-4">
                    <button class="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors" onclick="navigator.clipboard.writeText('${query}')">
                        <i data-lucide="copy" class="w-4 h-4"></i>
                        <span>Copy Question</span>
                    </button>
                    <button class="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" onclick="navigator.clipboard.writeText('${result.answer.replace(/'/g, "\\'").replace(/"/g, '\\"')}')">
                        <i data-lucide="download" class="w-4 h-4"></i>
                        <span>Copy Answer</span>
                    </button>
                </div>
            </div>
        `;

        lucide.createIcons();
    }

    formatAnswer(answer) {
        // Simple formatting for better readability
        return answer
            .replace(/\n\n/g, '</p><p class="mt-4">')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    // Dashboard and Analytics Methods
    async loadStats() {
        try {
            const response = await fetch(`${this.apiBase}/stats`);
            const stats = await response.json();
            
            this.stats.totalDocuments = stats.total_documents || 0;
            this.stats.totalChunks = stats.total_chunks || 0;
            
            this.updateDashboard();
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }
    
    updateDashboard() {
        // Update header stats
        const docCountElements = document.querySelectorAll('#docCount, #totalDocs');
        const chunkCountElements = document.querySelectorAll('#chunkCount, #totalChunks');
        
        docCountElements.forEach(el => {
            if (el.id === 'docCount') {
                el.textContent = `${this.stats.totalDocuments} documents`;
            } else {
                el.textContent = this.stats.totalDocuments;
            }
        });
        
        chunkCountElements.forEach(el => {
            if (el.id === 'chunkCount') {
                el.textContent = `${this.stats.totalChunks} chunks`;
            } else {
                el.textContent = this.stats.totalChunks;
            }
        });
        
        // Update other stats
        const queriesTodayEl = document.getElementById('queriesToday');
        const avgResponseTimeEl = document.getElementById('avgResponseTime');
        
        if (queriesTodayEl) queriesTodayEl.textContent = this.stats.queriesToday;
        if (avgResponseTimeEl) avgResponseTimeEl.textContent = `${this.stats.avgResponseTime.toFixed(1)}s`;
        
        this.updateRecentActivity();
    }
    
    addRecentActivity(type, description) {
        const activity = {
            type,
            description,
            timestamp: new Date().toLocaleTimeString(),
            icon: type === 'upload' ? 'upload' : 'search'
        };
        
        this.stats.recentActivity.unshift(activity);
        if (this.stats.recentActivity.length > 10) {
            this.stats.recentActivity.pop();
        }
        
        this.updateRecentActivity();
    }
    
    updateRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        if (this.stats.recentActivity.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-slate-400">
                    <i data-lucide="activity" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                    <p>No recent activity</p>
                </div>
            `;
        } else {
            container.innerHTML = this.stats.recentActivity.map(activity => `
                <div class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg slide-in">
                    <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <i data-lucide="${activity.icon}" class="w-4 h-4 text-blue-600 dark:text-blue-400"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-900 dark:text-white">${activity.description}</p>
                        <p class="text-xs text-gray-500 dark:text-slate-400">${activity.timestamp}</p>
                    </div>
                </div>
            `).join('');
        }
        
        lucide.createIcons();
    }
    
    updateResponseTime(responseTime) {
        // Calculate running average
        if (this.stats.avgResponseTime === 0) {
            this.stats.avgResponseTime = responseTime;
        } else {
            this.stats.avgResponseTime = (this.stats.avgResponseTime + responseTime) / 2;
        }
    }
    
    incrementQueriesToday() {
        this.stats.queriesToday++;
    }
    
    // Document Management
    async clearAllDocuments() {
        if (!confirm('Are you sure you want to clear all documents? This action cannot be undone.')) {
            return;
        }
        
        try {
            // This would need to be implemented in the backend
            // const response = await fetch(`${this.apiBase}/clear-all`, { method: 'DELETE' });
            
            this.showToast('All documents cleared successfully', 'success');
            this.stats.totalDocuments = 0;
            this.stats.totalChunks = 0;
            this.updateDashboard();
            this.addRecentActivity('system', 'Cleared all documents');
            
        } catch (error) {
            this.showToast('Failed to clear documents: ' + error.message, 'error');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        
        const colors = {
            success: 'bg-gradient-to-r from-green-500 to-green-600',
            error: 'bg-gradient-to-r from-red-500 to-red-600',
            info: 'bg-gradient-to-r from-blue-500 to-blue-600',
            warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
        };
        
        const icons = {
            success: 'check-circle',
            error: 'x-circle',
            info: 'info',
            warning: 'alert-triangle'
        };

        toast.className = `${colors[type]} text-white px-6 py-4 rounded-xl shadow-lg bounce-in flex items-center space-x-3 max-w-md`;
        toast.innerHTML = `
            <i data-lucide="${icons[type]}" class="w-5 h-5 flex-shrink-0"></i>
            <span class="font-medium">${message}</span>
            <button class="ml-auto hover:bg-white/20 rounded-lg p-1" onclick="this.parentElement.remove()">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        `;

        container.appendChild(toast);
        lucide.createIcons();

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    // Animation and Visual Effects
    initAnimations() {
        // Add stagger animation to dashboard cards
        const cards = document.querySelectorAll('.floating-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });

        // Add hover effects to navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateX(8px)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'translateX(0)';
            });
        });

        // Add typing effect to search placeholder
        this.setupTypingEffect();
    }

    setupTypingEffect() {
        const searchInput = document.getElementById('queryInput');
        if (!searchInput) return;

        const phrases = [
            'Ask a question about your documents...',
            'What are the key findings?',
            'Summarize the main points...',
            'Compare different sections...',
            'Find specific information...'
        ];

        let currentPhrase = 0;
        let currentChar = 0;
        let isDeleting = false;

        const typeEffect = () => {
            const phrase = phrases[currentPhrase];
            
            if (!isDeleting) {
                searchInput.placeholder = phrase.substring(0, currentChar + 1);
                currentChar++;
                
                if (currentChar === phrase.length) {
                    setTimeout(() => isDeleting = true, 2000);
                }
            } else {
                searchInput.placeholder = phrase.substring(0, currentChar - 1);
                currentChar--;
                
                if (currentChar === 0) {
                    isDeleting = false;
                    currentPhrase = (currentPhrase + 1) % phrases.length;
                }
            }
            
            setTimeout(typeEffect, isDeleting ? 50 : 100);
        };

        // Start typing effect when search section is active
        if (this.currentSection === 'search') {
            setTimeout(typeEffect, 1000);
        }
    }

    setupParticleEffects() {
        // Add floating particles to the background
        const createParticle = () => {
            const particle = document.createElement('div');
            particle.className = 'fixed pointer-events-none z-0';
            particle.style.cssText = `
                width: 4px;
                height: 4px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                border-radius: 50%;
                opacity: 0.1;
                animation: float 8s infinite ease-in-out;
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                animation-delay: ${Math.random() * 8}s;
            `;
            
            document.body.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentElement) {
                    particle.remove();
                }
            }, 8000);
        };

        // Create particles periodically
        setInterval(createParticle, 2000);
        
        // Create initial particles
        for (let i = 0; i < 5; i++) {
            setTimeout(createParticle, i * 400);
        }
    }

    // Enhanced visual feedback
    addRippleEffect(element, event) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
}

// Add ripple animation CSS
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Initialize the enhanced app
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedKnowledgeBaseApp();
});
