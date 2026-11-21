import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

let _rectUniformsReady = false;
function ensureRectAreaUniforms() {
  if (_rectUniformsReady) return;
  RectAreaLightUniformsLib.init();
  _rectUniformsReady = true;
}

// ---------------------------------------------------------------------------
// Phase 1 shared state. ONE PMREMGenerator + the live env render target are
// reused across per-frame env rebuilds (1c) so re-baking the IBL as the sun
// moves never leaks VRAM (the previous RT is disposed every rebuild). The fit
// scratch objects keep the per-frame shadow-frustum refit (1b) allocation-free.
// ---------------------------------------------------------------------------
let _pmrem = null;
let _envRT = null;

const FIT_EPS_RAD = 2 * Math.PI / 180;                  // refit only past ~2° of sun swing
const SUN_TARGET = new THREE.Vector3(-1.2, 1.4, 0.4);   // must match sun.target below
const _UP = new THREE.Vector3(0, 1, 0);
// Room volume the sun frustum must always bracket. The sealed cabin reaches the
// FrontWall at z≈6.9; the old z max of 3 clipped the far SideL receiver when the
// camera yawed left. Pixels outside the shadow map were treated as fully sunlit,
// producing the reported vertical "leak" through an otherwise closed box.
const ROOM_AABB_MIN = new THREE.Vector3(-6, -0.2, -2.5);
const ROOM_AABB_MAX = new THREE.Vector3(6, 6.6, 7.2);
const _mView = new THREE.Matrix4();
const _mViewInv = new THREE.Matrix4();
const _vCorner = new THREE.Vector3();

// ============================================================================
// SCENE LIGHTING — "real sunlight entering the cabin" (2026 rebuild).
//
// The goal is NOT a brighter room. It is the opposite: a room with strong,
// motivated CONTRAST, where sun enters through the window, lands as a crisp
// muntin-divided patch, and everything else falls away into cozy shadow.
// Scandinavian cabin, Studio-Ghibli interior, mountain-lodge golden hour.
//
//   • Sunlight ENTERS THROUGH THE WINDOW, physically. The sun is a
//     DirectionalLight that casts shadows, and the cabin's BackWall is a solid
//     shadow caster with the window as an actual aperture (frame + jamb +
//     MuntinH/MuntinV crossbars, NO glass pane). So the wall masks the sun
//     everywhere EXCEPT the opening: the only light reaching the interior is
//     the beam through the window. This is the real thing, not a faked pool.
//
//   • ONLY the illuminated regions get bright. Because the patch is shadow-
//     masked, raising the sun's intensity raises the PATCH, not the room. The
//     ambient/sky fill is kept low, so lit-vs-shaded contrast goes UP.
//
//   • BEAUTIFUL SHADOW COMPOSITION: the muntins throw sharp pane-shadow bars
//     across the patch. Sun-shadow map is tier-driven (caps.sunShadowSize) with
//     a tight room-fit frustum + a small PCF radius for crisp bars. Shadows are
//     refreshed on a cadence (main.js), not per frame.
//
//   • WARM INDIRECT LIGHT + SOFT RIM + SPECULAR: a procedural image-based
//     environment (PMREM) is built from a warm vertical gradient plus a bright
//     sun-aligned key, rebuilt on a throttle as the sun moves so the indirect
//     light always agrees with the palette.
//
// The visible window shafts are now a screen-space post pass (post.js), not
// in-scene geometry. Lights at runtime: SUN (DirectionalLight, only shadow
// caster), SKY/HEMI (HemisphereLight, carries the folded-in ambient + cool-
// shadow / warm-bounce split), the shadowed WINDOW SpotLight plus its faint area
// fill, and the baked env map. Desk lamp lives in deskObjects.js; window-frame
// bounce is a faked emissive tint in room.js.
// ============================================================================

// ---------------------------------------------------------------------------
// Warm image-based environment. Built from a tiny procedural scene and baked to
// a PMREM cube map. Drives all specular response, rim reflections, roughness
// reveal and warm indirect fill on the standard/physical materials (they read
// scene.environment automatically when their own envMap is null).
// ---------------------------------------------------------------------------
function buildWarmEnvironment(renderer, cfg) {
  if (!_pmrem) _pmrem = new THREE.PMREMGenerator(renderer);

  const envScene = new THREE.Scene();

  // Vertical gradient dome: a soft sky bounce up top, a warm window-glow band
  // through the middle, and a deep wood-floor bounce below. Colours are pulled
  // straight from the time-of-day cfg so the indirect light always agrees with
  // the sun/hemi palette.
  const skyTop  = new THREE.Color(cfg.sky ? cfg.sky[0] : '#bcd7e3');
  const horizon = new THREE.Color(cfg.beam || '#fff0cf');
  const ground  = new THREE.Color(cfg.hemi ? cfg.hemi[1] : 0x2a1f16);

  const c = document.createElement('canvas'); c.width = 8; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.00, '#' + skyTop.getHexString());
  g.addColorStop(0.46, '#' + horizon.getHexString());
  g.addColorStop(0.62, '#' + horizon.clone().multiplyScalar(0.7).getHexString());
  g.addColorStop(1.00, '#' + ground.getHexString());
  ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(40, 24, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })
  );
  envScene.add(dome);

  // Bright, warm KEY toward the sun's azimuth — the dominant reflection that
  // gives wood/walnut a directional sunlit glint (a "moving" specular highlight
  // as the camera pans). Held above unity so it reads as a real hot source in
  // the half-float PMREM, but kept off-white-warm so highlights stay golden.
  const keyCol = new THREE.Color(cfg.sun ? cfg.sun[0] : 0xffe9c8).multiplyScalar(cfg.mode === 'night' ? 0.6 : 1.5);
  const key = new THREE.Mesh(
    new THREE.CircleGeometry(11, 24),
    new THREE.MeshBasicMaterial({ color: keyCol })
  );
  const sunVec = new THREE.Vector3(...(cfg.sun ? cfg.sun[2] : [4, 8, -8])).normalize().multiplyScalar(30);
  key.position.copy(sunVec);
  key.lookAt(0, 0, 0);
  envScene.add(key);

  const rt = _pmrem.fromScene(envScene, 0.04);

  tex.dispose();
  dome.geometry.dispose(); dome.material.dispose();
  key.geometry.dispose(); key.material.dispose();
  // VRAM-leak guard: free the previous env map before swapping in the new one.
  // The PMREMGenerator itself is reused across rebuilds (never disposed here).
  if (_envRT) _envRT.dispose();
  _envRT = rt;
  return rt.texture;
}

export function buildLighting(scene, room, cfg, renderer) {
  const isNight = cfg.mode === 'night';

  // ---- 0. ENVIRONMENT — warm IBL (specular / rim / roughness / indirect) ----
  let env = null;
  if (renderer) {
    env = buildWarmEnvironment(renderer, cfg);
    scene.environment = env;
  }

  // ---- 1. SUN — the hero. Single shadow caster, frustum fit to the room ----
  // Intensity is high RELATIVE to the sky fill below, but because the wall
  // shadow-masks it to just the window aperture, that brightness only lands on
  // the patch — it raises contrast, not overall exposure.
  const sun = new THREE.DirectionalLight(cfg.sun[0], cfg.sun[1]);
  sun.position.set(...cfg.sun[2]);
  // aim the sun at the room interior, just below the window, so the cone of the
  // shadow frustum (fit below) brackets the patch where it actually lands.
  sun.target.position.set(-1.2, 1.4, 0.4);
  scene.add(sun.target);
  sun.castShadow = true;
  // Resolution is tier-driven (caps.sunShadowSize: 4096 high / 2048 mid / 1024
  // low). The muntin crossbars are thin and near edge-on to the raking sun, so
  // high res keeps their pane-shadow bars crisp. Shadows are refreshed on a
  // cadence now (main.js), not per frame, so the cost stays bounded.
  const _caps = (typeof window !== 'undefined' && window.__caps) || {};
  const _sunMap = _caps.sunShadowSize || 2048;
  sun.shadow.mapSize.set(_sunMap, _sunMap);
  // Ortho frustum is a starting bracket only — applyTime()'s fitSunShadow() refits
  // it to the room AABB from the live sun angle each time the sun swings > ~2°.
  sun.shadow.camera.left = -9; sun.shadow.camera.right = 9;
  sun.shadow.camera.top = 11; sun.shadow.camera.bottom = -5;
  sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 26;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;    // guards acne on the thin muntins/frame (edge-on to the sun)
  sun.shadow.radius = 0.0;         // Patch 1 (L1): zero-radius PCF — the beam boundary must read as a ruled line.
  scene.add(sun);

  // ---- 2. SKY/HEMI — demoted to a whisper of sky scatter (iter 17) ---------
  // The hemisphere used to carry the room: a uniform, sourceless wash that lit
  // the far corner exactly as much as the sill — the opposite of how a real
  // window-lit room reads. It survives only as faint multi-bounce scatter so
  // full shadow never collapses to pure black; the WINDOW key below now owns
  // the room's brightness gradient.
  const HEMI_SCALE = 0.50;
  const hemi = new THREE.HemisphereLight(cfg.hemi[0], cfg.hemi[1], cfg.hemi[2] * HEMI_SCALE);
  scene.add(hemi);

  // ---- 1b. WINDOW KEY — aperture-masked, shadow-casting daylight -----------
  // The iter-17 RectAreaLight could not cast shadows, so it illuminated through
  // the closed shell and washed out the lamp/MacBook/paper silhouettes. A wide,
  // fully feathered SpotLight now sits OUTSIDE the opening and aims at the desk.
  // The physical BackWall/window aperture masks its shadow map, inverse-square
  // falloff keeps the window side brighter, and one perspective shadow pass lets
  // every separately loaded prop participate without a Blender merge.
  const WINDOW_KEY_DAY = 24.0;
  const WINDOW_KEY_NIGHT = 0.0;
  const wc = room.win.center, wz = room.win.z, wr = room.win.radius;
  const windowKey = new THREE.SpotLight(0xdce8f5, WINDOW_KEY_NIGHT, 9.0, 0.72, 0.90, 2);
  windowKey.name = 'WindowKey';
  windowKey.position.set(wc.x, wc.y, wz - wr);             // one aperture radius outside the wall
  windowKey.target.position.set(
    room.desk.centerX,
    room.desk.surfaceY - 0.20,
    room.desk.z + 0.15,
  );
  scene.add(windowKey.target);
  windowKey.castShadow = true;
  const _windowMap = _caps.windowShadowSize || 1024;
  windowKey.shadow.mapSize.set(_windowMap, _windowMap);
  windowKey.shadow.camera.near = 0.25;
  windowKey.shadow.camera.far = 9.0;
  windowKey.shadow.bias = -0.0005;
  windowKey.shadow.normalBias = 0.008;
  windowKey.shadow.focus = 0.96;
  windowKey.userData.isWindowLight = true;
  scene.add(windowKey);

  // A low-energy area source restores the broad softness of an open window
  // without becoming the room key. It exists only to lift the deepest shadow
  // values around the spot's real silhouettes; at 1.2 it is a small fraction of
  // iter 17's unoccluded intensity 7, so the closed left wall stays shadowed.
  ensureRectAreaUniforms();
  const WINDOW_FILL_DAY = 1.2;
  const WINDOW_FILL_NIGHT = 0.08;
  const winSize = wr * 1.85;
  const windowFill = new THREE.RectAreaLight(0xdce8f5, WINDOW_FILL_NIGHT, winSize, winSize);
  windowFill.name = 'WindowSoftFill';
  windowFill.position.set(wc.x, wc.y, wz + 0.18);
  windowFill.lookAt(room.desk.centerX, room.desk.surfaceY, room.desk.z);
  windowFill.userData.isWindowFill = true;
  scene.add(windowFill);

  // --------------------------------------------------------------------------
  // PHASE 1 — live, mutable-per-frame time application. solarState() is pure math
  // (main.js calls it every frame); applyTime() pushes that state into the actual
  // light objects, refits the sun-shadow frustum when the sun has swung, and
  // rebuilds the PMREM environment on a throttle.
  // --------------------------------------------------------------------------
  const _sunColNow = new THREE.Color();
  const _sunColPrev = new THREE.Color(cfg.sun[0]);
  let _lastEnvMs = (typeof performance !== 'undefined') ? performance.now() : 0;
  let _lastEnvDay = (cfg.dayFactor != null) ? cfg.dayFactor : (isNight ? 0 : 1);
  let bakedSky = cfg;
  const envDirectionStep = Math.cos(THREE.MathUtils.degToRad(0.5));
  const _lastFitDir = new THREE.Vector3(...cfg.sun[2]).normalize();
  let _fitDone = false;

  function fitSunShadow(state) {
    // Refit only past ~2° of sun swing (real-time motion refits rarely; scrub /
    // __timeScale refit often). Project the room AABB into the sun's light space
    // and bracket it; the AABB always contains the BackWall occluder at z=-2.2.
    if (_fitDone && state.sunDir.angleTo(_lastFitDir) < FIT_EPS_RAD) return false;
    _mView.lookAt(state.sunPos, SUN_TARGET, _UP);
    _mView.setPosition(state.sunPos);
    _mViewInv.copy(_mView).invert();
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < 8; i++) {
      _vCorner.set(
        (i & 1) ? ROOM_AABB_MAX.x : ROOM_AABB_MIN.x,
        (i & 2) ? ROOM_AABB_MAX.y : ROOM_AABB_MIN.y,
        (i & 4) ? ROOM_AABB_MAX.z : ROOM_AABB_MIN.z,
      ).applyMatrix4(_mViewInv);
      minX = Math.min(minX, _vCorner.x); maxX = Math.max(maxX, _vCorner.x);
      minY = Math.min(minY, _vCorner.y); maxY = Math.max(maxY, _vCorner.y);
      minZ = Math.min(minZ, _vCorner.z); maxZ = Math.max(maxZ, _vCorner.z);
    }
    const cam = sun.shadow.camera;
    const PAD = 0.3;
    cam.left = minX - PAD; cam.right = maxX + PAD;
    cam.bottom = minY - PAD; cam.top = maxY + PAD;
    // light space looks down -z: nearest corner is at -maxZ, farthest at -minZ.
    cam.near = Math.max(0.1, -maxZ - PAD);
    cam.far = -minZ + PAD;
    cam.updateProjectionMatrix();
    _lastFitDir.copy(state.sunDir); _fitDone = true;
    return true;
  }

  function applyTime(state) {
    // direct lights
    sun.color.set(state.sun[0]);
    sun.intensity = state.sun[1];
    sun.position.copy(state.sunPos);
    hemi.color.set(state.hemi[0]);
    hemi.groundColor.set(state.hemi[1]);
    hemi.intensity = state.hemi[2] * HEMI_SCALE;
    windowKey.intensity = THREE.MathUtils.lerp(WINDOW_KEY_NIGHT, WINDOW_KEY_DAY, state.dayFactor);
    windowFill.intensity = THREE.MathUtils.lerp(WINDOW_FILL_NIGHT, WINDOW_FILL_DAY, state.dayFactor);

    // shadow frustum tracks the sun; a refit needs a fresh shadow render
    if (fitSunShadow(state) && renderer) renderer.shadowMap.needsUpdate = true;

    // throttled PMREM env rebuild (1c). Reuses the shared generator, disposes the
    // old RT. Rebuild on cadence, a sun-colour shift, or a dayFactor shift; on the
    // low tier (pmremEverySec = Infinity) the initial bake stands for the session.
    const caps = (typeof window !== 'undefined' && window.__caps) || {};
    const everySec = (typeof caps.pmremEverySec === 'number') ? caps.pmremEverySec : 20;
    if (renderer && isFinite(everySec)) {
      const now = (typeof performance !== 'undefined') ? performance.now() : 0;
      _sunColNow.set(state.sun[0]);
      const colMoved = Math.abs(_sunColNow.r - _sunColPrev.r) +
                       Math.abs(_sunColNow.g - _sunColPrev.g) +
                       Math.abs(_sunColNow.b - _sunColPrev.b) > 0.03;
      const dayMoved = Math.abs(state.dayFactor - _lastEnvDay) > 0.03;
      const timeDue = (now - _lastEnvMs) / 1000 > everySec;
      // The reflection is a broad, roughness-filtered light. A fixed hour can reuse it
      // indefinitely, and the real sun takes minutes to move half a degree.
      const bakeDue = timeDue && (state.sky[0] !== bakedSky.sky[0] || state.beam !== bakedSky.beam ||
        state.hemi[1] !== bakedSky.hemi[1] || state.sun[0] !== bakedSky.sun[0] ||
        state.sunDir.dot(bakedSky.sunDir) < envDirectionStep);
      if (bakeDue || colMoved || dayMoved || state.mode !== bakedSky.mode) {
        env = buildWarmEnvironment(renderer, state);
        scene.environment = env;
        bakedSky = state;
        _lastEnvMs = now; _lastEnvDay = state.dayFactor; _sunColPrev.copy(_sunColNow);
      }
    }
  }

  // No residual per-frame shader work now the volumetric shaft/dust are gone
  // (window shafts moved to the post pass). Kept as a no-op so main.js's
  // lighting.update(t) call stays valid.
  function update(_t) {}

  return { sun, hemi, windowKey, windowLight: windowKey, windowFill, env, applyTime, update };
}
