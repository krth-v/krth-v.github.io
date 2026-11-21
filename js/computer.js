// ============================================================================
// COMPUTER — the MacBook's on-screen "OS".
//
// A full-screen HTML overlay that mimics a macOS Finder window. It is shown
// after the camera flies into the laptop screen (see main.js → enterComputer);
// while it is up the 3D scene stops rendering to save the GPU. The window opens
// straight to the "Projects" folder — one "file" per project, pulled from the
// site's PROJECTS array. Clicking a file opens a Quick Look preview of it.
// Closing the window (red light / Leave / Esc) zooms back out to the room.
// ============================================================================

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function buildComputer({ projects, onLeave }) {
  const ui      = document.getElementById('computer-ui');
  const grid    = document.getElementById('finder-grid');
  const count   = document.getElementById('finder-count');
  const ql      = document.getElementById('ql');
  const qlTitle = document.getElementById('ql-title');
  const qlBody  = document.getElementById('ql-body');

  const items = projects || [];

  function renderList() {
    count.textContent = items.length + ' item' + (items.length === 1 ? '' : 's');
    if (!items.length) {
      grid.innerHTML = '<div class="empty">No projects yet — add them to PROJECTS in main.js.</div>';
      return;
    }
    grid.innerHTML = items.map((it, i) =>
      `<button class="file" data-i="${i}">
         <span class="file-ic"></span>
         <span class="file-name">${esc(it.name)}.txt</span>
       </button>`).join('');
  }

  function openFile(i) {
    const it = items[i];
    if (!it) return;
    qlTitle.textContent = it.name + '.txt';
    qlBody.innerHTML =
      (it.meta ? `<div class="ql-meta">${esc(it.meta)}</div>` : '') +
      `<div class="ql-title-lg">${esc(it.name)}</div>` +
      `<div class="ql-text">${esc(it.body || '')}</div>`;
    ql.hidden = false;
  }

  function closeQL() { ql.hidden = true; }

  // ---- delegated clicks ----
  ui.addEventListener('click', (e) => {
    if (e.target.closest('[data-os="leave"]'))    { onLeave && onLeave(); return; }  // Leave btn / window close
    if (e.target.closest('[data-os="ql-close"]')) { closeQL(); return; }
    if (e.target === ql)                          { closeQL(); return; }             // backdrop
    const f = e.target.closest('.file');
    if (f) { openFile(+f.dataset.i); return; }
  });

  function show() { closeQL(); renderList(); ui.hidden = false; }
  function hide() { ui.hidden = true; }

  return { show, hide, el: ui };
}
