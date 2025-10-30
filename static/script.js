const API_BASE_URL = window.location.origin;
const API_KEY = 'dev-key-12345';

let auditHistory = [];

const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesDiv = document.getElementById('messages');
const auditLog = document.getElementById('audit-log');

document.addEventListener('DOMContentLoaded', () => {
    sendBtn.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

async function sendMessage() {
    const query = messageInput.value.trim();
    
    if (!query) {
        return;
    }
    
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    messageInput.disabled = true;
    
    addMessage('user', query);
    messageInput.value = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify({ user_query: query })
        });
        
        const text = await response.text();
        
        if (response.ok) {
            addMessage('assistant', text);
            addAuditItem(query, 'success', 'Response generated');
        } else {
            addMessage('blocked', text);
            addAuditItem(query, 'blocked', text);
        }
        
    } catch (error) {
        addMessage('blocked', 'Error: ' + error.message);
        addAuditItem(query, 'blocked', 'Network error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
        messageInput.disabled = false;
        messageInput.focus();
    }
}

function addMessage(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    
    let label = '';
    if (type === 'user') label = 'User';
    else if (type === 'assistant') label = 'Assistant';
    else if (type === 'blocked') label = 'Blocked';
    
    messageDiv.innerHTML = `
        <div class="message-label">${label}</div>
        <div class="message-content">${escapeHtml(content)}</div>
        <div class="message-time">${timestamp}</div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addAuditItem(query, status, message) {
    const timestamp = new Date().toLocaleString();
    
    const auditItem = {
        timestamp,
        query: query.substring(0, 100),
        status,
        message
    };
    
    auditHistory.unshift(auditItem);
    
    if (auditHistory.length > 50) {
        auditHistory = auditHistory.slice(0, 50);
    }
    
    renderAuditLog();
}

function renderAuditLog() {
    if (auditHistory.length === 0) {
        auditLog.innerHTML = '<p>No requests yet</p>';
        return;
    }
    
    auditLog.innerHTML = auditHistory.map(item => `
        <div class="audit-item ${item.status}">
            <div class="audit-timestamp">${item.timestamp}</div>
            <div class="audit-query">Query: "${item.query}"</div>
            <div class="audit-status">Status: ${item.message}</div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
