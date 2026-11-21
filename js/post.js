import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// ============================================================================
// POST-PROCESSING — architectural-visualization quality pass (2026 redesign).
//
// An EffectComposer chain that turns the lit scene into a finished, premium
// frame. Order (linear HDR → graded display):
//
//   RenderPass   — the lit scene into a HalfFloat (HDR) target.
//   GTAOPass     — soft contact occlusion: the single biggest realism win.
//                  Grounds every object (corners, under the desk, between books).
//                  Needs STANDARD depth, so main.js turns the renderer's
//                  logarithmicDepthBuffer OFF.
//   God-rays     — screen-space radial-blur window shafts (see GodrayShader),
//                  after GTAO so they never taint the depth prepass.
//   UnrealBloom  — window/screen glow: driven per-frame by dayFactor (dramatic at
//                  night, restrained by day) via post.applyTime().
//   OutputPass   — tone mapping (AgX, read from renderer.toneMapping) + sRGB.
//                  Tone mapping happens HERE, once, at the end of the chain.
//                  Exposure alone is driven by dayFactor (AgX is retained).
//   SMAAPass     — anti-aliasing for the composited image (post pipelines can't
//                  rely on the renderer's MSAA).
//   Grade        — a soft vignette in display space (no film grain): the calm,
//                  filmic, museum-print finish, deepening slightly at night.
//
// Cost is per-frame, but the whole pipeline is gated by main.js's existing
// render-skip (panels / laptop overlay up → composer not rendered → GPU rests).
// Every pass is exposed for live tuning via window.__post.
// ============================================================================

// ---------------------------------------------------------------------------
// God-rays — screen-space radial blur ("volumetric light scattering"), additive.
//
// A post pass (NOT in-scene quads) so it can never pollute GTAO's depth/normal
// prepass (which uses scene.overrideMaterial and treats transparent quads as
// solid occluders — the reason the old shaft quads had to be force-hidden). It
// samples the already-lit frame along the ray from each pixel toward the window's
// screen position, accumulating the bright aperture into soft shafts. Inserted
// after GTAO and before UnrealBloom, so shafts pick up bloom but stay out of the
// depth prepass. uStrength is driven per-frame by main.js from dayFactor /
// elevationDeg / the camState gate (0 in birding & computer modes).
const GODRAY_STRENGTH = 0;
const GODRAY_MAX_SAMPLES = 32;
const GodrayShader = {
  uniforms: {
    tDiffuse:        { value: null },
    uLightScreenPos: { value: new THREE.Vector2(0.5, 0.85) },   // window center in screen UV
    uSamples:        { value: 16 },     // caps.godraySamples (loop is bounded by GODRAY_MAX_SAMPLES)
    uDensity:        { value: 0.6 },    // how far the ray reaches toward the light
    uDecay:          { value: 0.95 },   // per-step falloff along the ray
    uWeight:         { value: 0.3 },    // per-sample contribution
    uStrength:       { value: 0.0 },    // overall gain (0 = pass is a no-op)
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec2 uLightScreenPos;
    uniform float uSamples, uDensity, uDecay, uWeight, uStrength;
    varying vec2 vUv;
    void main(){
      vec4 base = texture2D(tDiffuse, vUv);
      if (uStrength <= 0.0) { gl_FragColor = base; return; }
      float samples = uSamples;
      vec2 texCoord = vUv;
      vec2 delta = (vUv - uLightScreenPos) * (uDensity / samples);
      float decay = 1.0;
      vec3 accum = vec3(0.0);
      for (int i = 0; i < ${GODRAY_MAX_SAMPLES}; i++) {
        if (float(i) >= samples) break;
        texCoord -= delta;
        vec3 s = texture2D(tDiffuse, texCoord).rgb * (decay * uWeight);
        accum += s;
        decay *= uDecay;
      }
      // Normalize by the sample count: this pass runs on the LINEAR HDR frame
      // (pre-AgX), where the daylit window reads ≫1, so a raw sum over samples
      // blows out. Averaging keeps uStrength a true, subtle blend gain.
      accum /= samples;
      gl_FragColor = vec4(base.rgb + accum * uStrength, base.a);
    }
  `,
};

// soft vignette, applied AFTER tone mapping (display space). Film grain removed
// in the 2026 rebuild; uVignette is driven per-frame by dayFactor (post.applyTime).
const GradeShader = {
  uniforms: {
    tDiffuse:    { value: null },
    uVignette:   { value: 0.26 },  // corner darkening (0 = off)
    uSaturation: { value: 1.0 },   // Patch 3 (R4/L2): display-space sat — AgX greys the lit wall; >1 restores it
    uContrast:   { value: 1.0 },   // Patch 3 (L2): pivot contrast — separates beam/shadow populations post-tonemap
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uVignette;
    uniform float uSaturation; uniform float uContrast;
    varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      // two-value grade: pivot sits between the shadow and beam populations, so
      // contrast pushes them apart instead of crushing either end
      c.rgb = (c.rgb - 0.40) * uContrast + 0.40;
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb = clamp(mix(vec3(l), c.rgb, uSaturation), 0.0, 1.0);
      // soft circular vignette
      vec2 d = vUv - 0.5;
      float vig = 1.0 - smoothstep(0.30, 0.95, length(d) * 1.414);
      c.rgb *= mix(1.0 - uVignette, 1.0, vig);
      gl_FragColor = c;
    }
  `,
};

// The room's ambient occlusion, drawn again only when what it is drawn from has changed (2026-11-19).
//
// The occlusion is worked out from the scene's depth and normals and the camera, and from nothing else: not the
// lamp, the fire's light, the hour or the forest in the window. It was half the desk's frame (two full-size passes of
// 16 samples a pixel and a redraw of the scene), drawn every frame to the same texels while the visitor sat still.
// Here each frame takes a snapshot of what three has just uploaded for this camera (its matrices, and for every
// visible mesh in the view that takes part in override passes: which mesh, which geometry, its vertices' version, its
// model-view and normal matrices) and, when that equals the last frame's, keeps the last occlusion. The occlusion is
// then multiplied straight onto the room's buffer, where three copied the buffer first and multiplied onto the copy.
// The picture is the same to the last pixel either way (driven through 1,252 frames with the fire burning: a pan, a
// book tipped out, the lamp toggled; each frame drawn both ways and read back whole: none differed).
//
// What it would not notice, if the room ever had one: a mesh that changes shape with neither its matrices nor its
// vertices' version changing (morph targets, skinning, an instanced mesh's own matrices). A mesh that leaves itself
// out of override passes says so with `userData.noOverride` (the fire's flame and embers: hearth.js).
class RoomOcclusionPass extends GTAOPass {
  constructor(scene, camera, width, height) {
    super(scene, camera, width, height);
    this.needsSwap = false;
    this.kept = false; this.reused = 0; this.redrawn = 0;
    this.was = new Float32Array(8192); this.now = new Float32Array(8192); this.wasCount = -1;
    this.frustum = new THREE.Frustum(); this.viewProjection = new THREE.Matrix4();
  }
  setSize(width, height) { super.setSize(width, height); this.kept = false; }
  updateGtaoMaterial(parameters) { super.updateGtaoMaterial(parameters); this.kept = false; }
  updatePdMaterial(parameters) { super.updatePdMaterial(parameters); this.kept = false; }
  // Whether what the occlusion is drawn from is, number for number, what it was a frame ago.
  unchanged() {
    const camera = this.camera;
    let n = 0;
    const put = (v) => { if (n >= this.now.length) { const grown = new Float32Array(this.now.length * 2); grown.set(this.now); this.now = grown; } this.now[n++] = v; };
    for (const matrix of [camera.projectionMatrix, camera.projectionMatrixInverse, camera.matrixWorld]) for (const e of matrix.elements) put(e);
    put(this.width); put(this.height); put(camera.near); put(camera.far);
    // (only what the view holds: three's shadow pass writes a model-view matrix for casters outside it too)
    this.frustum.setFromProjectionMatrix(this.viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    this.scene.traverseVisible((object) => {
      if (!object.isMesh || object.userData.noOverride || !object.layers.test(camera.layers)) return;
      if (object.frustumCulled && !this.frustum.intersectsObject(object)) return;
      const position = object.geometry.attributes.position;
      put(object.id); put(object.geometry.id); put(position ? position.version : -1);
      for (const e of object.modelViewMatrix.elements) put(e);
      for (const e of object.normalMatrix.elements) put(e);
    });
    let same = n === this.wasCount;
    if (same) for (let i = 0; i < n; i += 1) if (this.now[i] !== this.was[i]) { same = false; break; }
    const spare = this.was; this.was = this.now; this.now = spare; this.wasCount = n;
    return same;
  }
  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    // (any other output is three's own, drawn in full into the other buffer)
    if (this.output !== GTAOPass.OUTPUT.Default || this.renderToScreen) {
      this.needsSwap = true; this.kept = false;
      super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
      return;
    }
    this.needsSwap = false;
    const same = this.unchanged();
    if (same && this.kept) this.reused += 1;
    else {
      this.redrawn += 1;
      // exactly as three draws them: normals and depth, the occlusion, its denoise
      if (this._renderGBuffer) {
        this.overrideVisibility();
        this.renderOverride(renderer, this.normalMaterial, this.normalRenderTarget, 0x7777ff, 1.0);
        this.restoreVisibility();
      }
      const u = this.gtaoMaterial.uniforms;
      u.cameraNear.value = this.camera.near; u.cameraFar.value = this.camera.far;
      u.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix);
      u.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse);
      u.cameraWorldMatrix.value.copy(this.camera.matrixWorld);
      this.renderPass(renderer, this.gtaoMaterial, this.gtaoRenderTarget, 0xffffff, 1.0);
      this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse);
      this.renderPass(renderer, this.pdMaterial, this.pdRenderTarget, 0xffffff, 1.0);
      this.kept = true;
    }
    this.blendMaterial.uniforms.intensity.value = this.blendIntensity;
    this.blendMaterial.uniforms.tDiffuse.value = this.pdRenderTarget.texture;
    this.renderPass(renderer, this.blendMaterial, readBuffer);
  }
}

export function buildPostProcessing(renderer, scene, camera, opts = {}) {
  const caps = (typeof window !== 'undefined' && window.__caps) || {};
  const godraySamples = (typeof caps.godraySamples === 'number') ? caps.godraySamples : 16;
  const gtaoSamples = (typeof caps.gtaoSamples === 'number') ? caps.gtaoSamples : 16;
  const POST = Object.assign(
    { gtao: true, godrays: caps.godrays !== false && godraySamples > 0, bloom: true, smaa: true, grade: true },
    opts,
  );

  const ds   = renderer.getDrawingBufferSize(new THREE.Vector2());   // device px
  const size = renderer.getSize(new THREE.Vector2());                // CSS px

  // Explicit HDR target so bloom has real >1 values and we never depend on the
  // default target type varying across three versions.
  const rt = new THREE.WebGLRenderTarget(ds.x, ds.y, { type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(renderer.getPixelRatio());                  // custom RT → must set explicitly

  composer.addPass(new RenderPass(scene, camera));

  // --- GTAO: soft contact occlusion (needs standard depth) ---
  // (At full size. For a day, 2026-11-18, it was drawn at 0.65 of it: the same frozen frame then differed in 1.3 % of
  // its pixels by more than 10 levels of 255, along the edges of every contact shadow, and the owner rejected that
  // pass's picture: "the quality of the light is degraded".)
  const gtao = new RoomOcclusionPass(scene, camera, ds.x, ds.y);
  gtao.output = GTAOPass.OUTPUT.Default;
  gtao.blendIntensity = 0.9;                       // driven per-frame by applyTime()
  gtao.updateGtaoMaterial({
    radius: 0.28, distanceExponent: 1.0, thickness: 1.0, scale: 1.0,
    samples: gtaoSamples, distanceFallOff: 1.0, screenSpaceRadius: false,
  });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: gtaoSamples });
  gtao.enabled = POST.gtao;
  composer.addPass(gtao);

  // --- God-rays: soft window shafts (after GTAO, before bloom) ---
  const godray = new ShaderPass(GodrayShader);
  godray.uniforms.uSamples.value = Math.min(godraySamples, GODRAY_MAX_SAMPLES);
  godray.enabled = POST.godrays && GODRAY_STRENGTH > 0;
  composer.addPass(godray);

  // --- Bloom: window / screen glow (strength + threshold driven by applyTime) ---
  const bloom = new UnrealBloomPass(new THREE.Vector2(ds.x, ds.y), 0.06, 0.4, 1.1);   // strength, radius, threshold
  bloom.enabled = POST.bloom;
  composer.addPass(bloom);

  // --- tone map (AgX) + sRGB ---
  composer.addPass(new OutputPass());

  // --- anti-aliasing ---
  const smaa = new SMAAPass(ds.x, ds.y);
  smaa.enabled = POST.smaa;
  composer.addPass(smaa);

  // These passes' own targets are only ever drawn to with a full-screen triangle, and three gives each a depth buffer
  // unless told otherwise: fifteen of them, kept and cleared for nothing (about 72 MB at 2560x1440). A target's
  // buffers are made on first use and again after setSize, by this flag.
  for (const target of [gtao.gtaoRenderTarget, gtao.pdRenderTarget, bloom.renderTargetBright, ...bloom.renderTargetsHorizontal, ...bloom.renderTargetsVertical, smaa.edgesRT, smaa.weightsRT]) {
    if (target) target.depthBuffer = false;
  }

  // --- vignette (display space) ---
  const grade = new ShaderPass(GradeShader);
  grade.enabled = POST.grade;
  composer.addPass(grade);

  composer.setSize(size.x, size.y);

  function setSize(w, h) {
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
  }
  function render() {
    composer.render();
  }

  // Per-frame cinematic grade driven by dayFactor (0 night → 1 day). AgX tone
  // mapping is RETAINED — only its exposure moves. Bloom blooms dramatically at
  // night (lamp/screen/window), restrained by day; GTAO deepens slightly at
  // night; the vignette closes in a touch at night.
  const { lerp, clamp } = THREE.MathUtils;
  function applyTime(state) {
    const df = clamp((state && typeof state.dayFactor === 'number') ? state.dayFactor : 1, 0, 1);
    renderer.toneMappingExposure = lerp(0.72, 0.72, df);
    bloom.strength = lerp(0.25, 0.06, df);
    bloom.threshold = lerp(0.9, 1.15, df);                 // emitters only (bulb, LED, screen) — spec §9
    gtao.blendIntensity = lerp(1.25, 1.10, df);
    grade.uniforms.uVignette.value = lerp(0.36, 0.30, df);
    // Preserve the painted albedo's neutral browns. The retired high-contrast,
    // high-saturation grade clipped green/blue out of shaded wood, turning the
    // entire room crimson. Direct sunlight already supplies the two-value read.
    grade.uniforms.uSaturation.value = lerp(1.02, 1.08, df);
    grade.uniforms.uContrast.value = lerp(1.00, 1.04, df);
  }

  // Per-frame god-ray drive. main.js feeds the window's screen-space position,
  // dayFactor, elevationDeg and the on-screen/room gate; we fold in the low-sun
  // boost here so shafts are bold at raking angles and muted near noon:
  //   uStrength = GODRAY_STRENGTH * dayFactor * lowSunBoost * onScreen
  //   lowSunBoost = mix(1.0, 0.45, smoothstep(10°, 45°, elevationDeg))
  // Patch 1 (L1): GODRAY_STRENGTH 0.12 → 0 — the radial smear read as a second
  // soft light patch on the wall. Raise to restore shafts.
  function setGodray(screenX, screenY, dayFactor, elevationDeg, onScreen) {
    if (!godray.enabled) return;
    godray.uniforms.uLightScreenPos.value.set(screenX, screenY);
    const lowSunBoost = THREE.MathUtils.lerp(1.0, 0.45, THREE.MathUtils.smoothstep(elevationDeg, 10, 45));
    godray.uniforms.uStrength.value = GODRAY_STRENGTH * dayFactor * lowSunBoost * (onScreen ? 1 : 0);
  }

  return { composer, render, setSize, setGodray, applyTime, POST, passes: { gtao, godray, bloom, smaa, grade } };
}
