document.addEventListener('DOMContentLoaded', () => {
    // App State
    let releaseEntries = [];
    let selectedUpdates = new Map(); // Map of id -> update object
    let currentFilter = 'all';
    let searchQuery = '';

    // Cache DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const searchInput = document.getElementById('search-input');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const updatesContainer = document.getElementById('updates-container');
    const feedStatusText = document.getElementById('feed-status-text');
    const floatingBar = document.getElementById('floating-bar');
    const floatingInfo = document.getElementById('floating-info');
    const tweetSelectedBtn = document.getElementById('tweet-selected-btn');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');

    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statFeatures = document.getElementById('stat-features');
    const statIssues = document.getElementById('stat-issues');
    const statChanges = document.getElementById('stat-changes');

    // Initialize the app
    init();

    function init() {
        loadData();
        setupEventListeners();
    }

    // Event Listeners setup
    function setupEventListeners() {
        refreshBtn.addEventListener('click', loadData);
        
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().strip();
            render();
        });

        // Filter tab selection
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentFilter = tab.dataset.filter;
                render();
            });
        });

        // Bulk Actions
        tweetSelectedBtn.addEventListener('click', tweetSelected);
        clearSelectionBtn.addEventListener('click', clearSelection);
    }

    // Helper: strip padding/whitespaces from start/end
    String.prototype.strip = function() {
        return this.replace(/^\s+|\s+$/g, '');
    };

    // Load data from Backend API
    async function loadData() {
        setLoading(true);
        try {
            const response = await fetch('/api/release-notes');
            const data = await response.json();
            
            if (data.success) {
                releaseEntries = data.entries;
                selectedUpdates.clear();
                updateFloatingBar();
                
                // Update stats and render feed
                updateStats();
                render();
                
                // Update last updated status
                const now = new Date();
                feedStatusText.textContent = `Last synced: ${now.toLocaleTimeString()}`;
            } else {
                showError(data.error || 'Failed to fetch release notes.');
            }
        } catch (error) {
            console.error('Error fetching release notes:', error);
            showError('Network error. Check connection or server logs.');
        } finally {
            setLoading(false);
        }
    }

    function setLoading(isLoading) {
        if (isLoading) {
            refreshBtn.classList.add('loading');
            refreshBtn.disabled = true;
            // Render Skeleton loaders
            renderSkeletons();
        } else {
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }
    }

    function renderSkeletons() {
        updatesContainer.innerHTML = Array(4).fill(0).map(() => `
            <div class="skeleton-card">
                <div class="skeleton-meta"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
            </div>
        `).join('');
    }

    function showError(message) {
        updatesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>An error occurred</h3>
                <p>${message}</p>
                <button class="btn btn-primary" style="margin-top: 1rem" onclick="location.reload()">Retry</button>
            </div>
        `;
    }

    // Calculate count of each update type
    function updateStats() {
        let total = 0;
        let features = 0;
        let issues = 0;
        let changes = 0;

        releaseEntries.forEach(entry => {
            entry.updates.forEach(up => {
                total++;
                const type = up.type.toLowerCase();
                if (type.includes('feature')) features++;
                else if (type.includes('issue')) issues++;
                else if (type.includes('change') || type.includes('breaking')) changes++;
            });
        });

        statTotal.textContent = total;
        statFeatures.textContent = features;
        statIssues.textContent = issues;
        statChanges.textContent = changes;
    }

    // Flatten entries to updates while maintaining context (date, link)
    function getFlattenedUpdates() {
        const list = [];
        releaseEntries.forEach(entry => {
            entry.updates.forEach(up => {
                list.push({
                    id: up.id,
                    date: entry.title,
                    link: entry.link,
                    type: up.type,
                    html: up.html,
                    text: up.text
                });
            });
        });
        return list;
    }

    // Render updates cards
    function render() {
        const allUpdates = getFlattenedUpdates();
        
        // Apply Filters
        const filtered = allUpdates.filter(item => {
            const matchesFilter = currentFilter === 'all' || 
                (currentFilter === 'feature' && item.type.toLowerCase().includes('feature')) ||
                (currentFilter === 'issue' && item.type.toLowerCase().includes('issue')) ||
                (currentFilter === 'announcement' && item.type.toLowerCase().includes('announcement')) ||
                (currentFilter === 'change' && (item.type.toLowerCase().includes('change') || item.type.toLowerCase().includes('breaking')));

            const matchesSearch = searchQuery === '' || 
                item.text.toLowerCase().includes(searchQuery) ||
                item.type.toLowerCase().includes(searchQuery) ||
                item.date.toLowerCase().includes(searchQuery);

            return matchesFilter && matchesSearch;
        });

        if (filtered.length === 0) {
            updatesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No release notes found</h3>
                    <p>Try refining your search terms or choosing a different category filter.</p>
                </div>
            `;
            return;
        }

        updatesContainer.innerHTML = filtered.map(item => {
            const isSelected = selectedUpdates.has(item.id);
            const badgeClass = getBadgeClass(item.type);
            
            return `
                <div class="update-card ${isSelected ? 'selected' : ''}" data-id="${item.id}">
                    <div class="card-select-overlay">
                        <div class="card-checkbox">
                            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                    </div>
                    <div class="card-inner">
                        <div class="card-meta">
                            <div class="meta-left">
                                <span class="date-badge">${item.date}</span>
                                <span class="type-badge ${badgeClass}">${item.type}</span>
                            </div>
                        </div>
                        <div class="card-body">
                            ${item.html}
                        </div>
                        <div class="card-footer">
                            <button class="btn btn-sm btn-twitter-share" data-id="${item.id}">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                Tweet Update
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Wire events on newly generated cards
        addCardEventListeners();
    }

    function getBadgeClass(type) {
        const t = type.toLowerCase();
        if (t.includes('feature')) return 'type-feature';
        if (t.includes('issue')) return 'type-issue';
        if (t.includes('change')) return 'type-change';
        if (t.includes('breaking')) return 'type-breaking';
        if (t.includes('announcement')) return 'type-announcement';
        return 'type-general';
    }

    function addCardEventListeners() {
        const cards = updatesContainer.querySelectorAll('.update-card');
        cards.forEach(card => {
            const id = card.dataset.id;
            const item = getFlattenedUpdates().find(up => up.id === id);

            // Card click (selects card)
            card.addEventListener('click', (e) => {
                // If they clicked an anchor link or the tweet button, don't toggle selection
                if (e.target.tagName === 'A' || e.target.closest('a') || e.target.closest('.btn-twitter-share')) {
                    return;
                }
                toggleSelection(item);
            });

            // Single card Tweet button
            const tweetBtn = card.querySelector('.btn-twitter-share');
            tweetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openTweetIntent(item);
            });
        });
    }

    // Toggle card selection
    function toggleSelection(item) {
        if (selectedUpdates.has(item.id)) {
            selectedUpdates.delete(item.id);
        } else {
            selectedUpdates.set(item.id, item);
        }
        
        // Refresh rendering for selected states
        const cardElement = updatesContainer.querySelector(`.update-card[data-id="${item.id}"]`);
        if (cardElement) {
            cardElement.classList.toggle('selected');
        }
        
        updateFloatingBar();
    }

    function updateFloatingBar() {
        const count = selectedUpdates.size;
        if (count > 0) {
            floatingInfo.textContent = `${count} update${count > 1 ? 's' : ''} selected`;
            floatingBar.classList.add('active');
        } else {
            floatingBar.classList.remove('active');
        }
    }

    function clearSelection() {
        selectedUpdates.clear();
        const cards = updatesContainer.querySelectorAll('.update-card');
        cards.forEach(card => card.classList.remove('selected'));
        updateFloatingBar();
    }

    // Open Web Intent helper
    function openTweetIntent(item) {
        const tweetText = generateTweetText(item);
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(url, '_blank', 'width=550,height=420');
    }

    // Format tweet content neatly
    function generateTweetText(item) {
        const prefix = `📢 BigQuery ${item.type} Update (${item.date}):\n\n`;
        const suffix = `\n\nRead more: ${item.link}\n#BigQuery #GCP`;
        
        // Character Budget: Max 280.
        const budget = 280 - prefix.length - suffix.length;
        
        let text = item.text;
        if (text.length > budget) {
            text = text.substring(0, budget - 3) + '...';
        }
        
        return `${prefix}${text}${suffix}`;
    }

    // Tweet multiple/single selected items
    function tweetSelected() {
        if (selectedUpdates.size === 0) return;
        
        // If they selected multiple, let's list their summary or tweet the first/latest one.
        // As standard Twitter intent can't do multiple threads natively, we'll compile a summary 
        // or tweet the most recent. Let's do a digest format!
        const selectedList = Array.from(selectedUpdates.values());
        
        if (selectedList.length === 1) {
            openTweetIntent(selectedList[0]);
        } else {
            // Digest format for multiple selections
            const dates = [...new Set(selectedList.map(item => item.date))].join(', ');
            let digestContent = `🔥 BigQuery Updates Digest (${dates}):\n`;
            
            selectedList.forEach((item, idx) => {
                const bullet = `\n• [${item.type}] ${item.text}`;
                if (digestContent.length + bullet.length + 50 < 280) { // Keep safety margin for link/hashtags
                    digestContent += bullet;
                }
            });
            
            // Append link of the most recent one
            const mainLink = selectedList[0].link;
            digestContent += `\n\nDetails: ${mainLink}\n#BigQuery #GoogleCloud`;
            
            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(digestContent)}`;
            window.open(url, '_blank', 'width=550,height=420');
        }
    }
});
