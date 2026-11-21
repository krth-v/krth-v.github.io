function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function inlineMarkdown(value) {
  return escapeHTML(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// A deliberately small, safe renderer for the local placeholder manuscripts.
// It supports the book-like structures we need without shipping another CDN
// dependency or accepting raw HTML from future Markdown files.
function renderMarkdown(markdown) {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let paragraph = [];
  let list = null;
  let code = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!list) return;
    html.push(`</${list}>`);
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (code !== null) {
      if (/^```/.test(line.trim())) {
        html.push(`<pre><code>${escapeHTML(code.join('\n'))}</code></pre>`);
        code = null;
      } else code.push(rawLine);
      continue;
    }
    if (/^```/.test(line.trim())) {
      flushParagraph();
      closeList();
      code = [];
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    if (/^\s*---+\s*$/.test(line)) {
      flushParagraph();
      closeList();
      html.push('<hr>');
      continue;
    }
    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushParagraph();
      closeList();
      html.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    const numbered = /^\d+\.\s+(.+)$/.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      const wanted = bullet ? 'ul' : 'ol';
      if (list !== wanted) {
        closeList();
        list = wanted;
        html.push(`<${list}>`);
      }
      html.push(`<li>${inlineMarkdown((bullet || numbered)[1])}</li>`);
      continue;
    }
    closeList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  closeList();
  if (code !== null) html.push(`<pre><code>${escapeHTML(code.join('\n'))}</code></pre>`);
  return html.join('\n');
}

function fallbackManuscript(book) {
  return `# ${book.title}\n\n> A placeholder manuscript from the cabin shelf.\n\n## Pages in progress\n\nThis volume is still being written. Its local reading copy will appear here when the finished text is available.`;
}

export function buildBookReader({ onLeave }) {
  const el = document.getElementById('book-reader');
  const title = document.getElementById('book-reader-title');
  const content = document.getElementById('book-reader-content');
  const leave = document.querySelector('[data-book-leave]');
  if (leave) leave.addEventListener('click', () => onLeave && onLeave());

  async function load(book) {
    if (!el || !content) return;
    if (title) title.textContent = book.title;
    content.innerHTML = '<p class="book-loading">The pages are settling…</p>';
    try {
      const response = await fetch(book.file, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      content.innerHTML = renderMarkdown(await response.text());
      content.scrollTop = 0;
    } catch (error) {
      // Static hosts and offline previews do not always publish loose Markdown
      // assets. The reader must still open as a real spread instead of showing
      // the same dead-end error for every shelf volume.
      content.innerHTML = renderMarkdown(fallbackManuscript(book));
      content.scrollTop = 0;
      console.warn(`Using the inline reading fallback for ${book.file}`, error);
    }
  }

  function show() {
    if (!el) return;
    el.hidden = false;
    el.style.pointerEvents = 'none';
  }

  function hide() {
    if (!el) return;
    el.hidden = true;
    el.style.opacity = '';
    el.style.transition = '';
    el.style.pointerEvents = '';
  }

  function setFade(value, interactive = value >= 0.98) {
    if (!el) return;
    el.style.opacity = String(value);
    el.style.pointerEvents = interactive ? 'auto' : 'none';
  }

  return { el, load, show, hide, setFade };
}
