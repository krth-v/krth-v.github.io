import * as THREE from 'three';

// What is on the page over the forest for the visitor (the owner, 2026-11-19), all of it plain elements styled by
// css/forest.css, which this module asks for itself:
//
//   the circle    a thin hollow circle in the middle of the view while the mouse turns the head (the pointer is
//                 taken: nav/trailController.js). It is where the visitor looks, and what a click is a click on.
//   the guide     a "?" at the foot of the page (and the H key) opens the instructions: how to look, to walk, to
//                 look closely at an animal, what the ripples are. A line of them is shown for a moment at first.
//   the ripples   "When a bird calls/sings, have some kind of visual way for the user to locate exactly where that
//                 sound is coming from." Rings spread from where the voice is, for as long as it is heard, over
//                 whatever stands in front of it, and follow the animal. A voice from outside the view sends its
//                 rings in from the view's edge on the side it is on, so turning towards them brings them to the
//                 animal. (Rather than a map: a map says where on the ground, and a bird is up a tree.)
//
// `guide: false` leaves the circle and the instructions out (the tools' pages); the ripples are there whenever there
// is sound. `pause(true)` puts all of it away (the cabin's page, while the visitor is indoors).
export function createHud({ element, camera, nav, guide = true }) {
  if (!document.querySelector('link[data-forest]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = 'css/forest.css'; link.dataset.forest = '1';
    document.head.append(link);
  }
  const make = (tag, name, parent) => { const e = document.createElement(tag); e.className = name; (parent || document.body).append(e); return e; };
  const touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
  let paused = false, open = false, hinted = 0, taught = false;

  // ---- the circle
  const aim = guide ? make('div', 'forest-aim') : null;

  // ---- the guide
  let hint = null, button = null, help = null;
  const show = (on) => {
    open = on && !paused;
    help.classList.toggle('on', open); button.setAttribute('aria-expanded', String(open));
    if (open) { taught = true; hint.classList.remove('on'); }
  };
  const onKey = (event) => {
    if (paused || !guide || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.code === 'KeyH' || event.key === '?') show(!open);
    else if (event.key === 'Escape' && open) show(false);
  };
  if (guide) {
    hint = make('p', 'forest-hint');
    hint.textContent = touch ? 'Drag to look around · ? for help' : 'Click, then move the mouse to look · W and S, or scroll, to walk · H for help';
    button = make('button', 'forest-help-button');
    button.type = 'button'; button.textContent = '?'; button.title = 'How to walk, look and find the animals (H)';
    button.setAttribute('aria-label', 'Instructions'); button.setAttribute('aria-expanded', 'false');
    help = make('aside', 'forest-help');
    help.setAttribute('aria-label', 'Instructions');
    help.innerHTML = `<h2>Finding your way</h2>
      <dl>
        <dt>Look</dt><dd>${touch ? 'Drag across the view.' : 'Click the view once, then move the mouse. The small circle is where you are looking. <kbd>Esc</kbd> gives the pointer back.'}</dd>
        <dt>Walk</dt><dd><kbd>W</kbd> and <kbd>S</kbd>, the arrow keys or the scroll wheel take you along the trail, forwards being the way you face. Hold <kbd>Shift</kbd> to run.</dd>
        <dt>Animals</dt><dd>Put the circle on an animal. When a ring closes round it, click for a close look and its card; click again, or walk on, to look away. Come slowly: most will leave if you rush them.</dd>
        <dt>Listen</dt><dd>When something calls, rings spread from where it is. Rings at the edge of the view mean it is that way: turn towards them. <kbd>M</kbd> turns the sound on and off.</dd>
        <dt>Hours</dt><dd>The light is your own clock's, and by night you carry a lantern. Who is about changes with every visit.</dd>
      </dl>
      <p><kbd>H</kbd> shows and hides this.</p>`;
    button.addEventListener('click', (event) => { event.stopPropagation(); show(!open); button.blur(); });
    for (const type of ['pointerdown', 'pointerup', 'click', 'wheel']) help.addEventListener(type, (event) => event.stopPropagation());
    window.addEventListener('keydown', onKey);
  }

  // ---- the ripples: one element to a voice being heard, eight at the most (the sound plays no more at once)
  const calls = [];
  const _v = new THREE.Vector3(), _inverse = new THREE.Matrix4();
  for (let i = 0; i < 8; i += 1) {
    const e = make('div', 'forest-call');
    e.innerHTML = '<i></i><i></i><i></i>';
    calls.push({ e, event: null, from: 0, until: 0, strength: 0 });
  }
  const now = () => performance.now() / 1000;
  // A voice begins to be heard (sound/index.js `heard`): `event` is what was said (life/visit.js `say`), `seconds`
  // how long it lasts, `level` how loud it is where the walker stands (0 .. about 1).
  function voice(event, seconds, level) {
    if (paused || event.x == null) return;
    const t = now();
    // (one animal's next call takes its last one's rings over; else the first that is free, or the one nearest its end)
    let call = calls.find((c) => c.event && c.event.who && c.event.who === event.who) || calls.find((c) => !c.event);
    if (!call) call = calls.reduce((a, b) => (a.until < b.until ? a : b));
    const strength = THREE.MathUtils.clamp(Math.sqrt(Math.max(level, 0)), 0.12, 1);
    if (call.event !== event && !(call.event && call.event.who === event.who)) call.from = t;
    call.event = event; call.until = t + THREE.MathUtils.clamp(seconds || 0, 0.9, 14); call.strength = strength;
    call.e.style.setProperty('--r', `${Math.round(18 + 26 * strength)}px`);
  }

  // Every frame, once the view is where it will be drawn from. `hovering`: the circle is on an animal; `focused`:
  // the view is held on one (the circle is put away, and so is the line of instructions).
  function frame({ hovering = false, focused = false } = {}) {
    if (paused) return;
    const t = now();
    if (aim) {
      aim.classList.toggle('on', nav.state.locked && !focused);
      aim.classList.toggle('hot', hovering);
    }
    if (hint) {
      if (nav.state.locked || nav.state.speed > 0.5) taught = true;
      if (!hinted && !taught) { hinted = t; hint.classList.add('on'); }
      else if (hinted && hint.classList.contains('on') && (taught || focused || t - hinted > 16)) hint.classList.remove('on');
    }
    let any = false;
    for (const call of calls) if (call.event) { any = true; break; }
    if (!any) return;
    const box = element.getBoundingClientRect(), w = box.width || 1, h = box.height || 1;
    _inverse.copy(camera.matrixWorld).invert();
    for (const call of calls) {
      if (!call.event) continue;
      const fade = Math.min((t - call.from) / 0.18, (call.until + 0.4 - t) / 0.4);
      if (fade <= 0) { call.event = null; call.e.classList.remove('on', 'edge'); continue; }
      // where the voice is: with its animal while the animal is there, else where it was said
      const who = call.event.who;
      if (who && who.left == null) _v.set(who.at.x, who.at.y + Math.min(0.4, (who.size || 0.15) * 0.35), who.at.z);
      else _v.set(call.event.x, call.event.y ?? 0, call.event.z);
      _v.applyMatrix4(_inverse);
      // the way to it across the page (right, down), and where it is on the page if it is before the eye
      let dx = _v.x, dy = -_v.y, x = 0, y = 0, inside = false;
      if (_v.z < -0.05) {
        const depth = _v.z;
        _v.applyMatrix4(camera.projectionMatrix);
        x = (_v.x * 0.5 + 0.5) * w; y = (0.5 - _v.y * 0.5) * h;
        inside = x >= 0 && x <= w && y >= 0 && y <= h && depth < 0;
      }
      if (!inside) {
        // outside the view, or behind the eye: on the view's edge, on the side to turn to
        const length = Math.hypot(dx, dy);
        if (length < 1e-5) { dx = 1; dy = 0; } else { dx /= length; dy /= length; }
        const reach = Math.min(Math.abs(dx) > 1e-5 ? (w / 2) / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-5 ? (h / 2) / Math.abs(dy) : Infinity);
        x = w / 2 + dx * reach; y = h / 2 + dy * reach;
      }
      call.e.classList.add('on');
      call.e.classList.toggle('edge', !inside);
      call.e.style.opacity = (Math.min(1, fade) * (0.58 + 0.4 * call.strength)).toFixed(3);
      call.e.style.transform = `translate(${(box.left + x).toFixed(1)}px, ${(box.top + y).toFixed(1)}px)`;
    }
  }

  function pause(on) {
    paused = on;
    for (const e of [aim, hint, button, help]) if (e) e.hidden = on;
    if (on) {
      if (help) show(false);
      for (const call of calls) { call.event = null; call.e.classList.remove('on', 'edge'); }
    }
  }
  function dispose() {
    if (guide) window.removeEventListener('keydown', onKey);
    for (const e of [aim, hint, button, help, ...calls.map((c) => c.e)]) if (e) e.remove();
  }
  // (for the tools: what is shown just now)
  const state = () => ({ aim: !!aim && aim.classList.contains('on'), hot: !!aim && aim.classList.contains('hot'), help: open, hint: !!hint && hint.classList.contains('on'),
    calls: calls.filter((c) => c.event).map((c) => ({ key: c.event.key, what: c.event.what, edge: c.e.classList.contains('edge'), transform: c.e.style.transform, opacity: +c.e.style.opacity })) });

  return { frame, voice, pause, dispose, state, help: (on) => { if (guide) show(on); } };
}
