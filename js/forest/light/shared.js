import * as THREE from 'three';
import { solarState } from '../../solar.js';

// One set of light uniforms shared by every forest material, the shadow map and
// the light shafts. applyTime() fills it from the same solar object the cabin uses.
export function createLight() {
  const U = {
    uTime:          { value: 0 },
    uSunDir:        { value: new THREE.Vector3(0.6, 0.35, -0.7).normalize() },
    uSunColor:      { value: new THREE.Color(1, 1, 1) },
    uSkyAmb:        { value: new THREE.Color(0.3, 0.4, 0.5) },
    uGroundAmb:     { value: new THREE.Color(0.1, 0.12, 0.08) },
    uFogColor:      { value: new THREE.Color(0.7, 0.8, 0.85) },
    uZenith:        { value: new THREE.Color(0.5, 0.65, 0.8) },
    uFogDensity:    { value: 0.011 },
    uFogBase:       { value: 2.0 },
    uFogFalloff:    { value: 0.035 },
    uBand:          { value: new THREE.Vector2(-0.05, 0.3) },
    uBandNoise:     { value: 0.3 },
    uShadowTint:    { value: new THREE.Color(0.7, 0.8, 1.0) },
    uSunInMist:     { value: 0.7 },
    uSunMap:        { value: null },
    uSunMatrix:     { value: new THREE.Matrix4() },
    uSunTexel:      { value: new THREE.Vector2(1 / 2048, 1 / 2048) },
    uCanopyMap:     { value: null },
    uCanopyOrigin:  { value: new THREE.Vector2() },
    uCanopyInvSize: { value: new THREE.Vector2(1, 1) },
    uCanopyH:       { value: 34 },
    uCanopyShift:   { value: new THREE.Vector2() },
    uBeamU:         { value: new THREE.Vector3(1, 0, 0) },
    uBeamV:         { value: new THREE.Vector3(0, 1, 0) },
    uNoiseTex:      { value: null },
    uWindOffset:    { value: new THREE.Vector2() },
    uWindDir:       { value: new THREE.Vector3(1, 0, 0.3).normalize() },
    uOpen:          { value: 0 },
    uDay:           { value: 1 },             // the forest's day factor, 0 by night (thin leaves and pale bark read it: light/materials.js)
    uOpenSky:       { value: 1.5 },           // how much more of the sky's light falls on what lies under open sky than on the forest floor (less by a dark night)
    // the night's own lights (lampLight below; index.js says where they are): the walker's lantern, and the lamp behind the cabin's window
    uLamps:         { value: 0 },             // above 0 when either is lit
    uLamp:          { value: new THREE.Vector4(0, 0, 0, 1) },      // where the lantern's flame is, and how far its light carries
    uLampColor:     { value: new THREE.Color(0, 0, 0) },           // its colour times its strength
    uPane:          { value: new THREE.Vector4(0, 0, 0, 1) },      // where the room's lamp is, behind the window, and how far its light carries
    uPaneColor:     { value: new THREE.Color(0, 0, 0) },
    uPaneDir:       { value: new THREE.Vector3(0, 0, -1) },        // the way the window faces
  };

  const _sun = new THREE.Color(), _a = new THREE.Color(), _b = new THREE.Color(), _n = new THREE.Color(), _dir = new THREE.Vector3(), _moon = new THREE.Vector3(-0.35, 0.62, -0.7).normalize();
  const { lerp, smoothstep, degToRad } = THREE.MathUtils;
  let warmth = 1, density = 0.011, nightFill = 1;
  // How much of the night's own light is left (the moon; the sky's and the ground's fill; the air: the mist's and
  // the sky's colour): 1 is the night as it was approved at checkpoint 1. The owner asked for a lantern, and for
  // "the night environment and moonlight" to be darker, "so that the lantern makes sense": a look says how
  // much darker (night.moon, night.fill, night.air), and setNight(false) puts the approved night back.
  let nightLevel = { moon: 1, fill: 1, air: 1, open: 1 }, darkNight = true;
  const OPEN_SKY = 1.5;
  const lamps = { lantern: null, pane: null };
  // The night's own colours: the site's clock at its night anchor (23:00, which is what `time=night` forces).
  // applyTime draws the colours it reads from the clock to these by how far into the night the forest is.
  const NIGHT = solarState(23);
  // By night the cabin's hemisphere colours are close to black. Scaled up this far, the shade under a moonlit
  // crown still shows its bark and fronds; any lower and it is one flat black shape. A look scales it again
  // (shade.nightFill): opaque paint has no white paper under it to lift its darks, and without more fill the
  // bare earth of the trail in shade sat at 4 of 255, a black strip with nothing in it.
  const NIGHT_SKY = 1.2, NIGHT_GROUND = 1.0;
  const OPEN_MIST = 0.3;                              // the mist of the open valley, as a share of the forest's

  // A look (js/forest/looks) sets how light and mist behave; the palette is in its textures.
  function applyLook(look) {
    U.uBand.value.set(look.shade.band[0], look.shade.band[1]);
    U.uBandNoise.value = look.shade.bandNoise;
    U.uShadowTint.value.setRGB(...look.shade.shadowTint);
    density = U.uFogDensity.value = look.mist.density;
    U.uFogBase.value = look.mist.base;
    U.uFogFalloff.value = look.mist.falloff;
    U.uSunInMist.value = look.mist.sunInMist;
    warmth = look.shade.warmth;
    nightFill = look.shade.nightFill ?? 1;
    nightLevel = { moon: look.night?.moon ?? 1, fill: look.night?.fill ?? 1, air: look.night?.air ?? 1, open: look.night?.open ?? 1 };
    lamps.lantern = look.night?.lantern || null;
    lamps.pane = look.night?.window || null;
  }
  // `dark`: false for the night as it was approved, with no lantern and no light from the window.
  function setNight(dark) { darkNight = dark; }
  // The night's lights for this frame. `lantern` is where its flame is (a Vector3), or null when it is not
  // carried; `pane` is { at, facing }: where the room's lamp is and the way the window faces, or null.
  // `night` is how far into the night it is, 0 by day; `flicker` is the flame's unsteadiness, about 1.
  function setLamps(lantern, pane, night, flicker = 1) {
    const lit = darkNight ? night : 0;
    let any = 0;
    if (lantern && lamps.lantern && lit > 0) {
      U.uLamp.value.set(lantern.x, lantern.y, lantern.z, lamps.lantern.reach);
      U.uLampColor.value.setRGB(...lamps.lantern.colour).multiplyScalar(lamps.lantern.strength * lit * flicker);
      any = 1;
    } else U.uLampColor.value.setRGB(0, 0, 0);
    if (pane && lamps.pane && lit > 0) {
      U.uPane.value.set(pane.at.x, pane.at.y, pane.at.z, lamps.pane.reach);
      U.uPaneDir.value.copy(pane.facing);
      U.uPaneColor.value.setRGB(...lamps.pane.colour).multiplyScalar(lamps.pane.strength * lit);
      any = 1;
    } else U.uPaneColor.value.setRGB(0, 0, 0);
    U.uLamps.value = any;
    return lit;
  }

  // cfg is solarState(hour). The cabin's intensities are tuned for its interior;
  // the forest keeps the colours and the sun's compass direction and sets its
  // own levels. Returns the forest's day factor (0 night, 1 day).
  // `open` is how open the air is where the walker stands (world/land.js): 0 under the old terrace's trees,
  // where everything here is as it was at checkpoint 1, to 1 out on the river's bar.
  function applyTime(cfg, t, open = 0) {
    const elev = cfg.elevationDeg;
    // The cabin's dayFactor suits its window: 0.07 at midnight and only 0.55 at
    // seven in the morning. Out here it is day once the sun has cleared the horizon.
    const day = smoothstep(elev, 0.3, 3.5);
    // By night the forest's colours are the night's own, whatever the hour. The site's clock blends its four
    // anchors' colours hour by hour: it comes to the night's from the golden hour's through five hours, and from
    // 23:00 it goes over to the morning's pale air through eight. The forest is in its night from 20:00 to 06:00
    // (the moon, the lantern, the darker shares), so with the clock's colours as they come it was dark at 23:00
    // and a pale twilight at 21:30, at 02:00 and at 04:00, with a lit lantern carried through it: found by
    // shooting those hours, which no gallery and no check had. Each colour read from the clock is therefore drawn
    // to the night's own by how far into the night the forest is. At 23:00 that is the colour it was, to the bit;
    // by day it is not done; and the approved night (setNight(false)) is left as it was at every hour.
    const dark = darkNight ? 1 - day : 0;
    const clock = (into, colour, night) => (dark > 0 ? into.set(colour).lerp(_n.set(night), dark) : into.set(colour));
    U.uTime.value = t;
    // The sun never rakes lower than 12 degrees: below that the trunks shade the
    // whole floor and nothing is lit. By night the light comes from a fixed moon,
    // and the two are blended so dawn and dusk never snap.
    const az = Math.atan2(-cfg.sunDir.z, cfg.sunDir.x), el = degToRad(Math.max(elev, 12));
    _dir.set(Math.cos(az) * Math.cos(el), Math.sin(el), -Math.sin(az) * Math.cos(el));
    U.uSunDir.value.copy(_moon).lerp(_dir, day).normalize();
    // Where the ray that lands on the ground crossed the canopy, and two directions square to the rays:
    // a point's place across the beam, which is the same all the way along one ray of sunlight.
    const sun = U.uSunDir.value;
    U.uCanopyShift.value.set(sun.x, sun.z).multiplyScalar(U.uCanopyH.value / Math.max(sun.y, 0.12));
    U.uBeamU.value.set(sun.z, 0, -sun.x).normalize();
    U.uBeamV.value.crossVectors(sun, U.uBeamU.value).normalize();
    const high = smoothstep(elev, 4, 12);              // a low sun is weaker, and the mist it shines through thicker
    clock(_sun, cfg.sun[0], NIGHT.sun[0]);
    U.uSunColor.value.copy(_sun).lerp(_a.setRGB(1, 1, 1), 1 - warmth).multiplyScalar(lerp(0.6, 3.2 * lerp(0.62, 1, high), day));
    // Sky light reaches the floor through needles, so it loses blue on the way down. The cabin's
    // ground colour is its floorboards; here the floor throws back green in proportion to the sky.
    clock(_b, cfg.hemi[0], NIGHT.hemi[0]);
    const skyLevel = 0.2126 * _b.r + 0.7152 * _b.g + 0.0722 * _b.b;
    U.uSkyAmb.value.copy(_b).multiply(_a.setRGB(0.95, 1.0, 0.74)).multiplyScalar(lerp(NIGHT_SKY * nightFill, 0.8, day));
    clock(U.uGroundAmb.value, cfg.hemi[1], NIGHT.hemi[1]).add(_a.setRGB(0.15, 0.19, 0.08).multiplyScalar(skyLevel)).multiplyScalar(lerp(NIGHT_GROUND * nightFill, 0.6, day));
    clock(U.uFogColor.value, cfg.sky[1], NIGHT.sky[1]).multiplyScalar(lerp(0.55, 0.8, day));
    clock(U.uZenith.value, cfg.sky[0], NIGHT.sky[0]).multiplyScalar(lerp(0.6, 0.95, day));
    // Mist hangs under the trees. Out in the valley the air is clearer, or the far bank, the ridges and the
    // mountain would be one white wall: at the forest's density a hundred metres is half gone by day.
    U.uOpen.value = open;
    U.uDay.value = day;
    U.uFogDensity.value = density * lerp(1.15, lerp(1.45, 0.62, smoothstep(elev, 4, 22)), day) * lerp(1, OPEN_MIST, open);
    U.uWindOffset.value.set(t * 0.011, t * 0.004);
    // The darker night: what is left of the night's own light, each kind by its own share (the moon; the fill
    // from the sky and the ground, which is all the light there is under closed crowns; the air: the mist's
    // colour and the sky's). By day each share is 1 and nothing is touched; with the approved night asked for
    // they are 1 at every hour.
    U.uOpenSky.value = OPEN_SKY;
    if (darkNight && day < 1) {
      U.uOpenSky.value = OPEN_SKY * lerp(nightLevel.open, 1, day);          // (and the open valley's share of the sky's fill)
      U.uSunColor.value.multiplyScalar(lerp(nightLevel.moon, 1, day));
      for (const key of ['uSkyAmb', 'uGroundAmb']) U[key].value.multiplyScalar(lerp(nightLevel.fill, 1, day));
      for (const key of ['uFogColor', 'uZenith']) U[key].value.multiplyScalar(lerp(nightLevel.air, 1, day));
    }
    return day;
  }

  return { U, applyTime, applyLook, setNight, setLamps };
}

// Varyings and the instance transform. The colour pass and the depth pre-pass
// must compute bit-identical positions, so both use this one routine.
export const VERT_COMMON = /* glsl */`
  invariant gl_Position;
  attribute vec4 aInst;                 // x phase, y tint, z how much of its own level the plant still is, w its size at its limit (forestPlace)
  attribute vec2 aWind;                 // a card: x how freely this vertex moves, y variation. Wood: x depth in a hollow, y 1 on split wood
  attribute vec3 aRoot;                 // where the vertex lies once its plant has gone over to the next coarser level (plants/build.js)
  uniform float uTime;
  uniform sampler2D uNoiseTex;
  uniform vec2 uWindOffset;
  uniform vec3 uWindDir;
  #if defined(THIN) || defined(AXIS)
    uniform vec3 uHeart;                // the middle of a crown, in the plant's own frame (plants/maple.js, plants/spire.js)
  #endif
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vTint;
  varying vec3 vBase;                   // where this plant stands
  varying vec2 vWood;                   // wood only: x how deep in a hollow, y 1 on split wood and 0 on bark

  // Where a vertex lies in its plant. Nothing changes detail by switching: a switch shows, whether a whole
  // plant swaps, its cards go one by one, or its pixels are dithered (a dot screen over the middle distance).
  // Between two levels every vertex moves towards its root, where the next level has it, and when it is
  // there the levels swap with nothing to see: boughs that stay have grown to the next level's size, boughs
  // and limbs that go have shrunk into the wood, and the trunk lies on the coarser trunk. Where the next
  // level is another thing altogether (a tree's far level: a dozen large boughs), both are drawn while one
  // shrinks into its roots and the other grows out of its own. At its limit a plant shrinks into its foot.
  // aInst.z is 1 at rest and 0 at the root; the instancer (world/instancer.js) says how it runs between.
  vec3 forestPlace() {
    #ifdef USE_INSTANCING
      float own = smoothstep(0.0, 0.65, aInst.z);
      // at rest the vertex is its own position to the last bit: a mix worked out as root + (position - root) * 1.0 need not be
      return (own < 1.0 ? mix(aRoot, position, own) : position) * aInst.w;
    #else
      return position;                  // the ground
    #endif
  }

  vec4 forestWorld(vec3 p, float sway) {
    #ifdef USE_INSTANCING
      mat4 im = instanceMatrix;
    #else
      mat4 im = mat4(1.0);
    #endif
    vec4 wp = modelMatrix * im * vec4(p, 1.0);
    vNormal = normalize(mat3(modelMatrix) * mat3(im) * normal);
    float loose = aWind.x;                // how freely the vertex moves in the wind
    #ifdef AXIS
      // A crown painted whole on a card through the trunk (an alder's: plants/alder.js; a spruce's and a hemlock's:
      // plants/spire.js) is in every level of its tree, as its own root, so that nothing slides when the levels
      // change. Its vertices are marked: their freedom in the wind is given below zero. (They were first known by
      // being their own roots. So is any card that a coarser level keeps just as it is.)
      bool whole = loose < 0.0;
      loose = abs(loose);
      float close = 0.0;                  // a conifer's whole crown: 1 where the tree stands within 28 m of the eye, 0 from 60 m
    #endif
    #ifdef THIN
      // Broad leaves, on cards that lie every way (plants/maple.js). A card seen edge-on is its paint drawn out
      // into a streak along the eye's line: looked up through, the cards that hang were a sheaf of streaks,
      // and from beside the tree the ones that lie flat. So a card is drawn in to where it is attached (its
      // root) as it turns edge-on, by when all of it is a sliver. Its normal is the card's own, for that; what
      // its leaves are lit by is where they hang in the crown's dome, worked out here from the crown's middle.
      vec3 foot = (modelMatrix * im * vec4(aRoot * aInst.w, 1.0)).xyz;
      vec3 seen = wp.xyz;
      #ifdef AXIS
        // A card that is a whole crown has nowhere of its own to be drawn in to. Looked up along from under an
        // alder it was a streak of smeared paint as long as the crown. It is drawn in sideways, to the crown's
        // own upright axis, and by how the eye sees the crown's middle and not each corner: so all of the card
        // is drawn in by one share, and its paint is not sheared across it.
        if (whole) {
          foot = (modelMatrix * im * vec4(vec3(uHeart.x, position.y, uHeart.z) * aInst.w, 1.0)).xyz;
          seen = (modelMatrix * im * vec4(uHeart * aInst.w, 1.0)).xyz;
        }
      #endif
      #ifdef SOONER
        // (white flowers on green show a card's paint drawn out long before it is a sliver: a sheet that is
        // mostly blossom is drawn in sooner: plants/apple.js. A shrub with a flower here and there is not: with
        // every card that does not face the eye drawn in, there was little of it left.)
        wp.xyz = mix(foot, wp.xyz, smoothstep(0.25, 0.6, abs(dot(vNormal, normalize(seen - cameraPosition)))));
      #else
        wp.xyz = mix(foot, wp.xyz, smoothstep(0.07, 0.3, abs(dot(vNormal, normalize(seen - cameraPosition)))));
      #endif
      vec3 dome = (position - uHeart) * 0.08;
      vNormal = normalize(mat3(modelMatrix) * mat3(im) * vec3(dome.x, max(dome.y, -0.1) + 0.6, dome.z));
    #elif defined(AXIS)
      // A conifer's crown on crossed cards (Mesh.whole in plants/build.js). It is drawn in to the trunk as it
      // turns edge-on, as above, by its own flat normal (normal.x and .z) and the bearing it is seen on. It is
      // drawn in too as the eye comes to look up into the tree from under it (from 53 degrees up to its middle,
      // and gone by 72), where a crown painted from beside it is a flat sheet standing in the tree: but only for
      // a tree near enough to have its limbs and boughs drawn, which are what is seen then. (A tree high on the
      // valley's wall is looked up at as steeply from the river, from far off, and its cards are all it has.)
      // Then it is lit as what it stands for, the side of a cone: at its outline the cone faces outwards, away
      // from the trunk, and down its middle it faces whoever is looking (normal.y says which a vertex is), each
      // tilted a little to the sky. Lit by the card's own flat normal, every crown on a hillside was one flat
      // tone, or two with a ruled line between.
      if (whole) {
        vec3 midline = (modelMatrix * im * vec4(vec3(uHeart.x, position.y, uHeart.z) * aInst.w, 1.0)).xyz;
        vec3 gaze = (modelMatrix * im * vec4(uHeart * aInst.w, 1.0)).xyz - cameraPosition;
        float away = length(gaze);
        close = 1.0 - smoothstep(28.0, 60.0, away);
        gaze /= max(away, 1e-4);
        vec2 level = gaze.xz / max(length(gaze.xz), 1e-4);
        vec2 card = normalize((mat3(modelMatrix) * mat3(im) * vec3(normal.x, 0.0, normal.z)).xz);
        float shown = smoothstep(0.07, 0.3, abs(dot(card, level)));
        shown *= 1.0 - smoothstep(0.8, 0.95, abs(gaze.y)) * (1.0 - smoothstep(40.0, 70.0, away));
        // From nearby the crown is painted at a hand's breadth to the pixel: a soft-edged sheet among boughs
        // drawn needle by needle. There it is drawn in to two fifths of its width, and darkened (the fragment
        // reads how close): the tree's own shade behind its boughs, which are what is seen.
        shown *= 1.0 - 0.6 * close;
        vec2 outward = wp.xz - midline.xz;
        wp.xyz = mix(midline, wp.xyz, shown);
        float rim = normal.y;
        vec2 faces = (rim > 0.5 ? normalize(outward) * rim : vec2(0.0)) - level * sqrt(max(0.0, 1.0 - rim * rim));
        vNormal = normalize(vec3(faces.x, 0.4, faces.y));
      }
    #endif
    if (sway > 0.0) {
      float gust = texture2D(uNoiseTex, wp.xz * 0.012 + uWindOffset).r;
      float beat = sin(uTime * (1.1 + aWind.y * 0.9) + aInst.x + wp.x * 0.31 + wp.z * 0.17);
      wp.xyz += uWindDir * (sway * loose * (0.03 + 0.22 * gust) * (0.6 + 0.4 * beat));
    }
    vWorld = wp.xyz;
    vBase = (modelMatrix * im * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vUv = uv;
    vTint = aInst.y;
    #ifdef VARIANTS
      // A sheet with several plants side by side, a column to each (paint/flowers.js): which of them a plant is
      // goes by its tint, and what is left of the tint tones it as any plant's does. So one kind, in one draw,
      // is several kinds of flower.
      float which = min(floor(aInst.y * float(VARIANTS)), float(VARIANTS) - 1.0);
      vUv.x += which * VARIANT_STEP;
      vTint = aInst.y * float(VARIANTS) - which;
    #endif
    #ifdef USE_INSTANCING
      vWood = sway > 0.0 ? vec2(0.0) : aWind.xy;
      #ifdef AXIS
        if (whole) vWood = vec2(1.0, close);       // foliage has no use of its own for these: they tell the fragment the card is a whole crown, and how near
      #endif
    #else
      vWood = vec2(0.0);                // the ground's mesh has no aWind
    #endif
    return wp;
  }
`;

// Sun shadow (trunks only), canopy dapples, mist. Shared by materials and shafts.
export const LIGHT_PARS = /* glsl */`
  uniform vec3 uSunDir, uSunColor, uSkyAmb, uGroundAmb, uFogColor, uZenith;
  uniform float uFogDensity, uFogBase, uFogFalloff;
  uniform vec2 uBand;
  uniform float uBandNoise, uSunInMist;
  uniform vec3 uShadowTint;
  precision highp sampler2DShadow;
  uniform sampler2DShadow uSunMap;
  uniform sampler2D uCanopyMap;
  uniform mat4 uSunMatrix;
  uniform vec2 uSunTexel, uCanopyOrigin, uCanopyInvSize, uCanopyShift;
  uniform vec3 uBeamU, uBeamV;
  uniform float uCanopyH;
  uniform sampler2D uNoiseTex;
  uniform vec2 uWindOffset;
  uniform float uOpen;                  // how open the air is where the walker stands: 0 under the old terrace's trees
  uniform float uDay;                   // 1 by day, 0 by night
  uniform float uOpenSky;               // how much more of the sky's light falls on what lies under open sky than on the forest floor
  // The night's own lights: the walker's lantern, and the lamp behind the cabin's window. Both are out by day,
  // and uLamps is then 0: nothing that reads them is run, and a frame is what it was to the last bit.
  uniform float uLamps;
  uniform vec4 uLamp, uPane;            // where each is, and in w how far its light carries
  uniform vec3 uLampColor, uPaneColor, uPaneDir;

  // What the two of them throw on a point P that faces N. Neither casts a shadow: the lantern hangs at the
  // walker's side, so what it lights is very nearly what the eye sees, and the window looks out over open
  // ground. wobble is the brush's own unsteadiness (forestShade), so that the lit side ends as paint does.
  vec3 lampLight(vec3 N, vec3 P, float wobble) {
    vec3 sum = vec3(0.0);
    vec3 L = uLamp.xyz - P;
    float d = length(L);
    if (d < uLamp.w) {
      // a small flame: it falls off with the square of the distance, softened close to (at arm's length it
      // would otherwise burn the ground white), and is let down to nothing at its reach
      float fall = (1.0 - smoothstep(uLamp.w * 0.5, uLamp.w, d)) / (1.0 + d * d * 0.16);
      float faces = smoothstep(-0.35, 0.3, dot(N, L / max(d, 1e-3)) + wobble * 0.3);
      sum += uLampColor * (fall * mix(0.22, 1.0, faces));
    }
    L = uPane.xyz - P;
    d = length(L);
    if (d < uPane.w) {
      // the room's lamp, seen through the window's opening: only what stands in front of the opening is lit
      vec3 to = -L / max(d, 1e-3);
      float through = smoothstep(0.42, 0.8, dot(to, uPaneDir));
      float fall = (1.0 - smoothstep(uPane.w * 0.5, uPane.w, d)) / (1.0 + d * d * 0.07);
      float faces = smoothstep(-0.35, 0.3, dot(N, -to) + wobble * 0.3);
      sum += uPaneColor * (through * fall * mix(0.22, 1.0, faces));
    }
    return sum;
  }

  // The crown map covers the old world's box and nothing beyond it (light/canopyMap.js). Across the river and
  // far up the valley there is no map: a read there would take the nearest edge's value, drawn out in streaks.
  // A tree that stands at the box's edge hangs its boughs over it, and those were always read at the edge:
  // twelve metres beyond the box still counts as mapped, so that they still are.
  bool mapped(vec2 xz) {
    vec2 uv = (xz - uCanopyOrigin) * uCanopyInvSize, m = 12.0 * uCanopyInvSize;
    return uv.x >= -m.x && uv.x <= 1.0 + m.x && uv.y >= -m.y && uv.y <= 1.0 + m.y;
  }
  // How much of the sky stands open over the ground at xz: 0 under closed crowns.
  float openSky(vec2 xz) {
    return mapped(xz) ? 1.0 - texture2D(uCanopyMap, (xz - uCanopyOrigin) * uCanopyInvSize).r : 1.0;
  }

  // The sun map is read through a shadow sampler (light/sunMap.js): one read compares the four texels round
  // the point and blends the answers, so an edge ramps across a texel on foliage and in the mist. Wood and
  // ground are cheap to shade and show an edge at close range, so they take four such reads half a texel
  // apart, which is a tent three texels wide: a sliver of light one texel across, between two shadows on a
  // trunk, was otherwise a chain of beads, each bead a texel.
  float sunShadow(vec3 P) {
    vec4 sc = uSunMatrix * vec4(P, 1.0);
    vec3 c = sc.xyz / sc.w;
    if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0 || c.z > 1.0) return 1.0;
    float z = c.z - 0.0012;
    #ifdef WIDE_SHADOW
      vec2 h = uSunTexel * 0.5;
      return 0.25 * (texture(uSunMap, vec3(c.xy - h, z)) + texture(uSunMap, vec3(c.x + h.x, c.y - h.y, z))
                   + texture(uSunMap, vec3(c.x - h.x, c.y + h.y, z)) + texture(uSunMap, vec3(c.xy + h, z)));
    #else
      return texture(uSunMap, vec3(c.xy, z));
    #endif
  }

  // How much sun reaches P through the crowns: how closed the canopy is, broken by
  // drifting gaps between the needles so the ground carries moving dapples.
  float canopyLight(vec3 P) {
    // The crowns are read where the ray that lands on the ground under P crossed the canopy, whatever P's
    // own height. Followed up from P itself, a low sun turned each crown's shade into a sheet a metre or
    // two thick: stacked rings up a trunk, and a bar of light in the mist wherever a sheet met the eye edge-on.
    float dens = texture2D(uCanopyMap, (P.xz + uCanopyShift - uCanopyOrigin) * uCanopyInvSize).r;
    if (!mapped(P.xz)) dens = 0.0;
    // The gaps are read across the beam, so a shaft of light is as tall as it is wide: it lies long on
    // the ground under a low sun and falls round on a trunk.
    vec2 b = vec2(dot(P, uBeamU), dot(P, uBeamV));
    #ifdef COARSE_GAPS
      float gaps = texture2D(uNoiseTex, b * 0.045 + uWindOffset * 0.6).r;      // the shafts step too far apart to see the fine gaps
    #else
      float gaps = texture2D(uNoiseTex, b * 0.045 + uWindOffset * 0.6).r * 0.65
                 + texture2D(uNoiseTex, b * 0.19 - uWindOffset).r * 0.35;
    #endif
    // a low sun comes through more needles, and the edge of a dapple goes soft
    float edge = 0.18 + 0.35 * (1.0 - smoothstep(0.2, 0.45, uSunDir.y));
    float lit = smoothstep(dens * 0.9 + 0.02, dens * 0.9 + 0.02 + edge, gaps);
    // the map is a single layer of crowns; above it less and less stands in the sun's way
    return mix(lit, 1.0, smoothstep(uCanopyH - 4.0, uCanopyH + 12.0, P.y));
  }

  float mistAt(float y) { return mix(0.35, 1.0, exp(-max(y - uFogBase, 0.0) * uFogFalloff)); }

  vec3 applyMist(vec3 col, vec3 P) {
    vec3 v = P - cameraPosition;
    float d = length(v);
    float f = 1.0 - exp(-d * uFogDensity * mistAt(0.5 * (P.y + cameraPosition.y)));
    float toSun = pow(max(dot(v / max(d, 0.001), uSunDir), 0.0), 6.0);
    return mix(col, mix(uFogColor, uSunColor * 0.45 + uFogColor * 0.55, toSun * uSunInMist), f);
  }

  // Two-tone painted light: a band between lit and shaded whose edge wobbles
  // like a brush, warm light against cool shadow. open is how much of the sun
  // can reach the point at all: 1 anywhere but down inside a hollow.
  vec3 forestShade(vec3 albedo, vec3 N, vec3 P, float ao, float glow, float open) {
    float wobble = texture2D(uNoiseTex, P.xz * 0.37 + P.y * 0.23).r - 0.5;
    float band = smoothstep(uBand.x, uBand.y, dot(N, uSunDir) + wobble * uBandNoise);
    float sun = sunShadow(P + N * 0.06) * canopyLight(P) * open;
    vec3 amb = mix(uGroundAmb, uSkyAmb, N.y * 0.5 + 0.5) * ao;
    // The sky's light is set for the forest floor, where it has come down through the needles. Where the
    // walker has come out from under the trees, what lies under open sky takes the sky's light whole.
    if (uOpen > 0.0) amb *= 1.0 + uOpen * uOpenSky * openSky(P.xz) * vec3(0.94, 1.0, 1.14);
    vec3 col = albedo * (amb * uShadowTint + uSunColor * band * sun);
    if (glow > 0.0) {
      vec3 V = normalize(P - cameraPosition);
      col += albedo * uSunColor * (glow * sun * pow(max(dot(V, uSunDir), 0.0), 3.0));
    }
    if (uLamps > 0.0) col += albedo * lampLight(N, P, wobble) * (0.45 + 0.55 * ao);
    return applyMist(col, P);
  }
  vec3 forestShade(vec3 albedo, vec3 N, vec3 P, float ao, float glow) { return forestShade(albedo, N, P, ao, glow, 1.0); }
`;
