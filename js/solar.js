// solar.js — continuous, gently-warped solar model.
//
// solarState(hoursFloat) returns the SAME cfg shape that buildRoom / buildLighting
// already consume — { mode, bg, hemi:[sky,ground,int], sun:[color,int,posArr],
// sky:[...], sunC, beam, label, lamp } — PLUS { dayFactor, elevationDeg, sunDir,
// sunPos } for the phases that follow.
//
// Two independent parts:
//   1. PALETTE — the four hand-tuned timeConfig() presets are lifted VERBATIM as
//      keyframe anchors (hours 7/13/18/23) and lerped by hour, so colour/intensity
//      now move continuously instead of snapping between presets. At an exact anchor
//      hour the returned values equal the old preset (types preserved: numbers for
//      hemi/sun colours, `#strings` for bg/sky/sunC/beam), so this is drop-in.
//   2. SUN GEOMETRY — a gently-warped arc (independent of the palette) that makes
//      the sun DWELL at low raking angles: a noon visitor still gets a high, bright
//      sun, but the exponent on the elevation curve lingers the sun near the horizon.
//      The world position overrides the anchors' static sun[2]; the back wall keeps
//      masking it, so raising the sun raises the window PATCH, not the whole room.
//
// solarState is pure math → safe to call every frame (only the PMREM rebuild is
// throttled, in a later phase). Time controls: window.__scrub(h), __FORCE_HOUR,
// __FORCE_TIME/localStorage('forceTime'), __timeScale, __sunGamma, __sunMaxElev,
// __sunElevSoftCap.
import * as THREE from 'three';

const { clamp, lerp, smoothstep, degToRad } = THREE.MathUtils;

const W = (typeof window !== 'undefined') ? window : {};

// --- palette anchors: the exact former timeConfig() dictionaries, verbatim ------
// Ordered by hour; the 23→7 gap is the overnight segment (wraps, +8h span).
const ANCHORS = [
  { h: 7,  label: 'morning light', bg: '#231e19', hemi: [0xc4d4e2, 0x6a5a4a, 0.17], sun: [0xffe9c4, 4.20, [5.5, 6.5, -8.5]], sky: ['#d4e0e8', '#e8ecec', '#eef0ec'], sunC: '#ffe9cf', beam: '#ffead0', lamp: 8.0 },
  { h: 13, label: 'daylight',      bg: '#a6d0f2', hemi: [0xbcd0ea, 0x53412c, 0.10], sun: [0xffeccb, 16.0, [4.5, 8.5, -8.0]], sky: ['#cdd9e6', '#dfe7ec', '#eef0ee'], sunC: '#fff1dc', beam: '#fff4e6', lamp: 7.0 },   // iter-24: once the noon beam is kept in-frame, direct sun 9→16 restores a daylight hero patch without lifting ambient fill/exposure
  { h: 18, label: 'golden hour',   bg: '#20160f', hemi: [0xe2c8a4, 0x5a4028, 0.13], sun: [0xffa860, 13.0, [6.5, 4.2, -7.0]], sky: ['#f0d6b0', '#efcfa6', '#ecc99a'], sunC: '#ffcf9a', beam: '#ffd9a8', lamp: 10.0 },
  { h: 23, label: 'evening',       bg: '#0e1018', hemi: [0x26314f, 0x0a0d14, 0.12], sun: [0x9fb6ff, 0.08, [-3.0, 7.0, -9.0]], sky: ['#1d2742', '#33406a', '#46577f'], sunC: '#cfd8ff', beam: '#cdd6ff', lamp: 16.0 },
];

// Warp defaults (live-tunable via window.__sunMaxElev / __sunElevSoftCap /
// __sunGamma). The raw 36° arc is smoothly compressed above the low-angle
// range: morning and golden hour move by <1°, while noon lands at ~23°. At the
// former 36° peak the real aperture-masked beam fell below/outside the useful
// composition, so raising intensity had no visible effect; the soft cap keeps
// that beam on the wall/desk without a plateau or a discontinuity in motion.
const SUN_MAX_ELEV      = 36;
const SUN_ELEV_SOFT_CAP = 26;
const SUN_GAMMA         = 1.4;  // exponent > 1 pulls mid elevations low → the sun dwells
const SUN_RADIUS        = 14;   // sun sits this far outside the back wall (rakes the aperture)

// scratch colour objects (no per-frame allocation)
const _cA = new THREE.Color(), _cB = new THREE.Color(), _cO = new THREE.Color();

function numOr(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }
function norm24(h) { h = h % 24; return h < 0 ? h + 24 : h; }

// bracket the wrapped anchor ring for hour h → { a, b, t in [0,1] }
function bracket(h) {
  h = norm24(h);
  for (let i = 0; i < ANCHORS.length; i++) {
    const a = ANCHORS[i];
    const b = ANCHORS[(i + 1) % ANCHORS.length];
    let span = b.h - a.h; if (span <= 0) span += 24;   // 23→7 wraps
    let d = h - a.h;      if (d < 0) d += 24;
    if (d <= span) return { a, b, t: span > 0 ? d / span : 0 };
  }
  return { a: ANCHORS[0], b: ANCHORS[0], t: 0 };
}

// colour lerps that PRESERVE the original field type, so the shim is byte-for-byte
// identical to the old presets at the anchor hours.
function lerpHexNum(a, b, t) { _cO.copy(_cA.set(a)).lerp(_cB.set(b), t); return _cO.getHex(); }
function lerpHexStr(a, b, t) { _cO.copy(_cA.set(a)).lerp(_cB.set(b), t); return '#' + _cO.getHexString(); }

// gently-warped solar elevation for hour h (deg). 0 across the night hours.
function elevationFor(h) {
  const maxElev = numOr(W.__sunMaxElev, SUN_MAX_ELEV);
  const softCap = numOr(W.__sunElevSoftCap, SUN_ELEV_SOFT_CAP);
  const gamma   = numOr(W.__sunGamma,   SUN_GAMMA);
  const p = clamp((h - 6) / (20 - 6), 0, 1);
  const rawElevation = maxElev * Math.pow(Math.sin(Math.PI * p), gamma);
  return softCap > 0
    ? softCap * Math.tanh(rawElevation / softCap)
    : rawElevation;
}

export function solarState(hoursFloat) {
  const h = norm24(hoursFloat);
  const { a, b, t } = bracket(h);

  // --- palette (continuous lerp of the hand-tuned anchors) ---
  const bg   = lerpHexStr(a.bg, b.bg, t);
  const hemi = [lerpHexNum(a.hemi[0], b.hemi[0], t), lerpHexNum(a.hemi[1], b.hemi[1], t), lerp(a.hemi[2], b.hemi[2], t)];
  const sunColor = lerpHexNum(a.sun[0], b.sun[0], t);
  const sunInt   = lerp(a.sun[1], b.sun[1], t);
  const sky  = [lerpHexStr(a.sky[0], b.sky[0], t), lerpHexStr(a.sky[1], b.sky[1], t), lerpHexStr(a.sky[2], b.sky[2], t)];
  const sunC = lerpHexStr(a.sunC, b.sunC, t);
  const beam = lerpHexStr(a.beam, b.beam, t);
  const lamp = lerp(a.lamp, b.lamp, t);
  const label = t < 0.5 ? a.label : b.label;

  // --- sun geometry (gently-warped arc; overrides the anchors' static position) ---
  const elevationDeg = elevationFor(h);
  const el = degToRad(elevationDeg);
  const p  = clamp((h - 6) / (20 - 6), 0, 1);
  // Azimuth confined to the eastern sector (~16°…47°) instead of a full E→W
  // sweep: rays through the south window then travel mostly -x, across the room
  // toward the shelf wall and the desk — the raking patch composition. A
  // southern/western sun sends the patch into the floor beyond the desk, out of
  // frame (verified in-browser before this remap).
  const az = Math.PI * (0.09 + 0.17 * p);

  const cosEl = Math.cos(el);
  // heading: +x = east, −z = south (out through the back-wall window), −x = west
  const sunPos = new THREE.Vector3(
    Math.cos(az) * cosEl,
    Math.sin(el),
    -Math.sin(az) * cosEl,
  ).multiplyScalar(SUN_RADIUS);
  const sunDir = sunPos.clone().normalize();

  // --- day/night: warp never lifts a real-clock night hour above the horizon ---
  const dayFactor = smoothstep(elevationDeg, -2, 10);   // 0 below horizon → 1 by ~10°
  const mode = dayFactor < 0.15 ? 'night' : 'day';

  return {
    mode, label, bg, hemi,
    sun: [sunColor, sunInt, [sunPos.x, sunPos.y, sunPos.z]],   // sun[2] stays a spreadable [x,y,z]
    sky, sunC, beam, lamp,
    dayFactor, elevationDeg, sunDir, sunPos,
  };
}

// ---------- current-hour clock (real time + fast-forward + scrub/force) ---------
let _ffBase = null;   // { hour, t } latched when __timeScale first exceeds 1
function nowMs() { return (typeof performance !== 'undefined') ? performance.now() : Date.now(); }
function realHour() { const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }

// __FORCE_TIME / localStorage('forceTime') → a fixed PRE-warp anchor hour.
let _warnedForce = false;
function forceTimeHour() {
  let f = '';
  try {
    f = (W.__FORCE_TIME || '').toString().toLowerCase();
    if (!f && typeof localStorage !== 'undefined') f = (localStorage.getItem('forceTime') || '').toLowerCase();
  } catch (e) {}
  if (f && !_warnedForce) {
    _warnedForce = true;
    try { console.warn(`[solar] time OVERRIDE active: '${f}' — real clock ignored. Clear with localStorage.removeItem('forceTime') + reload.`); } catch (e) {}
  }
  if (f === 'day') return 13;
  if (f === 'morning') return 7;
  if (f === 'golden') return 18;
  if (f === 'night') return 23;
  return null;
}

// The hour fed to solarState each frame. Precedence: explicit scrub/force hour →
// __FORCE_TIME preset → real local clock (optionally sped up by __timeScale).
export function currentHour() {
  if (typeof W.__FORCE_HOUR === 'number' && isFinite(W.__FORCE_HOUR)) return norm24(W.__FORCE_HOUR);
  const ft = forceTimeHour();
  if (ft !== null) return ft;
  const scale = numOr(W.__timeScale, 1);
  if (scale <= 1) { _ffBase = null; return realHour(); }
  if (!_ffBase) _ffBase = { hour: realHour(), t: nowMs() };
  const elapsedH = ((nowMs() - _ffBase.t) / 3600000) * scale;
  return norm24(_ffBase.hour + elapsedH);
}

// Console helper: latch a scrub hour (persists across frames until you clear it
// with `window.__FORCE_HOUR = null`) and log the resulting state for eyeballing.
if (typeof window !== 'undefined') {
  window.__scrub = (h) => {
    window.__FORCE_HOUR = norm24(h);
    const s = solarState(window.__FORCE_HOUR);
    try {
      console.log(`[scrub] h=${window.__FORCE_HOUR.toFixed(2)} elev=${s.elevationDeg.toFixed(1)}° mode=${s.mode} ` +
        `sun=#${(s.sun[0] >>> 0).toString(16).padStart(6, '0')} dayFactor=${s.dayFactor.toFixed(2)}`);
    } catch (e) {}
    return s;
  };
}
