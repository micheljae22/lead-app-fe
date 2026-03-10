document.addEventListener('DOMContentLoaded', () => {
    
    // --- INIT & AUTH ---
    const token = localStorage.getItem('rankradar_token');
    let currentUser = null;
    let currentHistoryData = []; 
    let velocityChart = null;

    if (!token) {
        window.location.href = '/admin/login.html';
        return;
    }
// 
    async function apiFetch(endpoint, options = {}) {
        options.headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
        const res = await fetch(endpoint, options);
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('rankradar_token');
            window.location.href = '/admin/login.html';
            throw new Error('Session expired');
        }
        return res;
    }

    async function initSession() {
        try {
            const res = await apiFetch('/api/auth/me');
            const data = await res.json();
            currentUser = data.user;

            document.getElementById('displayUsername').textContent = currentUser.username.split('@')[0];
            document.getElementById('displayRoleInitials').textContent = currentUser.username.substring(0,2).toUpperCase();
            document.getElementById('displayRole').textContent = currentUser.role;

            if (currentUser.role === 'admin') {
                document.getElementById('navStaff').style.display = 'block';
                fetchStaff();
                fetchExecutiveData();
            } else {
                localStorage.removeItem('rankradar_token');
                window.location.href = '/admin/login.html';
            }

            fetchHistory();
            
            // Auto-refresh exec data every 5 seconds
            setInterval(fetchExecutiveData, 5000);

        } catch (e) { console.error('Auth Init Error:', e); }
    }

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch(e) {}
        localStorage.removeItem('rankradar_token');
        window.location.href = '/admin/login.html';
    });

    initSession();

    // --- TAB NAVIGATION (Pills) ---
    const navItems = document.querySelectorAll('.nav-pill');
    const tabContents = document.querySelectorAll('.view-pane');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            tabContents.forEach(t => t.classList.remove('active'));
            document.getElementById(`tab-${tabId}`).classList.add('active');
            
            if (tabId === 'dashboard' && velocityChart) {
                velocityChart.update();
            }
        });
    });

    // --- SEARCH / FILTER LOGIC ---
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = currentHistoryData.filter(item => {
            const name = (item.business_name || '').toLowerCase();
            const domain = (item.domain || '').toLowerCase();
            return name.includes(query) || domain.includes(query);
        });
        renderHistoryTable(filtered);
    });

    // --- CSV EXPORT ---
    document.getElementById('exportBtn').addEventListener('click', () => {
        if (currentHistoryData.length === 0) return alert("System is empty. Aborting export.");
        
        const headers = ["Timestamp", "Target Entity", "Domain Route", "Attack Vector", "Contact String", "Status Flag"];
        const rows = currentHistoryData.map(item => [
            new Date(item.timestamp).toISOString(),
            `"${item.business_name || ''}"`,
            item.domain || '',
            item.contact_method || '',
            `"${item.contact_value || ''}"`,
            item.status || ''
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `RR_ARCHIVE_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });


    // --- SYSOPS DASHBOARD (EXECUTIVE DATA) ---
    const refreshDashBtn = document.getElementById('refreshDashBtn');
    refreshDashBtn.addEventListener('click', fetchExecutiveData);

    const killSwitchCheckbox = document.getElementById('killSwitchCheckbox');
    const killSwitchText = document.getElementById('killSwitchText');
    const engineStatusLabel = document.getElementById('engineStatusLabel');
    let engineHalted = false;

    // The toggle is checked when ONLINE, unchecked when HALTED
    killSwitchCheckbox.addEventListener('change', async (e) => {
        const wantsHalt = !e.target.checked;
        const action = wantsHalt ? 'HALT' : 'START';
        
        if (!confirm(`WARNING: Are you sure you want to ${action} the Master Scraping Engine?`)) {
            // Revert UI if cancelled
            e.target.checked = !wantsHalt;
            return;
        }

        killSwitchCheckbox.disabled = true;
        killSwitchText.textContent = 'Transmitting...';

        try {
            const res = await apiFetch('/api/admin/kill-switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ halt: wantsHalt })
            });
            const data = await res.json();
            updateEngineState(data.killSwitchEngaged);
        } catch (err) {
            alert("Error: Could not dispatch command.");
            e.target.checked = !wantsHalt; // Revert on err
        } finally {
            killSwitchCheckbox.disabled = false;
        }
    });

    function updateEngineState(isHalted) {
        engineHalted = isHalted;
        killSwitchCheckbox.checked = !isHalted;
        if (engineHalted) {
            engineStatusLabel.textContent = 'Offline';
            engineStatusLabel.className = 'status-badge offline';
            killSwitchText.textContent = 'Engine Offline';
        } else {
            engineStatusLabel.textContent = 'Online';
            engineStatusLabel.className = 'status-badge';
            killSwitchText.textContent = 'Engine Active';
        }
    }

    async function fetchExecutiveData() {
        try {
            const res = await apiFetch('/api/admin/executive-data');
            const data = await res.json();
            
            updateEngineState(data.killSwitchEngaged);
            renderActivityFeed(data.activityLog || []);
            renderChart(data.chartData);

        } catch (error) {
            console.error("Exec data pull failed.");
        }
    }

    function renderActivityFeed(logItems) {
        const feed = document.getElementById('activityFeed');
        if (logItems.length === 0) {
            feed.innerHTML = '<div class="feed-item empty-state">Awaiting network traffic...</div>';
            return;
        }

        feed.innerHTML = '';
        logItems.forEach(item => {
            const d = new Date(item.timestamp);
            const tStr = d.toLocaleTimeString([], {hour12:true, hour:'numeric', minute:'2-digit'});
            
            const div = document.createElement('div');
            div.className = 'feed-item';
            div.innerHTML = `
                <div class="meta">
                    <span class="actor">${escapeHTML(item.username.split('@')[0])}</span>
                    <span>${tStr}</span>
                </div>
                <div>
                    <span class="action">${escapeHTML(item.action)}</span>
                    <span class="target">→ ${escapeHTML(item.target)}</span>
                </div>
            `;
            feed.appendChild(div);
        });
    }

    function renderChart(chartData) {
        if (!chartData) return;
        
        const ctx = document.getElementById('velocityChart').getContext('2d');
        
        if (velocityChart) {
            velocityChart.data.labels = chartData.labels;
            velocityChart.data.datasets[0].data = chartData.data;
            velocityChart.update();
            return;
        }

        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Outfit', sans-serif";

        velocityChart = new Chart(ctx, {
            type: 'bar', // Changed to beautiful bar chart for Bento aesthetic
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Payloads Dispatched',
                    data: chartData.data,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#fff',
                        bodyColor: '#e2e8f0',
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { font: { size: 11, weight: 500 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9', drawBorder: false },
                        border: { display: false },
                        ticks: { font: { size: 11 }, stepSize: 1, padding: 10 }
                    }
                }
            }
        });
    }


    // --- OUTREACH DASHBOARD (LOGS) ---
    const historyBody = document.getElementById('historyBody');
    const refreshBtn = document.getElementById('refreshBtn');

    async function fetchHistory() {
        historyBody.innerHTML = '<tr><td colspan="6" class="empty-state">Pulling database...</td></tr>';
        try {
            const response = await apiFetch('/api/history');
            const data = await response.json();
            currentHistoryData = data.history || [];
            updateStatsUI(currentHistoryData);
            
            searchInput.dispatchEvent(new Event('input')); 
        } catch (error) {
            historyBody.innerHTML = `<tr><td colspan="6" class="empty-state" style="color:var(--danger)">Error fetching data</td></tr>`;
        }
    }

    function updateStatsUI(history) {
        document.getElementById('totalContacts').textContent = history.length;
        let emails = 0, sms = 0, dms = 0;
        history.forEach(item => {
            const method = (item.contact_method || '').toLowerCase();
            if (method.includes('email')) emails++;
            else if (method.includes('sms')) sms++;
            else dms++;
        });

        document.getElementById('totalEmails').textContent = emails;
        document.getElementById('totalSms').textContent = sms;
        document.getElementById('totalDms').textContent = dms;
    }

    function renderHistoryTable(historyArray) {
        if (historyArray.length === 0) {
            historyBody.innerHTML = '<tr><td colspan="6" class="empty-state">No records found.</td></tr>';
            return;
        }

        historyBody.innerHTML = '';
        historyArray.forEach(item => {
            const dateObj = new Date(item.timestamp);
            const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour12:true, hour: 'numeric', minute:'2-digit'});
            
            const st = (item.status || '').toLowerCase();
            let bClass = 'tag-success';
            if (st.includes('fail') || st.includes('error')) bClass = 'tag-danger';
            else if (st.includes('flagged') || st.includes('warn')) bClass = 'tag-warn';

            const methodClass = item.contact_method?.toLowerCase().includes('email') ? 'tag-info' : 'tag-neutral';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color:var(--text-muted); font-size:0.85rem;">${dateStr}</td>
                <td>
                    <span class="cell-title">${escapeHTML(item.business_name || 'Unknown')}</span>
                    ${item.domain ? `<span class="cell-sub">${item.domain}</span>` : ''}
                </td>
                <td><span class="tag ${methodClass}">${escapeHTML(item.contact_method || 'Unknown')}</span></td>
                <td><span class="cell-highlight">${escapeHTML(item.contact_value || '—')}</span></td>
                <td><span class="tag ${bClass}">${escapeHTML(item.status || 'Deployed')}</span></td>
                <td class="text-right">
                    <button class="btn btn-secondary" onclick="openDossier('${item.id}')">Inspect</button>
                </td>
            `;
            historyBody.appendChild(tr);
        });
    }

    refreshBtn.addEventListener('click', fetchHistory);

    // --- DOSSIER MODAL ---
    const dossierModal = document.getElementById('dossierModal');
    
    document.getElementById('closeDossier').addEventListener('click', () => dossierModal.classList.remove('active'));
    document.getElementById('closeDossierBtn').addEventListener('click', () => dossierModal.classList.remove('active'));

    window.openDossier = function(idStr) {
        const item = currentHistoryData.find(h => String(h.id) === String(idStr));
        if (!item) return;

        document.getElementById('dTarget').textContent = item.business_name || 'Unknown';
        document.getElementById('dDomain').textContent = item.domain || 'N/A';
        document.getElementById('dVector').textContent = item.contact_method || 'Unknown';
        document.getElementById('dContactVal').textContent = item.contact_value || '—';
        document.getElementById('dMessage').textContent = item.generated_message || 'No payload data stored in archive.';

        dossierModal.classList.add('active');
    };


    // --- STAFF MANAGEMENT ---
    const staffBody = document.getElementById('staffBody');
    const refreshStaffBtn = document.getElementById('refreshStaffBtn');

    window.staffAction = async function(action, userId, username) {
        const actionText = action === 'approve' ? 'Grant Access' : (action === 'revoke' ? 'Revoke Access' : 'Disconnect User');
        if (!confirm(`Are you sure you want to ${actionText} for ${username}?`)) return;

        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Working...';
        btn.disabled = true;

        try {
            const res = await apiFetch(`/api/admin/${action}/${userId}`, { method: 'POST' });
            if (res.ok) {
                fetchStaff();
            } else {
                alert('Action rejected.');
            }
        } catch (e) {
            alert('Error processing request.');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    };

    async function fetchStaff() {
        if (currentUser?.role !== 'admin') return;
        staffBody.innerHTML = '<tr><td colspan="5" class="empty-state">Loading roster...</td></tr>';
        try {
            const response = await apiFetch('/api/admin/users');
            const data = await response.json();
            renderStaffTable(data.users || []);
        } catch (error) {
            staffBody.innerHTML = `<tr><td colspan="5" class="empty-state" style="color:var(--danger)">Roster fetch failed</td></tr>`;
        }
    }

    function renderStaffTable(users) {
        if (users.length === 0) {
            staffBody.innerHTML = '<tr><td colspan="5" class="empty-state">No team members found.</td></tr>';
            return;
        }

        staffBody.innerHTML = '';
        users.forEach(user => {
            const d = user.last_active ? new Date(user.last_active) : null;
            const timeStr = d ? d.toLocaleTimeString([], { hour12:true, hour:'numeric', minute:'2-digit' }) : 'Never';
            
            let actionHtml = ``;
            if (user.role === 'admin') {
                actionHtml = `<span class="tag tag-neutral">System Root</span>`;
            } else if (!user.is_approved) {
                actionHtml = `<button class="btn btn-success" onclick="staffAction('approve', ${user.id}, '${escapeHTML(user.username)}')">Approve</button>`;
            } else {
                actionHtml = `
                    <button class="btn btn-secondary" onclick="staffAction('revoke', ${user.id}, '${escapeHTML(user.username)}')">Revoke</button>
                    ${user.is_online ? `<button class="btn btn-danger" style="margin-left:0.5rem;" onclick="staffAction('kick', ${user.id}, '${escapeHTML(user.username)}')">Disconnect</button>` : ''}
                `;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span class="cell-title">${escapeHTML(user.username)}</span>
                    <span class="cell-sub">ID: ${user.id}</span>
                </td>
                <td>
                    <span class="tag ${user.role === 'admin' ? 'tag-primary' : 'tag-neutral'}">${escapeHTML(user.role)}</span>
                </td>
                <td>
                    ${user.is_online 
                        ? `<div style="display:flex; align-items:center; gap:0.5rem;"><div style="width:8px;height:8px;border-radius:50%;background:var(--success)"></div><span style="font-weight:600;color:var(--text-main)">Online</span></div>` 
                        : `<div style="display:flex; align-items:center; gap:0.5rem;"><div style="width:8px;height:8px;border-radius:50%;background:var(--text-light)"></div><span style="color:var(--text-muted)">Offline</span></div>`}
                </td>
                <td style="color:var(--text-muted);">${user.is_online ? 'Active Now' : timeStr}</td>
                <td class="text-right">${actionHtml}</td>
            `;
            staffBody.appendChild(tr);
        });
    }

    refreshStaffBtn.addEventListener('click', fetchStaff);

    function escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function(m) {
            return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];
        });
    }
});
