/**
 * Dashboard HTML for PTY web interface.
 * Uses xterm.js from CDN for the terminal emulator.
 * Design: Minimal, refined neutral dark theme with sidebar and split-screen support.
 * Fonts: Inter (sans) + IBM Plex Mono (monospace)
 */

export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PTY Sessions</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css">
  <style>
    :root {
      /* Neutral dark palette - no blue tint */
      --bg-base: #121212;
      --bg-surface: #1a1a1a;
      --bg-elevated: #242424;
      --bg-hover: #2a2a2a;
      --bg-active: #333333;
      --border: #2e2e2e;
      --border-subtle: #252525;
      
      --text-primary: #e8e8e8;
      --text-secondary: #a0a0a0;
      --text-muted: #666666;
      
      /* Warm accent */
      --accent: #d4a574;
      --accent-hover: #e0b88a;
      --accent-subtle: rgba(212, 165, 116, 0.15);
      
      /* Status colors */
      --status-running: #7ec97e;
      --status-exited: #e87272;
      --status-killed: #e8b972;
      
      /* Terminal */
      --terminal-bg: #0e0e0e;
      
      /* Sizing */
      --sidebar-width: 240px;
      --header-height: 48px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      background: var(--bg-base);
      color: var(--text-primary);
      height: 100vh;
      display: flex;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Sidebar */
    .sidebar {
      width: var(--sidebar-width);
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .sidebar-header {
      height: var(--header-height);
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
    }

    .sidebar-header h1 {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .session-count {
      font-size: 11px;
      font-weight: 500;
      color: var(--text-muted);
      background: var(--bg-elevated);
      padding: 2px 8px;
      border-radius: 10px;
    }

    .session-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .session-list::-webkit-scrollbar {
      width: 6px;
    }

    .session-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .session-list::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 3px;
    }

    .session-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 120ms ease;
      margin-bottom: 2px;
      opacity: 1;
      transform: translateX(0);
    }

    .session-item.entering {
      animation: slideIn 200ms ease forwards;
    }

    .session-item.exiting {
      animation: slideOut 200ms ease forwards;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(-10px);
      }
    }

    .session-item:hover {
      background: var(--bg-hover);
    }

    .session-item.active {
      background: var(--accent-subtle);
    }

    .session-item.active .session-title {
      color: var(--accent);
    }

    .status-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--status-running);
      flex-shrink: 0;
    }

    .status-indicator.exited {
      background: var(--status-exited);
    }

    .status-indicator.killed {
      background: var(--status-killed);
    }

    .session-info {
      flex: 1;
      min-width: 0;
    }

    .session-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .session-meta {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
      font-family: "IBM Plex Mono", monospace;
    }

    .empty-sessions {
      padding: 20px 16px;
      text-align: center;
      color: var(--text-muted);
      font-size: 12px;
    }

    /* Main content area */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .toolbar {
      height: var(--header-height);
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      background: var(--bg-surface);
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toolbar-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 10px;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 5px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 120ms ease;
    }

    .btn:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
      border-color: var(--text-muted);
    }

    .btn.active {
      background: var(--accent-subtle);
      border-color: var(--accent);
      color: var(--accent);
    }

    .btn svg {
      width: 14px;
      height: 14px;
    }

    /* Terminal panels container */
    .panels-container {
      flex: 1;
      display: flex;
      background: var(--bg-base);
      overflow: hidden;
    }

    .panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      border-right: 1px solid var(--border);
    }

    .panel:last-child {
      border-right: none;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border-subtle);
      min-height: 36px;
    }

    .panel-title {
      font-size: 11px;
      font-weight: 500;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .panel-close {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 120ms ease;
    }

    .panel-close:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    .terminal-container {
      flex: 1;
      background: var(--terminal-bg);
      padding: 8px;
      overflow: hidden;
    }

    .terminal-container .xterm {
      height: 100%;
    }

    /* Empty state */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--text-muted);
      background: var(--bg-base);
    }

    .empty-state svg {
      width: 40px;
      height: 40px;
      opacity: 0.3;
    }

    .empty-state p {
      font-size: 13px;
    }

    /* Footer */
    .footer {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 8px 16px;
      background: var(--bg-surface);
      border-top: 1px solid var(--border);
      font-size: 11px;
      color: var(--text-muted);
    }

    .footer-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .footer-value {
      color: var(--text-secondary);
      font-family: "IBM Plex Mono", monospace;
    }

    /* Resizer */
    .resizer {
      width: 4px;
      background: transparent;
      cursor: col-resize;
      transition: background 150ms ease;
    }

    .resizer:hover {
      background: var(--accent);
    }

    .resizer.dragging {
      background: var(--accent);
    }
  </style>
</head>
<body>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1>Sessions</h1>
      <span class="session-count" id="sessionCount">0</span>
    </div>
    <div class="session-list" id="sessionList">
      <div class="empty-sessions">No active sessions</div>
    </div>
  </aside>

  <main class="main">
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-title" id="toolbarTitle">Select a session</span>
      </div>
      <div class="toolbar-right">
        <button class="btn" id="splitBtn" title="Split view">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="12" y1="3" x2="12" y2="21"/>
          </svg>
          Split
        </button>
        <button class="btn" id="refreshBtn" title="Refresh sessions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 21h5v-5"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="panels-container" id="panelsContainer">
      <div class="empty-state" id="emptyState">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="4 17 10 11 4 5"/>
          <line x1="12" y1="19" x2="20" y2="19"/>
        </svg>
        <p>Click a session to connect</p>
      </div>
    </div>

    <footer class="footer" id="footer" style="display: none;">
      <div class="footer-item">
        <span>Command</span>
        <span class="footer-value" id="footerCommand">-</span>
      </div>
      <div class="footer-item">
        <span>PID</span>
        <span class="footer-value" id="footerPid">-</span>
      </div>
      <div class="footer-item">
        <span>Status</span>
        <span class="footer-value" id="footerStatus">-</span>
      </div>
      <div class="footer-item">
        <span>Lines</span>
        <span class="footer-value" id="footerLines">-</span>
      </div>
    </footer>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/lib/addon-fit.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@xterm/addon-web-links@0.11.0/lib/addon-web-links.min.js"></script>
  <script>
    // State
    let sessions = [];
    let previousSessionIds = new Set();
    let panels = []; // { id, sessionId, terminal, ws, fitAddon }
    let activePanel = null;
    let isSplitMode = false;

    // Terminal theme - warm neutral
    const terminalTheme = {
      background: '#0e0e0e',
      foreground: '#e8e8e8',
      cursor: '#d4a574',
      cursorAccent: '#0e0e0e',
      selectionBackground: 'rgba(212, 165, 116, 0.25)',
      black: '#1a1a1a',
      red: '#e87272',
      green: '#7ec97e',
      yellow: '#e8b972',
      blue: '#72a8e8',
      magenta: '#c490e8',
      cyan: '#72d4d4',
      white: '#e8e8e8',
      brightBlack: '#4a4a4a',
      brightRed: '#f09090',
      brightGreen: '#98e898',
      brightYellow: '#f0d090',
      brightBlue: '#90c0f0',
      brightMagenta: '#d8a8f0',
      brightCyan: '#90e8e8',
      brightWhite: '#ffffff',
    };

    // Load sessions
    async function loadSessions() {
      try {
        const response = await fetch('/api/sessions');
        const newSessions = await response.json();
        
        const newSessionIds = new Set(newSessions.map(s => s.id));
        
        // Find added and removed sessions for animation
        const added = newSessions.filter(s => !previousSessionIds.has(s.id));
        const removed = [...previousSessionIds].filter(id => !newSessionIds.has(id));
        
        sessions = newSessions;
        previousSessionIds = newSessionIds;
        
        renderSessionList(added.map(s => s.id), removed);
        
        // Clean up panels for removed sessions
        removed.forEach(id => {
          const panelIndex = panels.findIndex(p => p.sessionId === id);
          if (panelIndex !== -1) {
            closePanel(panelIndex);
          }
        });
      } catch (err) {
        console.error('Failed to load sessions:', err);
      }
    }

    // Render session list
    function renderSessionList(addedIds = [], removedIds = []) {
      const container = document.getElementById('sessionList');
      document.getElementById('sessionCount').textContent = sessions.length;

      if (sessions.length === 0) {
        container.innerHTML = '<div class="empty-sessions">No active sessions</div>';
        return;
      }

      container.innerHTML = sessions.map(session => {
        const isActive = panels.some(p => p.sessionId === session.id);
        const isNew = addedIds.includes(session.id);
        return \`
          <div class="session-item \${isActive ? 'active' : ''} \${isNew ? 'entering' : ''}"
               data-id="\${session.id}"
               onclick="handleSessionClick('\${session.id}')">
            <span class="status-indicator \${session.status}"></span>
            <div class="session-info">
              <div class="session-title">\${escapeHtml(session.title || session.id)}</div>
              <div class="session-meta">PID \${session.pid}</div>
            </div>
          </div>
        \`;
      }).join('');
    }

    // Handle session click
    function handleSessionClick(sessionId) {
      if (isSplitMode && panels.length < 2) {
        createPanel(sessionId);
      } else if (!isSplitMode) {
        if (panels.length > 0) {
          closePanel(0);
        }
        createPanel(sessionId);
      } else {
        const targetIndex = activePanel === 0 ? 1 : 0;
        closePanel(targetIndex);
        createPanel(sessionId);
      }
      updateActiveStates();
    }

    // Create a new panel
    function createPanel(sessionId) {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      document.getElementById('emptyState').style.display = 'none';
      document.getElementById('footer').style.display = 'flex';

      const panelId = 'panel-' + Date.now();
      const panelIndex = panels.length;

      const panelEl = document.createElement('div');
      panelEl.className = 'panel';
      panelEl.id = panelId;
      panelEl.innerHTML = \`
        <div class="panel-header">
          <span class="panel-title">
            <span class="status-indicator \${session.status}"></span>
            \${escapeHtml(session.title || session.id)}
          </span>
          <div class="panel-close" onclick="closePanel(\${panelIndex})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </div>
        </div>
        <div class="terminal-container" id="term-\${panelId}"></div>
      \`;

      if (panels.length === 1) {
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        resizer.id = 'resizer';
        initResizer(resizer);
        document.getElementById('panelsContainer').appendChild(resizer);
      }

      document.getElementById('panelsContainer').appendChild(panelEl);

      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: '"IBM Plex Mono", monospace',
        fontWeight: 400,
        lineHeight: 1.4,
        theme: terminalTheme,
        scrollback: 10000,
      });

      const fitAddon = new FitAddon.FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(new WebLinksAddon.WebLinksAddon());

      const termContainer = document.getElementById('term-' + panelId);
      terminal.open(termContainer);
      
      requestAnimationFrame(() => fitAddon.fit());

      const ws = new WebSocket(\`ws://\${window.location.host}/ws?session=\${sessionId}\`);
      
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'history' }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'output' || msg.type === 'history') {
          terminal.write(msg.data);
          if (msg.totalLines) {
            document.getElementById('footerLines').textContent = msg.totalLines;
          }
        } else if (msg.type === 'state') {
          loadSessions();
        } else if (msg.type === 'error') {
          terminal.write(\`\\r\\n\\x1b[38;5;203mError: \${msg.message}\\x1b[0m\\r\\n\`);
        }
      };

      ws.onclose = () => {
        terminal.write('\\r\\n\\x1b[38;5;243m[Disconnected]\\x1b[0m\\r\\n');
      };

      terminal.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data }));
        }
      });

      termContainer.addEventListener('click', () => {
        activePanel = panels.findIndex(p => p.id === panelId);
        updateFooter(session);
        updateActiveStates();
        terminal.focus();
      });

      const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
      });
      resizeObserver.observe(termContainer);

      panels.push({ id: panelId, sessionId, terminal, ws, fitAddon, resizeObserver });
      activePanel = panels.length - 1;
      updateFooter(session);
      updateToolbarTitle();
    }

    // Close panel
    function closePanel(index) {
      if (index < 0 || index >= panels.length) return;

      const panel = panels[index];
      panel.ws.close();
      panel.terminal.dispose();
      panel.resizeObserver.disconnect();
      document.getElementById(panel.id)?.remove();

      panels.splice(index, 1);

      if (panels.length <= 1) {
        document.getElementById('resizer')?.remove();
      }

      if (panels.length === 0) {
        document.getElementById('emptyState').style.display = 'flex';
        document.getElementById('footer').style.display = 'none';
        activePanel = null;
      } else {
        activePanel = 0;
        updateFooter(sessions.find(s => s.id === panels[0].sessionId));
      }

      updateActiveStates();
      updateToolbarTitle();
    }

    // Initialize resizer
    function initResizer(resizer) {
      let startX, startWidths;

      resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        const container = document.getElementById('panelsContainer');
        const panelEls = container.querySelectorAll('.panel');
        startWidths = Array.from(panelEls).map(el => el.offsetWidth);
        resizer.classList.add('dragging');
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      function onMouseMove(e) {
        const dx = e.clientX - startX;
        const container = document.getElementById('panelsContainer');
        const panelEls = container.querySelectorAll('.panel');
        
        let newWidth0 = startWidths[0] + dx;
        let newWidth1 = startWidths[1] - dx;
        
        const minWidth = 200;
        if (newWidth0 < minWidth) newWidth0 = minWidth;
        if (newWidth1 < minWidth) newWidth1 = minWidth;
        
        panelEls[0].style.flex = \`0 0 \${newWidth0}px\`;
        panelEls[1].style.flex = '1 1 auto';
        
        panels.forEach(p => p.fitAddon.fit());
      }

      function onMouseUp() {
        resizer.classList.remove('dragging');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
    }

    // Toggle split mode
    function toggleSplit() {
      isSplitMode = !isSplitMode;
      document.getElementById('splitBtn').classList.toggle('active', isSplitMode);
      
      if (!isSplitMode && panels.length > 1) {
        closePanel(1);
      }
    }

    // Update footer
    function updateFooter(session) {
      if (!session) return;
      document.getElementById('footerCommand').textContent = session.command + ' ' + (session.args || []).join(' ');
      document.getElementById('footerPid').textContent = session.pid;
      document.getElementById('footerStatus').textContent = session.status;
      document.getElementById('footerLines').textContent = session.lineCount;
    }

    // Update toolbar title
    function updateToolbarTitle() {
      const title = document.getElementById('toolbarTitle');
      if (panels.length === 0) {
        title.textContent = 'Select a session';
      } else if (panels.length === 1) {
        const session = sessions.find(s => s.id === panels[0].sessionId);
        title.textContent = session?.title || panels[0].sessionId;
      } else {
        title.textContent = panels.length + ' terminals';
      }
    }

    // Update active states in sidebar
    function updateActiveStates() {
      const activeIds = panels.map(p => p.sessionId);
      document.querySelectorAll('.session-item').forEach(el => {
        el.classList.toggle('active', activeIds.includes(el.dataset.id));
      });
    }

    // Escape HTML
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Event listeners
    document.getElementById('splitBtn').addEventListener('click', toggleSplit);
    document.getElementById('refreshBtn').addEventListener('click', loadSessions);

    // Initial load and polling
    loadSessions();
    setInterval(loadSessions, 3000);
  </script>
</body>
</html>`;
