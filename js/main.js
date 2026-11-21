import * as THREE from 'three';
import { buildRoom } from './room.js';
import { buildDeskObjects } from './deskObjects.js';
import { lerp, clamp, smoothstep, PROXY_LAYER, hitProxy } from './utils.js';
import { buildComputer } from './computer.js';
import { buildLighting } from './lighting.js';
import { buildPostProcessing } from './post.js';
import { detectCaps } from './caps.js';
import { currentSolarState } from './solar.js';
import { buildBookReader } from './bookReader.js';

// ---------- placeholder content ----------
const POSTS = [
  { title: 'On counting things that refuse to be counted', date: 'placeholder', excerpt: 'A short note on a problem that wouldn’t leave me alone.' },
  { title: 'A morning with the wood ducks', date: 'placeholder', excerpt: 'What the pond taught me before my 9am.' },
  { title: 'Why I keep a paper notebook', date: 'placeholder', excerpt: 'Friction, on purpose.' },
];
const PROJECTS = [
  { name: 'Project One', desc: 'Short placeholder description of what it does.', tag: 'math · tooling' },
  { name: 'Project Two', desc: 'Short placeholder description of what it does.', tag: 'web · visualization' },
  { name: 'Project Three', desc: 'Short placeholder description of what it does.', tag: 'research' },
  { name: 'Project Four', desc: 'Short placeholder description of what it does.', tag: 'for fun' },
];
const LINKS = [
  { label: 'Email', handle: 'kv0980@princeton.edu' },
  { label: 'GitHub', handle: '@handle' },
  { label: 'Twitter / X', handle: '@handle' },
  { label: 'LinkedIn', handle: '/in/handle' },
  { label: 'eBird', handle: 'profile' },
];

function injectContent() {
  const blog = document.getElementById('blog-list');
  if (blog) blog.innerHTML = POSTS.map(p => `
    <a class="card" href="#" onclick="return false">
      <div class="c-top"><div class="c-title">${p.title}</div><div class="c-date">${p.date}</div></div>
      <div class="c-ex">${p.excerpt}</div></a>`).join('');
  const grid = document.getElementById('projects-grid');
  if (grid) grid.innerHTML = PROJECTS.map(p => `
    <a class="card" href="#" onclick="return false">
      <div class="c-title">${p.name}</div><div class="c-ex">${p.desc}</div><div class="c-tag">${p.tag}</div></a>`).join('');
  const links = document.getElementById('links-list');
  if (links) links.innerHTML = LINKS.map(l => `
    <a class="card linkrow" href="#" onclick="return false">
      <span class="l-label">${l.label}</span><span class="l-handle">${l.handle} →</span></a>`).join('');
}

let renderer, scene, camera, raycaster, pointer;
const clock = new THREE.Clock();
let room, deskObjects, lighting, post;
// What is beyond the window (js/outside.js, where the forest joins the cabin). Null until it has loaded, and
// for good if it does not: the window then keeps its flat sky colour.
let outside = null;
let outsideReady = false, windowProxy = null;
let interactives = [];
const pickHits = [];
let hovered = null;
let cfg;

// Shadow refresh bookkeeping (Phase 2a): a frame counter for the tier-driven
// cadence and a snapshot of which late GLBs have loaded (refresh once each pops in).
let _shadowFrame = 0;
const _shadowAssets = { cabin: false, lamp: false, macbook: false };

// Everything that is "the room". One group, so a future view from outside the
// cabin can hide the whole interior with a single visibility toggle.
let roomStuff;

// camera state machine
const CAM = {
  // seated first-person view: sitting at the room-side of the desk, eyes ~ desk
  // height, looking down the desk toward the bookshelf on the left wall; the
  // square window on the back wall falls to the right of frame.
  // Iter 20: the eye dollied from x -1.2 to -1.67 — 15% of the eye→desk-centre
  // distance — so the desk fills more of the frame. The up/down reveals still
  // compose from the old vantage: LOOK.recedeX eases the eye back before they
  // lift/pitch (see updateCamera).
  room: { pos: new THREE.Vector3(-1.67, 3.1, -0.28), look: new THREE.Vector3(-4.76, 3.0, -0.28), fov: 50 },
  // filled in at runtime from the MacBook screen anchor (see enterComputer)
  computer: { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 30 },
  // filled in from the procedural open-book spread after its last page settles
  book: { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 33 },
  // standing at the window, looking out along the valley (20 degrees west of north, the room's -z being north),
  // a little down: 1.6 units (0.6 m) back from the opening, at its middle's height. The look point is near, so
  // the move from the desk does not swing (the eye and the look are each eased in a straight line).
  window: { pos: new THREE.Vector3(-2.74, 4.11, -0.6), look: new THREE.Vector3(-3.424, 4.0, -2.48), fov: 50 },
};
// (outdoors the room is neither moved nor drawn; the pose is the window's, for what reads CAM by state)
CAM.outside = CAM.window;
let camState = 'room';
let camLook = new THREE.Vector3().copy(CAM.room.look);
// scratch vectors for the per-frame applied eye/look (avoids accumulation)
const _eye = new THREE.Vector3();
const _look = new THREE.Vector3();
const _camPosTarget = new THREE.Vector3();   // per-frame lerp target (recede-adjusted)
const _winWorld = new THREE.Vector3();   // window center world→NDC scratch (god-rays)
// mouse-driven look-around (room view only): target = where the cursor wants
// the camera, cur = smoothed value applied each frame. vertical: -1 up / +1
// down, side: -1 left / +1 right.
const camTarget = { vertical: 0, side: 0 };
const camOffset = { vertical: 0, side: 0 };
// Hysteresis state: once engaged, the cursor must cross the matching semantic
// exit line before that pan releases.
const camEngaged = { vertical: 0, side: 0 };
const LOOK = {
  // Edge thresholds (fraction of viewport). Vertical release lines match the
  // settled views: below the raised bookshelf, or above the pitched-down desk.
  upEnter: 0.12, upExit: 0.64,
  downEnter: 0.88, downExit: 0.42,
  sideEnterR: 0.88, sideExitR: 0.72,
  sideEnterL: 0.12, sideExitL: 0.28,
  // limits at full deflection. UP restores the original lift; DOWN is a true
  // 30° pitch around the fixed eye; SIDE is a true 15° yaw.
  upLook: 0.72, upPos: 0.10,
  downDeg: 30,
  // The hearth/rug occupy the far +z corner revealed from the left edge. Keep
  // the established 15° window-side turn, but give that fireside reveal enough
  // yaw to compose the new floor accents without moving the default camera.
  sideDegLeft: 28, sideDegRight: 15, sideSign: 1,
  // Iter 20 fluid recede: the up-lift and down-pitch were framed from the old,
  // further eye. Before either reveal develops, the eye eases back +x by
  // recedeX (returning to the pre-dolly vantage); the recede saturates by
  // recedeBy of full deflection so it reads as "back first, then up/down"
  // within one continuous motion.
  recedeX: 0.47, recedeBy: 0.6,
};
// enter/exit transition driver
const trans = { active: false, t0: 0, dur: 1500, from: null, to: 'room', startPos: new THREE.Vector3(), startLook: new THREE.Vector3(), startFov: 41, phase: null, kind: null, onDone: null };
// MacBook "computer screen" mode: while shown, the 3D render loop pauses.
let computerUI = null, computerMode = false, computerShown = false;
let bookReader = null, bookMode = false, bookShown = false, bookClosing = false;
let bookSequence = 0;
const _hoverWorld = new THREE.Vector3();

function init() {
  // Capability tier FIRST — every downstream module (renderer DPR, shadow sizes,
  // PMREM cadence, post samples) reads window.__caps, so it must exist before any
  // of them are configured. Force with __FORCE_TIER / localStorage('forceTier').
  const caps = detectCaps();

  const canvas = document.getElementById('scene');
  const W = window.innerWidth || 1280, H = window.innerHeight || 720;

  // logarithmicDepthBuffer is OFF (2026 post-processing pass). GTAO + DOF read a
  // STANDARD perspective depth buffer; a logarithmic one would break their depth
  // reconstruction (the prepass writes log depth, the AO/Bokeh shaders assume
  // linear). AA comes from SMAA in the composer, not MSAA. The canvas itself is only
  // ever drawn to by a full-screen triangle (the composer's last pass; outdoors, the
  // forest's final pass), so it is not multisampled and has no depth or stencil
  // buffer of its own: with `antialias: true` Chrome gave it four samples, filled
  // and resolved every frame for a triangle with no edge in view (2026-11-19).
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, depth: false, stencil: false, logarithmicDepthBuffer: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));   // PERF: cap DPR 2.0→1.5 ≈ -44% fragments
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // PERF: scene + lights are static, so don't re-render shadow maps every frame
  // (sun + window key + lamp = three single perspective passes — still far
  // cheaper than one PointLight's 6-face cube map). They are refreshed on
  // demand during asset load, then frozen —
  // see the priming block in animate().
  renderer.shadowMap.autoUpdate = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // PHYSICALLY-CORRECT LIGHTING. Explicitly opt into physical light units so
  // every light obeys real radiometric falloff (inverse-square via decay=2 on
  // the point/spot lights, intrinsic on the RectAreaLight). This is what makes
  // the lamp/laptop read as motivated sources whose pools fade with distance
  // instead of flat game-style fills.
  renderer.useLegacyLights = false;
  // DAYLIGHT TONE MAPPING — AgX (2026 Scandinavian redesign). A neutral, filmic
  // response that desaturates highlights gracefully and keeps material colour
  // honest (walnut stays walnut, the window stays white) instead of ACES's warm,
  // saturated shoulder. This is the calm museum/Apple read the redesign is after:
  // soft daylight, low chroma, open shadows. Exposure ~1.0 — the look is shaped by
  // soft window light + rich indirect fill, not by over/under-driving the curve.
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.0;

  scene = new THREE.Scene();
  // near pushed to 0.5 (nothing in the room or any camera pose sits closer than
  // ~0.5) — without the logarithmic depth buffer this larger near is the cheapest
  // way to keep depth precision. far = 460 is inherited from an earlier exterior
  // sky dome; GTAO reads this projection, so change it only as a measured step.
  camera = new THREE.PerspectiveCamera(CAM.room.fov, W / H, 0.5, 460);
  camera.position.copy(CAM.room.pos);

  cfg = currentSolarState();
  scene.background = new THREE.Color(cfg.sky[1]);   // flat sky behind the window
  const tl = document.getElementById('time-label');
  if (tl) tl.textContent = cfg.label;

  // ---------- world ----------
  roomStuff = new THREE.Group();
  scene.add(roomStuff);

  room = buildRoom(cfg);
  roomStuff.add(room.group);
  // Keep the room's stable array reference: the GLB loads asynchronously and
  // appends all 17 real book meshes after the rest of init has completed.
  interactives = room.interactives;

  deskObjects = buildDeskObjects(room.desk, { projects: PROJECTS });
  roomStuff.add(deskObjects.group);
  interactives.push(...deskObjects.interactives);

  // ---------- lighting ----------
  // See lighting.js for the full architecture (sun / hemi / shadowed window key / soft fill / IBL).
  // The desk lamp's own SpotLight (deskObjects.js) and the window woodwork's
  // emissive bounce (room.js) are wired separately, at their respective hosts.
  lighting = buildLighting(scene, room, cfg, renderer);
  try { if (typeof window !== 'undefined') window.__lighting = lighting; } catch (e) {}   // debug/tuning handle
  try { if (typeof window !== 'undefined') window.__deskObjects = deskObjects; } catch (e) {}   // bake-script / debug handle

  // The lamp starts off by day and on at night, then remains click-toggleable.
  deskObjects.setLampDefault(cfg.mode === 'night');

  raycaster = new THREE.Raycaster();
  // Pick proxies live on PROXY_LAYER (never rendered by the camera / post passes).
  // Enable that layer here so raycasting still hits them; layer 0 stays enabled
  // for any non-proxy interactive meshes.
  raycaster.layers.enable(PROXY_LAYER);
  pointer = new THREE.Vector2(-2, -2);

  bindEvents();
  injectContent();

  bookReader = buildBookReader({ onLeave: exitBook });

  // MacBook on-screen OS — folders/files driven by the same content arrays.
  computerUI = buildComputer({
    projects: PROJECTS.map(p => ({ name: p.name, meta: p.tag, body: p.desc })),
    onLeave: exitComputer,
  });

  // ---------- post-processing ----------
  // EffectComposer: GTAO contact shadows, subtle DOF, window/screen bloom, AgX
  // OutputPass, SMAA, and a vignette+grain grade. See post.js. RenderPass holds
  // live references to scene/camera, so the async GLBs that pop in later are
  // picked up automatically.
  post = buildPostProcessing(renderer, scene, camera);
  try { if (typeof window !== 'undefined') window.__post = post; } catch (e) {}   // live-tuning handle

  window.__sceneReady = true;
  setTimeout(() => { const l = document.getElementById('loader'); if (l) l.classList.add('hide'); }, 350);
  animate();

  // The one import that reaches towards the forest. The room does not wait for it and does not need it.
  // (`join`: whether the forest is brought into the window; a page asked for with ?join=0 keeps the flat sky. It is
  // built a few milliseconds at a time between the room's frames, and only on the high tier: see js/outside.js)
  bindOutside();
  import('./outside.js').then((module) => {
    outside = module.createOutside({ renderer, scene, camera, post, glass: room.glass, join: !/[?&]join=0(&|$)/.test(window.location.search),
      onReady: outsideArrived, onFail: outsideLost });
    try { window.__outside = outside; } catch (e) {}
  }).catch((error) => { try { window.__outsideError = String((error && error.stack) || error); } catch (e) {} });
}

function bindEvents() {
  window.addEventListener('resize', onResize);
  const canvas = renderer.domElement;
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('click', onClick);
  // With the cursor gone there is nothing to hold a look engaged, so recenter
  // every axis. Vertical must reset here too: leaving through the top/bottom
  // edge never crosses the bookshelf/desk release line, and without this the
  // pitch would stay latched the whole time the cursor is outside the window.
  canvas.addEventListener('pointerleave', () => {
    camTarget.vertical = 0;
    camEngaged.vertical = 0;
    camTarget.side = 0;
    camEngaged.side = 0;
    setHover(null);
  });

  document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closePanel));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (bookMode) exitBook();
    else if (computerMode) exitComputer();
    else if (isPanelOpen()) closePanel();
    else if (camState === 'window' && !trans.active && !veiled) leaveWindow();
    // (outdoors Escape is the forest's: it lets go of an animal the view is held on, and never takes the visitor in)
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (post) post.setSize(window.innerWidth, window.innerHeight);
}
function onPointerMove(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

  // ---- edge-triggered look-around (room view only) ----
  // Normalized cursor position: 0..1 across the window.
  const nx = e.clientX / window.innerWidth;     // 0 = left, 1 = right
  const ny = e.clientY / window.innerHeight;    // 0 = top, 1 = bottom

  // Discrete engagement: once the cursor crosses into an edge band the pan
  // target snaps to its full limit; to release, the cursor must travel past its
  // semantic exit line (hysteresis), so the view doesn't flicker around the
  // trigger. The camera still EASES between the target states in updateCamera.
  // Vertical modes are mutually exclusive. Once UP/DOWN is engaged, it stays
  // latched until the cursor crosses the bookshelf/desk line respectively.
  if (ny < LOOK.upEnter) camEngaged.vertical = -1;
  else if (ny > LOOK.downEnter) camEngaged.vertical = 1;
  else if (camEngaged.vertical < 0 && ny > LOOK.upExit) camEngaged.vertical = 0;
  else if (camEngaged.vertical > 0 && ny < LOOK.downExit) camEngaged.vertical = 0;

  // RIGHT edge -> pan toward window (+1); LEFT edge -> pan away (-1).
  if (nx > LOOK.sideEnterR) camEngaged.side = 1;
  else if (nx < LOOK.sideEnterL) camEngaged.side = -1;
  else if (nx > LOOK.sideExitL && nx < LOOK.sideExitR) camEngaged.side = 0;

  // Snap the target to the full limit (or zero) — no gradual scaling.
  camTarget.vertical = camEngaged.vertical;
  camTarget.side = camEngaged.side;   // already -1 / 0 / +1
}

function pick() {
  if (camState !== 'room' || trans.active || isPanelOpen() || computerMode || bookMode) return null;
  raycaster.setFromCamera(pointer, camera);
  pickHits.length = 0;
  raycaster.intersectObjects(interactives, false, pickHits);
  return pickHits.length ? pickHits[0].object : null;
}
function onClick() {
  const obj = pick();
  if (!obj) return;
  const a = obj.userData.action;
  if (a === 'computer') enterComputer();        // the laptop opens its screen
  else if (a === 'book') openBook(obj);
  else if (a === 'lamp') {               // the lamp toggles its own light
    deskObjects.toggleLamp();
    renderer.shadowMap.needsUpdate = true;   // refresh shadows now, don't wait for the cadence
    if (hovered === obj) setHover(obj);  // refresh the hover label (on/off text)
  }
  else if (a === 'window') enterWindow();  // the window: stand at it and look out
  else openPanel(a);
}

// ---------- the window, and the way outside (js/outside.js) ----------
// The room's states for it: 'window' (standing at the window, the forest beyond it drawn from the room's own eye)
// and 'outside' (the forest is the whole picture and is walked with its own controls; the room is neither moved
// nor drawn). The way there is a button in the top bar or a click on the window; out of the door is a fade.
const HINTS = { room: 'look around — hover the objects', window: 'the valley, from the window', outside: 'W / S or scroll to walk · drag to look · shift to run' };
function bindOutside() {
  const bar = document.getElementById('outside-bar');
  if (!bar) return;
  bar.addEventListener('click', (e) => {
    const button = e.target.closest('[data-outside]');
    if (!button) return;
    const what = button.dataset.outside;
    if (what === 'look') enterWindow();
    else if (what === 'desk') leaveWindow();
    else if (what === 'out') stepOutside();
    else if (what === 'in') comeInside();
  });
}
// which of the bar's buttons stand in this state (none while the camera is moving, or the veil is down). A visitor at
// the window keeps "Back to the desk" if the forest is lost meanwhile (outsideLost): the bar goes only at the desk.
function showOutsideBar() {
  const bar = document.getElementById('outside-bar');
  if (!bar) return;
  bar.hidden = !outsideReady && camState === 'room';
  const still = !trans.active && !veiled;
  const show = { look: still && outsideReady && camState === 'room', out: still && outsideReady && camState === 'window',
    desk: still && camState === 'window', in: still && camState === 'outside' };
  for (const button of bar.querySelectorAll('[data-outside]')) button.hidden = !show[button.dataset.outside];
  const hint = document.querySelector('#topbar .hint');
  if (hint) hint.textContent = HINTS[camState] || HINTS.room;
}
function outsideArrived() {
  outsideReady = true;
  // the window takes a click: a pick proxy over its opening (PROXY_LAYER, never drawn)
  if (!windowProxy && room && room.win) {
    windowProxy = hitProxy(2.6, 2.6, 0.2, 'window', null, 'Look outside', 'green');
    windowProxy.position.set(room.win.center.x, room.win.center.y, room.win.z + 0.12);
    roomStuff.add(windowProxy);
    interactives.push(windowProxy);
  }
  showOutsideBar();
}
// The forest is gone (js/outside.js says why in window.__outsideError): the window has its flat sky again, and a
// visitor who was outside is back at the window at once.
function outsideLost() {
  outsideReady = false;
  if (windowProxy) {
    const i = interactives.indexOf(windowProxy);
    if (i >= 0) interactives.splice(i, 1);
    roomStuff.remove(windowProxy);
    windowProxy = null;
  }
  if (camState === 'outside') arriveIndoors();
  setVeil(false);
  showOutsideBar();
}
function enterWindow() {
  if (!outsideReady || camState !== 'room' || trans.active || veiled || computerMode || bookMode || isPanelOpen()) return;
  setHover(null);
  camTarget.vertical = 0; camTarget.side = 0; camEngaged.vertical = 0; camEngaged.side = 0;
  trans.active = true; trans.phase = 'enter'; trans.kind = 'window';
  trans.t0 = performance.now(); trans.dur = 1500;
  trans.startPos.copy(camera.position); trans.startLook.copy(camLook); trans.startFov = camera.fov;
  trans.to = 'window';
  trans.onDone = () => { camState = 'window'; showOutsideBar(); };
  showOutsideBar();
}
function leaveWindow() {
  if (camState !== 'window' || trans.active || veiled) return;          // (not while the veil is down for the door)
  trans.active = true; trans.phase = 'enter'; trans.kind = 'window-exit';
  trans.t0 = performance.now(); trans.dur = 1300;
  trans.startPos.copy(camera.position); trans.startLook.copy(camLook); trans.startFov = camera.fov;
  trans.to = 'room';
  trans.onDone = () => { camState = 'room'; showOutsideBar(); };
  showOutsideBar();
}
// The veil the page fades through at the door. Resolves when it has finished fading.
let veiled = false;
function setVeil(on) {
  veiled = on;
  const veil = document.getElementById('veil');
  if (veil) veil.classList.toggle('on', on);
  showOutsideBar();
  return new Promise((resolve) => setTimeout(resolve, 480));
}
const frames = (n) => new Promise((resolve) => { const step = () => (n-- <= 0 ? resolve() : requestAnimationFrame(step)); requestAnimationFrame(step); });
function stepOutside() {
  if (camState !== 'window' || trans.active || veiled || !outside || !outsideReady) return;
  setHover(null);
  setVeil(true).then(() => {
    if (camState !== 'window' || trans.active || !outside.goOut()) return setVeil(false);
    camState = 'outside';
    document.body.classList.add('outdoors');
    showOutsideBar();
    // (two frames under the veil: the forest's own finished picture is drawn for the first time here)
    return frames(2).then(() => setVeil(false));
  });
}
function comeInside() {
  if (camState !== 'outside' || veiled) return;
  setVeil(true).then(() => {
    if (outside) outside.comeIn();
    arriveIndoors();
    return frames(2).then(() => setVeil(false));
  });
}
// Back at the window from outside: the room as it was left, and its shadows drawn again (they were not, outdoors).
function arriveIndoors() {
  camState = 'window';
  document.body.classList.remove('outdoors');
  camera.position.copy(CAM.window.pos);
  camLook.copy(CAM.window.look);
  camera.lookAt(camLook);
  camera.fov = CAM.window.fov;
  camera.updateProjectionMatrix();
  camTarget.vertical = 0; camTarget.side = 0; camEngaged.vertical = 0; camEngaged.side = 0;
  renderer.shadowMap.needsUpdate = true;
  showOutsideBar();
}

// ---------- computer (MacBook screen) ----------
function setComputerFade(v) {
  if (computerUI && computerUI.el) computerUI.el.style.opacity = String(v);
}
function enterComputer() {
  if (computerMode || trans.active) return;
  const mb = deskObjects.macbook;
  const anchor = (mb && mb.getScreenAnchor && mb.getScreenAnchor()) || {
    center: new THREE.Vector3(-4.35, 2.62, -1.12),
    normal: new THREE.Vector3(0.92, 0.29, 0.26).normalize(),
  };
  computerMode = true;
  setHover(null);

  const D = 0.95;                       // camera ends just in front of the screen
  CAM.computer.pos.copy(anchor.center).addScaledVector(anchor.normal, D);
  CAM.computer.look.copy(anchor.center);
  CAM.computer.fov = 30;

  // overlay starts transparent over the live zoom, then crossfades in
  computerUI.show();
  if (computerUI.el) computerUI.el.style.transition = 'none';
  setComputerFade(0);

  trans.active = true; trans.phase = 'enter'; trans.kind = 'computer';
  trans.t0 = performance.now(); trans.dur = 1300;
  trans.startPos.copy(camera.position);
  trans.startLook.copy(camLook);
  trans.startFov = camera.fov;
  trans.to = 'computer'; trans.onDone = finishComputer;
}
function finishComputer() {
  // fully inside the screen: stop rendering the 3D room to save the GPU
  camState = 'computer';
  computerShown = true;
  setComputerFade(1);
}
function exitComputer() {
  if (!computerMode) return;
  computerShown = false;     // resume rendering — the room eases back into view
  camState = 'room';
  trans.active = false; trans.phase = null; trans.kind = null; trans.onDone = null;
  const ui = computerUI && computerUI.el;
  if (ui) {
    ui.style.transition = 'opacity .5s ease';
    setComputerFade(0);
    setTimeout(() => { computerUI.hide(); ui.style.transition = 'none'; ui.style.opacity = ''; }, 520);
  }
  computerMode = false;
}

// ---------- books (shelf → desk → aged Markdown spread) ----------
function setBookFade(value, interactive = value >= 0.98) {
  if (bookReader) bookReader.setFade(value, interactive);
}

function openBook(object) {
  if (bookMode || trans.active || !room?.books || !bookReader) return;
  const opening = room.books.open(object);
  if (!opening) return;

  bookMode = true;
  bookClosing = false;
  const sequence = ++bookSequence;
  setHover(null);
  camTarget.vertical = 0;
  camTarget.side = 0;
  camEngaged.vertical = 0;
  camEngaged.side = 0;

  // Fetch while the physical volume travels and opens, so the local Markdown
  // is ready before the camera begins its final move into the paper.
  const manuscriptReady = bookReader.load(opening.book);
  Promise.all([opening.finished, manuscriptReady]).then(([result]) => {
    if (sequence !== bookSequence || !bookMode || result?.cancelled) return;
    enterBookView();
  });
}

function enterBookView() {
  const anchor = room?.books?.getCameraAnchor();
  if (!anchor || !bookReader || !bookMode) return;
  CAM.book.pos.copy(anchor.position);
  CAM.book.look.copy(anchor.center);
  CAM.book.fov = 33;

  bookReader.show();
  if (bookReader.el) bookReader.el.style.transition = 'none';
  setBookFade(0, false);

  trans.active = true;
  trans.phase = 'enter';
  trans.kind = 'book';
  trans.t0 = performance.now();
  trans.dur = 1450;
  trans.startPos.copy(camera.position);
  trans.startLook.copy(camLook);
  trans.startFov = camera.fov;
  trans.to = 'book';
  trans.onDone = finishBookView;
}

function finishBookView() {
  camState = 'book';
  bookShown = true;
  setBookFade(1, true);
}

function flyCameraHome() {
  if (camState === 'room' && !(trans.active && trans.kind === 'book')) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    trans.active = true;
    trans.phase = 'enter';
    trans.kind = 'book-exit';
    trans.t0 = performance.now();
    trans.dur = 1200;
    trans.startPos.copy(camera.position);
    trans.startLook.copy(camLook);
    trans.startFov = camera.fov;
    trans.to = 'room';
    trans.onDone = () => {
      camState = 'room';
      resolve();
    };
  });
}

function exitBook() {
  if (!bookMode || bookClosing) return;
  bookClosing = true;
  ++bookSequence; // invalidate a pending load/open completion
  bookShown = false; // resume the 3D loop before reversing the physical book

  if (bookReader?.el && !bookReader.el.hidden) {
    bookReader.el.style.transition = 'opacity .45s ease';
    setBookFade(0, false);
    setTimeout(() => bookReader?.hide(), 480);
  }

  const cameraHome = flyCameraHome();
  const bookHome = room?.books?.close() || Promise.resolve();
  Promise.all([cameraHome, bookHome]).then(() => {
    bookMode = false;
    bookClosing = false;
    camState = 'room';
    trans.active = false;
    trans.phase = null;
    trans.kind = null;
    trans.onDone = null;
    bookReader?.hide();
  });
}

// ---------- panels ----------
function isPanelOpen() { const o = document.getElementById('overlay'); return o && !o.hidden; }
function openPanel(name) {
  const ov = document.getElementById('overlay'); if (!ov) return;
  ov.hidden = false;
  document.querySelectorAll('.panel').forEach(p => p.hidden = p.dataset.panel !== name);
  setHover(null);
}
function closePanel() { const o = document.getElementById('overlay'); if (o) o.hidden = true; }

// ---------- hover label ----------
function setHover(obj) {
  const changed = obj !== hovered;
  if (changed && room?.books) {
    room.books.setHovered(obj?.userData?.action === 'book' ? obj : null);
  }
  hovered = obj;
  const label = document.getElementById('hover-label');
  if (!label) return;
  if (!obj) { label.hidden = true; renderer.domElement.style.cursor = 'default'; return; }
  // The lamp action text comes from its controller, not a cached proxy label:
  // it always describes the action opposite to the lamp's current state.
  const text = obj.userData.action === 'lamp' && deskObjects
    ? (deskObjects.isLampOn() ? 'Turn off the lamp' : 'Turn on the lamp')
    : obj.userData.label;
  if (label.textContent !== text) label.textContent = text;
  if (changed) {
    label.className = obj.userData.labelClass || '';
    label.hidden = false;
    renderer.domElement.style.cursor = 'pointer';
  }
  const wp = _hoverWorld;
  if (obj.userData.labelPoint) {
    wp.copy(obj.userData.labelPoint);
    obj.localToWorld(wp);
  } else obj.getWorldPosition(wp);
  wp.project(camera);
  label.style.left = ((wp.x * 0.5 + 0.5) * window.innerWidth) + 'px';
  label.style.top = ((-wp.y * 0.5 + 0.5) * window.innerHeight) + 'px';
}

// ---------- loop ----------
function animate() {
  requestAnimationFrame(animate);

  // While a content panel is open (e.g. the résumé PDF viewer) the room is fully
  // covered by the overlay, so skip the 3D update + render entirely. This frees
  // the GPU for smooth native-PDF scrolling and stops the semi-transparent
  // backdrop's blur from being recomputed against a live canvas every frame.
  // The rAF loop stays alive, so rendering resumes the instant the panel closes.
  // Same idea for the MacBook "computer screen": while it is up, the HTML overlay
  // covers everything, so we pause the whole 3D pipeline to save the GPU.
  if (isPanelOpen() || computerShown || bookShown) return;

  const t = clock.getElapsedTime();

  // Live time-of-day. solarState() is pure math (safe every frame). cfg, the sky
  // colour behind the window and the post grade always update; room-side applies
  // stay gated on visibility.
  cfg = currentSolarState();
  if (post) post.applyTime(cfg);                 // AgX exposure / bloom / GTAO / vignette by dayFactor
  // Beyond the window: the forest, once js/outside.js has it (it is laid into the window's opening, and the
  // scene then has no background); until then, and if it never comes, the flat sky colour of the hour.
  if (!(outside && outside.live)) {
    if (scene.background && scene.background.isColor) scene.background.set(cfg.sky[1]);
    else scene.background = new THREE.Color(cfg.sky[1]);
  }
  // Outdoors the forest is the whole picture (js/outside.js), and the room is neither moved nor drawn. If the
  // forest fails there, the visitor is back at the window (outsideLost) and the room is drawn from the next frame.
  if (camState === 'outside') {
    if (!outside || !outside.drawOutdoors(t, cfg)) outsideLost();
    return;
  }
  if (roomStuff.visible) {
    if (lighting) lighting.applyTime(cfg);
    if (room) room.applyTime(cfg);                 // wall-only painted bounce follows daylight
    if (deskObjects) deskObjects.applyTime(cfg);   // lamp ember↔full + screen spill by dayFactor
    room.update(t);
    deskObjects.update(t);
    if (lighting) lighting.update(t);
  }
  // hover (only meaningful in the room)
  const obj = pick();
  if (obj !== hovered) setHover(obj);
  else if (obj) setHover(obj);

  updateCamera();
  camera.updateMatrixWorld();

  // PERF: shadow maps stay frozen (autoUpdate=false); we mark needsUpdate ourselves
  // on a tier-driven frame cadence (caps.shadowUpdateEvery) and whenever a late GLB
  // (cabin/lamp/MacBook) pops in. Sun-frustum refits (lighting.applyTime) and lamp
  // toggles flag needsUpdate at their source. Real-time sun motion is imperceptible,
  // so this infrequent refresh still reads as live (and rises under __timeScale).
  // While the room is hidden the casters are all invisible, so the cadence pauses.
  if (roomStuff.visible) {
    _shadowFrame++;
    const _cabin = !!window.__cabinLoaded, _lamp = !!window.__lampLoaded, _mac = !!window.__macbookLoaded;
    if (_cabin !== _shadowAssets.cabin || _lamp !== _shadowAssets.lamp || _mac !== _shadowAssets.macbook) {
      renderer.shadowMap.needsUpdate = true;
      _shadowAssets.cabin = _cabin; _shadowAssets.lamp = _lamp; _shadowAssets.macbook = _mac;
    }
    // At rest the maps change only as the sun creeps, so the tier's cadence is slow. A shelf book tipping on hover
    // casts too: while one moves the maps are drawn every other frame, as they always were, so its shadow does not step.
    const _every = room?.books?.moving ? 2 : ((window.__caps && window.__caps.shadowUpdateEvery) || 4);
    if (_shadowFrame % _every === 0) renderer.shadowMap.needsUpdate = true;
  }

  if (post) {
    // God-rays: project the window center to screen space and drive the shaft by
    // dayFactor / elevationDeg. onScreen gates to the settled room view (the window
    // in frame, never in the computer or book views), so shafts vanish elsewhere.
    if (post.passes.godray.enabled && room && room.win) {
      const wc = room.win.center;
      _winWorld.set(wc.x, wc.y, room.win.z).project(camera);
      const onScreen = camState === 'room' && !trans.active && !computerMode && !bookMode &&
        _winWorld.z < 1 && Math.abs(_winWorld.x) <= 1.15 && Math.abs(_winWorld.y) <= 1.15;
      post.setGodray(
        _winWorld.x * 0.5 + 0.5, _winWorld.y * 0.5 + 0.5,
        cfg ? cfg.dayFactor : 0, cfg ? cfg.elevationDeg : 0, onScreen,
      );
    }
    if (outside) outside.frame(t, cfg);
    post.render(t);
  }
}

let _restEye = null, _restLook = null;
function updateCamera() {
  if (trans.active && trans.phase === 'enter') {
    const p = clamp((performance.now() - trans.t0) / trans.dur, 0, 1);
    const e = smoothstep(0, 1, p);
    const target = CAM[trans.to];
    camera.position.lerpVectors(trans.startPos, target.pos, e);
    camLook.lerpVectors(trans.startLook, target.look, e);
    camera.lookAt(camLook);
    camera.fov = lerp(trans.startFov, target.fov, e);
    camera.updateProjectionMatrix();
    if (trans.kind === 'computer') setComputerFade(smoothstep(0.40, 1.0, p));
    if (trans.kind === 'book') setBookFade(smoothstep(0.42, 1.0, p), false);
    if (p >= 1) {
      trans.active = false;
      trans.phase = null;
      const cb = trans.onDone;
      trans.onDone = null;
      if (cb) cb();
    }
    return;
  }

  const target = CAM[camState];

  // mouse look-around: only active in the room view; eased back to neutral
  // otherwise. Smoothly chase the cursor-driven target. (Chased BEFORE the
  // position lerp so the recede below reads this frame's deflection.)
  const wantVertical = camState === 'room' ? camTarget.vertical : 0;
  const wantSide = camState === 'room' ? camTarget.side : 0;
  camOffset.vertical += (wantVertical - camOffset.vertical) * 0.08;
  camOffset.side += (wantSide - camOffset.side) * 0.08;
  // An eased value never arrives: the view went on changing in its last decimals for six to eight seconds after
  // every look, and for as long the room's occlusion could not be kept (post.js). Within a hundred-thousandth, which
  // is a few thousandths of a pixel, each is where it was going.
  if (Math.abs(wantVertical - camOffset.vertical) < 1e-5) camOffset.vertical = wantVertical;
  if (Math.abs(wantSide - camOffset.side) < 1e-5) camOffset.side = wantSide;

  // RECEDE (iter 20): the default eye sits closer to the desk, but both
  // vertical reveals were composed from the pre-dolly vantage. While either
  // reveal engages, the eye's lerp TARGET glides back +x to that old vantage —
  // saturating by recedeBy of full deflection, so the camera reads as easing
  // back first, then lifting/pitching, in one continuous curve. Offsetting the
  // target (not the applied eye) matters: the applied eye is written back into
  // camera.position each frame, so a per-frame eye offset would compound.
  _camPosTarget.copy(target.pos);
  if (camState === 'room') {
    _camPosTarget.x += LOOK.recedeX * smoothstep(0, LOOK.recedeBy, Math.abs(camOffset.vertical));
  }
  camera.position.lerp(_camPosTarget, 0.07);
  camLook.lerp(target.look, 0.07);
  if (camera.position.distanceToSquared(_camPosTarget) < 1e-10) camera.position.copy(_camPosTarget);
  if (camLook.distanceToSquared(target.look) < 1e-10) camLook.copy(target.look);

  // Compose all look-around transforms in shared scratch vectors, then write
  // the final eye/look to the camera once at the end of the frame.
  const eye = _eye.copy(camera.position);
  const look = _look.copy(camLook);

  if (camState === 'room') {
    const offUp = Math.max(0, -camOffset.vertical);
    const offDown = Math.max(0, camOffset.vertical);
    const offSide = camOffset.side;

    // UP: restore the original camera lift, revealing the top of the bookshelf.
    eye.y += offUp * LOOK.upPos;
    look.y += offUp * LOOK.upLook;

    // SIDE: yaw the view direction around the fixed eye by up to ±sideDeg.
    const sideDeg = offSide < 0 ? LOOK.sideDegLeft : LOOK.sideDegRight;
    const yaw = LOOK.sideSign * offSide * (sideDeg * Math.PI / 180);
    const dx0 = look.x - eye.x, dy0 = look.y - eye.y, dz0 = look.z - eye.z;
    const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
    const dxYaw = dx0 * cosYaw - dz0 * sinYaw;
    const dzYaw = dx0 * sinYaw + dz0 * cosYaw;

    // DOWN: pitch the yawed view direction around its local right axis while
    // preserving both the fixed eye and the original eye-to-look distance.
    const horizontal = Math.hypot(dxYaw, dzYaw);
    const distance = Math.hypot(horizontal, dy0);
    const pitch = offDown * (LOOK.downDeg * Math.PI / 180);
    const elevation = Math.atan2(dy0, horizontal) - pitch;
    const pitchedHorizontal = distance * Math.cos(elevation);
    const horizontalScale = horizontal > 0 ? pitchedHorizontal / horizontal : 0;
    look.x = eye.x + dxYaw * horizontalScale;
    look.y = eye.y + distance * Math.sin(elevation);
    look.z = eye.z + dzYaw * horizontalScale;
  }

  // The lifted eye is written back into the camera and eased again each frame, so a look up settles on a point it
  // only ever closes on in its last decimals, for hundreds of frames. Once a frame would move the eye and its aim by
  // less than a millionth of a unit, it is where it was: the view then stands still to the bit, and what is kept
  // for a still view (the room's occlusion in post.js, the window's forest in outside.js) is kept.
  if (_restEye && eye.distanceToSquared(_restEye) < 1e-12 && look.distanceToSquared(_restLook) < 1e-12) { eye.copy(_restEye); look.copy(_restLook); }
  else { (_restEye || (_restEye = new THREE.Vector3())).copy(eye); (_restLook || (_restLook = new THREE.Vector3())).copy(look); }
  camera.position.copy(eye);
  camera.lookAt(look);
  camera.fov = lerp(camera.fov, target.fov, 0.08);
  if (Math.abs(camera.fov - target.fov) < 1e-4) camera.fov = target.fov;
  camera.updateProjectionMatrix();
}

// ---------- WebGL probe + fatal ----------
function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
    return !!gl && !(gl.isContextLost && gl.isContextLost());
  } catch (e) { return false; }
}
function showFatal(title, msg, detail) {
  const loader = document.getElementById('loader'); if (loader) loader.classList.add('hide');
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('fatal-title', title); set('fatal-msg', msg); if (detail) set('fatal-detail', detail);
  const f = document.getElementById('fatal'); if (f) f.hidden = false;
}

// ---------- boot ----------
(function boot() {
  if (document.readyState !== 'complete') return setTimeout(boot, 50);
  if (!webglAvailable()) {
    return showFatal('WebGL unavailable', 'This scene needs WebGL, which your browser/device isn’t providing.', 'Try a current Chrome, Firefox, Edge, or Safari with hardware acceleration enabled.');
  }
  try { init(); }
  catch (e) { showFatal('Couldn’t start the scene', 'Something went wrong while building the 3D room.', (e && e.stack) || String(e)); }
})();
