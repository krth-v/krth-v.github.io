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

// Holds 60 fps by trimming render scale, and gives the scale back. A frame is late when its interval is more than
// one and a half of the display's own (learned: the lower quartile of the last 120 intervals) and more than 25 ms.
// Two runs of 45 frames in a row with six late frames in each step the scale down by a tenth.
//
// Until 2026-11-19 late meant "over 25 ms", whatever the display's pace; one such run of 45 was enough; and a step up
// needed 600 frames in a row with none late. So a browser drawing 30 frames a second (a power-saving mode) had its
// forest at 0.7 of its size within three seconds for no faster frame, and one late frame in 500 kept it there for
// good: the softness the owner rejected, brought back unasked. Now:
//   - the display's own pace is learned first, so a steady 30 Hz is not lateness, and one hitch is not an overload;
//   - a step down is a trial: if the next 90 frames are no better than the frames that caused it, the least scale
//     there is is tried for 90 more, and if that does not help either the smaller picture is no cure: the scale is
//     given back whole, and no step down is tried for 30 s (then a minute, two, up to eight);
//   - a step up of a twentieth comes when fewer than two of the last 600 frames were late. One that has to be
//     undone goes back to where it was, and that scale is then tried again only after twice as long, four times,
//     up to sixteen (160 s at 60 Hz), until it holds;
//   - `excused` frames are not counted: the caller knows of a cost the scale cannot cure (the sun's map redrawn, a
//     frame after the page was away).
export function createGovernor({ minScale, onScale }) {
  let scale = 1, pace = 16.7, hold = 0, rest = 30000, counted = 0;
  let window_ = 0, misses = 0, strikes = 0;    // the runs of 45 frames that can step it down
  let trial = null;                            // after a step down: { frames, late, was (the share late before), from }
  let since = 0, lateSince = 0;                // counted frames since the scale last changed, and the late ones among them
  let raisedFrom = null;                       // the scale before the last change, if that change was a step up
  let ceiling = null, wait = 1;                // a scale that proved too much, and how many runs of 600 frames a step up to it waits for
  const recent = [];
  const set = (next) => { scale = next; since = 0; lateSince = 0; window_ = 0; misses = 0; strikes = 0; onScale(scale); };
  return {
    get scale() { return scale; },
    get pace() { return pace; },
    frame(dtMs, excused = false) {
      if (excused || !(dtMs > 0)) return;
      hold -= dtMs;
      recent.push(dtMs);
      if (recent.length > 120) recent.shift();
      counted += 1;
      if (counted % 30 === 0) pace = [...recent].sort((a, b) => a - b)[recent.length >> 2];
      if (counted < 30) return;                // (the display's pace is not known yet)
      const late = dtMs > Math.max(25, 1.5 * pace);
      since += 1; if (late) lateSince += 1;
      if (trial) {
        trial.frames += 1; if (late) trial.late += 1;
        if (trial.frames >= 90) {
          const helped = trial.late / 90 < 0.75 * trial.was, { from, was } = trial;
          trial = null;
          // (a tenth less did not help: the least there is is tried once, and if that does not help either the
          // picture is given back whole)
          if (!helped && scale > minScale + 1e-6) { set(minScale); trial = { frames: 0, late: 0, was, from }; }
          else if (!helped) { hold = rest; rest = Math.min(480000, rest * 2); set(from); }
          else rest = 30000;
        }
        return;
      }
      window_ += 1; if (late) misses += 1;
      if (window_ >= 45) {
        const was = misses / 45;
        strikes = misses >= 6 ? strikes + 1 : 0;
        window_ = 0; misses = 0;
        if (raisedFrom != null && since <= 600 && strikes >= 1 && scale > minScale) {
          // the step up was too much: back to where it was, and this scale is not tried again so soon
          wait = ceiling != null && Math.abs(ceiling - scale) < 1e-6 ? Math.min(16, wait * 2) : 2;
          ceiling = scale;
          const back = raisedFrom; raisedFrom = null;
          set(back);
          return;
        }
        if (strikes >= 2 && scale > minScale && hold <= 0) {
          const from = scale;
          raisedFrom = null;
          set(Math.max(minScale, scale - 0.1));
          trial = { frames: 0, late: 0, was, from };
          return;
        }
      }
      if (scale < 1) {
        const next = Math.min(1, scale + 0.05), runs = ceiling != null && next > ceiling - 1e-6 ? wait : 1;
        if (since >= 600 * runs) {
          if (lateSince < 2 * runs) {
            // (the last step up, to a scale that had once been too much, has held: it is one no longer)
            if (raisedFrom != null && ceiling != null && scale > ceiling - 1e-6) { ceiling = null; wait = 1; }
            raisedFrom = scale;
            set(next);
          } else { since = 0; lateSince = 0; }
        }
      }
    },
  };
}
