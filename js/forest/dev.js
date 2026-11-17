import * as THREE from 'three';
import { detectCaps } from '../caps.js';
import { solarState, currentHour } from '../solar.js';
import { createForest, layOut, SCENES } from './index.js';
import { createGpuTimer, forestSettings, CEILINGS } from './budget.js';

// Development page for the forest on its own (forest.html). The cabin never
// loads this file. URL parameters:
//   show=textures (the painted sheets, flat)  only=<part of a name>,...  zoom=<x>
//   show=map (the layout from above)  from=<m> to=<m> margin=<m> cover=1 (ferns, sorrel and seedlings too)  walk=1 (the whole walk and the valley)
//   show=bird (a species' contact sheet)  species=<key>  pose=<name> turn=<deg> zoom=<x> (one pose, large)  sheet=1 (its paint, flat)
//   time=morning|day|golden|night   hour=17.5
//   msaa=0|2|4  prepass=0|1  shafts=<steps>  bloom=0|1  density=<x>  lod=<x>
//   hand=<x> tail=<x>   how long detail levels take to hand over, and plants to shrink away at their limit, as a share of the usual
//   scale=<0.5..1> (fixes render scale, governor off)  governor=0
//   s=<metres along the trail>  yaw=<deg>  pitch=<deg>  hud=0   (no pose: the first view of the first composed scene)
//   place=<name>[+m|-m]   a place on the walk by name, with metres on from it (place=river%2B8), in place of s=
//   vantage=window  bearing=<deg>  pitch=<deg>   look out from the cabin's window: bearing turns from straight out (-z) towards +x
//   hide=fern,sorrel,...   leave plant kinds out, to see what each costs (a name that is no kind is refused; the valley's
//                          conifers are two kinds, spruce and slope)
//   visit=<n>   the valley of visit n: who is about, and where, is drawn from the number (without it, a new valley
//               on every load; the number is on the page, to see the same one again). visit=busy: the busiest there can be
//   birds=<n>   the cast of checkpoint 2 in place of a visit: n birds in the composed scene, each where it always was (0: no animals)
//   night=approved   the night as it was approved at checkpoint 1: no darker, no lantern, no light from the cabin's window
//   lantern=0   the dark night without the lantern in the walker's hand
//   sound=0   no sound (with it, the sound begins at the first click or key, and M or the control at the foot of the page turns it off)
//   slow=<x>    the forest's clock runs at this share of real time (0.1: a wingbeat can be watched)
//   calls=<n>   at most n draw calls for the animals (life/index.js `allot`), below what the view's ceiling leaves them:
//               to see which kinds are left out of a frame, and drawn coarser, when there is no room

const params = new URLSearchParams(location.search);
const num = (key) => (params.has(key) ? Number(params.get(key)) : undefined);
const flag = (key) => (params.has(key) ? params.get(key) !== '0' : undefined);

function start() {
  if (params.has('time')) {
    // The site's clock ignores a name it does not know and shows the hour it really is. Asked for by name
    // on this page, that is a mistake: a frame captured as "noon" was a frame of whatever the time was.
    const times = ['morning', 'day', 'golden', 'night'], time = params.get('time').toLowerCase();
    if (!times.includes(time)) throw new Error(`there is no time called "${params.get('time')}": the times are ${times.join(', ')}`);
    window.__FORCE_TIME = time;
  }
  if (params.has('hour')) window.__FORCE_HOUR = Number(params.get('hour'));

  // a stretch that is not a positive number would be drawn as no stretch at all, or as nothing, without a word
  for (const key of ['hand', 'tail', 'slow']) {
    if (params.has(key) && !(num(key) > 0)) throw new Error(`${key}= wants a positive number, not "${params.get(key)}"`);
  }
  if (params.has('birds') && !(params.get('birds') !== '' && Number.isInteger(num('birds')) && num('birds') >= 0)) throw new Error(`birds= wants a whole number, 0 or more, not "${params.get('birds')}"`);
  if (params.has('visit') && params.get('visit') !== 'busy' && !(Number.isInteger(num('visit')) && num('visit') >= 1)) throw new Error(`visit= wants a whole number, 1 or more, or "busy", not "${params.get('visit')}"`);
  if (params.has('visit') && params.has('birds')) throw new Error('visit= and birds= were both given: the animals are a visit\'s or the cast, not both');
  const caps = detectCaps();
  const canvas = document.getElementById('forest');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, caps.pixelRatioCap));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;

  const forest = createForest({
    renderer, look: params.get('look') || undefined, hide: (params.get('hide') || '').split(',').filter(Boolean), birds: num('birds'),
    visit: params.get('visit') === 'busy' ? 'busy' : num('visit'), hour: currentHour(),
    night: params.get('night') || undefined, lantern: flag('lantern'), sound: flag('sound'),
    overrides: { msaa: num('msaa'), prepass: flag('prepass'), shaftSteps: num('shafts'), bloom: flag('bloom'),
      density: num('density'), lodScale: num('lod'), hand: num('hand'), tail: num('tail'), governor: flag('governor') },
  });
  forest.setSize(window.innerWidth, window.innerHeight);
  if (params.has('scale')) forest.setScale(num('scale'));
  if (params.has('calls')) {
    if (!(Number.isInteger(num('calls')) && num('calls') >= 0)) throw new Error(`calls= wants a whole number, 0 or more, not "${params.get('calls')}"`);
    forest.life.drawing.cap = num('calls');
  }
  // With no pose in the address the walker starts at the first checkpoint view of the first composed
  // scene: the loop's own start is still uncomposed scatter.
  const posed = params.has('s') || params.has('yaw') || params.has('pitch') || params.has('place') || params.has('vantage');
  const [s0, yaw0, pitch0] = posed ? [0, 0, 0] : SCENES[0].views[0];
  forest.nav.state.s = num('s') || s0;
  // 'ravine-6': six metres short of the place the walk calls ravine. A name the walk does not know is a mistake.
  const placeAt = (text) => {
    if (typeof text === 'number') return text;
    const [name, more] = String(text).split(/([+-].*)/), at = forest.trail.at[name] + Number(more || 0);
    if (!Number.isFinite(at)) throw new Error(`the walk has no place "${text}": its places are ${Object.keys(forest.trail.at).join(', ')}`);
    return at;
  };
  if (params.has('place')) forest.nav.state.s = placeAt(params.get('place'));
  if (params.has('vantage')) {
    const from = forest.places[params.get('vantage')];
    if (!from) throw new Error(`there is no vantage called "${params.get('vantage')}": there is ${Object.keys(forest.places).join(', ')}`);
    forest.nav.state.free = { x: from[0], y: from[1], z: from[2], open: from[3], yaw: THREE.MathUtils.degToRad(-(num('bearing') || 0)), pitch: THREE.MathUtils.degToRad(num('pitch') || 0) };
  }
  forest.nav.state.yaw = THREE.MathUtils.degToRad(num('yaw') || yaw0);
  forest.nav.state.pitch = THREE.MathUtils.degToRad(num('pitch') || pitch0);
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    forest.setSize(window.innerWidth, window.innerHeight);
  });

  const gl = renderer.getContext();
  const gpu = createGpuTimer(gl);
  const hud = document.getElementById('hud');
  if (params.get('hud') === '0') hud.hidden = true;
  const pixel = new Uint8Array(4);
  const clock = new THREE.Clock();
  let lastNow = performance.now(), smooth = 16.7, frames = 0, run = null, held = false, told = 0;
  const slow = num('slow') ?? 1;

  function loop(now) {
    const next = requestAnimationFrame(loop);
    const interval = now - lastNow;
    lastNow = now;
    if (held) return;                                    // the pop check is drawing its own frames
    const dt = Math.min(interval / 1000, 0.1);

    if (run && !run.still) {
      // scripted walk: once round the loop, looking from side to side
      const k = run.i / run.frames;
      forest.nav.state.auto = { s: k * forest.trail.length * run.loops, yaw: 0.9 * Math.sin(k * Math.PI * 6), pitch: 0.12 * Math.sin(k * Math.PI * 10) };
    }

    const before = performance.now();
    if (gpu) gpu.begin();
    try {
      told += dt * slow;
      forest.frame(slow === 1 ? clock.getElapsedTime() : told, dt * slow, solarState(currentHour()));
    } catch (error) {
      // a frame that throws would throw again sixty times a second: stop, say why on the page, and let a waiting walk go
      cancelAnimationFrame(next);
      if (run) { const done = run; run = null; done.resolve({ aborted: true, error: String(error) }); }
      failed(error);
      return;
    }
    if (gpu) gpu.end();
    if (run && run.sync) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);   // wait for the GPU
    const cost = performance.now() - before;

    frames += 1;
    smooth += (interval - smooth) * 0.05;
    if (run) {
      if (run.i >= 0) {
        const s = forest.stats();
        run.interval.push(interval); run.cost.push(cost); run.gpu.push(gpu ? gpu.ms : 0);
        run.calls.push(s.calls); run.triangles.push(s.triangles); run.solid.push(s.solid); run.foliage.push(s.foliage);
        run.pack.push(s.packMs); run.draw.push(s.drawMs); run.fov.push(forest.camera.fov);
        if (s.sunMapRedrawn) run.redraws += 1;
        run.minScale = Math.min(run.minScale, s.scale);
      }
      run.i += 1;
      if (run.i >= run.frames) { const done = run; run = null; if (!done.still) forest.nav.state.auto = null; done.resolve(summarise(done)); }
    }
    if (!hud.hidden && frames % 20 === 0) {
      const s = forest.stats();
      hud.textContent = `${smooth.toFixed(1)} ms  |  ${s.calls} draws  |  ${(s.solid / 1e3).toFixed(0)}k solid + ${(s.foliage / 1e3).toFixed(0)}k foliage tris`
        + `  |  scale ${s.scale.toFixed(2)}  |  tier ${s.settings.tier}  msaa ${s.settings.msaa}  prepass ${s.settings.prepass ? 1 : 0}  shafts ${s.settings.shaftSteps}`
        + (forest.life.visit ? `  |  visit ${forest.life.visit.busy ? 'busy' : forest.life.visit.seed}: ${forest.life.birds.length} here of ${forest.life.visit.who.length}` : `  |  the cast: ${forest.life.birds.length}`);
    }
    if (!window.__forestReady && frames > 3) window.__forestReady = true;
  }

  const pct = (values, p) => { const a = [...values].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(a.length * p))]; };
  const spread = (values, digits = 2) => ({ p50: +pct(values, 0.5).toFixed(digits), p95: +pct(values, 0.95).toFixed(digits),
    p99: +pct(values, 0.99).toFixed(digits), max: +Math.max(...values).toFixed(digits) });
  function summarise(r) {
    return {
      frames: r.frames, sync: r.sync, interval: spread(r.interval), cost: spread(r.cost), gpu: gpu ? spread(r.gpu) : null,
      pack: spread(r.pack), draw: spread(r.draw),
      calls: spread(r.calls, 0), triangles: spread(r.triangles, 0), solid: spread(r.solid, 0), foliage: spread(r.foliage, 0),
      sunMapRedraws: r.redraws, settings: forest.settings, ceilings: CEILINGS, scale: forest.stats().scale, minScale: r.minScale,
      canvas: [renderer.domElement.width, renderer.domElement.height],
      raw: r.raw ? { interval: r.interval, cost: r.cost, gpu: r.gpu, calls: r.calls, triangles: r.triangles, fov: r.fov } : undefined,
    };
  }

  window.__forest = {
    forest, renderer, caps, ceilings: CEILINGS,
    // Walk the loop `loops` times over `frames` frames and report frame cost.
    // sync=true waits for the GPU after each frame, so `cost` is the whole frame.
    // still=true times the frames where the walker stands, without the walk: a close-up, which a step would end.
    bench({ frames: n = 600, warmup = 60, sync = false, loops = 1, raw = false, governed = false, still = false } = {}) {
      forest.setGoverned(governed);
      if (run) {                                         // a second call takes over; the first must not be left waiting, nor its scripted pose left standing
        if (!run.still) forest.nav.state.auto = null;
        run.resolve({ aborted: true });
      }
      return new Promise((resolve) => {
        run = { frames: n, i: -warmup, sync, loops, raw, still, resolve, minScale: 1, interval: [], cost: [], gpu: [], pack: [], draw: [], fov: [], calls: [], triangles: [], solid: [], foliage: [], redraws: 0 };
      });
    },
    // What pops when the walker advances `step` metres from `s`. The frame is drawn twice from the same
    // camera, with detail chosen from where the walker stands and then from `step` further on, wind and
    // clock stopped; the two are compared pixel by pixel. `changed` is the share of pixels that differ
    // by more than `level` of 255 in any channel, `hot` the number of `tile`-pixel squares in which more
    // than a quarter of the pixels do, `worst` the worst square, and `mean` the mean difference.
    pop({ s = 0, yaw = 0, pitch = 0, step = 1, level = 10, tile = 40, at = 40 } = {}) {
      held = true;
      // a scripted pose moves the walker: where they stood is put back afterwards, not only the script
      const state = forest.nav.state, before = { s: state.s, yaw: state.yaw, pitch: state.pitch, speed: state.speed, push: state.push, auto: state.auto };
      try {
        const cfg = solarState(currentHour());
        const W = canvas.width, H = canvas.height, a = new Uint8Array(W * H * 4), b = new Uint8Array(W * H * 4);
        const pose = (along) => ({ s: along, yaw: THREE.MathUtils.degToRad(yaw), pitch: THREE.MathUtils.degToRad(pitch) });
        state.auto = pose(s + step);
        forest.nav.update(0);
        const ahead = forest.camera.position.clone();
        state.auto = pose(s);
        const shot = (from, into) => {
          forest.measureFrom(from);
          forest.frame(at, 0, cfg);
          gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, into);
        };
        shot(null, a);
        shot(ahead, b);
        const cols = Math.ceil(W / tile), rows = Math.ceil(H / tile), tiles = new Uint32Array(cols * rows);
        let changed = 0, sum = 0;
        for (let y = 0; y < H; y += 1) {
          const row = Math.floor(y / tile) * cols;
          for (let x = 0; x < W; x += 1) {
            const o = (y * W + x) * 4;
            const d = Math.max(Math.abs(a[o] - b[o]), Math.abs(a[o + 1] - b[o + 1]), Math.abs(a[o + 2] - b[o + 2]));
            sum += d;
            if (d > level) { changed += 1; tiles[row + Math.floor(x / tile)] += 1; }
          }
        }
        let hot = 0, worst = 0, where = 0;
        for (let i = 0; i < tiles.length; i += 1) {
          if (tiles[i] > tile * tile * 0.25) hot += 1;
          if (tiles[i] > worst) { worst = tiles[i]; where = i; }
        }
        return { s, yaw, pitch, step, changed: changed / (W * H), mean: sum / (W * H), hot, tiles: tiles.length,
          worst: { share: worst / (tile * tile), x: (where % cols) * tile, y: H - (Math.floor(where / cols) + 1) * tile } };
      } finally {
        forest.measureFrom(null);
        Object.assign(state, before);
        held = false;
      }
    },
    // Draw one frame with detail chosen from `step` metres further along the trail than the camera stands (0: from
    // the camera), wind and clock stopped, and leave it on the canvas: for looking at what the pop check counts.
    popFrame({ s = 0, yaw = 0, pitch = 0, step = 0, at = 40 } = {}) {
      held = true;
      const state = forest.nav.state;
      const pose = (along) => ({ s: along, yaw: THREE.MathUtils.degToRad(yaw), pitch: THREE.MathUtils.degToRad(pitch) });
      state.auto = pose(s + step);
      forest.nav.update(0);
      const from = step ? forest.camera.position.clone() : null;
      state.auto = pose(s);
      forest.measureFrom(from);
      // the frame stays on the canvas and the page stays held, unless drawing it fails: then the page is let go
      try { forest.frame(at, 0, solarState(currentHour())); } catch (error) { held = false; state.auto = null; throw error; } finally { forest.measureFrom(null); }
    },
    // What a close-up leaves out. Through a long lens each plant is tested against the view on its own
    // (world/instancer.js), and a plant left out wrongly would be a hole in the picture. The frame is drawn
    // twice from the camera as it stands, clock stopped: with every plant of every cell in view, as a
    // walker's view is packed, and with each plant tested. `differ` is how many pixels are not the same in
    // the two, which should be none; `all` and `tested` are what each of them held.
    closeUp({ at = 40 } = {}) {
      held = true;
      try {
        const cfg = solarState(currentHour());
        const W = canvas.width, H = canvas.height, a = new Uint8Array(W * H * 4), b = new Uint8Array(W * H * 4);
        const shot = (each, into) => {
          forest.testEach(each);
          forest.frame(at, 0, cfg);
          gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, into);
          const s = forest.stats();
          return { solid: s.solid, foliage: s.foliage, calls: s.calls, plants: s.instances };
        };
        const all = shot(false, a), tested = shot(true, b);
        let differ = 0;
        for (let o = 0; o < a.length; o += 4) if (a[o] !== b[o] || a[o + 1] !== b[o + 1] || a[o + 2] !== b[o + 2]) differ += 1;
        return { differ, pixels: W * H, all, tested, fov: forest.camera.fov, focused: forest.life.focused };
      } finally {
        forest.testEach(true);
        held = false;
      }
    },
    // How much of an animal the frame shows. The page knows what a trunk hides (the pointer does not find an animal
    // behind one) and not what leaves do: a close-up of a bird in a bough can be a frame of leaves. The frame is
    // drawn twice with the clock stopped, with the animal and without it; `differ` is the pixels that are not the
    // same, and `whole` about what a side view of the animal would cover at its distance, were nothing before it.
    shows(index, { at = 40 } = {}) {
      const bird = forest.life.birds[index];
      if (!bird) return null;
      held = true;
      try {
        const cfg = solarState(currentHour());
        const W = canvas.width, H = canvas.height, a = new Uint8Array(W * H * 4), b = new Uint8Array(W * H * 4);
        forest.frame(at, 0, cfg);
        gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, a);
        bird.omit = true;                       // (the tool's own word: `hide` is the animal's family's, life/index.js)
        forest.frame(at, 0, cfg);
        gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b);
        let differ = 0;
        for (let o = 0; o < a.length; o += 4) if (Math.abs(a[o] - b[o]) + Math.abs(a[o + 1] - b[o + 1]) + Math.abs(a[o + 2] - b[o + 2]) > 18) differ += 1;
        const long = (bird.size / Math.max(0.05, bird.at.distanceTo(forest.camera.position))) * (H / 2) / Math.tan(THREE.MathUtils.degToRad(forest.camera.fov / 2));
        return { differ, whole: Math.round(0.25 * long * long), long: Math.round(long), pixels: W * H };
      } finally {
        bird.omit = false;
        held = false;
      }
    },
    // s: metres along the walk, or a place on it by name ('ravine-6')
    pose(s, yawDeg = 0, pitchDeg = 0) {
      forest.nav.state.auto = { s: placeAt(s), yaw: THREE.MathUtils.degToRad(yawDeg), pitch: THREE.MathUtils.degToRad(pitchDeg) };
    },
    release() { forest.nav.state.auto = null; held = false; },
    // What walks meet. `visits` valleys, each drawn from its own number and walked once round with nothing drawn,
    // at `pace` metres a second (3.2 a walk, 7 a run). For each kind: on what share of them it was about, was in
    // sight (six pixels long, for 0.7 s) and was heard; and `broken`, each time an animal came or went where the
    // walker would plainly have seen it, which is meant never to happen.
    visits({ visits = 100, first = 1, pace = 3.2, hour = currentHour(), from = forest.trail.at.cabin, stay = 0, busy = false } = {}) {
      const elevation = solarState(hour).elevationDeg, rows = {}, sighted = [], broken = [], comings = { flew: 0, were: 0, went: 0, gone: 0 };
      // (see `checks` in life/visit.js: the worst of each over all the visits, with the visit it was on)
      const checks = { low: Infinity, lowBy: '', fastest: 0, fastestBy: '', nearest: Infinity, nearestBy: '', overlap: Infinity, overlapBy: '', closest: Infinity, closestBy: '', closer: 0, closerBy: '' };
      const events = {}, pairs = {}, lows = {};
      for (let i = 0; i < visits; i += 1) {
        const met = forest.life.walk({ seed: first + i, hour, elevation, pace, from, stay, busy });
        for (const key of Object.keys(comings)) comings[key] += met.comings[key];
        let kinds = 0;
        for (const { key, animals, built } of met.about) {
          const row = (rows[key] = rows[key] || { key, built, about: 0, animals: 0, seen: 0, heard: 0, flushed: 0, off: 0 });
          row.about += 1; row.animals += animals;
          if (met.flushed && met.flushed[key]) { row.flushed += met.flushed[key].near + met.flushed[key].off; row.off += met.flushed[key].off; }
          if (met.seen[key]) { row.seen += 1; kinds += 1; }
          if (met.heard[key]) row.heard += 1;
        }
        sighted.push(kinds);
        for (const b of met.broken) broken.push({ seed: first + i, ...b });
        if (met.checks.low < checks.low) { checks.low = met.checks.low; checks.lowBy = `${met.checks.lowBy} (visit ${first + i})`; }
        if (met.checks.fastest > checks.fastest) { checks.fastest = met.checks.fastest; checks.fastestBy = `${met.checks.fastestBy} (visit ${first + i})`; }
        if (met.checks.nearest < checks.nearest) { checks.nearest = met.checks.nearest; checks.nearestBy = `${met.checks.nearestBy} (visit ${first + i})`; }
        if (met.checks.overlap < checks.overlap) { checks.overlap = met.checks.overlap; checks.overlapBy = `${met.checks.overlapBy} (visit ${first + i})`; }
        if (met.checks.closest < checks.closest) { checks.closest = met.checks.closest; checks.closestBy = `${met.checks.closestBy} (visit ${first + i})`; }
        if (met.checks.closer > checks.closer) { checks.closer = met.checks.closer; checks.closerBy = `${met.checks.closerBy} (visit ${first + i})`; }
        // (every pair of kinds that came near, and every kind that went under the ground too far: the worst of each, with its visit)
        for (const [key, p] of Object.entries(met.checks.pairs || {})) {
          const q = (pairs[key] = pairs[key] || { near: Infinity, nearBy: '', gap: Infinity, gapBy: '' });
          if (p.near < q.near) { q.near = +p.near.toFixed(3); q.nearBy = `${p.nearBy} (visit ${first + i})`; }
          if (p.gap < q.gap) { q.gap = +p.gap.toFixed(3); q.gapBy = `${p.gapBy} (visit ${first + i})`; }
        }
        for (const [key, l] of Object.entries(met.checks.lows || {})) if (!lows[key] || l.low < lows[key].low) lows[key] = { ...l, visit: first + i };
        for (const [key, counted] of Object.entries(met.events || {})) for (const [what, n] of Object.entries(counted)) { events[key] = events[key] || {}; events[key][what] = (events[key][what] || 0) + n; }
      }
      sighted.sort((a, b) => a - b);
      const share = (n) => +(n / visits).toFixed(3);
      return { visits, pace, hour, kindsInSight: { least: sighted[0], median: sighted[visits >> 1], most: sighted[visits - 1] }, broken, comings,
        // (no two animals on the ground at once, or no big animal at all: far apart, not nothing)
        checks: { ...checks, low: +checks.low.toFixed(3), fastest: +checks.fastest.toFixed(1), nearest: Number.isFinite(checks.nearest) ? +checks.nearest.toFixed(3) : 999, overlap: Number.isFinite(checks.overlap) ? +checks.overlap.toFixed(3) : 999,
          closest: Number.isFinite(checks.closest) ? +checks.closest.toFixed(1) : 999, closer: +checks.closer.toFixed(1), pairs, lows }, events,
        rows: Object.values(rows).sort((a, b) => b.about - a.about).map((row) => ({ key: row.key, built: row.built, about: share(row.about), animals: +(row.animals / visits).toFixed(2), seen: share(row.seen), heard: share(row.heard),
          // (how many times a visit's walker put the kind up, for each visit it was about on; and the share of those that took it off out of sight)
          flushed: +(row.flushed / Math.max(1, row.about)).toFixed(2), off: row.flushed ? +(row.off / row.flushed).toFixed(2) : 0 })) };
    },
    stats: () => forest.stats(),
  };
  requestAnimationFrame(loop);
}

// ?show=textures paints the look's textures and lays them out flat, for review.
async function showTextures() {
  const { getLook } = await import('./looks/index.js');
  const paint = await import('./paint/textures.js');
  const look = getLook(params.get('look'));
  document.getElementById('forest').remove();
  document.getElementById('hud').hidden = true;
  const sheet = document.createElement('div');
  sheet.style.cssText = 'position:fixed;inset:0;overflow:auto;display:flex;flex-wrap:wrap;gap:14px;padding:14px;align-content:flex-start;background:#59645c';
  document.body.append(sheet);
  const t0 = performance.now();
  const made = {
    'fir bark': paint.barkTextures('fir', look), 'hemlock bark': paint.barkTextures('hemlock', look),
    'fir boughs': paint.boughAtlas('fir', look), 'hemlock boughs': paint.boughAtlas('hemlock', look),
    'cedar bark': paint.barkTextures('cedar', look), 'cedar sprays': paint.cedarAtlas(look), 'skunk cabbage': paint.skunkAtlas(look),
    'sword fern': paint.fernAtlas(look), 'ground cover': paint.coverAtlas(look), 'forest floor': paint.groundTexture(look),
    'trail tread': paint.treadTexture(look), 'river bar': paint.gravelTexture(look), 'old clearing': paint.meadowTexture(look),
  };
  made['maple leaves, moss and fern'] = (await import('./paint/maple.js')).mapleAtlas(look, Number(params.get('detail')) || 1);
  const riverside = await import('./paint/alder.js');
  made['alder and willow'] = riverside.alderAtlas(look); made['alder bark'] = riverside.alderBark(look);
  const spires = await import('./paint/spire.js'), { SPIRES } = await import('./plants/spire.js');
  made['sitka spruce'] = spires.spireAtlas(look, SPIRES.spruce); made['slope hemlock'] = spires.spireAtlas(look, SPIRES.slope); made['spruce bark'] = spires.spruceBark(look);
  made['apple blossom and leaves'] = (await import('./paint/apple.js')).appleAtlas(look, Number(params.get('detail')) || 1);
  const shrubs = await import('./paint/shrubs.js');
  made['shrubs'] = shrubs.shrubAtlas(look); made['lady fern'] = shrubs.ladyFernAtlas(look, Number(params.get('detail')) || 1);
  made['flowers, fungi and lichen'] = (await import('./paint/flowers.js')).flowerAtlas(look);
  const { backdropTextures } = await import('./paint/backdrop.js');
  const far = backdropTextures(look);
  made['far view'] = { canvas: far.canvas }; made['far view: air and light'] = { canvas: far.air }; made['far view: the mountain'] = { canvas: far.peak.canvas };
  window.__paintMs = performance.now() - t0;
  const only = params.get('only');
  for (const [name, { canvas }] of Object.entries(made)) {
    if (only && !only.split(',').some((k) => name.includes(k))) continue;
    const scale = Number(params.get('zoom')) || Math.min(1, 620 / canvas.height);
    canvas.style.cssText = `width:${canvas.width * scale}px;height:${canvas.height * scale}px;outline:1px solid #0006`;
    canvas.title = name;
    sheet.append(canvas);
  }
  window.__forestReady = true;
}

// ?show=map draws a stretch of the layout from above: the tread, every trunk, log and stump at its
// true girth (filled), and how far each plant reaches at the walker's height (outline). Compose a
// scene against this, not against the three checkpoint views.
async function showMap() {
  const THREE_ = THREE, { KINDS, VALLEY_KINDS, HAND_KINDS, RIVER_KINDS, UNDER_KINDS, RECORD } = await import('./world/layout.js');
  const { SHAPE, MEADOW, GLADE, VIEW, CABIN } = await import('./world/land.js');
  // the same layout the page itself would build on this device: the tier's density (or ?density=) changes every count
  detectCaps();
  const { trail, layout } = layOut({ density: forestSettings({ density: num('density') }).density });
  const whole = params.get('walk') === '1';
  const from = num('from') ?? (whole ? 0 : SCENES[0].from - 6), to = num('to') ?? (whole ? trail.length : SCENES[0].to + 6), margin = num('margin') ?? (whole ? 70 : 20);
  document.getElementById('forest').remove();
  document.getElementById('hud').hidden = true;
  const canvas = document.createElement('canvas');
  const W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight;
  canvas.style.cssText = 'position:fixed;inset:0';
  document.body.append(canvas);
  const g = canvas.getContext('2d'), p = new THREE_.Vector3(), t = new THREE_.Vector3();
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let s = from; s <= to; s += 0.5) { trail.sample(s, p, t); minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); }
  minX -= margin; maxX += margin; minZ -= margin; maxZ += margin;
  const k = Math.min(W / (maxX - minX), H / (maxZ - minZ));
  const X = (x) => (x - minX) * k, Z = (z) => (z - minZ) * k;
  g.fillStyle = '#20261f'; g.fillRect(0, 0, W, H);
  // The lie of the land: the river and its cobbles, the creek, the brink of the old terrace, the old clearing,
  // the cedar's wet ground, and the strip the cabin's window looks along. North is up.
  const poly = (points, width, colour, dash = []) => {
    g.beginPath(); points.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z))));
    g.lineWidth = width; g.strokeStyle = colour; g.lineCap = g.lineJoin = 'round'; g.setLineDash(dash); g.stroke(); g.setLineDash([]);
  };
  const river = SHAPE.RIVER.map(([x, z]) => [x, z]);
  poly(river, (2 * SHAPE.HALF + 9) * k, '#4b4a40');                   // cobbles, roughly
  poly(river, 2 * SHAPE.HALF * k, '#3e6470');
  poly(SHAPE.CREEK.map(([x, z]) => [x, z]), Math.max(1.5, 2 * k), '#5b93a3');
  poly(SHAPE.RIM, 2, '#c9b27a', [6, 5]);
  poly([...MEADOW.outline, MEADOW.outline[0]], 1.5, '#7a8f4a');
  g.strokeStyle = '#5b93a3'; g.beginPath(); g.arc(X(GLADE.x), Z(GLADE.z), GLADE.r * k, 0, 6.283); g.stroke();
  for (const side of [-1, 1]) poly([SHAPE.upValley(SHAPE.REACH_FROM, side * VIEW.half), SHAPE.upValley(SHAPE.REACH_TO, side * VIEW.half)], 1, '#e8dcc066', [3, 6]);
  g.fillStyle = '#d9c9a0'; g.fillRect(X(CABIN.x - 3.6), Z(CABIN.z - 2.75), 7.2 * k, 5.5 * k);
  const line = (width, colour) => {
    g.beginPath();
    for (let s = from - 10; s <= to + 10; s += 0.25) { trail.sample(s, p, t); if (s === from - 10) g.moveTo(X(p.x), Z(p.z)); else g.lineTo(X(p.x), Z(p.z)); }
    g.lineWidth = width * k; g.strokeStyle = colour; g.lineCap = 'round'; g.stroke();
  };
  line(2.0, '#2c3a2b');                                   // a metre either side: the least any solid keeps clear
  line(1.1, '#6d5a44');                                   // the bare tread
  g.font = '11px system-ui'; g.textBaseline = 'middle';
  const every = whole ? 25 : 5;
  for (let s = Math.ceil(from / every) * every; s <= to; s += every) {
    trail.sample(s, p, t);
    g.fillStyle = '#e8dcc0'; g.beginPath(); g.arc(X(p.x), Z(p.z), 2, 0, 6.283); g.fill();
    g.fillText(`${s}`, X(p.x - t.z * -1.6) - 6, Z(p.z + t.x * -1.6));
  }
  if (whole) {
    g.font = 'bold 12px system-ui';
    for (const [name, s] of Object.entries(trail.at)) { trail.sample(s, p, t); g.fillStyle = '#ffd98a'; g.fillText(name, X(p.x) + 7, Z(p.z) - 9); }
    g.font = '11px system-ui';
  }
  const paint = { giant: '#8a5a3c', mature: '#a08468', spruce: '#4f8f7a', slopes: '#3f9fa8', cedar: '#c0563a', maple: '#c9e06a', alder: '#e6e2d2', willow: '#9fc7a0', pole: '#7f9a4a', snag: '#b9b3a6', log: '#c9a56b', drift: '#f0e6cf', shelter: '#d7b98a', cabin: '#e0a35c', apple: '#f5c8d8', stump: '#d98a4a', sapling: '#57b56a', fern: '#2f6b3a', sorrel: '#3d5a34', seedling: '#86c98f',
    salmon: '#e85aa8', elder: '#f2ecc0', club: '#b7d94a', ladyfern: '#5fd0a0', bracken: '#c8b040', carpet: '#ffffff', trillium: '#ff9ad0' };
  const cover = params.get('cover') === '1';
  for (const kind of [...KINDS, ...VALLEY_KINDS, ...HAND_KINDS, ...RIVER_KINDS, ...UNDER_KINDS.filter((k) => !k.more)].reverse()) {
    const data = layout[kind.name];
    if (!data || (!cover && !kind.solid && !kind.trees)) continue;
    for (let o = 0; o < data.length; o += RECORD) {
      const x = data[o], z = data[o + 2], yaw = data[o + 3], scale = data[o + 4];
      if (x < minX || x > maxX || z < minZ || z > maxZ) continue;
      g.strokeStyle = g.fillStyle = paint[kind.name];
      if (kind.half) {
        const dx = Math.cos(yaw) * kind.half * scale, dz = -Math.sin(yaw) * kind.half * scale;
        g.lineCap = 'round';
        g.globalAlpha = 0.28; g.lineWidth = 2 * kind.body * scale * k; g.beginPath(); g.moveTo(X(x - dx), Z(z - dz)); g.lineTo(X(x + dx), Z(z + dz)); g.stroke();
        g.globalAlpha = 1; g.lineWidth = 2 * kind.solid * scale * k; g.beginPath(); g.moveTo(X(x - dx), Z(z - dz)); g.lineTo(X(x + dx), Z(z + dz)); g.stroke();
        if (o / RECORD < (layout.composed[kind.name] || 0)) {        // placed by hand: a white spine, its butt marked
          g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(x - dx), Z(z - dz)); g.lineTo(X(x + dx), Z(z + dz)); g.stroke();
          g.fillStyle = '#ffffff'; g.beginPath(); g.arc(X(x - dx), Z(z - dz), 3, 0, 6.283); g.fill();
        }
        continue;
      }
      g.globalAlpha = 1; g.beginPath(); g.arc(X(x), Z(z), Math.max(1.2, (kind.solid || 0.08) * scale * k), 0, 6.283); g.fill();
      if (o / RECORD < (layout.composed[kind.name] || 0)) {          // placed by hand: ringed in white
        g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.beginPath(); g.arc(X(x), Z(z), Math.max(3.5, (kind.solid || 0.08) * scale * k + 2), 0, 6.283); g.stroke();
        g.strokeStyle = paint[kind.name];
      }
      if (kind.body * scale > (kind.solid || 0) * scale + 0.2 && (kind.trees || kind.solid)) {
        g.globalAlpha = 0.45; g.lineWidth = 1; g.beginPath(); g.arc(X(x), Z(z), kind.body * scale * k, 0, 6.283); g.stroke();
      }
    }
  }
  g.globalAlpha = 1;
  let y = 16;
  for (const [name, colour] of Object.entries(paint)) {
    if (!cover && ['fern', 'sorrel', 'seedling'].includes(name)) continue;
    g.fillStyle = colour; g.fillRect(12, y - 5, 10, 10); g.fillStyle = '#e8dcc0'; g.fillText(name, 28, y); y += 16;
  }
  g.fillStyle = '#e8dcc0'; g.fillText(`filled: girth    outline: reach at the walker's height    white: placed by hand    walker's right is + side    ${(1 / k * 100).toFixed(1)} m per 100 px`, 12, H - 14);
  window.__forestReady = true;
}

// Whatever stops the page from starting, or a frame from being drawn, is shown on it, left where the
// capture tools look (window.__forestError) and logged as an error, which they also fail on.
function failed(error) {
  window.__forestError = String((error && error.stack) || error);
  const hud = document.getElementById('hud');
  if (hud) { hud.hidden = false; hud.textContent = window.__forestError; }
  console.error(error);
}
try {
  // the texture sheet and the map are async: a failure in either has to be caught here, or it leaves no message on the page
  if (params.get('show') === 'textures') showTextures().catch(failed);
  else if (params.get('show') === 'map') showMap().catch(failed);
  else if (params.get('show') === 'bird') import('./life/studio.js').then((studio) => studio.showBird(params)).catch(failed);
  else start();
} catch (error) {
  failed(error);
}
