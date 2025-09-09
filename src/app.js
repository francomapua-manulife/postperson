// --- History logic ---
const HISTORY_KEY = 'postperson_history';
function getHistory() {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}
function saveHistory(history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
function addToHistory(entry) {
    let history = getHistory();
    // Remove duplicates (same method, url, body)
    history = history.filter(h => !(h.method === entry.method && h.url === entry.url && h.body === entry.body));
    history.unshift(entry);
    if (history.length > 50) history = history.slice(0, 50); // limit
    saveHistory(history);
}
function renderHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;
    list.innerHTML = '';
    const history = getHistory();
    if (history.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No history yet.';
        li.style.color = '#888';
        list.appendChild(li);
        return;
    }
    history.forEach((h, idx) => {
        const li = document.createElement('li');
        const details = document.createElement('span');
        details.className = 'history-details';
        details.textContent = `[${h.method}] ${h.url}` + (h.body ? ' (body)' : '');
        li.appendChild(details);
        // Delete button
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-history';
        delBtn.title = 'Delete this request';
        delBtn.textContent = '✖';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            let hist = getHistory();
            hist.splice(idx, 1);
            saveHistory(hist);
            renderHistory();
        };
        li.appendChild(delBtn);
        // Click to load
        li.onclick = () => {
            document.getElementById('method').value = h.method;
            document.getElementById('url').value = h.url;
            document.getElementById('body').value = h.body;
        };
        list.appendChild(li);
    });
}
document.addEventListener('DOMContentLoaded', renderHistory);
if (document.getElementById('clear-history')) {
    document.getElementById('clear-history').onclick = () => {
        if (confirm('Clear all request history?')) {
            saveHistory([]);
            renderHistory();
        }
    };
}

// --- Main request logic ---
document.getElementById('request-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const method = document.getElementById('method').value;
    let url = document.getElementById('url').value.trim();
    const body = document.getElementById('body').value.trim();
    const responseEl = document.getElementById('response');
    responseEl.textContent = 'Loading...';

    // Auto-prepend protocol if missing and show to user
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
        document.getElementById('url').value = url;
    }

    let options = { method };
    if (body && method !== 'GET' && method !== 'HEAD') {
        try {
            options.body = body;
            options.headers = { 'Content-Type': 'application/json' };
            JSON.parse(body); // Validate JSON
        } catch {
            responseEl.textContent = 'Invalid JSON in request body.';
            return;
        }
    }

    try {
        const res = await fetch(url, options);
        const contentType = res.headers.get('content-type') || '';
        let data;
        if (contentType.includes('application/json')) {
            data = JSON.stringify(await res.json(), null, 2);
        } else {
            data = await res.text();
        }
        responseEl.textContent = `Status: ${res.status} ${res.statusText}\n\n` + data;
        // Save to history
        addToHistory({ method, url, body });
        renderHistory();
    } catch (err) {
        let msg = 'Error: ' + err;
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
            msg += '\n\nPossible reasons:';
            msg += '\n- The server is not reachable (check the URL)';
            msg += '\n- CORS (Cross-Origin Resource Sharing) is blocking the request';
            msg += '\n- The server does not support HTTPS (try http:// instead of https://)';
            msg += '\n- Network connection issues';
        }
        responseEl.textContent = msg;
    }
});
