import * as THREE from 'three';
import { LIGHT_PARS } from '../light/shared.js';

// An animal's material: the forest's own light (two-tone bands, the sun map, the canopy, mist) on a skinned,
// painted mesh. Feather edges are cut out of the paint's alpha, as foliage is.
const VERT = /* glsl */`
  #include <skinning_pars_vertex>
  varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv;
  void main() {
    #include <skinbase_vertex>
    vec3 objectNormal = normal;
    #include <skinnormal_vertex>
    vec3 transformed = position;
    #include <skinning_vertex>
    vec4 wp = modelMatrix * vec4(transformed, 1.0);
    vWorld = wp.xyz;
    vNormal = normalize(mat3(modelMatrix) * objectNormal);
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// The same, for many animals of a kind in one draw (life/flock.js): an instance's bones are a row of uBones,
// four texels to a bone, and they carry a vertex straight into the world.
const FLOCK_VERT = /* glsl */`
  attribute vec4 skinIndex;
  attribute vec4 skinWeight;
  attribute float aRow;
  uniform highp sampler2D uBones;
  varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv;
  mat4 bone(float i) {
    int x = int(i) * 4, y = int(aRow + 0.5);
    return mat4(texelFetch(uBones, ivec2(x, y), 0), texelFetch(uBones, ivec2(x + 1, y), 0), texelFetch(uBones, ivec2(x + 2, y), 0), texelFetch(uBones, ivec2(x + 3, y), 0));
  }
  void main() {
    mat4 skin = skinWeight.x * bone(skinIndex.x);
    if (skinWeight.y != 0.0) skin += skinWeight.y * bone(skinIndex.y);
    if (skinWeight.z != 0.0) skin += skinWeight.z * bone(skinIndex.z);
    if (skinWeight.w != 0.0) skin += skinWeight.w * bone(skinIndex.w);
    vec4 wp = skin * vec4(position, 1.0);
    vWorld = wp.xyz;
    vNormal = normalize(mat3(skin) * normal);
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */`
  ${LIGHT_PARS}
  varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv;
  uniform sampler2D uMap;
  // Why a yellow bird read cream. The final pass tone-maps with AgX, whose first step (an inset matrix) mixes each
  // channel into the others, so a saturated yellow can never come out of it as one: lit at any strength a
  // (50, 92, 52) paint came out at about saturation 55 to 70 and lightness 55 to 75 (cream), and at a lower
  // strength it came out ochre. UNINSET is the inverse of that matrix, taken in the working space the matrix
  // acts in (Rec. 2020), put back into linear sRGB; what it gives the tone mapper is what the tone mapper's own
  // first step then undoes, and AgX's outset matrix puts the colour back. It leaves a small negative blue in
  // the light, which the tone mapper clamps away. It is applied only to a saturated paint whose hue is
  // yellow (hue 23 to 54 degrees in the linear colour the shader reads, which is 28 to 60 as a sheet writes it, and a saturation above 0.9 there; the thrush's tawny is at 13 and 19, the creeper's most saturated colour at a saturation of 0.81), so
  // nothing else a bird is painted with is touched. The matrix is the inverse of three r160 AgXInsetMatrix, worked out with numpy.
  const mat3 UNINSET = mat3(vec3(1.2542, -0.1281, -0.0984), vec3(-0.2561, 1.2899, -0.1638), vec3(0.0019, -0.1618, 1.2622));
  float yellowness(vec3 c) {
    float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), d = mx - mn;
    if (d < 1e-4) return 0.0;
    float hue = (mx == c.r ? mod((c.g - c.b) / d, 6.0) : (mx == c.g ? (c.b - c.r) / d + 2.0 : (c.r - c.g) / d + 4.0)) / 6.0;
    return smoothstep(0.064, 0.080, hue) * (1.0 - smoothstep(0.125, 0.150, hue)) * smoothstep(0.90, 0.97, d / mx);
  }
  #ifdef SHINE
    // The shine of an owl's eye (life/parts/owl.js): what comes back out through the pupil of the walker's lantern,
    // seen only when the lantern is held close to the line along which the eye is seen (within a few degrees: so
    // further off, where the lantern's place beside the walker's eye makes less of an angle, rather than close by),
    // and only when the eye looks back towards the walker. Its colour is the sheet's (shape.eye.shine). A pupil
    // smaller than the fragment is spread over it, so that a far eye does not flicker: dimmed by how much smaller
    // it is across, not by its share of the area, which would put out a far eye that is plainly seen to shine (an
    // owl's pupil is a centimetre across: at eleven metres, half a pixel).
    uniform vec3 uShine;
    uniform vec4 uShineEye, uShinePupils;          // the eye's own cell (its middle, half its size), and the two pupils painted on the face
    uniform vec2 uShinePupilR;
    uniform float uShineRho;                       // the pupil's radius in the eye cell, in shares of half the cell
    float pupilShare(vec2 d, float rad) {
      float r = length(d), fw = max(length(fwidth(d)), 1e-5);
      return (1.0 - smoothstep(rad - fw * 0.5, rad + fw * 0.5, r)) * min(1.0, rad / fw);
    }
  #endif
  void main() {
    vec4 paint = texture2D(uMap, vUv);
    #if MODE == 1
      float a = clamp((paint.a - 0.5) / max(fwidth(paint.a), 0.0001) + 0.5, 0.0, 1.0);
      if (a <= 0.0) discard;
    #else
      if (paint.a < 0.5) discard;
      float a = 1.0;
    #endif
    vec3 N = normalize(vNormal);
    // the underside of a bird sits in its own shade
    float ao = mix(0.72, 1.0, N.y * 0.5 + 0.5);
    vec3 lit = forestShade(paint.rgb, N, vWorld, ao, 0.0);
    lit = mix(lit, UNINSET * lit, yellowness(paint.rgb));
    #ifdef SHINE
      if (uLamps > 0.0) {
        float pupil = max(pupilShare((vUv - uShineEye.xy) / uShineEye.zw, uShineRho),
          max(pupilShare((vUv - uShinePupils.xy) / uShinePupilR, 1.0), pupilShare((vUv - uShinePupils.zw) / uShinePupilR, 1.0)));
        if (pupil > 0.001) {
          vec3 toLamp = uLamp.xyz - vWorld, toEye = cameraPosition - vWorld;
          float dl = length(toLamp), dv = length(toEye);
          float retro = smoothstep(SHINE_WIDE, SHINE_NARROW, dot(toLamp / max(dl, 1e-3), toEye / max(dv, 1e-3)));
          float facing = smoothstep(0.3, 0.8, dot(N, toEye / max(dv, 1e-3)));
          float fall = (1.0 - smoothstep(22.0, 30.0, dl)) / (1.0 + dl * dl * 0.16);
          lit += uShine * uLampColor * (pupil * retro * facing * fall * SHINE_GAIN) * exp(-dv * uFogDensity);
        }
      }
    #endif
    gl_FragColor = vec4(lit, a);
  }
`;

// `bones`: the texture of a flock's bones (life/flock.js); without it the material is for one skinned mesh.
// A sheet whose eyes shine (an owl's) hands its shine over on its painted texture (life/parts/owl.js): only then
// is the shine compiled in, so every other material is what it was.
export function createAnimalMaterial(U, texture, { msaa = 2, bones = null } = {}) {
  const shine = texture && texture.userData && texture.userData.shine;
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uMap: { value: texture }, ...(bones ? { uBones: { value: bones } } : {}),
      ...(shine ? { uShine: { value: new THREE.Vector3(...shine.colour) }, uShineEye: { value: new THREE.Vector4(...shine.eye) }, uShineRho: { value: shine.rho },
        uShinePupils: { value: new THREE.Vector4(...shine.pupils) }, uShinePupilR: { value: new THREE.Vector2(...shine.pupilR) } } : {}) },
    vertexShader: bones ? FLOCK_VERT : VERT, fragmentShader: FRAG, alphaToCoverage: !!msaa,
    // (how bright the shine is beside the lantern's own light on a face turned to it, and the angles between the
    // lantern and the eye's line within which it is seen: from about 5 degrees, whole within about 1.2)
    defines: shine ? { MODE: msaa ? 1 : 0, SHINE: 1, SHINE_GAIN: '70.0', SHINE_WIDE: '0.99619', SHINE_NARROW: '0.99978' } : { MODE: msaa ? 1 : 0 },
  });
}
