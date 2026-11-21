// outside.js — what is beyond the cabin's window.
//
// The join between the cabin and the forest (js/forest/) is made here and nowhere else. main.js loads this
// file with one dynamic import once the room is up; if that fails, or anything here throws, the window keeps
// the flat sky colour it has always had, the page says nothing, and window.__outsideError says why.
//
// How the window is drawn. The room clears to nothing where it is open to the outside. A pass right after
// the room is drawn keeps the alpha that left (the passes that follow change it), and a second lays what is
// outside in behind the room, into the same buffer, while it is still light and not yet a picture: before the
// room's ambient occlusion, its bloom and its tone mapping, which is where the sky was when it was the scene's
// background. What is outside is the forest's own frame, drawn from the very eye the room is seen from, or,
// while there is no forest yet, the hour's flat sky colour. A third pass, after the room's tone mapping, puts
// the forest's own grade back on what is seen through the opening, in place of the room's. post.js is not
// touched: the three passes are put into its composer from here.
//
// (It was first laid in after the tone mapping, as a finished picture. The window's pane is a sheet of glass
// drawn at 0.06, and what it mirrors is bright: the curve of the pane's light and the curve of the sky's,
// added, are not the curve of their sum, and the window was white at noon. Found by drawing the room both
// ways in one page load, which is what `check` below is for.)

import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const FS_VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// The window's opening in the room's own units (assets/cabin.glb's WindowJamb), from the wall's inner face to its
// outer one: when none of it is in the room's view, nothing outside is drawn.
const OPENING = new THREE.Box3(new THREE.Vector3(-4.1, 2.75, -2.29), new THREE.Vector3(-1.38, 5.47, -2.11));
// What of the forest is left out of the window's picture: its own cabin's walls and window, which are the room's.
const HIDDEN = ['cabin'];
const FADE = 1.6;               // seconds for the forest to come up in the window once it is there
const BUDGET = 6;               // milliseconds of the forest's building to each frame of the room's while it grows
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

// Where the room is open to the outside: the alpha its own drawing left. Opaque things write 1; the cleared
// background 0; the window's pane, a sheet of glass drawn at 0.06, leaves 0.06. It is copied here because the
// room's bloom, further down the chain, adds into alpha, and because what glows in the room is added into it
// too: kept in eight bits, more than whole is whole.
class OpeningPass extends Pass {
  constructor() {
    super();
    this.needsSwap = false;
    this.target = new THREE.WebGLRenderTarget(1, 1, { format: THREE.RedFormat, type: THREE.UnsignedByteType, depthBuffer: false });
    this.quad = new FullScreenQuad(new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: FS_VERT,
      fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse; varying vec2 vUv;
        void main() { gl_FragColor = vec4(texture2D(tDiffuse, vUv).a, 0.0, 0.0, 1.0); }`,
      depthTest: false, depthWrite: false, toneMapped: false,
    }));
  }
  setSize(width, height) { this.target.setSize(width, height); }
  render(renderer, writeBuffer, readBuffer) {
    this.quad.material.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.setRenderTarget(this.target);
    this.quad.render(renderer);
    if (this.ask) this.count(renderer, writeBuffer);
  }
  // Is anything open at all? Asked of the GPU on the very texels the passes after this one read: a second triangle
  // that writes nothing and throws away every pixel that is closed, drawn inside a query for "did any sample pass".
  // The answer comes a frame or two later (`answer()`): true, false, or null while there is none. `asked` is whatever
  // the caller hands in to know the answer by (the view it was asked under).
  count(renderer, scratch) {
    const gl = renderer.getContext();
    if (this.pending || !gl.createQuery) return;
    if (!this.probe) {
      this.probe = new FullScreenQuad(new THREE.ShaderMaterial({
        uniforms: { tOpen: { value: this.target.texture } },
        vertexShader: FS_VERT,
        fragmentShader: /* glsl */`
          uniform sampler2D tOpen; varying vec2 vUv;
          void main() { if (texture2D(tOpen, vUv).r >= 0.999) discard; gl_FragColor = vec4(0.0); }`,
        depthTest: false, depthWrite: false, colorWrite: false, toneMapped: false,
      }));
    }
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    const query = gl.createQuery();
    try {
      renderer.setRenderTarget(scratch);
      gl.beginQuery(gl.ANY_SAMPLES_PASSED, query);
      this.probe.render(renderer);
    } finally {
      gl.endQuery(gl.ANY_SAMPLES_PASSED);
      renderer.autoClear = autoClear;
    }
    this.pending = { query, asked: this.ask };
    this.ask = null;
  }
  answer(renderer) {
    if (!this.pending) return null;
    const gl = renderer.getContext(), { query, asked } = this.pending;
    if (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) return null;
    const open = gl.getQueryParameter(query, gl.QUERY_RESULT) > 0;
    gl.deleteQuery(query);
    this.pending = null;
    return { open, asked };
  }
  dispose() { this.target.dispose(); this.quad.material.dispose(); this.quad.dispose(); if (this.probe) { this.probe.material.dispose(); this.probe.dispose(); } }
}

// What is outside, laid in behind the room: added into the room's own buffer, weighted by how open each pixel
// is, so that a pixel the pane covers comes out as pane over outside, exactly as it did when the outside was
// the scene's background. Alpha is made whole again where it does (the passes after this had it whole).
//   uSky: the hour's flat sky colour, linear. tOutside: the forest's frame, linear too (js/forest/post.js, drawn
// as light), and uGain what brings it to the room's exposure, so that the room's tone mapping, further on, does to
// it what the forest's own does: the same curve at the same exposure.
//   uRegion: where the forest's picture lies in the room's view (x and y from its lower left, width, height, in the
// view's pixels), uFull the view's size: only the part of the view the opening can show is drawn (`regionOf`).
const BEYOND_FRAG = /* glsl */`
  uniform sampler2D tOpen, tOutside;
  uniform vec3 uSky;
  uniform float uShow, uGain;
  uniform vec4 uRegion;
  uniform vec2 uFull;
  varying vec2 vUv;
  void main() {
    float open = 1.0 - texture2D(tOpen, vUv).r;
    vec3 beyond = uSky;
    if (uShow > 0.0) {
      vec2 at = (vUv * uFull - uRegion.xy) / uRegion.zw;
      if (all(greaterThanEqual(at, vec2(0.0))) && all(lessThanEqual(at, vec2(1.0)))) beyond = mix(uSky, texture2D(tOutside, at).rgb * uGain, uShow);
    }
    gl_FragColor = vec4(beyond * open, open);
  }
`;
class BeyondPass extends Pass {
  constructor(opening) {
    super();
    this.needsSwap = false;
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tOpen: { value: opening.target.texture }, tOutside: { value: null },
        uSky: { value: new THREE.Color() }, uShow: { value: 0 }, uGain: { value: 1 },
        uRegion: { value: new THREE.Vector4(0, 0, 1, 1) }, uFull: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: FS_VERT, fragmentShader: BEYOND_FRAG,
      depthTest: false, depthWrite: false, toneMapped: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
    });
    this.quad = new FullScreenQuad(this.material);
  }
  render(renderer, writeBuffer, readBuffer) {
    // (into the buffer the room was drawn into, on top of it: nothing is cleared)
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    try {
      renderer.setRenderTarget(readBuffer);
      this.quad.render(renderer);
    } finally {
      renderer.autoClear = autoClear;
    }
  }
  dispose() { this.material.dispose(); this.quad.dispose(); }
}

// The forest's own grade, put back on what is seen through the opening. It runs on the room's picture after its
// tone mapping (the OutputPass) and before its anti-aliasing and its grade (post.js's last pass): it does what
// the forest's final pass does after its tone mapping (contrast about 0.40, then saturation: js/forest/post.js),
// and undoes what the room's grade is still to do, so that the forest comes through it with its own. What is
// left of the room's on it is the vignette, which is the lens's. By night the difference is most of it: the forest
// lets moonlight carry little colour, and the room's grade is more saturated still by night.
const REGRADE_FRAG = /* glsl */`
  uniform sampler2D tDiffuse, tOpen;
  uniform float uShow, uContrast, uSaturation, uRoomContrast, uRoomSaturation;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(tDiffuse, vUv);
    float w = (1.0 - texture2D(tOpen, vUv).r) * uShow;
    if (w > 0.0) {
      const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
      vec3 g = (c.rgb - 0.40) * uContrast + 0.40;
      float l = dot(g, LUMA);
      g = clamp(mix(vec3(l), g, uSaturation), 0.0, 1.0);
      l = dot(g, LUMA);
      g = vec3(l) + (g - vec3(l)) / uRoomSaturation;
      g = (g - 0.40) / uRoomContrast + 0.40;
      c.rgb = mix(c.rgb, g, w);
    }
    gl_FragColor = c;
  }
`;
class RegradePass extends Pass {
  constructor(opening) {
    super();
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null }, tOpen: { value: opening.target.texture }, uShow: { value: 0 },
        uContrast: { value: 1 }, uSaturation: { value: 1 }, uRoomContrast: { value: 1 }, uRoomSaturation: { value: 1 },
      },
      vertexShader: FS_VERT, fragmentShader: REGRADE_FRAG,
      depthTest: false, depthWrite: false, toneMapped: false,
    });
    this.quad = new FullScreenQuad(this.material);
  }
  render(renderer, writeBuffer, readBuffer) {
    this.material.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }
  dispose() { this.material.dispose(); this.quad.dispose(); }
}

// The window's pane (js/room.js) was made for the flat sky: a sheet of glass at 0.06 that mirrors a bright
// environment, "so the window reads as glazed rather than an open hole". Over the forest it is a veil: drawn
// both ways in one page load, the forest seen through it stood 9 to 11 levels lighter than the forest's own
// picture from the same eye by day, and 22 by night, a haze over everything; with the pane left out, half the
// window's pixels were within a level of it. So while the forest is in the window the pane is thinned to a
// quarter (a hint of glass, which the room's own parallax no longer needs to make the point).
const PANE_LEFT = 0.25;

// `post` is what post.js built for the room, `camera` the room's, `glass` the window's pane. Nothing changes in
// the room's picture until the forest is there (`join`: whether to bring it; main.js brings it unless the page was
// asked for with ?join=0).
// `onReady`: called once the forest is in the window; `onFail`: called if it is lost (it then never comes back).
export function createOutside({ renderer, scene, camera, post, glass = null, join = false, onReady = null, onFail = null }) {
  const composer = post.composer;
  const renderPass = composer.passes.find((pass) => pass instanceof RenderPass);
  const output = composer.passes.find((pass) => pass instanceof OutputPass);
  if (!renderPass || !output) throw new Error('outside: the room\'s render chain is not the one this was written for');

  const opening = new OpeningPass(), beyond = new BeyondPass(opening), regrade = new RegradePass(opening);
  opening.enabled = beyond.enabled = regrade.enabled = false;
  composer.insertPass(opening, composer.passes.indexOf(renderPass) + 1);
  composer.insertPass(beyond, composer.passes.indexOf(opening) + 1);
  composer.insertPass(regrade, composer.passes.indexOf(output) + 1);

  let live = false;
  const paneOpacity = glass && glass.material ? glass.material.opacity : 0;
  // While it is live the room is drawn with no background, cleared to nothing: main.js leaves the scene's
  // background alone then (see `live`), and the clear's alpha is the render pass's own, so that nothing else
  // drawn with this renderer ever sees it.
  function setLive(on) {
    live = !!on;
    opening.enabled = beyond.enabled = live;
    regrade.enabled = false;                 // (each frame that draws the forest turns it on)
    renderPass.clearAlpha = live ? 0 : null;
    if (live) scene.background = null;
  }

  // ---- the forest
  let forest = null, input = null, failed = null, last = null, show = 0, toForest = null, outdoors = false;
  // `settled`: the forest is in the window, or it failed, or it is not to be brought at all (for the tools, which
  // wait for it before they look at the window)
  let settled = !join;
  const built = { steps: [], ms: 0 };
  const tick = (t) => { const dt = last === null ? 0 : Math.min(0.1, Math.max(0, t - last)); last = t; return dt; };
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  const size = new THREE.Vector2(), frustum = new THREE.Frustum(), viewProjection = new THREE.Matrix4();
  const eye = new THREE.Vector3(), euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const view = { position: eye, quaternion: camera.quaternion, fov: camera.fov, aspect: camera.aspect, offset: [1, 1, 0, 0, 1, 1] };

  // Only the part of the room's view that the opening can show is drawn: the box the opening's eight corners make on
  // the screen, with a margin for the forest's bloom to spread from, in a render chain of that size, whose camera is
  // the room's own with its view offset to that part (three's setViewOffset: the same picture, pixel for pixel, as
  // that part of the whole). Its size is let grow and shrink in steps (`QUANTUM`), so that a moving eye does not have
  // the chain made again every frame; where the box is, it is moved to, inside the view. At the desk the opening is a
  // strip at the edge of the view; at the window it is most of it.
  // The box is cut by the plane the eye sees from (its near plane) before it is put on the screen: at the desk the
  // eye is level with the opening's near edge, and a corner behind it would make the part the whole view (it did:
  // the forest cost as much at the desk, where the opening is a strip at the edge, as at the window).
  const MARGIN = 24, QUANTUM = 128, corners = Array.from({ length: 8 }, () => new THREE.Vector3()), point = new THREE.Vector3();
  const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const chain = { w: 0, h: 0 };                      // the size the forest's render chain and `target` were made at (0: to be made)
  function regionOf(W, H, out) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const put = (p) => {
      point.copy(p).applyMatrix4(camera.projectionMatrix);
      const px = (point.x * 0.5 + 0.5) * W, py = (0.5 - point.y * 0.5) * H;            // (y from the top, as setViewOffset has it)
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    };
    for (let k = 0; k < 8; k += 1) {
      corners[k].set(k & 1 ? OPENING.max.x : OPENING.min.x, k & 2 ? OPENING.max.y : OPENING.min.y, k & 4 ? OPENING.max.z : OPENING.min.z).applyMatrix4(camera.matrixWorldInverse);
      if (corners[k].z <= -camera.near) put(corners[k]);                // in front of the near plane
    }
    for (const [a, b] of EDGES) {                                       // where an edge goes through the near plane
      const da = corners[a].z + camera.near, db = corners[b].z + camera.near;
      if ((da > 0) === (db > 0)) continue;
      point.lerpVectors(corners[a], corners[b], da / (da - db)); point.z = -camera.near;
      put(point);
    }
    if (!(x1 >= x0 && y1 >= y0)) { x0 = 0; y0 = 0; x1 = W; y1 = H; }
    x0 = Math.max(0, Math.floor(x0 - MARGIN)); y0 = Math.max(0, Math.floor(y0 - MARGIN));
    x1 = Math.min(W, Math.ceil(x1 + MARGIN)); y1 = Math.min(H, Math.ceil(y1 + MARGIN));
    const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
    // made again only when the part outgrows it, or is less than half of it
    if (chain.w < w || chain.h < h || chain.w * chain.h > 2 * w * h) {
      chain.w = Math.min(W, Math.ceil(w / QUANTUM) * QUANTUM); chain.h = Math.min(H, Math.ceil(h / QUANTUM) * QUANTUM);
      forest.post.resize(chain.w, chain.h);
      target.setSize(chain.w, chain.h);
    }
    // the chain's size, laid over the part, inside the view
    out[0] = W; out[1] = H;
    out[2] = Math.min(W - chain.w, Math.max(0, Math.round((x0 + x1 - chain.w) / 2)));
    out[3] = Math.min(H - chain.h, Math.max(0, Math.round((y0 + y1 - chain.h) / 2)));
    out[4] = chain.w; out[5] = chain.h;
    return out;
  }

  // (after the room's own handler, which is bound first: the forest sizes itself from the drawing buffer)
  function resize() {
    chain.w = chain.h = 0;                           // (the window's part is made again on its next frame)
    if (forest && outdoors) forest.setSize(window.innerWidth, window.innerHeight);
  }

  // Anything thrown on the way leaves the window as it always was: the flat sky, and a quiet console.
  function fail(error, cfg) {
    if (failed) return;                      // (once: what it says first is why)
    failed = error;
    try { window.__outsideError = String((error && error.stack) || error); } catch (e) { /* nothing more to do */ }
    try { setLive(false); } catch (e) { /* nothing more to do */ }
    if (glass) glass.material.opacity = paneOpacity;
    if (cfg) scene.background = new THREE.Color(cfg.sky[1]);
    if (forest) { try { forest.dispose(); } catch (e) { /* nothing more to do */ } forest = null; }
    if (input) { input.remove(); input = null; }
    window.removeEventListener('resize', resize);
    outdoors = false;
    settled = true;
    if (onFail) { try { onFail(error); } catch (e) { /* nothing more to do */ } }
  }

  async function bring() {
    // Only the high tier brings it (a desktop's or a laptop's own GPU: caps.js); the others keep the flat sky. The
    // mid tier is a phone's or a tablet's Apple GPU, an Intel one, or a browser that will not say: the forest asks a
    // second scene's worth of memory and three seconds of building of them, beside a room that is already dear.
    if (!window.__caps || window.__caps.tier !== 'high') { settled = true; return; }
    const [{ createForestSlowly }, { UNIT }, { currentHour }] = await Promise.all([
      import('./forest/index.js'), import('./forest/plants/cabin.js'), import('./solar.js')]);
    // What takes the visitor's pointer and wheel for the forest: an element over the canvas that lets everything
    // through to the room while the visitor is indoors, and takes it while they are outside.
    input = document.createElement('div');
    input.className = 'outside-input';
    input.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;touch-action:none;';
    document.body.append(input);
    // Built a few milliseconds at a time, between the room's frames: the room goes on being drawn while it grows.
    // (`built`: each step and what it took, for the tools.)
    const started = performance.now();
    built.steps = [];
    const grown = await createForestSlowly({ renderer, element: input, hour: currentHour() },
      { budget: BUDGET, onStep: (what, ms) => built.steps.push([what, +ms.toFixed(1)]) });
    if (failed) { grown.dispose(); return; }                     // (given up on while it grew)
    forest = grown;
    built.ms = performance.now() - started;
    await warm();
    if (failed) return;
    built.warm = performance.now() - started - built.ms;
    // indoors: no governor (the frames it would time are the room's as well), and silent until the visitor is out
    forest.setGoverned(false);
    if (forest.sound) forest.sound.pause(true);
    forest.hud.pause(true); forest.nav.free();
    // the walker is at the cabin, for the animals' sake: where on the walk they are, and where they look from
    forest.nav.state.s = forest.trail.at.cabin;
    forest.nav.state.speed = 0;
    forest.nav.state.free = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, open: forest.places.window[3] };
    // the room's units are not the forest's metres: a point of the room is put into the forest by the cabin's own
    // sum (js/forest/plants/cabin.js: the room's middle is 2.3 units from its back wall, and its floor is the cabin's)
    const home = forest.places.cabin;
    toForest = (p, out) => out.set(home[0] + UNIT * p.x, home[1] + UNIT * p.y, home[2] + UNIT * (p.z - 2.3));
    resize();
    window.addEventListener('resize', resize);
    show = 0;
    setLive(true);
    settled = true;
    if (onReady) onReady();
  }
  if (join) bring().catch((error) => fail(error));

  // What the forest's first frame would otherwise do all at once (half a second, held), done beforehand and spread
  // out: each of its textures sent to the GPU, a few to a frame, and every program its scene needs compiled where
  // the driver can do it beside the page (KHR_parallel_shader_compile: three's compileAsync), with a render target
  // bound, since the scene is drawn into one and that is part of what a program is compiled for.
  // (the forest's own: js/forest/index.js `warm`. Once sent, a painted sheet's pixels are let go, so a lost WebGL
  // context could not be recovered from: the window then goes back to its flat sky.)
  async function warm() {
    built.textures = await forest.warm({ budget: BUDGET, between: nextFrame });
    renderer.domElement.addEventListener('webglcontextlost', () => fail(new Error('the WebGL context was lost')), { once: true });
  }

  // The forest's frame, drawn from the room's eye into the light buffer the window's pass reads.
  // The small view beside the desk can reuse its last HDR frame while the room animates.
  // Reproject immediately on any camera change. A deliberate look through the window stays live.
  //
  // Nothing open, nothing drawn (2026-11-19). The opening's box can touch the view while not one pixel of the outside
  // shows: at the seat's own resting pose the box, cut by the near plane, is a strip at the view's right edge, and
  // every texel of it is wall. The forest was drawn for it all the same, 72 draw calls and its whole chain, on every
  // second frame, with three passes over the whole view on top. So the GPU is asked (OpeningPass `count`), for the
  // view as it stands, whether any texel is open; while the view is the one it said "none" of, the forest is not
  // drawn and the three passes are off (there is nothing for them to add to). The question is put again every
  // twentieth frame, in case something in the room has uncovered the opening; any change of the view draws
  // everything as before until there is an answer for the new view.
  const lastWindowProjection = new THREE.Matrix4(), closedUnder = new THREE.Matrix4(), openUnder = new THREE.Matrix4(), asking = new THREE.Matrix4(), viewBefore = new THREE.Matrix4();
  let lastWindowTime = -Infinity, pendingWindowDt = 0, closed = false, sinceAsked = 0;
  // (for the tools: how many frames found nothing open and drew nothing; `off` draws everything whatever was answered)
  const unseen = { frames: 0, off: false };
  function drawWindow(t, dt, cfg) {
    const u = beyond.material.uniforms;
    camera.updateMatrixWorld();
    viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(viewProjection);
    const told = opening.answer(renderer);
    if (told) { closed = !told.open; (closed ? closedUnder : openUnder).copy(told.asked); }
    const still = viewBefore.equals(viewProjection);
    viewBefore.copy(viewProjection);
    // nothing outside is in view: nothing is drawn, and anything left open on the screen is given the flat sky
    if (!frustum.intersectsBox(OPENING)) { regrade.enabled = false; u.uShow.value = 0; opening.enabled = beyond.enabled = false; return; }
    opening.enabled = beyond.enabled = true;
    pendingWindowDt = Math.min(0.1, pendingWindowDt + dt);
    if (closed && !unseen.off && closedUnder.equals(viewProjection)) {
      // (the fade goes on, so that the first look at the window finds the forest in it as it does now)
      show = Math.min(1, show + dt / FADE);
      u.uShow.value = show;
      if (glass) glass.material.opacity = paneOpacity * (1 - (1 - PANE_LEFT) * show);
      regrade.enabled = false;
      unseen.frames += 1;
      sinceAsked += 1;
      if (sinceAsked >= 20) { sinceAsked = 0; opening.ask = closedUnder; beyond.enabled = false; }      // (the opening's own pass alone, to be asked again)
      else opening.enabled = beyond.enabled = false;
      return;
    }
    // (asked once the view stands still, and not again of a view already known to be open: the answer counts only for
    // the view it was asked under)
    if (still && !opening.pending && !openUnder.equals(viewProjection)) opening.ask = asking.copy(viewProjection);
    if (show === 1 && regrade.enabled && chain.w > 0 && chain.w < size.x * 0.3 &&
        t - lastWindowTime < 1 / 30 && lastWindowProjection.equals(viewProjection)) return;
    lastWindowProjection.copy(viewProjection);
    lastWindowTime = t;
    show = Math.min(1, show + dt / FADE);
    toForest(camera.position, eye);
    euler.setFromQuaternion(camera.quaternion, 'YXZ');
    const free = forest.nav.state.free;
    free.x = eye.x; free.y = eye.y; free.z = eye.z; free.yaw = euler.y; free.pitch = euler.x;
    view.fov = camera.fov; view.aspect = camera.aspect;
    renderer.getDrawingBufferSize(size);
    const o = regionOf(size.x, size.y, view.offset);
    // The renderer is the room's. The forest sets its own exposure (and draws with its own clears); what the room
    // needs is put back however the forest's frame ends: its exposure, its clearing, its shadows' pending refresh.
    const exposure = renderer.toneMappingExposure, autoClear = renderer.autoClear, shadows = renderer.shadowMap.needsUpdate;
    let gain = 1;
    renderer.autoClear = true;
    try {
      forest.frame(t, pendingWindowDt, cfg, { view, into: target, hide: HIDDEN });
      pendingWindowDt = 0;
      gain = renderer.toneMappingExposure / exposure;
    } finally {
      renderer.toneMappingExposure = exposure;
      renderer.autoClear = autoClear;
      renderer.shadowMap.needsUpdate = shadows;
      renderer.setRenderTarget(null);
    }
    u.tOutside.value = target.texture;
    u.uRegion.value.set(o[2], o[1] - o[3] - o[5], o[4], o[5]);          // (from the view's lower left)
    u.uFull.value.set(o[0], o[1]);
    u.uGain.value = gain;
    u.uShow.value = show;
    if (glass) glass.material.opacity = paneOpacity * (1 - (1 - PANE_LEFT) * show);
    const r = regrade.material.uniforms, mine = forest.post.grade, room = post.passes && post.passes.grade;
    const graded = !!room && room.enabled !== false;
    r.uShow.value = show;
    r.uContrast.value = mine.uContrast.value; r.uSaturation.value = mine.uSaturation.value;
    r.uRoomContrast.value = graded ? room.uniforms.uContrast.value : 1;
    r.uRoomSaturation.value = graded ? room.uniforms.uSaturation.value : 1;
    regrade.enabled = show > 0;
  }

  // Every frame, before the room is drawn. `t` is the room's clock, in seconds; `cfg` the hour's state (solar.js).
  function frame(t, cfg) {
    const dt = tick(t);
    if (!live) return;
    try {
      beyond.material.uniforms.uSky.value.set(cfg.sky[1]);
      if (forest) drawWindow(t, dt, cfg);
    } catch (error) { fail(error, cfg); }
  }

  // ---- out of the door
  // The walker starts at the cabin's door looking down the valley, as the window looks (20 degrees west of north),
  // and walks with the forest's own controls: its walking, its animals' close-ups and its sound are let go.
  const VALLEY = THREE.MathUtils.degToRad(20), _at = new THREE.Vector3(), _along = new THREE.Vector3();
  function goOut() {
    if (!forest || failed) return false;
    try {
      const nav = forest.nav;
      nav.state.free = null; nav.state.speed = 0; nav.state.push = 0; nav.state.auto = null;
      nav.state.s = forest.trail.at.cabin;
      forest.trail.sample(nav.state.s, _at, _along);
      nav.state.yaw = VALLEY - Math.atan2(-_along.x, -_along.z);
      nav.state.pitch = -0.06;
      forest.setGoverned(true);
      if (forest.sound) forest.sound.pause(false);
      forest.hud.pause(false);
      input.style.pointerEvents = 'auto';
      outdoors = true;
      forest.setSize(window.innerWidth, window.innerHeight);           // (the whole view again, at the canvas's own size)
      chain.w = chain.h = 0;
      return true;
    } catch (error) { fail(error); return false; }
  }
  // Back in: the forest is the window's again (no close-up, no governor, its full size, silent, no input).
  function comeIn() {
    outdoors = false;
    if (!forest) return;
    try {
      forest.life.release();
      const nav = forest.nav;
      nav.state.free = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, open: forest.places.window[3] };
      nav.state.speed = 0; nav.state.push = 0;
      nav.state.s = forest.trail.at.cabin;
      forest.post.setScale(1);                 // use the window’s pixel budget on the next resize
      forest.setGoverned(false);
      if (forest.sound) forest.sound.pause(true);
      forest.hud.pause(true); forest.nav.free();
      input.style.pointerEvents = 'none';
      input.style.cursor = '';
      chain.w = chain.h = 0;                         // (the window's part is made again on its next frame)
    } catch (error) { fail(error); }
  }
  // Outdoors, every frame in place of the room's: the forest's own frame, finished, on the canvas. False if it
  // could not be drawn (the forest is then gone: fail, and onFail, have run).
  function drawOutdoors(t, cfg) {
    const dt = tick(t);
    if (!forest || failed || !outdoors) return false;
    try {
      forest.frame(t, dt, cfg);
      return true;
    } catch (error) { fail(error, cfg); return false; }
  }

  // For the tools. The room's frame as it stands, drawn twice with nothing moved between: the way it has always
  // been drawn (the sky its background, these passes off) and through these passes with the flat sky laid in.
  // What differs is what the join itself changes in the room's picture, which should be next to nothing, and
  // nothing at all outside the window. Call it with the page's own loop parked. `skew` multiplies the sky laid in
  // by the second drawing only: with it the window's pixels must differ, which is how the check is shown to see.
  function check(cfg, { level = 2, skew = 1 } = {}) {
    const gl = renderer.getContext(), canvas = renderer.domElement, W = canvas.width, H = canvas.height;
    const a = new Uint8Array(W * H * 4), b = new Uint8Array(W * H * 4), was = live, shown = beyond.material.uniforms.uShow.value;
    const shot = (on, into) => {
      setLive(on);
      if (!on) scene.background = new THREE.Color(cfg.sky[1]);
      beyond.material.uniforms.uShow.value = 0;
      beyond.material.uniforms.uSky.value.set(cfg.sky[1]);
      if (on && skew !== 1) beyond.material.uniforms.uSky.value.multiplyScalar(skew);
      post.render();
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, into);
    };
    try {
      shot(false, a); shot(true, b);
      let differ = 0, over = 0, most = 0, x0 = W, x1 = -1, y0 = H, y1 = -1;
      for (let o = 0; o < a.length; o += 4) {
        const d = Math.max(Math.abs(a[o] - b[o]), Math.abs(a[o + 1] - b[o + 1]), Math.abs(a[o + 2] - b[o + 2]));
        if (!d) continue;
        differ += 1; if (d > level) over += 1; if (d > most) most = d;
        const x = (o / 4) % W, y = H - 1 - Math.floor(o / 4 / W);
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      return { pixels: W * H, differ, over, most, box: differ ? [x0, y0, x1, y1] : null };
    } finally {
      setLive(was);
      if (!was) scene.background = new THREE.Color(cfg.sky[1]);
      beyond.material.uniforms.uShow.value = shown;
    }
  }

  function dispose() {
    fail(new Error('disposed'));
    composer.removePass(opening); composer.removePass(beyond); composer.removePass(regrade);
    opening.dispose(); beyond.dispose(); regrade.dispose(); target.dispose();
  }

  return {
    get live() { return live; }, get forest() { return forest; }, get failed() { return failed; },
    get outdoors() { return outdoors; }, get settled() { return settled; }, built, unseen,
    setLive, frame, check, dispose, goOut, comeIn, drawOutdoors,
    // (for the tools: the forest's eye for the room's present view, and how far the window's picture has come up)
    eyeOf: (out = new THREE.Vector3()) => (toForest ? toForest(camera.position, out) : null),
    get show() { return show; },
  };
}
