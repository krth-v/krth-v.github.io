// The forest's quality settings per device tier, and the governor that keeps
// the frame rate. The tier itself comes from window.__caps (js/caps.js), which
// stays the only place a device is classified.

// What a view may hold. Triangles are not what a frame costs on this GPU:
// placeholders with 850k solid and 570k foliage triangles in view cost less
// than the painted plants do with 600k and 280k. Pixels are: cut-out cards
// that overlap, and the multisampled target.
export const CEILINGS = { foliageTriangles: 550000, solidTriangles: 900000, drawCalls: 120, frameMs: 12 };

// Measured on the M4 at 2560x1440 (tools/verify_forest.mjs, 2026-11-13). With
// placeholder content multisampling cost about 3.5 ms at 4x and 1.5 ms at 2x; a
// depth pre-pass for foliage saved nothing on this tile-based GPU, so it is
// off; twelve shaft steps cost about 0.3 ms. With the painted plants of
// milestone 1 a frame at 4x cost 10.0 ms (11.6 at the 95th percentile), too
// close to the 12 ms ceiling with five scenes and the animals still to come,
// and 8.1 ms (9.7) at 2x with no difference to see in a still. So the high
// tier draws at 2x; forest.html?msaa=4 shows the other.
// `hand` is how much of the stretch over which foliage hands over between detail levels is used, and `tail` how
// much of the stretch over which a plant shrinks away at its limit (world/instancer.js). Shorter costs fewer
// triangles and makes the change quicker; nothing switches at any length. Every tier uses the whole of both:
// the lower tiers draw few enough plants to afford it, and their hand-overs happen nearer the walker
// (`lodScale`), where a quick change shows most. forest.html?hand=0.5&tail=0.5 shows what shorter does.
// `mirror` is how the river finds what it mirrors (light/materials.js WATER_FRAG): how many steps a mirrored
// ray is followed over the map of the banks, and how many times longer each step is than the last, so that
// the last of them is 280 m out whatever their number. Fewer steps are fewer reads, and a softer mirrored edge.
// `scenePixels`, where a tier gives it, is the most pixels its HDR scene is drawn at: a larger drawing buffer is drawn
// smaller and scaled up in the final pass (post.js sizeTargets). The high tier gives none: its forest is drawn at
// the drawing buffer's own size, as it was approved, and only the governor trims it when frames come late. (It was
// 1440x810 for a day, 2026-11-18, and the owner rejected the picture: "A lot of the texture and density of nature
// and the quality of the light is degraded.") The mid and low tiers keep a budget for a screen larger than a
// laptop's, which their GPUs never drew in time.
const TIERS = {
  high: { msaa: 2, prepass: false, shaftSteps: 12, bloom: true, sunMap: 4096, density: 1.0, lodScale: 1.0, hand: 1.0, tail: 1.0, minScale: 0.7, mirror: [12, 1.6] },
  mid:  { scenePixels: 1920 * 1200, msaa: 2, prepass: false, shaftSteps: 6,  bloom: true, sunMap: 2048, density: 0.7, lodScale: 0.8, hand: 1.0, tail: 1.0, minScale: 0.6, mirror: [8, 2.09] },
  low:  { scenePixels: 1440 * 900, msaa: 0, prepass: false, shaftSteps: 0,  bloom: false, sunMap: 1024, density: 0.5, lodScale: 0.6, hand: 1.0, tail: 1.0, minScale: 0.5, mirror: [5, 3.64] },
};

export function forestSettings(overrides = {}) {
  const tier = (typeof window !== 'undefined' && window.__caps && window.__caps.tier) || 'mid';
  const settings = { tier, ...(TIERS[tier] || TIERS.mid) };
  for (const [k, v] of Object.entries(overrides)) if (v !== undefined && k in settings) settings[k] = v;
  return settings;
}

// GPU time for a frame, where the browser exposes it. Returns null otherwise.
export function createGpuTimer(gl) {
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (!ext) return null;
  const pending = [];
  let active = null, last = 0;
  return {
    begin() {
      if (active) return;
      active = gl.createQuery();
      gl.beginQuery(ext.TIME_ELAPSED_EXT, active);
    },
    end() {
      if (!active) return;
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      pending.push(active);
      active = null;
      while (pending.length && gl.getQueryParameter(pending[0], gl.QUERY_RESULT_AVAILABLE)) {
        const query = pending.shift();
        if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) last = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6;
        gl.deleteQuery(query);
      }
    },
    get ms() { return last; },
  };
}

// Holds 60 fps by trimming render scale. A frame that takes more than about one
// and a half refresh intervals counts as missed. Several misses in a short
// window step the scale down; a long clean run lets it creep back up.
export function createGovernor({ minScale, onScale }) {
  let scale = 1, misses = 0, clean = 0, window_ = 0;
  return {
    get scale() { return scale; },
    frame(dtMs) {
      window_ += 1;
      if (dtMs > 25) { misses += 1; clean = 0; } else clean += 1;
      if (window_ >= 45) {
        if (misses >= 6 && scale > minScale) { scale = Math.max(minScale, scale - 0.1); onScale(scale); clean = 0; }
        misses = 0; window_ = 0;
      }
      if (clean >= 600 && scale < 1) { scale = Math.min(1, scale + 0.05); onScale(scale); clean = 0; }
    },
  };
}
