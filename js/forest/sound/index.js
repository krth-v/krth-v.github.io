// The forest's sound: its water and its air, and its animals' voices.
//
// The water and the air are made in the page, from noise through filters: the river (the nearer its bank the
// louder, with a brighter rush close to), the creek, the falls and their rumble, and the air in the crowns,
// which comes and goes. Nothing of them is recorded. The animals' voices are recordings where one with a
// clear licence was found, and are otherwise silent or, for a few that are named there, made in the page
// (sound/voices.js). A voice is played when its animal says it (life/visit.js keeps what each has said), as
// loud as it would be from where the walker stands, and from the side it is on.
//
// A browser plays nothing until its visitor has clicked or pressed a key, so the sound begins then, and what
// shows that it has is a small control at the foot of the page, which turns it off (M does too). Every level
// here, and every filter, is the agent's own, set from no recording and heard by no one yet: headless Chrome
// has no ears. What was checked is that each part is there and is as loud as it was meant to be, by number.
import { BASE, RECORDINGS, SYNTHS, CREDITS } from './voices.js';
import { HUMMINGBIRD } from './hummingbird.js';
import { river, creek, FALLS } from '../world/land.js';
import { MADE } from './grouse.js';

const LEVEL = 0.55;               // the whole, before the limiter (which lifts it again by about as much as this takes off)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const _r = [0, false, 0, 0, 0], _c = [0, 0, 0, 0, 0];
const toRiver = (x, z) => Math.max(0, river(x, z, _r)[0]);            // metres from the river's water (0 in it)
const toCreek = (x, z) => Math.max(0, creek(x, z, _c)[0]);            // metres from the creek (99 far from it)

// `heard(event, seconds, level)`, if given, is told of each voice as it begins to play: what was said (life/visit.js
// `say`: its kind, where, and by whom), for how long and how loud (js/forest/hud.js shows where it comes from).
export function createSound({ heard = null } = {}) {
  let ctx = null, master = null, limit = null, meter = null, started = false, muted = false, paused = false, primed = false, seen = -1, playing = 0, control = null;
  const buffers = new Map(), beds = {}, told = { handled: 0, played: 0, quiet: 0, silent: 0, last: '' };
  const wanted = { river: 0, rush: 0, creek: 0, falls: 0, rumble: 0, air: 0 };
  try { muted = window.localStorage.getItem('forestSound') === 'off'; } catch { /* a private window: it is on */ }

  // Seconds of noise, the same on every load: two channels that are not each other. Every part of the water and
  // the air plays it from a place of its own (`from`, seconds in): two parts that played the same noise through
  // different filters cancelled each other where the filters met, and a dark line lay across what was heard.
  let hiss = null;
  const noise = (from) => {
    if (!hiss) {
      hiss = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 11), ctx.sampleRate);
      let a = 11;
      const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      for (let ch = 0; ch < 2; ch += 1) { const data = hiss.getChannelData(ch); for (let i = 0; i < data.length; i += 1) data[i] = next() * 2 - 1; }
    }
    const source = ctx.createBufferSource();
    source.buffer = hiss; source.loop = true; source.start(0, from);
    return source;
  };
  // One part of the water or the air: noise through filters, as loud as it is told to be, from one side or all round.
  // `waver`: its loudness wavers a little, at rates that never fall in step ([a second, by how much] each).
  const bed = (name, from, filters, { sided = true, waver = [] } = {}) => {
    let node = noise(from);
    for (const [type, frequency, q] of filters) { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = frequency; if (q) f.Q.value = q; node.connect(f); node = f; }
    const gain = ctx.createGain();
    gain.gain.value = 0; node.connect(gain); node = gain;
    if (waver.length) {
      const through = ctx.createGain();
      for (const [rate, depth] of waver) { const lfo = ctx.createOscillator(), by = ctx.createGain(); lfo.frequency.value = rate; by.gain.value = depth; lfo.connect(by); by.connect(through.gain); lfo.start(); }
      node.connect(through); node = through;
    }
    let pan = null;
    if (sided) { const p = ctx.createStereoPanner(); node.connect(p); p.connect(master); pan = p.pan; } else node.connect(master);
    beds[name] = { gain: gain.gain, pan };
  };
  // A bill on wood: a few thousandths of a second of ringing, made once at each pitch.
  const knocks = new Map();
  const knockAt = (pitch) => {
    if (knocks.has(pitch)) return knocks.get(pitch);
    const n = Math.floor(ctx.sampleRate * 0.07), buffer = ctx.createBuffer(1, n, ctx.sampleRate), data = buffer.getChannelData(0);
    let a = 12345;
    for (let i = 0; i < n; i += 1) {
      const t = i / ctx.sampleRate; a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
      data[i] = Math.exp(-t / 0.011) * (0.6 * Math.sin(6.2832 * pitch * t) + 0.3 * Math.sin(6.2832 * pitch * 2.31 * t) + 0.3 * (a / 2147483648 - 1) * Math.exp(-t / 0.003));
    }
    knocks.set(pitch, buffer);
    return buffer;
  };

  function start() {
    if (started) return;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    started = true;
    ctx = new Context();
    master = ctx.createGain(); master.gain.value = muted ? 0 : LEVEL;
    // A limiter. By the levels in sound/voices.js a woodpecker calling close by, over a jay and the falls, comes to
    // more than the output holds, and what it does not hold it clips. (It also lifts what is quiet: LEVEL allows for it.)
    limit = ctx.createDynamicsCompressor();
    limit.threshold.value = -9; limit.knee.value = 6; limit.ratio.value = 12; limit.attack.value = 0.003; limit.release.value = 0.2;
    meter = ctx.createAnalyser(); meter.fftSize = 2048;
    master.connect(limit); limit.connect(meter); meter.connect(ctx.destination);
    bed('river', 0, [['lowpass', 850, 0.4], ['highpass', 110, 0.5]]);
    bed('rush', 1.7, [['bandpass', 2300, 0.5]]);
    bed('falls', 3.1, [['highpass', 450, 0.5], ['lowpass', 5200, 0.5]]);
    bed('rumble', 4.9, [['lowpass', 170, 0.6]]);
    bed('creek', 6.3, [['bandpass', 3100, 0.8]], { waver: [[3.1, 0.22], [5.3, 0.16]] });        // (its babble)
    bed('air', 8.2, [['bandpass', 1100, 0.3], ['lowpass', 3600, 0.5]], { sided: false });
    for (const { file } of Object.values(RECORDINGS)) {
      fetch(BASE + file).then((answer) => (answer.ok ? answer.arrayBuffer() : Promise.reject(new Error(`${answer.status}`))))
        .then((bytes) => ctx.decodeAudioData(bytes)).then((buffer) => buffers.set(file, buffer)).catch(() => { told.missing = (told.missing || 0) + 1; });
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    show();
  }

  // The control at the foot of the page: on or off, and whose the recordings are.
  function show() {
    if (control) return;
    control = document.createElement('div');
    control.className = 'forest-sound';
    const button = document.createElement('button');
    button.type = 'button';
    const label = () => { button.textContent = muted ? 'Sound off' : 'Sound on'; button.setAttribute('aria-pressed', String(!muted)); button.title = 'M turns the sound on and off'; };
    button.addEventListener('click', (event) => { event.stopPropagation(); mute(!muted); label(); });
    control.label = label;
    const credits = document.createElement('details');
    credits.innerHTML = `<summary>credits</summary><ul>${CREDITS.map((c) => `<li>${c.what}: ${c.by}. ${c.licenceUrl ? `<a href="${c.licenceUrl}" rel="license noopener" target="_blank">${c.licence}</a>` : c.licence}.</li>`).join('')}
      <li>The water, the air, the woodpecker's knocking and drumming, the nuthatch's tapping and the Varied Thrush's whistle are made in the page.</li></ul>`;
    for (const type of ['pointerdown', 'click', 'wheel']) credits.addEventListener(type, (event) => event.stopPropagation());
    control.append(button, credits);
    document.body.append(control);
    label();
  }
  function mute(off) {
    muted = off;
    try { window.localStorage.setItem('forestSound', off ? 'off' : 'on'); } catch { /* not kept */ }
    if (master) master.gain.setTargetAtTime(off ? 0 : LEVEL, ctx.currentTime, 0.08);
    if (control) control.label();
  }
  // The first click or key begins it, whichever key it is (M too: before there is a sound there is nothing for it
  // to turn off). A press that a browser does not take for leave to play (a finger's, until it lifts) leaves the
  // sound waiting, and the next one wakes it.
  // While it is paused (in the cabin's page, while the visitor is indoors) a click or a key begins nothing.
  const wake = () => { if (paused) return; if (!started) start(); else if (ctx && ctx.state === 'suspended' && !document.hidden) ctx.resume().catch(() => {}); };
  const onKey = (event) => { if (paused) return; if (!started) { start(); return; } wake(); if (event.code === 'KeyM' && !event.repeat && !event.metaKey && !event.ctrlKey) mute(!muted); };
  const onPointer = () => wake();
  // (a page that is not being looked at is silent: its frames have stopped, and the water would run on as it last was)
  const onHide = () => { if (ctx) (document.hidden || paused ? ctx.suspend() : ctx.resume()).catch(() => {}); };
  window.addEventListener('pointerdown', onPointer);
  window.addEventListener('pointerup', onPointer);
  window.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onHide);

  // One voice, from where it was said. `far`: metres from the walker; `side`: -1 on their left .. 1 on their right.
  function voice(event, side) {
    const id = `${event.key}/${event.what}`, rec = RECORDINGS[id], made = SYNTHS[id], spec = rec || made;
    told.handled += 1;
    if (!spec) { told.silent += 1; return; }
    const d = Math.max(event.far, 0.5), level = spec.level * Math.min(1, spec.near / d) * (1 - smooth(0.7 * event.reach, event.reach, d));
    if (level < 0.003 || playing >= 8 || (rec && !buffers.has(rec.file))) { told.quiet += 1; return; }
    const now = ctx.currentTime + 0.02, out = ctx.createGain(), air = ctx.createBiquadFilter(), pan = ctx.createStereoPanner();
    // (the further off, the duller: the wood takes the top of a voice first)
    air.type = 'lowpass'; air.frequency.value = 14000 - 9500 * clamp(d / Math.max(event.reach, 1), 0, 1);
    pan.pan.value = clamp(side, -1, 1) * 0.8;
    out.connect(air); air.connect(pan); pan.connect(master);
    playing += 1; told.played += 1; told.last = id;
    const done = (after) => { if (heard) heard(event, after, level); window.setTimeout(() => { playing -= 1; pan.disconnect(); }, after * 1000 + 200); };
    if (rec) {
      const source = ctx.createBufferSource();
      source.buffer = buffers.get(rec.file); out.gain.value = level;
      source.connect(out); source.start(now);
      done(source.buffer.duration);
    } else if (MADE[made.synth]) {
      // (made by a maker of its own: the grouse's drum, flush and hoot, sound/grouse.js)
      done(MADE[made.synth](ctx, out, now, level, made, event));
    } else if (made.synth === 'whistle') {
      // one long note with a buzz in it: two tones a little apart; each song on another pitch
      const pitch = [2850, 3200, 3600, 4000, 4450, 4950][Math.floor(Math.random() * 6)], length = clamp(event.hold || 1.5, 0.9, 2.2);
      for (const [f, share] of [[pitch, 0.55], [pitch + 78 + Math.random() * 30, 0.45]]) { const osc = ctx.createOscillator(), g = ctx.createGain(); osc.frequency.value = f; g.gain.value = share; osc.connect(g); g.connect(out); osc.start(now); osc.stop(now + length + 0.05); }
      out.gain.setValueAtTime(0, now); out.gain.linearRampToValueAtTime(level, now + 0.24); out.gain.setValueAtTime(level, now + length - 0.32); out.gain.linearRampToValueAtTime(0, now + length);
      done(length);
    } else if (HUMMINGBIRD[made.synth]) {
      // (the hummingbird's wings and its dive's note: sound/hummingbird.js)
      done(HUMMINGBIRD[made.synth](ctx, out, now, level, event));
    } else {
      // a knock, or a roll of them: about fifteen a second, quickening, and trailing off at the end
      const buffer = knockAt(made.pitch), roll = made.synth === 'drum' ? 2.6 : 0;
      out.gain.value = level;
      for (let t = 0, gap = 1 / 14; t <= roll; t += gap, gap *= 0.992) {
        const source = ctx.createBufferSource(), g = ctx.createGain();
        source.buffer = buffer; g.gain.value = roll ? Math.min(1, 0.35 + t * 2.5) * (1 - 0.75 * smooth(roll * 0.6, roll, t)) * (0.85 + 0.15 * Math.random()) : 1;
        source.connect(g); g.connect(out); source.start(now + t);
        if (!roll) break;
      }
      done(roll + 0.1);
    }
  }

  // `camera`: the walker's own view; `x`, `z`: where they stand; `open`: how open the air is there (0..1);
  // `voices`: what the visit's animals have said (life/visit.js), or null.
  function frame(dt, { camera, x, z, open = 0, t = 0, voices = null }) {
    if (!started || !ctx) return;
    // While it is paused (the visitor indoors, in the cabin's page) nothing is played, and what is said meanwhile is not
    // kept for later: played on the suspended context it waited at a stopped clock, and came all at once on the next
    // time out (a review's find).
    if (paused) { if (voices && voices.length) seen = Math.max(seen, voices[voices.length - 1].at); return; }
    const e = camera.matrixWorld.elements, rx = e[0], rz = e[2], now = ctx.currentTime;
    const sideOf = (dx, dz) => { const d = Math.hypot(dx, dz) || 1; return (dx * rx + dz * rz) / d; };
    // the water: by how far off it is, and from the side it is on (found by which way it gets nearer)
    const dr = toRiver(x, z), drx = toRiver(x + 2, z) - toRiver(x - 2, z), drz = toRiver(x, z + 2) - toRiver(x, z - 2);
    const dc = toCreek(x, z), dcx = toCreek(x + 1, z) - toCreek(x - 1, z), dcz = toCreek(x, z + 1) - toCreek(x, z - 1);
    const fx = FALLS.x - x, fz = FALLS.z - z, df = Math.hypot(fx, fz);
    wanted.river = 0.5 / (1 + (dr / 14) ** 2); wanted.rush = 0.2 / (1 + (dr / 7) ** 2);
    wanted.creek = dc > 60 ? 0 : 0.16 / (1 + (dc / 4) ** 2);
    wanted.falls = 0.3 / (1 + (df / 8) ** 2); wanted.rumble = 0.18 / (1 + (df / 10) ** 2);        // (a creek's leap of three metres, not a river's)
    // the air in the crowns: a little always, more in the open, barely coming and going
    // (As first set the wood between two calls was silent, 54 dB under full scale; at five times that it was a wash
    // that ebbed and flowed over everything, and the owner, 2026-11-18: "The general washy sound of the wind that
    // ebbs and flows needs to be tuned down significantly". So: about a quarter of that level, and a swell a third as
    // deep. The animals' voices are as they were.)
    wanted.air = (0.036 + 0.045 * open) * (0.82 + 0.12 * Math.sin(t * 0.19) * Math.sin(t * 0.07 + 1) + 0.06 * Math.sin(t * 0.53 + 2));
    for (const name of Object.keys(wanted)) beds[name].gain.setTargetAtTime(Math.max(0, wanted[name]), now, 0.3);
    const riverSide = -sideOf(drx, drz) * clamp(dr / 10, 0, 1) * 0.7, creekSide = -sideOf(dcx, dcz) * clamp(dc / 4, 0, 1) * 0.7, fallsSide = sideOf(fx, fz) * clamp(df / 6, 0, 1) * 0.8;
    beds.river.pan.setTargetAtTime(riverSide, now, 0.3); beds.rush.pan.setTargetAtTime(riverSide, now, 0.3);
    beds.creek.pan.setTargetAtTime(creekSide, now, 0.3);
    beds.falls.pan.setTargetAtTime(fallsSide, now, 0.3); beds.rumble.pan.setTargetAtTime(fallsSide * 0.5, now, 0.3);
    // the voices: whatever has been said since the last frame (what was said before the sound began is not played)
    // (the first frame after the sound began marks the place: with nothing said yet, the first thing said was taken for old)
    if (!primed) { primed = true; seen = voices && voices.length ? voices[voices.length - 1].at : -1; }
    if (voices && voices.length) {
      let latest = seen;
      for (const said of voices) if (said.at > seen) { voice(said, sideOf(said.x - camera.position.x, said.z - camera.position.z)); latest = Math.max(latest, said.at); }
      seen = latest;
    }
  }

  // for the tools: what there is, and how loud the whole is just now (root mean square of the last 2,048 samples)
  function state() {
    let level = 0;
    if (meter) { const data = new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(data); for (const v of data) level += v * v; level = Math.sqrt(level / data.length); }
    return { started, running: ctx ? ctx.state : 'none', muted, loaded: [...buffers.keys()].sort(), wanted: { ...wanted }, level, playing, ...told };
  }
  // for the tools: what is heard over the next `seconds`, as a recording (a WebM, in base64). It is how a
  // checkpoint's folder comes to have the sound in it, and how the agent, which cannot hear, looks at it.
  function record(seconds) {
    const tap = ctx.createMediaStreamDestination(), recorder = new MediaRecorder(tap.stream), parts = [];
    limit.connect(tap);
    return new Promise((resolve) => {
      recorder.ondataavailable = (event) => parts.push(event.data);
      recorder.onstop = async () => {
        limit.disconnect(tap);
        const bytes = new Uint8Array(await new Blob(parts).arrayBuffer());
        let text = '';
        for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        resolve(btoa(text));
      };
      recorder.start();
      window.setTimeout(() => recorder.stop(), seconds * 1000);
    });
  }
  function dispose() {
    window.removeEventListener('pointerdown', onPointer); window.removeEventListener('pointerup', onPointer); window.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onHide);
    if (control) control.remove();
    if (ctx) ctx.close().catch(() => {});
  }
  // (the forest is not being shown: nothing is played, and nothing is spent)
  // Paused, it is silent and its control is put away; let go, it begins if it has not (the press that lets it go is
  // the visitor's own: js/outside.js does it from the click that takes them outside) and its control comes back.
  const pause = (on) => {
    paused = on;
    if (!on && !started) start();
    if (control) control.hidden = on;
    onHide();
  };

  // (for the tools: one voice, as if an animal `far` metres off had said it)
  const play = (key, what, far = 8, reach = 100, hold = undefined, side = 0) => voice({ key, what, far, reach, hold }, side);

  return { frame, start, mute, state, record, play, pause, dispose };
}
