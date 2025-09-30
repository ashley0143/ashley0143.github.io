(function(){
  const STORAGE_KEY = '_hs_store';
  const DISABLED_KEY = '_hs_disabled';
  let disabled = localStorage.getItem(DISABLED_KEY) === '1';
  let events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  function record(evt) {
    if (disabled) return;
    events.push(evt);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); } catch (e) { /* ignore */ }
  }
  const startTime = performance.now();
  window.addEventListener('DOMContentLoaded', () => record({ t: Date.now(), type: 'dom_content_loaded', duration: Math.round(performance.now() - startTime) }));
  window.addEventListener('load', () => record({ t: Date.now(), type: 'window_load', duration: Math.round(performance.now()) }));
  document.addEventListener('click', e => record({ t: Date.now(), type: 'click', target: e.target.tagName }));
  document.addEventListener('submit', e => record({ t: Date.now(), type: 'form_submit', form: e.target.id || e.target.name || null }));
  document.addEventListener('copy', () => record({ t: Date.now(), type: 'copy' }));
  let maxDepth = 0;
  window.addEventListener('scroll', () => {
    const depth = Math.min(100, Math.round(((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100));
    if (depth > maxDepth) {
      maxDepth = depth;
      record({ t: Date.now(), type: 'scroll_depth', value: maxDepth });
    }
  });
  document.addEventListener('visibilitychange', () => record({ t: Date.now(), type: 'visibility_change', state: document.visibilityState }));
  window.addEventListener('focus', () => record({ t: Date.now(), type: 'window_focus' }));
  window.addEventListener('blur', () => record({ t: Date.now(), type: 'window_blur' }));
  window.addEventListener('orientationchange', () => record({ t: Date.now(), type: 'orientation_change', orientation: screen.orientation.type }));
  if (navigator.deviceMemory) record({ t: Date.now(), type: 'device_memory', value: navigator.deviceMemory });
  if (performance.memory) record({ t: Date.now(), type: 'js_heap_size', value: Math.round(performance.memory.usedJSHeapSize / 1024) });
  setInterval(() => record({ t: Date.now(), type: 'heartbeat', uptime: Math.round(performance.now()) }), 30000);
  let lastActivity = Date.now();
  ['mousemove', 'keydown', 'touchstart'].forEach(evt => document.addEventListener(evt, () => { lastActivity = Date.now(); }));
  setInterval(() => { if (Date.now() - lastActivity > 60000) record({ t: Date.now(), type: 'idle' }); }, 60000);
  window.addEventListener('error', err => record({ t: Date.now(), type: 'js_error', message: err.message }));
  window._hs = {
    get: () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
    clear: () => { localStorage.removeItem(STORAGE_KEY); events = []; },
    export: () => {
      const data = JSON.stringify(events, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'metrics.json'; a.click();
      URL.revokeObjectURL(url);
    },
    optOut: () => { localStorage.setItem(DISABLED_KEY, '1'); disabled = true; },
    optIn: () => { localStorage.removeItem(DISABLED_KEY); disabled = false; }
  };
})();
