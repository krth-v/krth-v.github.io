import * as THREE from 'three';

// Painterly hearth fire for the Blender-authored HearthAccent assembly.
//
// The flame is the standard stylized-VFX construction (Cyanilux fire
// breakdown / RealTimeVFX consensus): a fixed teardrop mask eroded by
// upward-scrolling noise, posterized into hard pigment bands. Everything
// animates inside the fragment shader as a FIELD — licks continuously grow,
// pinch off and dissolve as the noise advects through the mask — so the fire
// flows instead of morphing discrete silhouettes (the previous CPU tongue
// mesh read as paper cutouts sliding around). Two to three parallel quads,
// stepped back into the firebox with phase-shifted noise, give cheap
// parallax depth behind the grate; the whole flame is one draw call and
// costs no per-frame CPU beyond three uniform writes.
//
// The quads are opaque and depth-writing with `discard` outside the flame,
// so the beauty pass sees the true silhouette. GTAO's override-material
// prepass would rasterize them as solid rectangles, so — like the embers —
// they skip every overrideMaterial pass; an emissive flame wants no AO of
// its own. Embers stay a fixed InstancedMesh pool and the only live fire
// light remains a broad, unshadowed spotlight plus the facade fill cone.

const DEFAULT_SEED = 0x6d2b79f5;
const FIRE_DISTANCE = 2.8;
const FIRE_DAY_INTENSITY = 1.4;
const FIRE_NIGHT_INTENSITY = 2.8;
const FACADE_DAY_INTENSITY = 0.10;
const FACADE_NIGHT_INTENSITY = 0.48;
const PAUSE_GAP_SECONDS = 0.25;

// Depth-stacked flame planes, deepest last. `depth` steps back toward the
// firebox rear wall (room side is +x, the wall sits ~0.45 m behind the
// front plane); `scale` shrinks the rear flames; `drift` nudges them off
// the shared centerline so the three silhouettes never read as one shape.
const FLAME_LAYERS = [
  { depth: 0.0, scale: 1.0, drift: 0.0 },
  { depth: -0.16, scale: 0.84, drift: 0.06 },
  { depth: -0.30, scale: 0.68, drift: -0.07 },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function quintic(value) {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function hash32(value) {
  let x = value | 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
}

function random01(seed, slot, epoch, lane) {
  const value = (seed | 0)
    ^ Math.imul((slot + 1) | 0, 0x9e3779b1)
    ^ Math.imul(epoch | 0, 0x85ebca6b)
    ^ Math.imul((lane + 1) | 0, 0xc2b2ae35);
  return hash32(value) / 4294967296;
}

function randomSigned(seed, slot, epoch, lane) {
  return random01(seed, slot, epoch, lane) * 2 - 1;
}

function valueNoise1(seed, value) {
  const cell = Math.floor(value);
  const fraction = value - cell;
  const a = hash32((seed | 0) ^ Math.imul(cell | 0, 0x9e3779b1))
    / 2147483648 - 1;
  const b = hash32((seed | 0) ^ Math.imul((cell + 1) | 0, 0x9e3779b1))
    / 2147483648 - 1;
  return lerp(a, b, quintic(fraction));
}

function regeneratePigment(data, seed, size) {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const coarseX = Math.floor(x / 8);
      const coarseY = Math.floor(y / 8);
      const mediumX = Math.floor(x / 3);
      const mediumY = Math.floor(y / 3);
      const coarse = hash32(
        (seed | 0)
        ^ Math.imul(coarseX + 1, 0x9e3779b1)
        ^ Math.imul(coarseY + 1, 0x85ebca6b),
      ) & 255;
      const medium = hash32(
        (seed | 0)
        ^ Math.imul(mediumX + 1, 0x27d4eb2d)
        ^ Math.imul(mediumY + 1, 0x165667b1),
      ) & 255;
      const tooth = hash32(
        (seed | 0)
        ^ Math.imul(x + 1, 0x1b873593)
        ^ Math.imul(y + 1, 0xcc9e2d51),
      ) & 255;
      data[index] = coarse;
      data[index + 1] = medium;
      data[index + 2] = tooth;
      data[index + 3] = 255;
    }
  }
}

function createPigmentTexture(seed) {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  regeneratePigment(data, seed, size);
  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.name = 'HearthWatercolorPigment';
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createFlameGeometry(layerCount) {
  const positions = new Float32Array(layerCount * 4 * 3);
  const uvs = new Float32Array(layerCount * 4 * 2);
  const layers = new Float32Array(layerCount * 4);
  const indices = new Uint16Array(layerCount * 6);
  for (let i = 0; i < layerCount; i += 1) {
    const v = i * 4;
    uvs.set([0, 0, 1, 0, 1, 1, 0, 1], v * 2);
    layers.fill(i, v, v + 4);
    indices.set([v, v + 1, v + 2, v, v + 2, v + 3], i * 6);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometry;
}

// Places the layer quads inside the measured firebox bounds. Quads carry a
// margin beyond the nominal flame mask so sway and detached licks never hit
// the card edge and betray the rectangle.
function rebuildFlameQuads(geometry, bounds, layerCount) {
  const positions = geometry.attributes.position.array;
  for (let i = 0; i < layerCount; i += 1) {
    const layer = FLAME_LAYERS[i];
    const halfW = bounds.width * 0.62 * layer.scale;
    const x = bounds.depthX + layer.depth;
    const y0 = bounds.rootY + 0.005;
    const y1 = bounds.rootY + bounds.maxHeight * 1.12 * layer.scale;
    const zc = bounds.centerZ + layer.drift * bounds.width;
    positions.set([
      x, y0, zc - halfW,
      x, y0, zc + halfW,
      x, y1, zc + halfW,
      x, y1, zc - halfW,
    ], i * 12);
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

function createFlameMaterial(pigmentTexture, extraOctave) {
  const material = new THREE.ShaderMaterial({
    name: 'HearthWatercolorFlameMaterial',
    uniforms: {
      pigmentMap: { value: pigmentTexture },
      uTime: { value: 0 },
      uEnergy: { value: 1 },
      uSeed: { value: 0 },
    },
    defines: extraOctave ? { FIRE_EXTRA_OCTAVE: 1 } : {},
    vertexShader: [
      'attribute float aLayer;',
      'varying vec2 vUv;',
      'varying float vLayer;',
      'void main() {',
      '  vUv = uv;',
      '  vLayer = aLayer;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}',
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D pigmentMap;',
      'uniform float uTime;',
      'uniform float uEnergy;',
      'uniform float uSeed;',
      'varying vec2 vUv;',
      'varying float vLayer;',
      '',
      'float hash21(vec2 p) {',
      '  p = fract(p * vec2(123.34, 456.21));',
      '  p += dot(p, p + 45.32);',
      '  return fract(p.x * p.y);',
      '}',
      'float vnoise(vec2 p) {',
      '  vec2 i = floor(p);',
      '  vec2 f = fract(p);',
      '  vec2 u = f * f * (3.0 - 2.0 * f);',
      '  float a = hash21(i);',
      '  float b = hash21(i + vec2(1.0, 0.0));',
      '  float c = hash21(i + vec2(0.0, 1.0));',
      '  float d = hash21(i + vec2(1.0, 1.0));',
      '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
      '}',
      'float fbm(vec2 p) {',
      '  float v = vnoise(p) * 0.62 + vnoise(p * 2.13 + 17.7) * 0.26;',
      '#ifdef FIRE_EXTRA_OCTAVE',
      '  v += vnoise(p * 4.31 + 41.3) * 0.12;',
      '#else',
      '  v *= 1.136;',
      '#endif',
      '  return v;',
      '}',
      '',
      // Hue-shifted HDR pigment family (linear, ahead of Bloom + AgX): the
      // three washes of the original palette plus a white-hot bed core.
      'const vec3 OUTER = vec3(0.82, 0.02, 0.004);',
      'const vec3 MIDDLE = vec3(1.08, 0.16, 0.015);',
      'const vec3 CORE = vec3(1.38, 0.56, 0.06);',
      'const vec3 HOT = vec3(1.65, 1.08, 0.28);',
      '',
      'void main() {',
      '  float t = uTime * 1.05 + vLayer * 27.31 + uSeed;',
      // Energy breathes the whole flame height: the same smoothed signal
      // drives the room light flicker, so glow and shape stay in sync.
      '  float energyNorm = clamp((uEnergy - 0.76) / 0.48, 0.0, 1.0);',
      '  float y = vUv.y * mix(1.12, 0.90, energyNorm);',
      '',
      // Whole-body sway: a slow lean plus a faster ripple, both growing with
      // height so the root stays planted in the fuel bed.
      '  float lean = (vnoise(vec2(t * 0.45, vLayer * 7.0)) - 0.5) * 0.30;',
      '  float ripple = sin(t * 2.3 + y * 3.1) * 0.03;',
      '  float px = vUv.x - 0.5 - (lean + ripple) * y;',
      '',
      // Upward advection: one noise field sampled twice at different tiling
      // and speed, scrolling down in uv so features climb through the mask.
      '  float n = fbm(vec2(px * 3.1 + vLayer * 11.0, y * 3.3 - t * 0.9)) * 0.66',
      '          + fbm(vec2(px * 6.4 + vLayer * 23.0 + 31.7, y * 7.0 - t * 1.7)) * 0.34;',
      '',
      // Teardrop mask: rooted narrow in the bed, swelling through the body
      // (peak near y = 0.3) and pinching convexly toward the tip — straight
      // (1-y) profiles posterize into paper triangles.
      '  float rise = clamp(1.0 - y, 0.0, 1.0);',
      '  float w = max(0.42 * pow(rise, 0.55) * (0.62 + 1.8 * y * rise), 0.001);',
      '  float r = abs(px) / w;',
      '  float field = (1.0 - r * r) * (1.0 - 0.22 * y);',
      // Signed erosion: noise both carves the sheet and bellies it outward,
      // so the silhouette waves and sheds licks instead of shrinking a cone.
      '  field -= (n - 0.38) * (0.55 + 1.05 * y);',
      '  field += smoothstep(0.18, 0.0, y) * 0.35 * (1.0 - min(r, 1.0) * 0.8);',
      '  if (field < 0.035) discard;',
      '',
      '  vec3 color = field < 0.24 ? OUTER',
      '    : field < 0.50 ? MIDDLE',
      '    : field < 0.80 ? CORE : HOT;',
      '',
      // Watercolor wash: the shared pigment grain drifts slowly upward so
      // the flat bands keep a painted, slightly uneven fill.
      '  vec4 pigment = texture2D(pigmentMap, vec2(vUv.x * 1.7, vUv.y * 1.3 - uTime * 0.02));',
      '  color *= 0.965 + (pigment.g - 0.5) * 0.07;',
      '',
      // Rear layers dim toward the firebox wall — cheap depth cue.
      '  color *= 1.0 - vLayer * 0.19;',
      '  color *= 0.96 + energyNorm * 0.10;',
      '  gl_FragColor = vec4(color, 1.0);',
      '}',
    ].join('\n'),
    transparent: false,
    depthTest: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  material.userData.__noClay = true;
  return material;
}

function readCaps() {
  const caps = typeof window !== 'undefined' ? window.__caps : null;
  return {
    tier: caps && typeof caps.tier === 'string' ? caps.tier : 'mid',
    embers: caps && Number.isFinite(caps.hearthEmbers) ? caps.hearthEmbers : 16,
    pigmentSamples: caps && Number.isFinite(caps.hearthPigmentSamples)
      ? caps.hearthPigmentSamples
      : 1,
    capsMissing: !caps,
  };
}

export function buildHearthFire() {
  const quality = readCaps();
  const layerCount = quality.tier === 'low' ? 2 : FLAME_LAYERS.length;
  const emberCount = Math.max(1, quality.embers | 0);
  const bounds = {
    // The authored Hearth_Fire_Anchor is world (-4.8645, 0.9856, 4.13) after
    // Blender/glTF axis conversion. These local defaults are replaced by the
    // measured mouth bounds at bind time and keep the flame behind the grate.
    width: 0.70,
    maxHeight: 0.95,
    rootY: -0.39,
    centerZ: 0,
    depthX: 0.045,
  };

  const group = new THREE.Group();
  group.name = 'HearthFireRuntime';

  let seed = DEFAULT_SEED;
  const initialForcedSeed = Number(globalThis.__FORCE_FIRE_SEED);
  if (Number.isFinite(initialForcedSeed)) seed = initialForcedSeed >>> 0;

  const pigmentTexture = createPigmentTexture(seed);
  const flameGeometry = createFlameGeometry(layerCount);
  const flameMaterial = createFlameMaterial(
    pigmentTexture,
    quality.pigmentSamples > 1 || quality.tier === 'high',
  );
  const flame = new THREE.Mesh(flameGeometry, flameMaterial);
  flame.name = 'HearthWatercolorFlameBatch';
  flame.castShadow = false;
  flame.receiveShadow = false;
  flame.renderOrder = 2;
  // GTAO's override-material prepass rasterizes the cards as solid
  // rectangles (discard lives in our material, which the override replaces).
  // Skip every override pass — same trick as the embers below.
  flame.userData.noOverride = true;      // (post.js: what the occlusion is drawn from does not include it)
  flame.onBeforeRender = (_renderer, renderScene) => {
    flameGeometry.setDrawRange(0, renderScene.overrideMaterial ? 0 : Infinity);
  };
  flame.onAfterRender = () => flameGeometry.setDrawRange(0, Infinity);
  group.add(flame);

  // Cast-iron fireback: an opaque charcoal plate just behind the flame
  // cards. Unlike them it DOES render in GTAO's override prepass, so flame
  // pixels inherit this plate's smooth occlusion instead of the rear wall's
  // brick-joint AO, which otherwise prints thin dark lines through the fire.
  // It is deliberately oversized — the edges bury themselves inside the
  // splayed firebox masonry, so only the smooth face is ever on screen.
  const firebackMaterial = new THREE.MeshStandardMaterial({
    name: 'HearthFirebackMaterial',
    color: 0x14100c,
    roughness: 1,
  });
  const fireback = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), firebackMaterial);
  fireback.name = 'HearthFireback';
  fireback.rotation.y = Math.PI / 2;
  fireback.castShadow = false;
  fireback.receiveShadow = false;
  group.add(fireback);

  function refreshFireback() {
    const rear = FLAME_LAYERS[layerCount - 1].depth;
    const height = bounds.maxHeight * 1.12 + 0.16;
    fireback.position.set(
      bounds.depthX + rear - 0.05,
      bounds.rootY + height * 0.5 - 0.06,
      bounds.centerZ,
    );
    fireback.scale.set(bounds.width * 1.24 + 0.3, height, 1);
  }

  rebuildFlameQuads(flameGeometry, bounds, layerCount);
  refreshFireback();

  const emberGeometry = new THREE.IcosahedronGeometry(0.013, 1);
  const emberMaterial = new THREE.MeshBasicMaterial({
    name: 'HearthEmberMaterial',
    color: 0xffffff,
    // Instanced colors are used directly. Enabling geometry vertex colors on
    // an IcosahedronGeometry (which has no `color` attribute) multiplies every
    // mote by WebGL's zero default and turns the sparks black.
    vertexColors: false,
    transparent: false,
    depthTest: true,
    depthWrite: true,
    toneMapped: false,
  });
  emberMaterial.color.setRGB(1.82, 0.48, 0.045);
  emberMaterial.userData.__noClay = true;
  const embers = new THREE.InstancedMesh(emberGeometry, emberMaterial, emberCount);
  embers.name = 'HearthEmbers';
  embers.castShadow = false;
  embers.receiveShadow = false;
  embers.frustumCulled = false;
  embers.renderOrder = 3;
  embers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // GTAO's override-material depth pass interprets tiny foreground sparks as
  // heavy occluders and paints a black halo around them. Skip only that
  // auxiliary pass; the opaque beauty render still depth-tests and writes.
  embers.userData.noOverride = true;
  embers.onBeforeRender = (_renderer, renderScene) => {
    emberGeometry.setDrawRange(
      0,
      renderScene.overrideMaterial ? 0 : Infinity,
    );
  };
  embers.onAfterRender = () => emberGeometry.setDrawRange(0, Infinity);
  group.add(embers);

  const emberMatrix = new THREE.Matrix4();
  const emberColor = new THREE.Color();
  const emberPeriods = new Float32Array(emberCount);
  const emberOffsets = new Float32Array(emberCount);
  for (let i = 0; i < emberCount; i += 1) {
    emberMatrix.makeScale(0, 0, 0);
    emberMatrix.setPosition(bounds.depthX, bounds.rootY, bounds.centerZ);
    embers.setMatrixAt(i, emberMatrix);
    emberColor.setRGB(1, 0.42, 0.06);
    embers.setColorAt(i, emberColor);
  }
  if (embers.instanceColor) embers.instanceColor.setUsage(THREE.DynamicDrawUsage);

  // A broad forward cone avoids the omnidirectional point-light leak through
  // the masonry. It remains unshadowed, preserving the frozen shadow cadence.
  const light = new THREE.SpotLight(
    0xff9a45,
    FIRE_DAY_INTENSITY,
    FIRE_DISTANCE,
    1.15,
    0.85,
    2,
  );
  light.name = 'HearthFireLight';
  light.castShadow = false;
  light.userData.isHearthLight = true;
  light.target.name = 'HearthFireLightTarget';
  group.add(light);
  group.add(light.target);

  // A second, tightly reversed cone grazes the front-facing insert around the
  // opening. The main fire cone points into the room and cannot light that
  // facade without leaking through masonry; this finite backward cone can.
  const facadeLight = new THREE.SpotLight(
    0xff7938,
    FACADE_DAY_INTENSITY,
    1.35,
    0.90,
    1.0,
    2,
  );
  facadeLight.name = 'HearthFacadeFill';
  facadeLight.castShadow = false;
  facadeLight.userData.isHearthLight = true;
  facadeLight.target.name = 'HearthFacadeFillTarget';
  group.add(facadeLight);
  group.add(facadeLight.target);

  const anchorWorld = new THREE.Vector3();
  const lightDim = new THREE.Color(0xff7138);
  const lightBright = new THREE.Color(0xffb65c);

  const debug = {
    bound: false,
    anchorName: null,
    tier: quality.tier,
    capsMissing: quality.capsMissing,
    technique: 'noise-eroded-gradient',
    flameCount: 1,
    flameLayers: layerCount,
    emberCount,
    activeEmbers: 0,
    clayMode: false,
    dayFactor: 1,
    baseIntensity: FIRE_DAY_INTENSITY,
    energyRaw: 1,
    energySmooth: 1,
    flicker: 1,
    intensity: FIRE_DAY_INTENSITY,
    lightType: 'SpotLight',
    lightCount: 2,
    lightAngle: light.angle,
    lightPenumbra: light.penumbra,
    distance: FIRE_DISTANCE,
    castsShadow: false,
    facadeFillType: 'SpotLight',
    facadeFillIntensity: FACADE_DAY_INTENSITY,
    facadeFillCastsShadow: false,
    phaseTime: 0,
    forcedPhase: false,
    seed,
    forcedSeed: Number.isFinite(initialForcedSeed),
    pauseGapSeconds: PAUSE_GAP_SECONDS,
    drawCalls: 2,
    transparentMaterials: 0,
    flameOpaque: true,
    flameDepthWrite: true,
    perFrameAllocations: 0,
    flameWidth: bounds.width,
    maxFlameHeight: bounds.maxHeight,
    rootWorldY: 0.48,
    depthWorldX: -4.935,
  };

  let clayMode = false;
  let baseIntensity = FIRE_DAY_INTENSITY;
  let facadeBaseIntensity = FACADE_DAY_INTENSITY;
  let phaseTime = 0;
  let lastSourceTime = null;
  let lastEnergyPhase = null;
  let energySmooth = 1;

  function configureSeededState() {
    for (let i = 0; i < emberCount; i += 1) {
      emberPeriods[i] = 1.65 + random01(seed, i, 0, 80) * 2.15;
      emberOffsets[i] = random01(seed, i, 0, 81) * emberPeriods[i];
    }
    regeneratePigment(pigmentTexture.image.data, seed, pigmentTexture.image.width);
    pigmentTexture.needsUpdate = true;
    // Decorrelate the shader noise domain without losing float precision.
    flameMaterial.uniforms.uSeed.value = (seed % 4096) * 0.618;
  }

  configureSeededState();

  function setSeed(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return seed;
    const next = numeric >>> 0;
    if (next === seed) return seed;
    seed = next;
    debug.seed = seed;
    configureSeededState();
    lastEnergyPhase = null;
    energySmooth = 1;
    return seed;
  }

  function resolveSeedOverride() {
    const forced = Number(globalThis.__FORCE_FIRE_SEED);
    debug.forcedSeed = Number.isFinite(forced);
    if (Number.isFinite(forced)) setSeed(forced);
  }

  function resolvePhase(sourceTime) {
    const forcedPhase = Number(globalThis.__FORCE_FIRE_PHASE);
    if (Number.isFinite(forcedPhase)) {
      if (Number.isFinite(sourceTime)) lastSourceTime = sourceTime;
      debug.phaseTime = forcedPhase;
      debug.forcedPhase = true;
      return forcedPhase;
    }

    debug.forcedPhase = false;
    if (!Number.isFinite(sourceTime)) return phaseTime;
    if (lastSourceTime !== null) {
      const delta = sourceTime - lastSourceTime;
      // Overlay and hidden-tab gaps are discarded. Animation resumes from the
      // previous local phase rather than jumping by paused wall-clock time.
      if (delta >= 0 && delta <= PAUSE_GAP_SECONDS) phaseTime += delta;
    }
    lastSourceTime = sourceTime;
    debug.phaseTime = phaseTime;
    return phaseTime;
  }

  function setPhaseTime(seconds) {
    if (!Number.isFinite(seconds)) return phaseTime;
    phaseTime = Math.max(0, seconds);
    lastSourceTime = null;
    lastEnergyPhase = null;
    debug.phaseTime = phaseTime;
    return phaseTime;
  }

  function refreshLightPlacement() {
    light.position.set(bounds.depthX - 0.012, bounds.rootY + 0.24, bounds.centerZ);
    light.target.position.set(
      bounds.depthX + 1.45,
      bounds.rootY + 0.08,
      bounds.centerZ,
    );
    facadeLight.position.set(
      bounds.depthX + 0.58,
      bounds.rootY + bounds.maxHeight * 0.54,
      bounds.centerZ,
    );
    facadeLight.target.position.set(
      bounds.depthX - 0.32,
      bounds.rootY + bounds.maxHeight * 0.48,
      bounds.centerZ,
    );
  }

  refreshLightPlacement();

  function applyOptionalBounds(fireBounds, anchor) {
    if (!fireBounds || typeof fireBounds !== 'object') return;
    anchor.updateWorldMatrix(true, false);
    anchor.getWorldPosition(anchorWorld);

    const mouthWidth = Number(fireBounds.mouthWidth);
    const explicitWidth = Number(fireBounds.flameWidth);
    if (Number.isFinite(explicitWidth)) {
      bounds.width = clamp(explicitWidth, 0.40, 1.20);
    } else if (Number.isFinite(mouthWidth)) {
      bounds.width = clamp(mouthWidth * 0.84, 0.52, 1.10);
    }

    const floorY = Number(fireBounds.floorY);
    const apexY = Number(fireBounds.apexY);
    const explicitHeight = Number(fireBounds.flameHeight);
    if (Number.isFinite(floorY)) bounds.rootY = floorY - anchorWorld.y - 0.015;
    if (Number.isFinite(explicitHeight)) {
      bounds.maxHeight = clamp(explicitHeight, 0.40, 1.45);
    } else if (Number.isFinite(floorY) && Number.isFinite(apexY)) {
      bounds.maxHeight = clamp((apexY - floorY) * 0.76, 0.45, 1.35);
    }

    const minZ = Number(fireBounds.minZ);
    const maxZ = Number(fireBounds.maxZ);
    const centerZ = Number(fireBounds.centerZ);
    if (Number.isFinite(centerZ)) {
      bounds.centerZ = centerZ - anchorWorld.z;
    } else if (Number.isFinite(minZ) && Number.isFinite(maxZ)) {
      bounds.centerZ = (minZ + maxZ) * 0.5 - anchorWorld.z;
    }

    const depthX = Number(fireBounds.depthX);
    if (Number.isFinite(depthX)) bounds.depthX = depthX - anchorWorld.x;
    if (Number.isFinite(fireBounds.localRootY)) bounds.rootY = fireBounds.localRootY;
    if (Number.isFinite(fireBounds.localCenterZ)) bounds.centerZ = fireBounds.localCenterZ;
    if (Number.isFinite(fireBounds.localDepthX)) bounds.depthX = fireBounds.localDepthX;

    rebuildFlameQuads(flameGeometry, bounds, layerCount);
    refreshFireback();
    refreshLightPlacement();
  }

  function bindAnchor(anchor, fireBounds) {
    if (!anchor || !anchor.isObject3D) return false;
    anchor.add(group);
    group.position.set(0, 0, 0);
    group.rotation.set(0, 0, 0);
    group.scale.set(1, 1, 1);
    applyOptionalBounds(fireBounds, anchor);
    anchor.updateWorldMatrix(true, false);
    anchor.getWorldPosition(anchorWorld);
    debug.bound = true;
    debug.anchorName = anchor.name || '';
    debug.flameWidth = bounds.width;
    debug.maxFlameHeight = bounds.maxHeight;
    debug.rootWorldY = anchorWorld.y + bounds.rootY;
    debug.depthWorldX = anchorWorld.x + bounds.depthX;
    return true;
  }

  function inactiveEmber(index) {
    emberMatrix.makeScale(0, 0, 0);
    emberMatrix.setPosition(bounds.depthX, bounds.rootY, bounds.centerZ);
    embers.setMatrixAt(index, emberMatrix);
    emberColor.setRGB(1, 0.30, 0.04);
    embers.setColorAt(index, emberColor);
  }

  function updateEmbers(time, energy) {
    let active = 0;
    for (let i = 0; i < emberCount; i += 1) {
      const period = emberPeriods[i];
      const offset = emberOffsets[i];
      const cycle = (time + offset) / period;
      let epoch = Math.floor(cycle);
      let cellStart = epoch * period - offset;
      let birth = cellStart + random01(seed, i, epoch, 90) * period * 0.28;
      if (time < birth) {
        epoch -= 1;
        cellStart = epoch * period - offset;
        birth = cellStart + random01(seed, i, epoch, 90) * period * 0.28;
      }
      const lifetime = 0.48 + random01(seed, i, epoch, 91) * 0.58;
      const age = time - birth;
      const spawned = random01(seed, i, epoch, 92) > 0.48;
      // Keep the skyward marks sparse even on tiers with a larger pool. The
      // deterministic cap also makes forced review phases show at most three.
      if (!spawned || age < 0 || age >= lifetime || active >= 3) {
        inactiveEmber(i);
        continue;
      }

      const u = age / lifetime;
      const envelope = Math.max(0, 4 * u * (1 - u));
      // A small painted fleck remains legible at birth and retirement instead
      // of mathematically shrinking to a sub-pixel point at review phases.
      const scale = (0.44 + Math.sqrt(envelope) * 0.56)
        * (0.85 + random01(seed, i, epoch, 93) * 0.45);
      const startZ = bounds.centerZ
        + randomSigned(seed, i, epoch, 94) * bounds.width * 0.42;
      const driftZ = randomSigned(seed, i, epoch, 95) * bounds.width * 0.18;
      const arcZ = randomSigned(seed, i, epoch, 96) * bounds.width * 0.08;
      const z = startZ + driftZ * u + arcZ * 4 * u * (1 - u);
      const rise = 0.28 + random01(seed, i, epoch, 97) * 0.20;
      // Begin above the grate's top rail; spawning down at the fuel bed made
      // correctly active instances disappear behind the iron silhouette.
      const y = bounds.rootY + 0.88
        + random01(seed, i, epoch, 98) * 0.08
        + rise * u * (1.18 - 0.18 * u);
      // Motes share the flame depth. They remain behind the ironwork instead
      // of floating on the facade, but start above the rail where they read.
      const x = bounds.depthX + 0.060
        + randomSigned(seed, i, epoch, 99) * 0.022 * u;

      emberMatrix.makeScale(scale * 0.78, scale * 1.05, scale * 0.78);
      emberMatrix.setPosition(x, y, z);
      embers.setMatrixAt(i, emberMatrix);

      const heat = 1 - u;
      const energyGain = 0.92 + clamp(energy, 0.75, 1.25) * 0.08;
      emberColor.setRGB(
        energyGain,
        (0.34 + heat * 0.34) * energyGain,
        (0.045 + heat * 0.085) * energyGain,
      );
      embers.setColorAt(i, emberColor);
      active += 1;
    }
    embers.instanceMatrix.needsUpdate = true;
    if (embers.instanceColor) embers.instanceColor.needsUpdate = true;
    debug.activeEmbers = active;
  }

  function updateEnergy(time, raw) {
    if (debug.forcedPhase || lastEnergyPhase === null) {
      // Forced captures are exact and independent of the previously rendered
      // frame. The band-limited value noise already keeps raw well-behaved.
      energySmooth = raw;
    } else {
      const delta = time - lastEnergyPhase;
      if (delta > 0 && delta <= PAUSE_GAP_SECONDS) {
        const tau = raw > energySmooth ? 0.065 : 0.18;
        const alpha = 1 - Math.exp(-delta / tau);
        energySmooth += (raw - energySmooth) * alpha;
      }
    }
    lastEnergyPhase = time;
    debug.energyRaw = raw;
    debug.energySmooth = energySmooth;
    return energySmooth;
  }

  function updateLight(time, energy) {
    const micro = valueNoise1(seed ^ 0x3f1a5b79, time * 4.1) * 0.025
      + valueNoise1(seed ^ 0x7a9d2e13, time * 7.3) * 0.012;
    const flicker = clamp(energy * (1 + micro), 0.78, 1.24);
    const colorMix = clamp((flicker - 0.78) / 0.46, 0, 1);
    light.color.copy(lightDim).lerp(lightBright, colorMix);
    light.intensity = clayMode ? 0 : baseIntensity * flicker;
    facadeLight.intensity = clayMode
      ? 0
      : facadeBaseIntensity * (0.92 + flicker * 0.08);
    flameMaterial.uniforms.uTime.value = time;
    flameMaterial.uniforms.uEnergy.value = energy;
    debug.flicker = flicker;
    debug.intensity = light.intensity;
    debug.facadeFillIntensity = facadeLight.intensity;
  }

  function applyTime(state) {
    const raw = state && typeof state.dayFactor === 'number' ? state.dayFactor : 1;
    const dayFactor = clamp(raw, 0, 1);
    baseIntensity = lerp(FIRE_NIGHT_INTENSITY, FIRE_DAY_INTENSITY, dayFactor);
    facadeBaseIntensity = lerp(
      FACADE_NIGHT_INTENSITY,
      FACADE_DAY_INTENSITY,
      dayFactor,
    );
    debug.dayFactor = dayFactor;
    debug.baseIntensity = baseIntensity;
    light.intensity = clayMode ? 0 : baseIntensity * debug.flicker;
    facadeLight.intensity = clayMode
      ? 0
      : facadeBaseIntensity * (0.92 + debug.flicker * 0.08);
    debug.intensity = light.intensity;
    debug.facadeFillIntensity = facadeLight.intensity;
  }

  function update(sourceTime) {
    resolveSeedOverride();
    const time = resolvePhase(sourceTime);
    // The hearth's breath: one slow surge plus a faster shimmer of value
    // noise. The same smoothed signal scales the shader flame height and the
    // spotlight flicker, so light and shape always agree.
    const rawEnergy = clamp(
      1
      + valueNoise1(seed ^ 0x5bd1e995, time * 1.05) * 0.16
      + valueNoise1(seed ^ 0x9e3779b9, time * 2.65) * 0.09,
      0.76,
      1.24,
    );
    const energy = updateEnergy(time, rawEnergy);
    updateEmbers(time, energy);
    updateLight(time, energy);
  }

  function setClayMode(enabled) {
    clayMode = !!enabled;
    group.visible = !clayMode;
    light.intensity = clayMode ? 0 : baseIntensity * debug.flicker;
    facadeLight.intensity = clayMode
      ? 0
      : facadeBaseIntensity * (0.92 + debug.flicker * 0.08);
    debug.clayMode = clayMode;
    debug.intensity = light.intensity;
    debug.facadeFillIntensity = facadeLight.intensity;
  }

  return {
    group,
    light,
    facadeLight,
    bindAnchor,
    update,
    applyTime,
    setClayMode,
    setPhaseTime,
    setSeed,
    debug,
  };
}
