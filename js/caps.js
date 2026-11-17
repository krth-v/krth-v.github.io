// caps.js — capability tiers: ONE place for every quality decision.
//
// detectCaps() classifies the device into a `high | mid | low` tier and returns a
// frozen settings object, also parked on `window.__caps`. Every downstream module
// (lighting shadow sizes, PMREM cadence, post-pass sample counts, DPR cap, shadow
// refresh cadence) reads `window.__caps` rather than sniffing the device itself, so
// the whole pipeline scales from one decision.
//
// Force a tier for testing with `window.__FORCE_TIER` or, to survive a reload,
// `localStorage.setItem('forceTier', 'high'|'mid'|'low')`.

// The tier table (exact values are the contract; see LIGHTING_REVAMP_PLAN.md 0a).
const TIERS = {
  high: { tier: 'high', sunShadowSize: 4096, windowShadowSize: 2048, lampShadowSize: 1024, screenShadowSize: 2048, pmremEverySec: 8,        godrays: true,  godraySamples: 32, gtaoSamples: 16, bloom: true, smaa: true, pixelRatioCap: 1.5,  shadowUpdateEvery: 2, textureAnisotropy: 8, hearthTongues: 12, hearthRows: 8, hearthEmbers: 24, hearthPigmentSamples: 2 },
  mid:  { tier: 'mid',  sunShadowSize: 2048, windowShadowSize: 1024, lampShadowSize: 512,  screenShadowSize: 1024, pmremEverySec: 20,       godrays: true,  godraySamples: 16, gtaoSamples: 12, bloom: true, smaa: true, pixelRatioCap: 1.25, shadowUpdateEvery: 4, textureAnisotropy: 4, hearthTongues: 9,  hearthRows: 7, hearthEmbers: 16, hearthPigmentSamples: 1 },
  low:  { tier: 'low',  sunShadowSize: 1024, windowShadowSize: 512,  lampShadowSize: 512,  screenShadowSize: 1024, pmremEverySec: Infinity, godrays: false, godraySamples: 0,  gtaoSamples: 8,  bloom: true, smaa: true, pixelRatioCap: 1.0,  shadowUpdateEvery: 8, textureAnisotropy: 2, hearthTongues: 6,  hearthRows: 6, hearthEmbers: 10, hearthPigmentSamples: 1 },
};

function readForcedTier() {
  try {
    let f = ((typeof window !== 'undefined' && window.__FORCE_TIER) || '').toString().toLowerCase();
    if (!f && typeof localStorage !== 'undefined') f = (localStorage.getItem('forceTier') || '').toLowerCase();
    if (f === 'high' || f === 'mid' || f === 'low') return f;
  } catch (e) {}
  return null;
}

// UNMASKED_RENDERER string, or null when unavailable (privacy mode / no extension).
function unmaskedRenderer() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) return null;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (!dbg) return null;
    const s = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
    return (typeof s === 'string' && s) ? s : null;
  } catch (e) { return null; }
}

// Map the GPU string (+ a few coarse signals) to a tier. Renderer null (privacy
// mode) → 'mid' per the plan.
function classify(rendererStr, sig) {
  if (!rendererStr) return 'mid';
  const r = rendererStr.toLowerCase();
  // software rasterizers — never try to run the full pipeline
  if (r.includes('swiftshader') || r.includes('llvmpipe') || r.includes('software')) return 'low';
  // mobile GPUs — desktop-first design leans these onto the low tier
  if (r.includes('adreno') || r.includes('mali') || r.includes('powervr')) return 'low';
  // Apple GPUs: M-series in a laptop (fine pointer) → high; touch iPad/iPhone → mid
  if (r.includes('apple')) return sig.coarse ? 'mid' : 'high';
  // discrete desktop GPUs
  if (r.includes('nvidia') || r.includes('geforce') || r.includes('radeon') || r.includes('amd') || r.includes('arc')) return 'high';
  // Intel integrated
  if (r.includes('intel')) return 'mid';
  // unknown desktop — nudge down on thin hardware, else middle of the road
  if ((sig.cores && sig.cores <= 4) || (sig.memory && sig.memory <= 4)) return 'low';
  return 'mid';
}

export function detectCaps() {
  const forced = readForcedTier();
  const coarse = (() => { try { return !!(window.matchMedia && window.matchMedia('(pointer:coarse)').matches); } catch (e) { return false; } })();
  const touch  = (() => { try { return (navigator.maxTouchPoints || 0) > 0; } catch (e) { return false; } })();
  const dpr    = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const cores  = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 0;
  const memory = (typeof navigator !== 'undefined' && navigator.deviceMemory) || 0;
  const rendererStr = unmaskedRenderer();

  const tierName = forced || classify(rendererStr, { coarse: coarse || touch, cores, memory });
  const base = TIERS[tierName] || TIERS.mid;

  const caps = Object.freeze({
    ...base,
    forced: !!forced,
    coarse, touch, dpr, cores, memory,
    renderer: rendererStr,
  });
  try { if (typeof window !== 'undefined') window.__caps = caps; } catch (e) {}
  return caps;
}
