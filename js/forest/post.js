import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { LIGHT_PARS } from './light/shared.js';

// The forest's own render chain. It never touches the cabin's composer.
//
//   scene      → HDR target, multisampled, at the governor's render scale
//   shafts     → quarter resolution, marched against the sun map and canopy map,
//                stopped by the scene's own depth (resolved with the colour)
//   bloom      → quarter and eighth resolution
//   soft       → during a close-up only: the scene at a quarter and then an eighth, blurred at each, for what is out of focus
//   final      → composite, AgX tone map, sRGB, grade; straight to the canvas
//                (or, for the cabin's window, the composite alone, still light, into a target of the cabin's:
//                the cabin's own chain tone-maps it with the room, and js/outside.js puts the forest's grade back)

const FS_VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const SHAFT_FRAG = /* glsl */`
  ${LIGHT_PARS}
  uniform sampler2D tDepth;
  uniform mat4 uInvViewProj;
  uniform vec3 uEye;
  uniform float uSteps, uReach, uGain;
  varying vec2 vUv;
  void main() {
    float depth = texture2D(tDepth, vUv).r;
    vec4 far = uInvViewProj * vec4(vUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec3 ray = far.xyz / far.w - uEye;
    float dist = min(length(ray), uReach);
    vec3 dir = normalize(ray);
    float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    float stride = dist / uSteps;
    vec3 p = uEye + dir * stride * jitter;
    float sum = 0.0;
    for (int i = 0; i < 32; i++) {
      if (float(i) >= uSteps) break;
      sum += sunShadow(p) * canopyLight(p) * mistAt(p.y);
      p += dir * stride;
    }
    float forward = mix(0.3, 1.0, pow(max(dot(dir, uSunDir), 0.0), 4.0));
    gl_FragColor = vec4(uSunColor * (sum * stride * uFogDensity * forward * uGain), 1.0);
  }
`;

const BRIGHT_FRAG = /* glsl */`
  uniform sampler2D tMap; uniform vec2 uTexel; uniform float uThreshold;
  varying vec2 vUv;
  void main() {
    vec3 c = 0.25 * (texture2D(tMap, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture2D(tMap, vUv + uTexel * vec2(1.0, -1.0)).rgb
                   + texture2D(tMap, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture2D(tMap, vUv + uTexel * vec2(1.0, 1.0)).rgb);
    float l = max(c.r, max(c.g, c.b));
    // threshold 0 means "just downsample"
    gl_FragColor = vec4(uThreshold > 0.0 ? c * smoothstep(uThreshold, uThreshold * 2.0, l) : c, 1.0);
  }
`;

const BLUR_FRAG = /* glsl */`
  uniform sampler2D tMap; uniform vec2 uStep;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tMap, vUv).rgb * 0.227027;
    c += (texture2D(tMap, vUv + uStep * 1.384615).rgb + texture2D(tMap, vUv - uStep * 1.384615).rgb) * 0.316216;
    c += (texture2D(tMap, vUv + uStep * 3.230769).rgb + texture2D(tMap, vUv - uStep * 3.230769).rgb) * 0.070270;
    gl_FragColor = vec4(c, 1.0);
  }
`;

const FINAL_FRAG = /* glsl */`
  uniform sampler2D tScene, tShafts, tBloomA, tBloomB, tSoft, tDepth;
  uniform vec2 uShaftTexel, uPlanes;
  uniform float uShafts, uBloom, uVignette, uSaturation, uContrast, uSoft, uFocus;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    vec3 c = texture2D(tScene, uv).rgb;
    if (uSoft > 0.0) {
      // a close-up: what stands nearer or further than the animal goes soft, as through a long lens
      float z = texture2D(tDepth, uv).r * 2.0 - 1.0;
      float dist = 2.0 * uPlanes.x * uPlanes.y / (uPlanes.y + uPlanes.x - z * (uPlanes.y - uPlanes.x));
      c = mix(c, texture2D(tSoft, uv).rgb, uSoft * smoothstep(0.1, 0.55, abs(dist - uFocus) / uFocus));
    }
    if (uShafts > 0.0) {
      vec3 shafts = 0.25 * (texture2D(tShafts, uv + uShaftTexel * vec2(-0.5, -0.5)).rgb + texture2D(tShafts, uv + uShaftTexel * vec2(0.5, -0.5)).rgb
                          + texture2D(tShafts, uv + uShaftTexel * vec2(-0.5, 0.5)).rgb + texture2D(tShafts, uv + uShaftTexel * vec2(0.5, 0.5)).rgb);
      if (uSoft > 0.0) {
        // The shafts are marched from a different start in every pixel, and the grain of that is lost in the
        // brushwork of a sharp frame. Over a background gone soft it was a dot screen: there, three texels square of it are averaged.
        vec3 wide = vec3(0.0);
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) wide += texture2D(tShafts, uv + uShaftTexel * vec2(float(i), float(j))).rgb;
        shafts = mix(shafts, wide / 9.0, uSoft);
      }
      c += uShafts * shafts;
    }
    if (uBloom > 0.0) c += uBloom * (texture2D(tBloomA, uv).rgb * 0.6 + texture2D(tBloomB, uv).rgb * 0.4);
    gl_FragColor = vec4(c, 1.0);
    #ifndef HDR_OUT
    #include <tonemapping_fragment>
    // three r160's AgX ends in a matrix that can leave a channel below zero (a dark, saturated blue-green
    // by moonlight does it); the sRGB curve then has no answer and the whole pixel went black.
    gl_FragColor.rgb = clamp(gl_FragColor.rgb, 0.0, 1.0);
    #include <colorspace_fragment>
    // The cabin's display-space grade: pivot contrast, saturation, soft vignette.
    vec3 g = (gl_FragColor.rgb - 0.40) * uContrast + 0.40;
    float l = dot(g, vec3(0.2126, 0.7152, 0.0722));
    g = clamp(mix(vec3(l), g, uSaturation), 0.0, 1.0);
    vec2 d = vUv - 0.5;
    g *= mix(1.0 - uVignette, 1.0, 1.0 - smoothstep(0.30, 0.95, length(d) * 1.414));
    gl_FragColor = vec4(g, 1.0);
    #endif
  }
`;

export function createPost(renderer, U, opts) {
  const quad = new FullScreenQuad();
  const size = new THREE.Vector2();
  const hdr = (w, h, extra = {}) => new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h),
    { type: THREE.HalfFloatType, depthBuffer: false, ...extra });

  let scale = 1, requestedScale = 1, useBudget = true;
  // three.js resolves a multisampled target's depth along with its colour, so a
  // depth texture here gives the shafts the scene's depth without another pass.
  const sceneTarget = hdr(4, 4, { depthBuffer: true, samples: opts.msaa });
  sceneTarget.depthTexture = new THREE.DepthTexture(4, 4, THREE.UnsignedIntType);
  sceneTarget.depthTexture.minFilter = sceneTarget.depthTexture.magFilter = THREE.NearestFilter;
  const shaftTarget = hdr(4, 4);
  const bloom = [hdr(4, 4), hdr(4, 4), hdr(4, 4), hdr(4, 4)];       // quarter A/B, eighth A/B
  // The scene blurred, for what a close-up leaves out of focus: quarter A/B, eighth A/B, as the bloom is made, and only
  // drawn during a close-up. One blur at a quarter and a second with its taps spread wider left a dot screen
  // wherever sky showed through leaves: the spread taps stepped over texels.
  const soft = [hdr(4, 4), hdr(4, 4), hdr(4, 4), hdr(4, 4)];
  let softness = 0;

  const pass = (fragmentShader, uniforms) => new THREE.ShaderMaterial({
    uniforms, vertexShader: FS_VERT, fragmentShader, depthTest: false, depthWrite: false,
  });
  const shaftMat = pass(SHAFT_FRAG, { ...U, tDepth: { value: sceneTarget.depthTexture }, uInvViewProj: { value: new THREE.Matrix4() },
    uEye: { value: new THREE.Vector3() }, uSteps: { value: opts.shaftSteps }, uReach: { value: 90 }, uGain: { value: 1.0 } });
  shaftMat.defines = { COARSE_GAPS: 1 };
  shaftMat.toneMapped = false;
  const brightMat = pass(BRIGHT_FRAG, { tMap: { value: null }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: 1.0 } });
  const blurMat = pass(BLUR_FRAG, { tMap: { value: null }, uStep: { value: new THREE.Vector2() } });
  brightMat.toneMapped = blurMat.toneMapped = false;
  const finalMat = pass(FINAL_FRAG, {
    tScene: { value: sceneTarget.texture }, tShafts: { value: shaftTarget.texture },
    tBloomA: { value: bloom[0].texture }, tBloomB: { value: bloom[2].texture }, uShaftTexel: { value: new THREE.Vector2() },
    uShafts: { value: opts.shaftSteps > 0 ? 1 : 0 }, uBloom: { value: opts.bloom ? 0.12 : 0 },
    uVignette: { value: 0.3 }, uSaturation: { value: 1.06 }, uContrast: { value: 1.03 },
    tSoft: { value: soft[2].texture }, tDepth: { value: sceneTarget.depthTexture }, uSoft: { value: 0 }, uFocus: { value: 10 }, uPlanes: { value: new THREE.Vector2(0.15, 420) },
  });
  // The same composite, left as light (HDR_OUT): what the cabin's window is given. It shares every uniform with the
  // final pass, so the look, the hour and a close-up's softness reach it as they reach that.
  const hdrMat = pass(FINAL_FRAG, finalMat.uniforms);
  hdrMat.defines = { HDR_OUT: 1 };
  hdrMat.toneMapped = false;
  let vignette = 0.3, shaftGain = 1, saturation = 1.06, contrast = 1;
  function applyLook(look) {
    saturation = look.post.saturation;
    contrast = finalMat.uniforms.uContrast.value = look.post.contrast;
    if (opts.bloom) finalMat.uniforms.uBloom.value = look.post.bloom;
    vignette = look.post.vignette;
    shaftGain = look.mist.shafts;
  }

  function sizeTargets() {
    const limit = useBudget && opts.scenePixels
      ? Math.min(1, Math.sqrt(opts.scenePixels / Math.max(1, size.x * size.y))) : 1;
    scale = limit * requestedScale;
    const w = Math.max(1, Math.round(size.x * scale)), h = Math.max(1, Math.round(size.y * scale));
    sceneTarget.setSize(w, h);
    shaftTarget.setSize(Math.ceil(w / 4), Math.ceil(h / 4));
    for (const chain of [bloom, soft]) {
      chain[0].setSize(Math.ceil(w / 4), Math.ceil(h / 4)); chain[1].setSize(Math.ceil(w / 4), Math.ceil(h / 4));
      chain[2].setSize(Math.ceil(w / 8), Math.ceil(h / 8)); chain[3].setSize(Math.ceil(w / 8), Math.ceil(h / 8));
    }
    // (four scene pixels, as it always was: the shaft target's own texel is a little smaller where the size is no multiple of four)
    finalMat.uniforms.uShaftTexel.value.set(4 / w, 4 / h);
  }
  // The cabin supplies the size of the visible window. The standalone page uses the drawing buffer.
  function resize(width = null, height = null) {
    if (width != null) size.set(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
    else renderer.getDrawingBufferSize(size);
    sizeTargets();
  }
  function setScale(next, budgeted = true) {
    if (next === requestedScale && budgeted === useBudget) return;
    requestedScale = next;
    useBudget = budgeted;
    sizeTargets();
  }

  const draw = (material, target) => {
    quad.material = material;
    renderer.setRenderTarget(target);
    quad.render(renderer);
  };
  const blur = (from, via, w, h) => {
    blurMat.uniforms.tMap.value = from.texture; blurMat.uniforms.uStep.value.set(1 / w, 0); draw(blurMat, via);
    blurMat.uniforms.tMap.value = via.texture; blurMat.uniforms.uStep.value.set(0, 1 / h); draw(blurMat, from);
  };

  // `into`: a target of someone else's to draw the composite into, as light, in place of the finished picture on the canvas
  function render(scene, camera, into = null) {
    renderer.setRenderTarget(sceneTarget);
    renderer.render(scene, camera);

    if (opts.shaftSteps > 0) {
      shaftMat.uniforms.uInvViewProj.value.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
      shaftMat.uniforms.uEye.value.copy(camera.position);
      draw(shaftMat, shaftTarget);
    }

    if (opts.bloom) {
      const w = bloom[0].width, h = bloom[0].height;
      // four bilinear taps, each averaging a 2x2 block: one pass from full to quarter size
      brightMat.uniforms.tMap.value = sceneTarget.texture; brightMat.uniforms.uTexel.value.set(0.25 / w, 0.25 / h);
      brightMat.uniforms.uThreshold.value = 1.0;
      draw(brightMat, bloom[0]);
      blur(bloom[0], bloom[1], w, h);
      brightMat.uniforms.tMap.value = bloom[0].texture; brightMat.uniforms.uTexel.value.set(0.5 / w, 0.5 / h);
      brightMat.uniforms.uThreshold.value = 0.0;
      draw(brightMat, bloom[2]);
      blur(bloom[2], bloom[3], bloom[2].width, bloom[2].height);
    }

    if (softness > 0.003) {
      const w = soft[0].width, h = soft[0].height;
      brightMat.uniforms.tMap.value = sceneTarget.texture; brightMat.uniforms.uTexel.value.set(0.25 / w, 0.25 / h);
      brightMat.uniforms.uThreshold.value = 0.0;
      draw(brightMat, soft[0]);
      blur(soft[0], soft[1], w, h);
      brightMat.uniforms.tMap.value = soft[0].texture; brightMat.uniforms.uTexel.value.set(0.5 / w, 0.5 / h);
      draw(brightMat, soft[2]);
      blur(soft[2], soft[3], soft[2].width, soft[2].height);
      finalMat.uniforms.uPlanes.value.set(camera.near, camera.far);
    }
    finalMat.uniforms.uSoft.value = softness > 0.003 ? softness : 0;

    draw(into ? hdrMat : finalMat, into);
  }

  // How soft the surroundings of a close-up are (0 none .. 1), and how far off the animal in focus is.
  function setSoft(amount, focus) { softness = amount; finalMat.uniforms.uFocus.value = focus; }

  // `open`: how open the air is where the walker stands (light/shared.js), 0 under the old terrace's trees
  function applyTime(day, open = 0) {
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.5, 0.85, day);
    finalMat.uniforms.uVignette.value = vignette * THREE.MathUtils.lerp(1.1, 1.0, day);
    finalMat.uniforms.uSaturation.value = saturation * THREE.MathUtils.lerp(0.82, 1.0, day);      // moonlight carries little colour
    // the grade pivots contrast about 0.40, so by night, when most of the frame lies far below it, added contrast only buries the shade
    finalMat.uniforms.uContrast.value = THREE.MathUtils.lerp(1.0, contrast, day);
    // Shafts are what the sun does to mist between trunks. In the open, where nothing breaks the light into
    // shafts, the same sum is one even veil over the whole view, and the valley went white under it.
    shaftMat.uniforms.uGain.value = shaftGain * THREE.MathUtils.lerp(0.5, 1.0, day) * THREE.MathUtils.lerp(1, 0.12, open);
  }

  function dispose() {
    for (const t of [sceneTarget, shaftTarget, ...bloom, ...soft]) t.dispose();
    sceneTarget.depthTexture.dispose();
    for (const m of [shaftMat, brightMat, blurMat, finalMat, hdrMat]) m.dispose();
    quad.dispose();
  }

  resize();
  // (`grade`: the final pass's own uniforms, read by js/outside.js for the grade it puts back on the window's picture)
  return { render, resize, setScale, setSoft, applyTime, applyLook, dispose, grade: finalMat.uniforms, get scale() { return scale; } };
}
