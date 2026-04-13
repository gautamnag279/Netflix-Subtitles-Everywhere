(() => {
  const DEFAULTS = { fontSize: 115, bold: false, outlineWidth: 2.5, outlineColor: '#000000', color: '#ffffff', removeDefaultBackground: true };

  function detectPlatform(url) {
    if (!url) return { key: 'generic', name: '' };
    if (/hotstar\.(com|in)|jiohotstar\.com/i.test(url)) return { key: 'hotstar', name: 'JioHotstar' };
    if (/primevideo\.com|amazon\.(com|co\.uk|in)\/gp\/video/i.test(url)) return { key: 'primevideo', name: 'Prime Video' };
    return { key: 'generic', name: '' };
  }

  let platform = { key: 'generic', name: '' };
  function storageKey() { return 'subtitlePrefs_' + platform.key; }

  function get() {
    return {
      fontSize: parseInt(document.getElementById('fontSize').value),
      bold: document.getElementById('bold').checked,
      outlineWidth: parseFloat(document.getElementById('outlineWidth').value),
      outlineColor: document.getElementById('outlineColor').value,
      color: document.getElementById('color').value,
      removeDefaultBackground: document.getElementById('removeDefaultBackground').checked
    };
  }

  function set(p) {
    const d = { ...DEFAULTS, ...p };
    document.getElementById('fontSize').value = d.fontSize;
    document.getElementById('fontSizeVal').textContent = d.fontSize + '%';
    document.getElementById('bold').checked = d.bold;
    document.getElementById('outlineWidth').value = d.outlineWidth;
    document.getElementById('outlineWidthVal').textContent = d.outlineWidth + 'px';
    document.getElementById('outlineColor').value = d.outlineColor;
    document.getElementById('color').value = d.color;
    document.getElementById('removeDefaultBackground').checked = d.removeDefaultBackground;
    preview(d);
  }

  function preview(p) {
    const el = document.getElementById('prev');
    el.style.cssText = `
      font-size:${Math.round(p.fontSize * 0.13)}px;
      font-weight:${p.bold ? 'bold' : 'normal'};
      color:${p.color};
      -webkit-text-stroke:${p.outlineWidth}px ${p.outlineColor};
      paint-order:stroke fill;
      background:transparent;
    `;
  }

  function push(p) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: 'UPDATE_PREFS', prefs: p }, () => void chrome.runtime.lastError);
    });
  }

  function onChange() { const p = get(); preview(p); push(p); }

  document.querySelectorAll('input').forEach(el => {
    el.addEventListener('input', onChange);
    el.addEventListener('change', onChange);
  });

  document.getElementById('fontSize').addEventListener('input', e =>
    document.getElementById('fontSizeVal').textContent = e.target.value + '%');
  document.getElementById('outlineWidth').addEventListener('input', e =>
    document.getElementById('outlineWidthVal').textContent = e.target.value + 'px');

  document.getElementById('save').addEventListener('click', () => {
    chrome.storage.sync.set({ [storageKey()]: get() }, () => {
      document.getElementById('save').textContent = 'Saved ✓';
      setTimeout(() => document.getElementById('save').textContent = 'Save', 1500);
    });
  });

  document.getElementById('reset').addEventListener('click', () => {
    chrome.storage.sync.remove(storageKey(), () => { set(DEFAULTS); push(DEFAULTS); });
  });

  // Detect active tab's platform, show badge, load that platform's prefs
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const url = tabs[0]?.url || '';
    platform = detectPlatform(url);

    const badge = document.getElementById('activePlatform');
    if (badge) {
      badge.textContent = platform.name || 'No supported site';
      badge.className = 'platform-badge ' + (platform.name ? 'active' : 'inactive');
    }

    chrome.storage.sync.get(storageKey(), d => set(d[storageKey()] || DEFAULTS));
  });
})();