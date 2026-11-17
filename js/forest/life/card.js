// What is on the page over the forest for its animals: a thin ring round the one the pointer is on, and the
// card that slides in beside a close-up. Both are plain elements, styled by css/forest.css, which this
// module asks for itself: the page that shows the forest needs to know nothing of it.

export function createCard() {
  if (!document.querySelector('link[data-forest]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = 'css/forest.css'; link.dataset.forest = '1';
    document.head.append(link);
  }
  const ring = document.createElement('div');
  ring.className = 'forest-ring';
  const card = document.createElement('aside');
  card.className = 'forest-card';
  card.setAttribute('aria-live', 'polite');
  document.body.append(ring, card);
  let said = '';

  return {
    // screen: { x, y, r } in pixels of the page, or null for no ring
    ring(screen) {
      if (!screen) { ring.classList.remove('on'); return; }
      const size = Math.max(36, screen.r * 2);
      ring.style.width = ring.style.height = `${size}px`;
      ring.style.transform = `translate(${screen.x - size / 2}px, ${screen.y - size / 2}px)`;
      ring.classList.add('on');
    },
    // `note`: which one of its kind this is, if its family says (life/beasts.js: "A cow, leading the herd"), or nothing
    show(sheet, doing, note = '') {
      const c = sheet.card;
      card.innerHTML = `<h2>${sheet.name}</h2><p class="latin">${sheet.latin}</p>${note ? `<p class="who">${note}</p>` : ''}<p>${c.size}</p>
        <ul>${c.marks.map((mark) => `<li>${mark}</li>`).join('')}</ul><p>${c.lives}</p>
        <p class="doing"><span>Right now</span> <b></b></p><p class="hint">Esc, or a click elsewhere, to look away</p>`;
      said = '';
      this.doing(doing);
      card.classList.add('on');
    },
    doing(text) {
      if (text === said) return;
      said = text;
      const line = card.querySelector('.doing b');
      if (line) line.textContent = text;
    },
    hide() { card.classList.remove('on'); },
    get shown() { return card.classList.contains('on'); },
    dispose() { ring.remove(); card.remove(); },
  };
}
