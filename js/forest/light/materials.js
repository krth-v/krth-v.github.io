import * as THREE from 'three';
import { VERT_COMMON, LIGHT_PARS } from './shared.js';

const VARYINGS = /* glsl */`
  varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv; varying float vTint; varying vec3 vBase;
`;

const vertex = (sway) => /* glsl */`
  ${VERT_COMMON}
  void main() {
    vec4 wp = forestWorld(forestPlace(), ${sway});
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// Trunks, limbs, logs, stumps: painted bark with its relief, moss where it
// would grow (upward faces, the foot, damp patches), and a darker foot.
const BARK_FRAG = /* glsl */`
  ${LIGHT_PARS}
  ${VARYINGS}
  uniform sampler2D uMap, uNormalMap, uMossMap;
  uniform vec3 uMossA, uMossB, uTone, uWoodA, uWoodB;
  uniform float uMoss, uFoot;
  varying vec2 vWood;                    // x: how deep in a hollow; y: 1 on split wood (a broken end), 0 on bark
  // The painted relief turned into the surface's own frame. The frame comes
  // from how position and uv change across the pixel, so it is right for a
  // standing trunk, a lying log and a limb alike.
  vec3 relief(vec3 N, vec3 P, vec2 uv, vec3 nm) {
    vec3 dp1 = dFdx(P), dp2 = dFdy(P);
    vec2 d1 = dFdx(uv), d2 = dFdy(uv);
    vec3 a = cross(dp2, N), b = cross(N, dp1);
    vec3 T = a * d1.x + b * d2.x, B = a * d1.y + b * d2.y;
    float k = inversesqrt(max(max(dot(T, T), dot(B, B)), 1e-12));
    return normalize(T * (nm.x * k) + B * (nm.y * k) + N * nm.z);
  }
  void main() {
    vec3 N0 = normalize(vNormal);
    vec3 nm = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
    float h = vWorld.y - vBase.y;
    // Damp patches are large and slow, so they are read from the world: through three flat projections,
    // weighted by the way the bark faces. One projection alone does not change along one direction, and
    // the moss on a giant ran along it as one straight diagonal band.
    vec3 facing = N0 * N0;
    float damp = dot(facing, vec3(texture2D(uNoiseTex, vWorld.zy * 0.19 + 0.3).r, texture2D(uNoiseTex, vWorld.xz * 0.19).r, texture2D(uNoiseTex, vWorld.xy * 0.19 + 0.7).r));
    // Fine detail is read in the bark's own sheet coordinates, shifted for every tree. A flat projection of
    // the world has one face of every trunk along which it does not change, and there the moss ran in streaks.
    // One sheet is about 1.2 m round the trunk by 2.4 m up it, and whole numbers of repeats round it leave no seam.
    vec2 skin = vec2(vUv.x, vUv.y + vTint * 3.1);
    float tuft = texture2D(uNoiseTex, skin * vec2(2.0, 4.0)).r;                                          // moss is dabbed on, not sprayed
    // slow drifts of tone up the trunk and round it (by the way the bark faces, so the drift has no seam either)
    float weather = texture2D(uNoiseTex, vec2(dot(N0.xz, vec2(0.13, 0.09)) + vWorld.y * 0.07, vWorld.y * 0.045 + vTint)).r;
    vec3 albedo = texture2D(uMap, vUv).rgb * uTone * mix(0.85, 1.15, vTint) * mix(0.78, 1.2, weather);
    #ifdef PALE_NIGHT
      // Pale bark by night (a red alder's, under its crusts of lichen: plants/alder.js). By night the forest's
      // shade is lifted a long way, so that dark paint in it still reads (looks: shade.nightFill). Paint as pale
      // as this, lifted as far, stood in the moon as bright as it does by day (140 of 255, where the leaves
      // beside it were 35): trunks lit by a lamp. It keeps this share of its lightness by night, as the
      // maples' leaves and the far view's snow keep a share of theirs.
      albedo *= mix(float(PALE_NIGHT), 1.0, uDay);
    #endif
    // Through a long lens (the close-up of an animal: life/index.js) one texel of the sheet is many pixels
    // wide, and the bark a creeper is on is a blur. From four pixels to the texel the sheet is read a second
    // time, six times finer, and laid over the first as lights and darks about the sheet's own mean, which
    // is its last mip level: the brushwork of the plates, small. Six is a whole number, so there is still no
    // seam. Nothing a walker passes is as near as that, so nothing changes at the walker's own field of view.
    vec2 sheet = vec2(textureSize(uMap, 0)), gx = dFdx(vUv), gy = dFdy(vUv);
    float close = 1.0 - smoothstep(0.08, 0.25, max(length(gx * sheet), length(gy * sheet)));
    if (close > 0.0 && vWood.y < 0.5) {
      vec2 fine = vUv * 6.0 + vec2(0.37, 0.61);
      albedo *= mix(vec3(1.0), textureGrad(uMap, fine, gx * 6.0, gy * 6.0).rgb / max(textureLod(uMap, vec2(0.5), 16.0).rgb, vec3(0.02)), close * 0.8);
      nm = normalize(nm + vec3(textureGrad(uNormalMap, fine, gx * 6.0, gy * 6.0).xy * 2.0 - 1.0, 0.0) * close);
    }
    if (vWood.y > 0.0) {
      // Split wood has no plates. Its uv is where the vertex lies across the end, in metres (plants/deadwood.js),
      // so the same reads are mottled across a face of the break and drawn out into streaks down a wall, where
      // that place hardly changes: along the grain. Laid in stripes from the rim to the middle, the paint alone
      // made a pinwheel of any end. It is coarse enough to see from the trail: finer, it averaged out to a blank board.
      float fibre = texture2D(uNoiseTex, vUv * 1.0 + vTint * 7.0).r;
      float broad = texture2D(uNoiseTex, vUv * 0.22 + 0.37 + vTint).r;
      float check = smoothstep(0.56, 0.7, texture2D(uNoiseTex, vUv * 1.9 + 0.2 + vTint * 3.0).r);
      vec3 split = mix(uWoodA, uWoodB, clamp(fibre * 0.7 + broad * 0.6 - 0.2, 0.0, 1.0)) * (1.0 - 0.55 * check) * (1.0 - 0.65 * vWood.x);
      #ifdef BARE
        // driftwood (plants/deadwood.js): there is no bark left on it anywhere, and its cracks are weathered as
        // pale as the rest of it (as dark as a fresh break's, a stub seen from a stride away was spotted)
        albedo = split * (1.0 - 0.25 * check) / (1.0 - 0.55 * check);
      #else
        albedo = mix(albedo, split, vWood.y);
      #endif
    }
    // moss grows on upward faces, round the foot of a standing tree (uFoot), and in damp patches; less of it on a fresh break
    float moss = max(N0.y, 0.0) * 1.3 + (1.0 - smoothstep(0.2, 6.0, h)) * 0.7 * uFoot + (damp - 0.5) * 1.3 + (tuft - 0.5) * 0.5 - 0.45 * vWood.y;
    #ifdef WORN
      moss -= 1.25 * vWood.y;             // wood that boots and hands keep bare (plants/footbridge.js): moss holds only where they do not go
    #endif
    #ifdef WRAPPED
      // A maple's trunk and limbs are wrapped in it all round (plants/maple.js), thickest on the trunk and the
      // great limbs and thinner above, and never none: on three maples of the Hoh every branch and twig carried
      // living epiphytes (Can. J. Bot. 62, 1984, as an agent read its text). It was first let go by 20 m.
      moss += 0.75 * mix(1.0, 0.5, smoothstep(9.0, 22.0, h));
    #endif
    // its paint is stippled like the floor's: read the forest-floor sheet for the brushwork,
    // and let a patch end where a dab ends instead of fading out
    float dabbed = dot(texture2D(uMossMap, skin).rgb, vec3(0.6, 1.2, 0.5));
    moss = smoothstep(0.5, 0.62, moss * uMoss * 1.6 + (dabbed - 0.3) * 0.6);
    vec3 mossPaint = mix(uMossA, uMossB, clamp(damp * 0.55 + tuft * 0.7 - 0.12, 0.0, 1.0)) * min(0.5 + 4.0 * dabbed, 1.2);     // a dab is never much lighter than the moss round it: at 1.4 the lightest glowed against the bark by moonlight
    albedo = mix(albedo, mossPaint, moss);
    vec3 N = normalize(mix(relief(N0, vWorld, vUv, nm), N0, max(moss * 0.75, vWood.y)));                 // moss fills the furrows; split wood has none
    // A break is chipped, not turned: every face of it takes its own light. Shaded smoothly from one face to
    // the next, a snapped end facing the sun was one even disc, and from the trail the log had been sawn.
    vec3 Nf = cross(dFdx(vWorld), dFdy(vWorld));
    float area = dot(Nf, Nf);
    #ifdef BARE
      bool chipped = vWood.y > 0.9;       // a drift log is round and worn smooth: only its broken ends are faces
    #else
      bool chipped = vWood.y > 0.5;
    #endif
    if (chipped && area > 1e-24) {
      Nf *= inversesqrt(area);
      N = dot(Nf, cameraPosition - vWorld) < 0.0 ? -Nf : Nf;
    }
    // The deeper below the rim, the less sky reaches the wood, and past about half the trunk's radius down
    // the sun does not either: a shallow break is lit, a hollow is dark.
    float ao = mix(0.5, 1.0, smoothstep(0.0, 1.4, h)) * (1.0 - 0.6 * vWood.x);
    #ifdef DEEP_HOLLOW
      // A tree a walker can step into (plants/cedar.js): its hollow is a room, not the end of a log. Deep in it
      // the wood is charred and rotten, and no more of the sky's light arrives than through a door ajar. The
      // creases between its columns go most of the way to that dark, which is all that draws them in shade.
      albedo = mix(albedo, vec3(0.05, 0.036, 0.03), smoothstep(0.55, 1.0, vWood.x) * vWood.y);
      ao *= 1.0 - 0.78 * smoothstep(0.6, 1.0, vWood.x);
    #endif
    gl_FragColor = vec4(forestShade(albedo, N, vWorld, ao, 0.0, 1.0 - smoothstep(0.35, 0.9, vWood.x)), 1.0);
  }
`;

// The rock of the falls (plants/crag.js): bedded stone laid on through three flat projections, moss on what
// faces up and over every lip, dark where it is wet, bare where the water has scoured it.
const ROCK_FRAG = /* glsl */`
  ${LIGHT_PARS}
  ${VARYINGS}
  uniform sampler2D uMap, uMossMap;
  uniform vec3 uMossA, uMossB;
  uniform float uMoss;
  varying vec2 vWood;                    // x: how wet it is (the pool's edge, the spray); y: how bare the water keeps it
  // (vUv.x: how much of the sky's light reaches it; vUv.y: how much of the forest's litter lies over it)
  void main() {
    vec3 N0 = normalize(vNormal), P = vWorld;
    // A ledge is planes. Shaded smoothly from one to the next it was a cushion; shaded face by face alone, a
    // pile of cut blocks. It takes some of each: the planes show, and a corner is still a little round.
    vec3 Nf = cross(dFdx(P), dFdy(P));
    float area = dot(Nf, Nf);
    Nf = area > 1e-24 ? Nf * inversesqrt(area) : N0;
    if (dot(Nf, cameraPosition - P) < 0.0) Nf = -Nf;
    vec3 N = normalize(mix(N0, Nf, 0.5));
    // the painted stone, through three flat projections weighted by the way the face looks: the beds are
    // level on every upright face (the tile's top is up), and what faces the sky is read from above
    vec3 w = N * N; w *= w; w /= (w.x + w.y + w.z);
    float tilt = (texture2D(uNoiseTex, P.xz * 0.02).r - 0.5) * 0.5;                    // the beds dip a little, one way here and another there
    vec3 stone = texture2D(uMap, vec2(P.z, P.y + tilt) * 0.33).rgb * w.x + texture2D(uMap, P.xz * 0.33 + 0.37).rgb * w.y + texture2D(uMap, vec2(P.x, P.y + tilt) * 0.33 + 0.61).rgb * w.z;
    // slow drifts of tone, so that no stride of the wall is the stride beside it
    float drift = dot(w, vec3(texture2D(uNoiseTex, P.zy * 0.09 + 0.2).r, texture2D(uNoiseTex, P.xz * 0.09).r, texture2D(uNoiseTex, P.xy * 0.09 + 0.6).r));
    vec3 albedo = stone * mix(0.72, 1.22, drift);
    #ifdef TONE
      albedo *= TONE;                    // stone that is not the valley's dark bedrock: gathered from the river's bars for a chimney
    #endif
    float wet = clamp(vWood.x + (drift - 0.5) * 0.5, 0.0, 1.0);
    albedo *= mix(vec3(1.0), vec3(0.4, 0.4, 0.37), wet);                               // wet stone is dark (cold as well, in a tree's shade, it was navy blue)
    // Moss: thick on what faces up, hanging over every lip, in the damp of a corner; thin on a dry upright
    // face; none where the water runs. Its paint is the floor's own stipple, as on bark, and a patch ends where a dab ends.
    float damp = dot(w, vec3(texture2D(uNoiseTex, P.zy * 0.27 + 0.5).r, texture2D(uNoiseTex, P.xz * 0.27 + 0.1).r, texture2D(uNoiseTex, P.xy * 0.27 + 0.8).r));
    const vec3 GREEN = vec3(0.6, 1.2, 0.5);
    float dabbed = dot(w, vec3(dot(texture2D(uMossMap, P.zy * 0.25).rgb, GREEN), dot(texture2D(uMossMap, P.xz * 0.25).rgb, GREEN), dot(texture2D(uMossMap, P.xy * 0.25).rgb, GREEN)));
    float moss = smoothstep(0.0, 0.6, N0.y) * 1.3 + (damp - 0.5) * 1.5 + (1.0 - vUv.x) * 0.5 + wet * 0.2 - 1.7 * vWood.y;
    moss = smoothstep(0.5, 0.62, moss * uMoss + (dabbed - 0.3) * 0.6);
    vec3 mossPaint = mix(uMossA, uMossB, clamp(damp * 0.6 + smoothstep(0.2, 0.9, N0.y) * 0.45 - 0.1, 0.0, 1.0)) * min(0.55 + 3.5 * dabbed, 1.2);
    albedo = mix(albedo, mossPaint, moss);
    // Where it goes back under the ground the forest's litter lies over it: the floor's own paint, read as the
    // floor reads it, and ending where a dab ends.
    float under = smoothstep(0.42, 0.6, vUv.y + (dabbed - 0.3) * 0.7 + (damp - 0.5) * 0.5);
    if (under > 0.0) albedo = mix(albedo, mix(texture2D(uMossMap, P.xz * 0.25).rgb, texture2D(uMossMap, P.zx * 0.071 + 0.37).rgb, 0.35) * 0.9, under);
    N = normalize(mix(N, N0, max(moss * 0.7, under)));                                  // moss rounds a ledge off
    // a corner under a ledge gets little of the sky; a wet face shines a little with what sky there is
    float ao = mix(0.42, 1.0, vUv.x);
    vec3 col = forestShade(albedo, N, P, ao, 0.0);
    vec3 V = normalize(P - cameraPosition);
    float graze = pow(1.0 - clamp(dot(-V, N), 0.0, 1.0), 5.0);
    col += uSkyAmb * 0.28 * graze * wet * (1.0 - moss) * exp(-length(P - cameraPosition) * uFogDensity);      // (at three times this a wet wall seen along its length was a pane of glass)
    gl_FragColor = vec4(col, 1.0);
  }
`;

// The ground of the river's bars, under the stones: sand and grit (paint/textures.js gravelTexture), lighter
// and darker in drifts tens of metres long and in patches a stride across, so that no metre of it is the
// metre beside it. The ground paints itself with this, and a stone's shadow paints the ground with it.
const BAR_PAINT = /* glsl */`
  uniform sampler2D uGravelMap;
  vec3 barPaint(vec2 xz) {
    vec3 sand = mix(texture2D(uGravelMap, xz * 0.83).rgb, texture2D(uGravelMap, xz.yx * 0.27 + 0.23).rgb, 0.35);
    return sand * (0.74 + 0.4 * texture2D(uNoiseTex, xz * 0.021 + 0.6).r) * (0.82 + 0.36 * texture2D(uNoiseTex, xz * 0.13 + 0.31).r);
  }
`;

// The forest floor: one painted tile, and along the trail the tread's own tile
// (earth worn bare: paint/textures.js treadTexture) with a wavering edge.
const GROUND_VERT = /* glsl */`
  ${VERT_COMMON}
  attribute vec4 aGround;               // what the ground is here (world/land.js paint): gravel, grass, bare earth, wet
  varying vec4 vGround;
  void main() {
    vGround = aGround;
    vec4 wp = forestWorld(forestPlace(), 0.0);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const GROUND_FRAG = /* glsl */`
  ${LIGHT_PARS}
  ${VARYINGS}
  uniform sampler2D uMap, uTreadMap, uTrailMap, uMeadowMap;
  uniform vec2 uTrailOrigin, uTrailInvSize;
  varying vec4 vGround;
  ${BAR_PAINT}
  void main() {
    vec3 albedo = texture2D(uMap, vWorld.xz * 0.25).rgb;
    // break the tile's repeat with a second, larger read
    albedo = mix(albedo, texture2D(uMap, vWorld.zx * 0.071 + 0.37).rgb, 0.35);
    float worn = 1.0;                     // how much of the tread's bare earth shows: all of it on a forest floor
    if (vGround.x + vGround.y + vGround.z + vGround.w > 0.0) {
      // Off the old terrace the floor is something else: sand and grit on a bar, grass in the clearing and
      // along the bank, bare earth and rock where the ravine's sides are steep, dark where it is wet. Each
      // ends where a dab ends, not in a fade.
      float n = texture2D(uNoiseTex, vWorld.xz * 0.13).r - 0.5, m = texture2D(uNoiseTex, vWorld.zx * 0.47 + 0.19).r - 0.5;
      float bare = smoothstep(0.6, 0.8, vGround.z + n * 1.1 + m * 0.4);
      albedo = mix(albedo, texture2D(uTreadMap, vWorld.xz * 0.31 + 0.5).rgb * vec3(0.92, 0.9, 0.86), bare * 0.85);
      float grass = smoothstep(0.38, 0.6, vGround.y + n * 0.6 + m * 0.3);
      vec3 meadow = mix(texture2D(uMeadowMap, vWorld.xz * 0.33).rgb, texture2D(uMeadowMap, vWorld.zx * 0.093 + 0.41).rgb, 0.4);
      albedo = mix(albedo, meadow, grass);
      float gravel = smoothstep(0.4, 0.6, vGround.x + n * 0.5 + m * 0.25);
      albedo = mix(albedo, barPaint(vWorld.xz), gravel);
      albedo *= 1.0 - 0.38 * vGround.w * (1.0 - 0.5 * gravel);
      worn = 1.0 - 0.72 * gravel;         // a path over cobbles is only a paler line where boots have turned them
    }
    float away = texture2D(uTrailMap, (vWorld.xz - uTrailOrigin) * uTrailInvSize).r * 8.0;      // metres from the trail, up to 8
    float edge = texture2D(uNoiseTex, vWorld.xz * 0.6).r - 0.5;
    float path = 1.0 - smoothstep(0.6, 1.3, away + edge * 0.7);
    if (path > 0.0) {
      // broad lighter and darker reaches along it, so two metres of trail never repeat as two metres
      vec3 tread = texture2D(uTreadMap, vWorld.xz * 0.5).rgb * (0.78 + 0.44 * texture2D(uNoiseTex, vWorld.xz * 0.043 + 0.31).r);
      albedo = mix(albedo, tread, path * worn);
    }
    gl_FragColor = vec4(forestShade(albedo, normalize(vNormal), vWorld, 1.0, 0.0), 1.0);
  }
`;

// The river's stones (plants/stones.js): cobbles and boulders, each a solid with its own shadow. A vertex of a
// shadow is moved away from the sun by the height of its stone over the sun's slope, as far as it faces away,
// so the shadow lies the way the light does at every hour, long under a low sun. It is the ground's own paint
// with no sun on it: in a tree's shade it cannot be told from the ground, as a shadow in shade cannot.
const STONE_VERT = /* glsl */`
  ${VERT_COMMON}
  uniform vec3 uSunDir;
  varying float vAway;                   // on a shadow: how far this part of it faces away from the sun, 0 to 1
  varying float vFoot;                   // on a shadow: 1 under the middle of its stone, 0 at its rim
  void main() {
    vec4 wp = forestWorld(forestPlace(), 0.0);
    vAway = 0.0; vFoot = 0.0;
    #ifdef USE_INSTANCING
      mat3 turn = mat3(instanceMatrix);
      float fade = aInst.w;              // a knot at its limit shrinks into its foot (forestPlace), and its shadows with it
    #else
      mat3 turn = mat3(1.0);
      float fade = 1.0;
    #endif
    // The knot lies as the ground does: the instancer has sheared it by the ground's slope under it, which is
    // read back here (what the ground rises in a metre towards +x and towards +z).
    float size = length(turn[1]);
    vec2 fall = vec2(turn[0].y * turn[0].x + turn[2].y * turn[2].x, turn[0].y * turn[0].z + turn[2].y * turn[2].z) / max(size * size, 1e-6);
    vec3 out3 = turn * normal;
    if (aWind.y > 0.5) {
      float wide = length(out3.xz);
      vec2 away = -uSunDir.xz / max(length(uSunDir.xz), 1e-4);
      float slope = sqrt(max(1.0 - uSunDir.y * uSunDir.y, 0.0)) / max(uSunDir.y, 0.2);
      if (wide > 1e-5) {
        vAway = max(dot(out3.xz / wide, away), 0.0);
        // drawn out away from the sun, and down the bank if the ground falls that way
        vec2 move = away * (aWind.x * size * fade * slope * vAway);
        wp.xz += move;
        wp.y += dot(fall, move);
      } else vFoot = 1.0;
      vWorld = wp.xyz;
    } else {
      // A sheared stone's faces do not turn as its points do: a face keeps what it had of east and north and
      // tips by the slope. (The shared routine turns normals by the matrix itself, which is right for a turn
      // and a size and wrong for a shear: a stone on a bank was lit as if it lay level.)
      float up = out3.y - dot(fall, out3.xz);
      vNormal = normalize(vec3(out3.x - up * fall.x, up, out3.z - up * fall.y));
    }
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const STONE_FRAG = /* glsl */`
  ${LIGHT_PARS}
  ${VARYINGS}
  uniform vec3 uCool, uWarm, uPale, uDark, uRust;
  varying vec2 vWood;                    // a stone: x how high up it this is (0 to 1), y 0. Its shadow: x the stone's height, y 1
  varying float vAway, vFoot;
  ${BAR_PAINT}
  void main() {
    if (vWood.y > 0.5) {
      // A stone's shadow: sand with as much of the sun taken from it as this part of the shadow takes. All of
      // it on the far side; none on the sun's side or at the rim, so that its edge is a soft one (the fan's own
      // edge is ruled from corner to corner). What is drawn is kept only where it is darker than what is there
      // (the material's blend), and it is painted a twentieth lighter than the sand would be, so that sand in
      // a tree's shade, where there is no sun to take, is left alone to the last pixel. The sun is added back
      // in the same share to red, green and blue: a shadow painted lighter by one number for all three crossed
      // the sunlit sand's red before its blue, and had a green fringe at golden hour.
      vec3 amb = uSkyAmb;
      if (uOpen > 0.0) amb *= 1.0 + uOpen * uOpenSky * openSky(vWorld.xz) * vec3(0.94, 1.0, 1.14);
      vec3 unlit = amb * uShadowTint;
      float taken = smoothstep(0.0, 0.3, vAway) * smoothstep(0.0, 0.25, vFoot);
      // close in under the stone less of the sky reaches the sand, in sun or shade
      float under = mix(1.05, 0.66, smoothstep(0.0, 0.55, vFoot));
      vec3 light = unlit * under + uSunColor * (1.0 - taken) * 1.05;
      // (a stone's shadow is the sun's or the moon's: the lantern lights the sand in it as it lights the sand
      // beside it. Left out, every cobble cut a blot of moon-shadow into the lantern's pool)
      if (uLamps > 0.0) light += lampLight(vec3(0.0, 1.0, 0.0), vWorld, 0.0) * 1.05;
      gl_FragColor = vec4(applyMist(barPaint(vWorld.xz) * light, vWorld), 1.0);
      return;
    }
    // which rock it is, and how light a piece of it; each knot of stones leans a little to grey or to buff
    vec3 rock = vUv.x < 0.4 ? uCool : vUv.x < 0.7 ? uWarm : vUv.x < 0.8 ? uPale : vUv.x < 0.94 ? uDark : uRust;
    rock = mix(rock, vTint < 0.5 ? uCool : uWarm, 0.5 * abs(vTint - 0.5));
    float grain = texture2D(uNoiseTex, vWorld.xz * 2.7 + vWorld.y * 3.1).r, speck = texture2D(uNoiseTex, vWorld.zx * 9.0 + vWorld.y * 7.0 + 0.4).r;
    vec3 albedo = rock * (0.62 + 0.36 * vUv.y) * (0.84 + 0.3 * grain) * (0.9 + 0.2 * speck) * mix(0.9, 1.1, vTint);
    // down between the stones less of the sky is seen, and the foot of each is damp and dark
    float ao = mix(0.42, 1.0, smoothstep(0.0, 0.75, vWood.x));
    gl_FragColor = vec4(forestShade(albedo, normalize(vNormal), vWorld, ao, 0.0), 1.0);
  }
`;

// Moving water: the river and the creek (world/water.js). Water has little colour of its own. What is seen
// of it is its bed, through it, where it is thin; what stands over it, mirrored, the more the lower the eye;
// and the breaks in that mirror its ripples make. So the sheets are blended over the ground by how deep the
// water is, and what each ripple mirrors is looked for: the far bank's trees or the sky. (Until the owner
// said "the water looks really bad" it was one opaque coat of paint in blotches of two blues, with a tan band
// for its shallows.)
const WATER_VERT = /* glsl */`
  attribute vec3 aWater;                // x depth in metres (a ribbon's, as painted), y how broken the water is (0 smooth .. 1 falling), z how fast it runs
  attribute vec3 aFlow;                 // metres down the stream, metres across it from its middle line, and for a ribbon -1..1 from bank to bank (0 on a lattice)
  attribute float aAir;                 // a creek's: 0 where it runs under trees, 1 where it runs under open sky (the river's sheet has none)
  varying vec3 vWorld;
  varying vec3 vWater;
  varying vec3 vFlow;
  varying float vAir;
  void main() {
    vWorld = position; vWater = aWater; vFlow = aFlow; vAir = aAir;
    gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
  }
`;
const WATER_FRAG = /* glsl */`
  ${LIGHT_PARS}
  uniform float uTime;
  uniform vec3 uDeep, uLight, uFoam;    // the water's own colour where it is deep, and where it is thin over its bed; and broken water
  uniform vec3 uDeepOpen, uLightOpen;   // the same water where no crown stands over it (a creek's; a river's are its own again)
  uniform vec2 uGrain;                  // how long and how wide a ripple is, as repeats a metre
  uniform float uClear;                 // how many metres of it hide its bed
  uniform float uWet;                   // how much of its bed's light comes back up through it: a wet stone is a darker stone
  uniform float uSheen;                 // how much of what stands over it lies on it, of what a mirror would show
  uniform float uRipple;                // how far its ripples tilt it
  uniform float uRagged;                // how far in from its banks a ribbon of water is broken off, as a share of half its width (0: not at all)
  uniform float uWoods;                 // how much of what lies on it is the wood round it and not the sky: 1 for a creek under trees
  #ifdef RIVER
    uniform sampler2D uBanks;           // what stands along the river, from above (world/water.js banksMap): r how high it reaches over the water, g how light its leaves are
    uniform vec4 uBanksBox;             // that map's corner (x, z), and one over its size
    uniform vec3 uBed;                  // half the river's width, how deep it is in its middle, and how many metres the map's 1 is
    uniform vec3 uConifer, uLeaf;       // the paint of a conifer and of a broad-leaved tree, mirrored
  #endif
  varying vec3 vWorld;
  varying vec3 vWater;
  varying vec3 vFlow;
  varying float vAir;
  float ease(float t) { t = clamp(t, 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
  void main() {
    // A ribbon's own edge is two ruled lines, and a creek so edged was a road across the bar. The water stops
    // short of them by a different amount every hand's breadth along, and the wet bed shows between.
    if (uRagged > 0.0 && vWater.y < 0.9) {
      float lip = texture2D(uNoiseTex, vec2(vFlow.x * 0.31, vFlow.y * 0.23 + 0.5)).r * 0.7 + texture2D(uNoiseTex, vec2(vFlow.x * 1.3 + 0.4, 0.27)).r * 0.3;
      if (1.0 - abs(vFlow.z) < uRagged * clamp(lip * 2.0 - 0.5, 0.0, 1.0)) discard;
    }
    float run = uTime * vWater.z;
    vec2 broad = vec2((vFlow.x - run * 0.9) * uGrain.x, vFlow.y * uGrain.y);
    float a = texture2D(uNoiseTex, broad).r;
    float b = texture2D(uNoiseTex, vec2((vFlow.x - run * 1.6) * uGrain.x * 2.7 + 0.37, vFlow.y * uGrain.y * 2.3 + 0.11)).r;
    float white = clamp(vWater.y, 0.0, 1.0);
    // How deep it is here. The river's bed is the section of its middle line (world/land.js valley), so a
    // pixel's depth is had from how far it lies from that line; a ribbon carries the depth it is painted at.
    #ifdef RIVER
      float inside = uBed.x - abs(vFlow.y);
      float depth = uBed.y * ease(inside / 5.0) + 0.1 * ease(inside / 1.2);
    #else
      float depth = vWater.x;
    #endif
    // A creek is dark under trees, where it lies over a dark bed with the wood on it. Out in the old clearing
    // the sky is on it and the sun on its stones: painted there as it is in the wood, it was a strip of tar
    // with white dashes across the grass, by night most of all. Which it is goes by the place (world/water.js),
    // not by the crowns overhead: the old cedar's wet ground has few, and its spring is dark all the same.
    float air = uWoods > 0.0 ? vAir : 0.0;
    // its own colour: the lighter where it is thin over its bed, and where a riffle has stirred air into it
    vec3 albedo = mix(mix(uLight, uLightOpen, air), mix(uDeep, uDeepOpen, air), smoothstep(0.2, 1.1, depth) * (1.0 - 0.5 * white));
    // broken water: streaks of white that thicken until, where it falls, little else is left. Whole water has none.
    float foam = smoothstep(0.66 - 0.6 * white, 0.74 - 0.5 * white, b * 0.7 + a * 0.3) * (0.35 + 0.65 * white) * smoothstep(0.1, 0.26, white);
    // falling water comes down in strands: thin lines of it, drawn out the way it runs
    float strand = texture2D(uNoiseTex, vec2((vFlow.x - run * 0.5) * uGrain.x * 0.6, vFlow.y * uGrain.y * 3.1 + 0.7)).r;
    albedo = mix(albedo, uFoam * (0.62 + 0.55 * strand), foam);
    // Where it falls outright it is threads of white with the dark of the wet rock between them. One even
    // white, however streaked, was a sheet of ice hung in the ravine.
    float fall = smoothstep(0.6, 0.95, white);
    if (fall > 0.0) {
      // strands a hand or two across that waver and part as they come down, and finer ones among them; whole
      // and white down its middle, and fraying at its edges into strands with the rock showing between
      float t1 = texture2D(uNoiseTex, vec2((vFlow.x - run * 0.5) * 0.05, vFlow.y * 1.1 + 0.7)).r;
      float t2 = texture2D(uNoiseTex, vec2((vFlow.x - run * 0.8) * 0.1 + 0.21, vFlow.y * 3.7 + 0.3)).r;
      float t3 = texture2D(uNoiseTex, vec2((vFlow.x - run * 0.65) * 0.3 + 0.5, vFlow.y * 9.0 + 0.1)).r;
      // Strands alone are the same from the lip to the pool, and a thing that does not change along the way it
      // moves cannot be seen to move: with the clock running the fall stood still, a white band. Water comes
      // over a lip in gouts: thicker and thinner by turns, each a hand or two long, and they are what the eye
      // follows down. They cross the fall in about the time a thing takes to drop that far.
      float gout = texture2D(uNoiseTex, vec2((vFlow.x - run * 1.08) * 0.125 + 0.13, vFlow.y * 0.42 + 0.45)).r;
      float core = 1.0 - abs(vFlow.z), strands = t1 * 0.5 + t2 * 0.5 + (core - 0.5) * 0.5 + (gout - 0.5) * 0.3;
      if (fall > 0.5 && strands < 0.3 && core < 0.7) discard;
      float threads = smoothstep(0.3, 0.44, strands);
      // The white is two whites: the thick of a gout, and the thin water between gouts, where the wet rock's
      // grey shows through. A gout ends where a dab ends, drawn out a little down the strands it is made of.
      float thick = smoothstep(0.43, 0.55, gout * 0.8 + t2 * 0.2);
      vec3 falling = uFoam * mix(vec3(0.5, 0.57, 0.64), vec3(1.0), thick) * (0.93 + 0.14 * t3);
      albedo = mix(albedo, mix(uDeep * 1.6 + uLight * 0.35, falling, threads), fall);
    }
    // its ripples, at three sizes: a riffle's stand twice as steep as a pool's
    float c = texture2D(uNoiseTex, vec2((vFlow.x - run * 1.25) * uGrain.x * 6.1 + 0.71, vFlow.y * uGrain.y * 4.3 + 0.53)).r;
    float tilt = uRipple * (1.0 + 1.6 * white);
    vec3 N = normalize(vec3((a - 0.5 + 0.45 * (c - 0.5)) * tilt, 1.0, (b - 0.5 + 0.45 * (c - 0.5)) * tilt));
    float through = canopyLight(vWorld);
    // On the river the dapples of the wood that stands between it and the sun are half as strong: on open, level
    // water every gap in the crowns lay as a long dark bar, ruled across the current, and the bars made a plaid of it.
    if (uWoods <= 0.0) through = mix(through, 0.62, 0.5);
    float sun = sunShadow(vWorld) * through;
    #ifdef RIVER
      // (and a trunk's shadow on milky water is no bar: the light goes on into the water round it. Whole, the
      // shadows of the bank's trees lay across the river as a fan of dark spokes. Let down this far, one read
      // of the sun's map does for it, where wood and ground blend four.)
      sun = mix(sun, 0.7, 0.6);
    #endif
    float band = smoothstep(uBand.x, uBand.y, dot(N, uSunDir));
    vec3 amb = mix(uGroundAmb, uSkyAmb, 0.9);
    float overhead = openSky(vWorld.xz);
    if (uOpen > 0.0) amb *= 1.0 + uOpen * uOpenSky * overhead * vec3(0.94, 1.0, 1.14);
    vec3 lit = albedo * (amb * uShadowTint + uSunColor * band * sun);
    if (uLamps > 0.0) lit += albedo * lampLight(N, vWorld, 0.0);

    // What lies on it. A mirror shows more the lower the eye: looked down into from a bank it shows a tenth
    // of what stands over it, and a stone's throw off nearly all. (That is more than water's own law gives
    // near the eye, by a painter's licence: five metres out from a walker on the bank the law would show an
    // eighth of what stands over the water, and this shows two fifths.)
    vec3 V = normalize(vWorld - cameraPosition), R = reflect(V, N);
    R.y = abs(R.y);                                       // (a ripple tilted far enough sends the ray down into the water: it is taken as going up)
    float facing = clamp(dot(-V, N), 0.0, 1.0), solid = max(foam, fall);
    float mirror = uSheen * (0.05 + 0.92 * pow(1.0 - facing, 2.2)) * (1.0 - solid);
    // The sky that lies on water is the sky overhead more than the pale air at the horizon, and darker than
    // either: with the horizon's own tone on it a creek over pale cobbles was the cobbles' grey, and was not
    // seen to be there at all.
    vec3 sky = mix(uFogColor, uZenith, 0.45 + 0.55 * smoothstep(0.0, 0.7, R.y)) * 0.82, shown = sky;
    #ifdef RIVER
      // What stands in the mirrored ray's way: the ray is followed out across the map of the banks, each step
      // longer than the last (half as long again, on the high tier: the tier's mirror, in budget.js), to 280 m. A tree's
      // edge is as soft as the step that found it is long.
      if (mirror > 0.03) {
        vec2 way = normalize(R.xz + vec2(1e-5));
        float rise = max(R.y, 0.015) / max(length(R.xz), 0.05), met = 0.0, leaf = 0.0, where = 0.0, t = 1.6;
        for (int i = 0; i < BANK_STEPS; i += 1) {
          // (it stops where no later step could change what was found: once the ray has climbed over everything
          // the map can hold, or has run into something whole)
          if (t * rise > uBed.z) break;
          vec2 here = texture2D(uBanks, (vWorld.xz + way * t - uBanksBox.xy) * uBanksBox.zw).rg;
          float over = smoothstep(0.0, 0.5 + 0.1 * (BANK_STRIDE - 1.0) * t, here.r * uBed.z - t * rise);
          if (over > met) { met = over; leaf = here.g; where = t; }
          if (met >= 1.0) break;
          t *= BANK_STRIDE;
        }
        // the trees there, in the hour's light, with the air between: darker than the trees themselves, as a
        // mirrored thing is
        vec3 wood = mix(uConifer, uLeaf, leaf) * (mix(uGroundAmb, uSkyAmb, 0.7) * uShadowTint * (1.0 + uOpenSky * vec3(0.94, 1.0, 1.14)) + uSunColor * 0.3);
        wood = applyMist(wood, vec3(vWorld.x + way.x * where, vWorld.y + where * rise, vWorld.z + way.y * where));
        // (a brush's edge: the ripples have broken it already, and it is not left soft)
        shown = mix(sky, wood, smoothstep(0.3, 0.7, met));
      }
    #else
      if (uWoods > 0.0) {
        // Under trees what lies on water is the wood itself: trunks, dark, and the mist's light between them,
        // each drawn out towards the eye and broken by the ripples. Which is which goes by the bearing the
        // reflected ray leaves on (the two reads go a whole number of times round, so there is no seam). One even
        // tone of sky on it, and a creek in the forest was a strip of pale paving.
        float bearing = atan(R.z, R.x);
        float trunks = texture2D(uNoiseTex, vec2(bearing * 1.90986 + 0.3, 0.37)).r * 0.6 + texture2D(uNoiseTex, vec2(bearing * 6.04789, 0.61)).r * 0.4;
        float between = smoothstep(0.5, 0.64, trunks);
        vec3 beside = mix(uFogColor * vec3(0.1, 0.14, 0.12), uFogColor * 0.5, between);
        // That is what a ray leaving low meets. One that leaves higher meets the wood's leaves, and only a steep
        // one goes up through the crowns to the sky, where they stand open (the crown map, read where the ray
        // would be 16 m up). With the light between trunks on every ray the pool under the falls, looked down
        // into from the rim, was a sheet of the mist's grey; with the sky on every ray that leaves above the
        // trunks, the spring in the old cedar's glade was a slab of pale stone among the skunk cabbage.
        vec3 leaves = uFogColor * vec3(0.07, 0.12, 0.08);
        vec3 above = mix(leaves, sky, openSky(vWorld.xz + R.xz * (16.0 / max(R.y, 0.5))) * smoothstep(0.45, 0.8, R.y));
        // (out in the old clearing the walker stands under open sky, and it is the sky that lies on the creek there)
        shown = mix(sky, mix(beside, above, smoothstep(0.12, 0.3, R.y)), uWoods * (1.0 - uOpen));
      }
    #endif
    // the sun on it, or the moon: where a ripple's face sends the light straight to the eye
    float glint = smoothstep(0.5, 0.8, pow(max(dot(R, uSunDir), 0.0), 70.0)) * sun * (1.0 - solid);
    // and the backs of its ripples, which take the sky's light whatever lies on the water round them: thin
    // strokes of it drawn out along the current, broken into dashes. They are what says the water is moving.
    // (A stroke is a band of the broad ripples' noise. Where a pixel takes in more than a texel or so of that
    // noise the band is thinner than the pixel, and it is let go: drawn on, a far stroke was a row of dots.)
    float crest = (1.0 - smoothstep(0.045, 0.085, abs(a - 0.5))) * smoothstep(0.45, 0.62, b) * (1.0 - solid)
      * (1.0 - smoothstep(0.7, 1.6, 256.0 * max(length(dFdx(broad)), length(dFdy(broad)))));

    // Its bed shows through it where it is thin: the paint is laid over the ground by how much of the water
    // hides its bed, looked straight down into, and the mirror lies on top of that.
    float hides = max(smoothstep(0.0, uClear, depth), max(solid, 1.5 * white));
    float cover = clamp(mirror + (1.0 - mirror) * hides, 0.0, 1.0);
    vec3 own = (shown * mirror + lit * (1.0 - mirror) * clamp(hides, 0.0, 1.0)) / max(cover, 0.001);
    own = mix(own, mix(uFogColor, uZenith, 0.3) * (0.75 + 0.5 * sun) * mix(0.4, 1.0, overhead), 0.6 * crest) + uSunColor * (0.9 * glint);
    cover = max(cover, max(glint, 0.6 * crest));
    // What shows through it is wet, and a wet stone is a darker stone: it takes away a share of the light that
    // comes up from its bed, without laying any paint over it. (Without that a creek over pale cobbles was the
    // cobbles, dry, with a film of flecks on them.)
    float dims = 1.0 - (1.0 - cover) * uWet;
    #ifdef RIVER
      float edge = smoothstep(0.0, 0.05, depth);          // it thins to nothing at its edge
      cover *= edge; dims *= edge;
    #endif
    gl_FragColor = vec4(applyMist(own, vWorld) * cover, dims);
  }
`;

// What stands too far off to be built: the valley's walls, spur behind spur, and the mountain at its head
// (paint/backdrop.js). It is painted on a band of the sky, so it has no distance and never comes nearer.
const BACKDROP_VERT = /* glsl */`
  varying vec2 vUv;
  varying vec3 vDir;
  void main() {
    vUv = uv; vDir = position;
    vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0);
    gl_Position = p.xyww;
  }
`;
const BACKDROP_FRAG = /* glsl */`
  uniform sampler2D uMap, uAux;
  uniform sampler2D uPeak, uPeakAux;    // the mountain's own sheet (paint/backdrop.js mountainSheet): its paint with no light in it and, in alpha, where it is; and how squarely each pixel of it faces the sun
  uniform vec4 uPeakBox;                // where that sheet lies on the strip: its corner, and how many times smaller than the strip it is each way
  uniform float uPeakSun;               // how much of the sun the mountain's lit faces take
  uniform vec3 uSunDir, uSunColor, uSkyAmb, uFogColor, uZenith;
  uniform float uSunShare, uFogDensity;
  uniform float uDay;                   // 1 by day, 0 by night (light/shared.js applyTime)
  varying vec2 vUv;
  varying vec3 vDir;
  const float LOW_MIST = 14.0;          // metres of the valley's mist a level look goes through for each metre it would climb
  const float NIGHT_AIR = 0.5;          // how much of the far view is left by night, of what the day leaves
  const vec3 PEAK_SHADE = vec3(0.22, 0.3, 0.44);     // how much of the sky's light the mountain takes, of what a spur takes: its shade is to be blue, and darker than the sky behind it, not white
  void main() {
    vec4 paint = texture2D(uMap, vUv);                  // rgb: the paint; a: how much of it is left once the air in front has had its share
    float facing = texture2D(uAux, vUv).r;              // how squarely it faces the sun's side
    vec3 d = normalize(vDir);
    // the sky behind it, as the dome paints it (SKY_FRAG)
    vec3 sky = mix(uFogColor, uZenith, smoothstep(0.0, 0.7, d.y));
    sky += uSunColor * 0.35 * pow(max(dot(d, uSunDir), 0.0), 24.0);
    // By night the forest's own shade is lifted a long way so that paint in it still reads (shade.nightFill).
    // Snow lifted as far was a lamp at the head of the valley: far off, the night is let be darker.
    vec3 lit = paint.rgb * (uSkyAmb * vec3(2.6, 2.8, 3.4) * mix(0.28, 1.0, uDay) + uSunColor * (uSunShare * facing * mix(0.6, 1.0, uDay)));
    // The paint has its own air in it, as on a clear noon. The mist of the hour lies low in the valley: a look
    // that climbs steeply is soon out of it, and one that runs level stays in it, so on a misty morning the
    // spurs go and the mountain's top stands clear.
    float veil = exp(-uFogDensity * LOW_MIST / max(d.y, 0.02));
    // By night what is far is fainter still: the spurs stood darker and harder than the trees in front of them,
    // which the night's mist had paled, and their skyline of trees was a saw's edge on the sky.
    veil *= mix(NIGHT_AIR, 1.0, uDay);
    // it ends in the sky at both ends of its span, not in a ruled edge
    float ends = smoothstep(0.0, 0.035, vUv.x) * (1.0 - smoothstep(0.94, 1.0, vUv.x));
    // The mountain stands behind every spur. Its sheet's alpha is where it shows: it is cut along the line the
    // spurs' paint was filled to. The strip's own alpha will not do for that: it is the air in front of the
    // strip's paint, laid four columns at a time, and stands over the paint's edge in steps. Against the sky
    // those steps are the sky's own colour. Across the mountain they were a flight of stairs, so where the
    // mountain shows the strip lets go.
    vec2 at = (vUv - uPeakBox.xy) * uPeakBox.zw;
    vec4 peak = texture2D(uPeak, at);
    vec3 near = mix(sky, lit, paint.a * veil * (1.0 - peak.a));
    float turned = texture2D(uPeakAux, at).r;
    // its own light: the sky's on every face of it, and the sun's on the faces turned to the sun, which is what
    // gives it a lit side and a side in blue shade at every hour, and its rose at golden hour
    // (By night the moon is over it and behind it, and the faces it shows the valley take little of it: at the
    // spurs' share its snow stood 24 levels over the night's sky, a lamp at the valley's head.)
    vec3 far = peak.rgb * (uSkyAmb * vec3(2.6, 2.8, 3.4) * PEAK_SHADE * mix(0.28, 1.0, uDay) + uSunColor * (uPeakSun * turned * mix(0.3, 1.0, uDay)));
    // it rises out of the valley's haze: clear at its top, and going into the air towards the notch
    float air = mix(0.14, 0.78, smoothstep(0.2, 0.9, at.y));
    vec3 mountain = mix(sky, far, (1.0 - air) * veil);
    gl_FragColor = vec4(mix(near, mountain, peak.a), ends);
  }
`;

// The stand-ins of the blockout (world/structures.js): flat-painted wood, shakes and stone, each vertex
// its own colour, and a window that is lit from inside.
const PLAIN_VERT = /* glsl */`
  ${VERT_COMMON}
  attribute vec4 aPaint;                // rgb, and in w how much of it is its own light (a lit window)
  varying vec4 vPaint;
  void main() {
    vPaint = aPaint;
    vec4 wp = forestWorld(forestPlace(), 0.0);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const PLAIN_FRAG = /* glsl */`
  ${LIGHT_PARS}
  ${VARYINGS}
  varying vec4 vPaint;
  void main() {
    vec3 N = normalize(vNormal);
    float grain = texture2D(uNoiseTex, vWorld.xz * 0.9 + vWorld.y * 1.7).r, broad = texture2D(uNoiseTex, vWorld.zx * 0.11 + vWorld.y * 0.13).r;
    vec3 albedo = vPaint.rgb * (0.8 + 0.28 * grain) * (0.86 + 0.28 * broad);
    vec3 col = forestShade(albedo, N, vWorld, 1.0, 0.0);
    // A lit window: the room's lamp behind glass, strongest where the lamp is (the share of it a corner of the
    // pane carries, squared: light falls off fast from a lamp). By night it is the brightest thing there is. By
    // day the room behind the glass is darker than the wall round it, and the lamp a warm place in it: at a
    // fifth of its night's strength the whole pane was an orange board, brighter than anything in the shade.
    if (vPaint.w > 0.0) col = mix(col * 0.14, applyMist(vPaint.rgb * 3.2, vWorld), vPaint.w * vPaint.w * mix(1.0, 0.1, uDay));
    gl_FragColor = vec4(col, 1.0);
  }
`;

// Cut-out cards. MODE 0: alpha test. MODE 1: alpha to coverage. MODE 2: colour
// after a depth pre-pass (no discard: the depth test has chosen the pixels).
const FOLIAGE_FRAG = /* glsl */`
  ${LIGHT_PARS}
  ${VARYINGS}
  uniform sampler2D uMap;
  uniform float uGlow, uAoScale;
  #ifdef AXIS
    varying vec2 vWood;                  // x: 1 on a card that is a whole crown (forestWorld in shared.js), 0 on every other; y: how near that tree is
  #endif
  #ifdef THIN
    // forestShade for broad leaves (plants/maple.js), which pass light on to one another: a trunk's shadow
    // across a crown of them is nearly half filled again (0.45), and the sky's light counts for more beside the
    // sun's. Lit as needles are, every trunk between a maple and a low sun ruled a dark stripe down its crown.
    vec3 thinShade(vec3 albedo, vec3 N, vec3 P, float ao, float glow) {
      float wobble = texture2D(uNoiseTex, P.xz * 0.37 + P.y * 0.23).r - 0.5;
      float band = smoothstep(uBand.x, uBand.y, dot(N, uSunDir) + wobble * uBandNoise);
      float sun = mix(0.45, 1.0, sunShadow(P + N * 0.06)) * canopyLight(P);
      vec3 amb = mix(uGroundAmb, uSkyAmb, N.y * 0.5 + 0.5) * ao;
      if (uOpen > 0.0) amb *= 1.0 + uOpen * uOpenSky * openSky(P.xz) * vec3(0.94, 1.0, 1.14);
      // a crown is masses of leaf, one in the shade of another: a slow pattern through it, a stride or two across
      albedo *= mix(0.74, 1.1, texture2D(uNoiseTex, P.xz * 0.085 + P.y * 0.12).r);
      // (by night the forest's shade is lifted a long way so that dark paint still reads, and a leaf's paint is
      // light: lifted as far, a maple by moonlight was lit by a lamp)
      vec3 col = albedo * (amb * uShadowTint * mix(0.6, 1.25, uDay) + uSunColor * band * sun * mix(0.4, 0.8, uDay));
      vec3 V = normalize(P - cameraPosition);
      col += albedo * uSunColor * (glow * sun * pow(max(dot(V, uSunDir), 0.0), 3.0));
      // (the lantern's light, and the window's, by the crown's own normal as the sun is: a leaf on the side of the
      // crown that is turned from the lamp keeps a fifth of it)
      if (uLamps > 0.0) col += albedo * lampLight(N, P, wobble) * (0.45 + 0.55 * ao);
      return applyMist(col, P);
    }
  #endif
  void main() {
    vec4 paint = texture2D(uMap, vUv);
    #if MODE != 2
      float a = paint.a;
      #if MODE == 1
        a = clamp((a - 0.5) / max(fwidth(a), 0.0001) + 0.5, 0.0, 1.0);
        if (a <= 0.0) discard;
      #else
        if (a < 0.5) discard;
        a = 1.0;
      #endif
    #else
      float a = 1.0;
    #endif

    #ifdef DEPTH_ONLY
      gl_FragColor = vec4(0.0, 0.0, 0.0, a);
    #else
      vec3 albedo = paint.rgb * mix(0.82, 1.18, vTint);
      #ifdef PETAL
        // Flowers of the forest floor, and what grows on dead wood (plants/flowers.js): what is not green on the
        // sheet is petal or cap. It is painted a little warm (white paint in the shade takes the shade's blue
        // whole) and by night keeps this share of its lightness, when the shade is lifted so far that pale paint
        // is a lamp.
        albedo *= mix(vec3(1.08, 1.0, 0.9) * mix(float(PETAL), 1.0, uDay), vec3(1.0), smoothstep(0.0, 0.06, paint.g - max(paint.r, paint.b)));
      #endif
      #ifdef DIM
        // (a sheet that is pale all over, a hanging lichen's: all of it keeps this share by night)
        albedo *= mix(float(DIM), 1.0, uDay);
      #endif
      // lower and inner parts of a plant sit in its own shade
      float ao = mix(0.6, 1.0, smoothstep(0.0, 1.0, (vWorld.y - vBase.y) * uAoScale));
      // seen from underneath, a bough shows its shaded side: darker, and lit only by what shines through
      float under = smoothstep(0.05, 0.7, normalize(vWorld - cameraPosition).y);
      #ifdef THIN
        // A broad leaf is thin (plants/maple.js). Seen from underneath it is no bough's shaded side: what
        // falls on its upper side comes through it, yellower than it went in. So it is lit as its upper side
        // is, whichever side is looked at, and from underneath it takes the colour of light through a leaf.
        vec3 N = normalize(normalize(vNormal) + vec3(0.0, 0.5 * under, 0.0));
        #ifdef BLOSSOM
          // A sheet with blossom among its leaves (plants/apple.js). What is not green on it is petal, bud or
          // twig, and none of those is a leaf with the light coming through it: seen from underneath it keeps its
          // own colour (a white petal took the leaf's yellow). And a petal is the palest paint in the forest: by
          // night it keeps this share of its lightness, as pale bark does (PALE_NIGHT), where the leaves round
          // it are lifted as far as every thin leaf is.
          float leafy = smoothstep(0.0, 0.06, paint.g - max(paint.r, paint.b));
          // (and it is painted a little warm: white paint in the shade takes the shade's blue whole, and the
          // shaded half of the tree was in pale blue flower)
          albedo *= mix(vec3(1.1, 1.0, 0.86) * mix(float(BLOSSOM), 1.0, uDay), vec3(1.0), leafy);
          gl_FragColor = vec4(thinShade(albedo * mix(vec3(1.0), vec3(1.04, 1.0, 0.58), under * leafy), N, vWorld, ao, uGlow), a);
        #else
          gl_FragColor = vec4(thinShade(albedo * mix(vec3(1.0), vec3(1.04, 1.0, 0.58), under), N, vWorld, ao, uGlow), a);
        #endif
      #else
        #ifdef AXIS
          // (a crown painted whole is seen from beside it, however high above the eye it stands: vWood.x is 1 on
          // it; and from nearby it is the tree's own shade behind its boughs: vWood.y)
          under *= 1.0 - vWood.x;
          // (and a bough far enough off that the painted crown stands whole behind it is lit as that is: left
          // as its shaded side, the boughs high on a far tree were black marks on the crown painted behind them)
          float far = smoothstep(28.0, 60.0, length(vWorld - cameraPosition));
          under *= 1.0 - far;
          albedo *= 1.0 - 0.45 * vWood.y;
        #endif
        vec3 N = normalize(mix(normalize(vNormal), vec3(0.0, -1.0, 0.0), under * 0.8));
        #ifdef AXIS
          // (nor is it then lit by the way it faces, which is to the sky: it is lit as the middle of the painted
          // crown behind it is, which faces whoever is looking and a little up. By night, when the shade is
          // lifted by the sky's light, a bough lit by its own face was a pale mark on the crown)
          vec2 toEye = normalize(cameraPosition.xz - vWorld.xz);
          N = normalize(mix(N, normalize(vec3(toEye.x, 0.4, toEye.y)), far * (1.0 - vWood.x)));
          // (and from nearby the sun does not reach it: its boughs stand in front of it)
          gl_FragColor = vec4(forestShade(albedo * (1.0 - 0.35 * under), N, vWorld, ao, uGlow * (1.0 + under), 1.0 - vWood.y), a);
        #else
          gl_FragColor = vec4(forestShade(albedo * (1.0 - 0.35 * under), N, vWorld, ao, uGlow * (1.0 + under)), a);
        #endif
      #endif
    #endif
  }
`;

const SKY_VERT = /* glsl */`
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0);
    gl_Position = p.xyww;
  }
`;
const SKY_FRAG = /* glsl */`
  uniform vec3 uSunDir, uSunColor, uFogColor, uZenith;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    vec3 col = mix(uFogColor, uZenith, smoothstep(0.0, 0.7, d.y));
    col += uSunColor * 0.35 * pow(max(dot(d, uSunDir), 0.0), 24.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const hsl = ([h, s, l]) => new THREE.Color().setHSL(h / 360, s / 100, l / 100, THREE.SRGBColorSpace);

export function createMaterials(U, look, { msaa, prepass, mossMap, mirror = [12, 1.6] }) {
  const mossA = hsl(look.palette.moss.dark), mossB = hsl(look.palette.moss.light);
  const woodA = hsl(look.palette.splitWood.dark), woodB = hsl(look.palette.splitWood.light);

  // `foot` is 1 for a standing tree (moss climbs from the ground) and 0 for wood lying on it. `wood` is the
  // palette's pair of colours for its bare wood, where that is not freshly split: an old cedar's dead tops are silver.
  // `hollow` says its hollows are deep enough to be dark (DEEP_HOLLOW in BARK_FRAG), `worn` that its bare wood is
  // kept bare by use (WORN), `night` the share of its lightness that pale bark keeps by night (PALE_NIGHT). Each
  // is a define, so that no other material's arithmetic changes.
  const bark = ({ texture, normal }, { moss = 0.5, tone = [1, 1, 1], foot = 1, wood = null, hollow = false, worn = false, wrapped = false, bare = false, night = 1 } = {}) => new THREE.ShaderMaterial({
    uniforms: { ...U, uMap: { value: texture }, uNormalMap: { value: normal }, uMossA: { value: mossA }, uMossB: { value: mossB },
      uMoss: { value: moss * look.shade.mossy * 2 }, uFoot: { value: foot }, uTone: { value: new THREE.Color(...tone) }, uMossMap: { value: mossMap },
      uWoodA: { value: wood ? hsl(wood.dark) : woodA }, uWoodB: { value: wood ? hsl(wood.light) : woodB } },
    vertexShader: vertex('0.0'), fragmentShader: BARK_FRAG, defines: { WIDE_SHADOW: 1, ...(hollow ? { DEEP_HOLLOW: 1 } : {}), ...(worn ? { WORN: 1 } : {}), ...(wrapped ? { WRAPPED: 1 } : {}), ...(bare ? { BARE: 1 } : {}),
      ...(night !== 1 ? { PALE_NIGHT: night.toFixed(3) } : {}) },
  });

  // `moss`: how mossy, 1 for a ravine that never dries.
  // (`tone`: a define, so that no other rock's arithmetic changes)
  const rock = ({ texture }, { moss = 1, tone = null } = {}) => new THREE.ShaderMaterial({
    uniforms: { ...U, uMap: { value: texture }, uMossMap: { value: mossMap }, uMossA: { value: mossA }, uMossB: { value: mossB }, uMoss: { value: moss * look.shade.mossy * 2 } },
    vertexShader: vertex('0.0'), fragmentShader: ROCK_FRAG, defines: { WIDE_SHADOW: 1, ...(tone ? { TONE: `vec3(${tone.map((v) => v.toFixed(3)).join(', ')})` } : {}) },
  });

  const ground = ({ texture }, tread, trailMap, gravel, meadow) => new THREE.ShaderMaterial({
    uniforms: { ...U, uMap: { value: texture }, uTreadMap: { value: tread.texture }, uTrailMap: { value: trailMap.texture },
      uTrailOrigin: { value: trailMap.origin }, uTrailInvSize: { value: trailMap.invSize },
      uGravelMap: { value: gravel.texture }, uMeadowMap: { value: meadow.texture } },
    vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG, defines: { WIDE_SHADOW: 1 },
  });

  // `colours` is a palette entry (looks): deep, light, foam, and for a creek `open`, the first two again for
  // where it runs under open sky. `grain`, `clear`, `wet`, `sheen`, `ripple`, `ragged` and `woods`: see WATER_FRAG.
  // `banks`, for the river: the map of what stands along it (world/water.js banksMap), `bed` half its width
  // and its depth, and `mirrored` the paint of the trees on it.
  // It is laid over the ground it runs on, its colour already multiplied by how much of the ground it hides.
  const water = (colours, { grain, clear, wet = 0.8, sheen = 1, ripple = 0.22, ragged = 0, woods = 0, banks = null, bed = null, mirrored = null }) => new THREE.ShaderMaterial({
    uniforms: { ...U, uDeep: { value: hsl(colours.deep) }, uLight: { value: hsl(colours.light) },
      uDeepOpen: { value: hsl((colours.open || colours).deep) }, uLightOpen: { value: hsl((colours.open || colours).light) },
      uFoam: { value: hsl(colours.foam) }, uGrain: { value: new THREE.Vector2(...grain) }, uClear: { value: clear }, uWet: { value: wet }, uSheen: { value: sheen }, uRipple: { value: ripple },
      uRagged: { value: ragged }, uWoods: { value: woods },
      ...(banks ? { uBanks: { value: banks.texture }, uBanksBox: { value: banks.box }, uBed: { value: new THREE.Vector3(bed[0], bed[1], banks.top) },
        uConifer: { value: hsl(mirrored.conifer) }, uLeaf: { value: hsl(mirrored.leaf) } } : {}) },
    vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, defines: banks ? { RIVER: 1, BANK_STEPS: mirror[0], BANK_STRIDE: mirror[1].toFixed(3) } : { WIDE_SHADOW: 1 },
    transparent: true, premultipliedAlpha: true,
  });

  const backdrop = ({ texture, aux, peak }) => new THREE.ShaderMaterial({
    uniforms: { uMap: { value: texture }, uAux: { value: aux }, uPeak: { value: peak.texture }, uPeakAux: { value: peak.aux }, uPeakBox: { value: new THREE.Vector4(...peak.box) },
      uPeakSun: { value: look.shade.peakSun ?? 1 }, uSunDir: U.uSunDir, uSunColor: U.uSunColor, uSkyAmb: U.uSkyAmb, uFogColor: U.uFogColor, uZenith: U.uZenith, uFogDensity: U.uFogDensity,
      uSunShare: { value: look.shade.farSun ?? 0.4 }, uDay: { value: 1 } },
    vertexShader: BACKDROP_VERT, fragmentShader: BACKDROP_FRAG, transparent: true, depthWrite: false, depthFunc: THREE.LessEqualDepth,
  });

  const plain = () => new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: PLAIN_VERT, fragmentShader: PLAIN_FRAG, defines: { WIDE_SHADOW: 1 } });

  // Returns { solid, shade }: the stones, and their shadows. `gravel` is the bar's own ground
  // (paint/textures.js gravelTexture), which a shadow is painted as: sand with no sun on it. A shadow is drawn
  // after everything solid and keeps, channel by channel, the darker of itself and what is there (MinEquation).
  // So it darkens sunlit ground and does nothing to ground in shade, to wet sand, or to anything already as
  // dark as it; painted over the ground instead, it was a pale slab wherever the ground was not dry sand.
  // It lies a finger above the ground and is drawn a little towards the eye, so that where the ground swells
  // under it the ground does not cut it off.
  const rocks = look.palette.gravel;
  const stone = (gravel) => {
    const uniforms = { ...U, uGravelMap: { value: gravel.texture }, uCool: { value: hsl(rocks.cool) }, uWarm: { value: hsl(rocks.warm) }, uPale: { value: hsl(rocks.pale) },
      uDark: { value: hsl(rocks.dark) }, uRust: { value: hsl(rocks.rust) } };
    return {
      solid: new THREE.ShaderMaterial({ uniforms, vertexShader: STONE_VERT, fragmentShader: STONE_FRAG }),          // one read of the sun's map, as foliage has: a cobble is too small for four to show
      shade: new THREE.ShaderMaterial({ uniforms, vertexShader: STONE_VERT, fragmentShader: STONE_FRAG, transparent: true, depthWrite: false,
        blending: THREE.CustomBlending, blendEquation: THREE.MinEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }),
    };
  };

  // Returns { foliage, foliageDepth }: the colour material and, when a pre-pass
  // is on, the depth-only twin that draws first.
  // `thin`: broad leaves, which the light comes through, on cards that are drawn in as they turn edge-on
  // (light/shared.js): the middle of the plant's crown, [x, y, z] in its own frame. It is a define, so that
  // no bough's arithmetic changes. `axis`: among its cards are whole crowns (Mesh.whole in plants/build.js: a
  // crown's far level, kept in its nearer ones), which are drawn in to the crown's upright axis instead (AXIS):
  // true for a thin-leaved crown, whose middle is `thin`; for a conifer's, the middle of its crown itself.
  // `blossom`: the sheet has petals among its leaves (BLOSSOM): the share of their lightness they keep by night.
  // `sooner`: the sheet is mostly blossom, and its cards are drawn in sooner as they turn edge-on (SOONER).
  // `variants`: [how many plants the sheet has side by side, the width of one's column as a share of the sheet's]
  // (VARIANTS: a plant's tint says which it is). `petal`: the share of its lightness that paint which is not
  // green keeps by night (PETAL: for leaves that are not thin). `dim`: the share all of it keeps by night (DIM).
  const foliage = ({ texture }, { glow = look.shade.glow, height = 1, thin = null, axis = false, blossom = null, sooner = false, variants = null, petal = null, dim = null } = {}) => {
    const heart = thin || (Array.isArray(axis) ? axis : null);
    const uniforms = { ...U, uMap: { value: texture }, uGlow: { value: glow }, uAoScale: { value: 1 / height }, ...(heart ? { uHeart: { value: new THREE.Vector3(...heart) } } : {}) };
    const make = (mode, extra) => new THREE.ShaderMaterial({
      uniforms, vertexShader: vertex('1.0'), fragmentShader: FOLIAGE_FRAG, side: THREE.DoubleSide,
      defines: { MODE: mode, ...(thin ? { THIN: 1 } : {}), ...(heart && axis ? { AXIS: 1 } : {}), ...(blossom !== null ? { BLOSSOM: blossom.toFixed(3) } : {}), ...(sooner ? { SOONER: 1 } : {}),
        ...(variants ? { VARIANTS: variants[0], VARIANT_STEP: variants[1].toFixed(6) } : {}), ...(petal !== null ? { PETAL: petal.toFixed(3) } : {}), ...(dim !== null ? { DIM: dim.toFixed(3) } : {}), ...(extra.defines || {}) }, ...extra.options,
    });
    if (!prepass) {
      return { foliage: make(msaa ? 1 : 0, { options: { alphaToCoverage: !!msaa } }), foliageDepth: null };
    }
    return {
      foliageDepth: make(msaa ? 1 : 0, { defines: { DEPTH_ONLY: 1 }, options: { colorWrite: false, alphaToCoverage: !!msaa } }),
      foliage: make(2, { options: { depthFunc: THREE.EqualDepth, depthWrite: false } }),
    };
  };

  const sky = new THREE.ShaderMaterial({
    uniforms: { uSunDir: U.uSunDir, uSunColor: U.uSunColor, uFogColor: U.uFogColor, uZenith: U.uZenith },
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthFunc: THREE.LessEqualDepth,
  });

  return { bark, rock, ground, water, backdrop, plain, stone, foliage, sky };
}
