import * as THREE from 'three';
import { createLight } from '../light/shared.js';
import { createSunMap } from '../light/sunMap.js';
import { createCanopyMap, createNoiseTexture } from '../light/canopyMap.js';
import { createPost } from '../post.js';
import { getLook } from '../looks/index.js';
import { solarState } from '../../solar.js';
import { buildSalamanderKind } from './salamander.js';
import { PLANS } from './plans.js';
import { createSalamander } from './salamanderRig.js';
import { paintSalamander } from './salamanderSkin.js';
import { createAnimalMaterial } from './material.js';

// The contact sheet of a salamander or a newt (forest.html?show=bird&species=<key>, for a sheet whose plan is
// 'salamander'): the animal alone, to one scale, standing from the side, from above and from below, walking, warning,
// standing tall, swimming and keeping still, beside its published lengths and the same lengths measured on the mesh.
// Drawn by the forest's own materials and render chain in midday light, with no canopy and no mist.
//   &pose=<name>   one pose large (stand, walk, warn, tall, swim, still, curl, lunge)   &cycle=<0..1>  where in a stride
//                  &turn=<deg> (about the upright)  &tilt=<deg> (towards the eye)  &zoom=<x>
//   &strip=<gait>  six moments of one stride (walk) or one stroke (swim), from above
//   &sheet=1       the painted skin, flat                 &faces=1  faces seen from behind drawn red

export const POSES = {
  stand: {},
  walk: { walk: 1 },
  warn: { warn: 1 },
  tall: { tall: 1, tail: { pitch: 0.2, sway: 0.6 } },
  swim: { swim: 1, afloat: true },
  still: { crouch: 1 },
  curl: { bend: 0.8 },
  lunge: { lunge: 1, walk: 0.3 },
};

export async function showSalamander(params, sheet) {
  const look = getLook(params.get('look'));
  document.getElementById('hud').hidden = true;
  const canvas = document.getElementById('forest');
  const t0 = performance.now();
  const kind = buildSalamanderKind(sheet), t1 = performance.now(), painted = paintSalamander(sheet, kind.levels[0], look);
  window.__birdMs = performance.now() - t0;
  window.__paintMs = performance.now() - t1;
  const L = sheet.shape.svl / 1000, T = L * kind.levels[0].S;

  if (params.get('sheet') === '1') {
    canvas.remove();
    painted.canvas.style.cssText = `position:fixed;left:0;top:0;height:100vh;width:${100 * painted.canvas.width / painted.canvas.height}vh;background:#888`;
    document.body.append(painted.canvas);
    window.__forestReady = true;
    return;
  }

  const column = document.createElement('div');
  column.style.cssText = 'position:fixed;right:0;top:0;bottom:0;width:26vw;box-sizing:border-box;padding:2.2vh 1.6vw;overflow:auto;background:#efe8d8;color:#2a2620;font:1.45vh/1.5 Georgia, serif';
  document.body.append(column);
  canvas.style.width = '74vw';
  const rows = PLANS.salamander.measure(kind);
  window.__birdTable = rows;
  const P = sheet.published, fmt = (v) => (v === null ? '' : v.toFixed(1));
  const share = (v) => { const text = (v * 100).toFixed(1); return `${text === '-0.0' ? '0.0' : text} %`; };
  column.innerHTML = `
    <div style="font-size:3vh;line-height:1.15">${sheet.name}</div>
    <div style="font-style:italic;font-size:1.9vh;margin-bottom:1vh">${sheet.latin}</div>
    <div>Shown: ${P.shown}. Painted and built when the page loads; nothing is downloaded.</div>
    <table style="border-collapse:collapse;margin:1.6vh 0;width:100%;font-size:1.35vh">
      <tr style="text-align:left;border-bottom:1px solid #8a8272"><th>Length, mm</th><th style="padding:0 0.7vw">built</th><th>published</th><th style="padding-left:0.7vw">off</th></tr>
      ${rows.map((r) => `<tr style="border-bottom:1px solid #d2c9b6"><td>${r.what} <sup>${r.source}</sup></td><td style="padding:0 0.7vw">${fmt(r.built)}</td>
        <td>${r.mean !== null ? `${fmt(r.mean)} (${r.range[0]}-${r.range[1]})` : `${r.range[0]}-${r.range[1]}`}</td>
        <td style="padding-left:0.7vw;white-space:nowrap;color:${Math.abs(r.off) > 0.05 ? '#a02818' : '#2a2620'}">${share(r.off)}</td></tr>`).join('')}
    </table>
    <div style="font-size:1.25vh">Built lengths are measured between vertices of the mesh (the snout's tip, the vent, the tail's tip), along the body as it lies straight in the pose it was built in, not read back from the numbers it was made from. A published range holds a length that lies inside it.</div>
    <div style="margin-top:1.4vh;font-size:1.3vh">${P.proportions.map((p) => `· ${p}`).join('<br>')}</div>
    <div style="margin-top:1.4vh;font-size:1.3vh">${P.mass}</div>
    <div style="margin-top:1.4vh;font-size:1.2vh;color:#5a5346"><b>Sources</b><br>${Object.entries(P.sources).map(([k, v]) => `<sup>${k}</sup> ${v}`).join('<br>')}</div>
    <div style="margin-top:1.4vh;font-size:1.2vh;color:#5a5346">${P.note} ${kind.triangles[0]} triangles in the close-up level, ${kind.triangles[1]} and ${kind.triangles[2]} further off; built in ${window.__birdMs.toFixed(0)} ms, of which painted in ${window.__paintMs.toFixed(0)}.</div>`;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  const size = () => { const w = Math.round(window.innerWidth * 0.74), h = window.innerHeight; renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(w, h, false); return [w, h]; };
  let [w, h] = size();
  const light = createLight(), U = light.U;
  light.applyLook(look);
  createNoiseTexture(U);
  createCanopyMap(U, []);
  const sunMap = createSunMap(U, 256);
  const post = createPost(renderer, U, { msaa: 4, shaftSteps: 0, bloom: false });
  post.applyLook(look);
  post.applyTime(light.applyTime(solarState(13), 0));
  U.uSunDir.value.set(0.4, 0.62, -0.68).normalize();
  U.uCanopyH.value = -100;
  U.uFogDensity.value = 0;
  renderer.setClearColor(new THREE.Color(0.5, 0.47, 0.4));

  const scene = new THREE.Scene();
  const WIDE = T * 2.6, K = T;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.001, 5);
  camera.position.set(0, 0, -1);
  camera.lookAt(0, 0, 0);                                    // +x is to the left of the page: the animals face left
  const frame = () => { const tall = WIDE * (h / w); camera.left = -WIDE / 2; camera.right = WIDE / 2; camera.top = tall / 2; camera.bottom = -tall / 2; camera.updateProjectionMatrix(); };
  frame();

  const material = createAnimalMaterial(U, painted.texture, { msaa: 4 });
  if (params.get('faces') === '1') {
    material.side = THREE.DoubleSide;
    material.fragmentShader = material.fragmentShader.replace(/\}\s*$/, '  if (!gl_FrontFacing) gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n}\n');
  }
  const ground = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.24, 0.21, 0.16) });
  const labels = [], animals = [];
  // one animal at (x, y) in its own lengths from the page's middle, turned, in a pose; with a line for the ground
  const add = (name, x, y, turn, pose, line = true) => {
    const one = createSalamander(kind, material);
    one.pose(pose);
    one.group.position.set(x * K, y * K, 0);
    if (turn) one.group.rotation.set(...turn);
    scene.add(one.group);
    if (line) { const bar = new THREE.Mesh(new THREE.BoxGeometry(1.15 * K, 0.004 * K, 0.4 * K), ground); bar.position.set(x * K, y * K - 0.002 * K, 0.2 * K); scene.add(bar); }
    labels.push([name, x * K, y * K]);
    animals.push(one);
    return one;
  };
  const single = params.get('pose'), strip = params.get('strip'), quarter = Math.PI / 2, D = Math.PI / 180;
  if (single) {
    if (!POSES[single]) throw new Error(`there is no pose called "${single}": there is ${Object.keys(POSES).join(', ')}`);
    camera.zoom = Number(params.get('zoom')) || 2.2; camera.updateProjectionMatrix();
    add(single, 0, -0.12, [(Number(params.get('tilt')) || 0) * D, (Number(params.get('turn')) || 0) * D, 0], { ...POSES[single], cycle: Number(params.get('cycle')) || 0, wave: Number(params.get('cycle')) || 0 }, false);
  } else if (strip) {
    if (!['walk', 'swim'].includes(strip)) throw new Error(`there is no gait called "${strip}"`);
    for (let i = 0; i < 6; i += 1) add(`${strip}, ${(i / 6).toFixed(2)}`, 0.62 - (i % 2) * 1.24, 0.62 - Math.floor(i / 2) * 0.6, [-quarter, 0, 0], { ...POSES[strip], cycle: i / 6 }, false);
  } else {
    add('standing', 0.62, 0.66, null, POSES.stand);
    add('from above', -0.62, 0.7, [-quarter, 0, 0], POSES.stand, false);
    add('walking, from above', 0.62, 0.22, [-quarter, 0, 0], { ...POSES.walk, cycle: 0.1 }, false);
    add('from below', -0.62, 0.24, [quarter, 0, 0], POSES.stand, false);
    add('the warning', 0.62, -0.36, null, POSES.warn);
    add('standing tall', -0.62, -0.36, null, { ...POSES.tall, wave: 0.2 });
    add('swimming, from above', 0.62, -0.72, [-quarter, 0, 0], { ...POSES.swim, cycle: 0.3 }, false);
    add('keeping still, curled', -0.62, -0.78, null, { crouch: 1, bend: 0.5 });
  }

  const over = document.createElement('div');
  over.style.cssText = 'position:fixed;left:0;top:0;width:74vw;height:100vh;pointer-events:none;font:1.5vh Georgia, serif;color:#2a2620';
  document.body.append(over);
  const bar = [0.01, 0.02, 0.05, 0.1].reduce((best, v) => (Math.abs(v - T * 0.5) < Math.abs(best - T * 0.5) ? v : best));
  const place = () => {
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight, k = cssW / WIDE * camera.zoom;
    over.innerHTML = labels.map(([name, x, y]) => `<div style="position:absolute;left:${cssW / 2 - x * k - 80}px;top:${cssH / 2 - y * k + 0.07 * T * k}px;width:160px;text-align:center;white-space:nowrap">${name}</div>`).join('')
      + `<div style="position:absolute;left:${cssW * 0.5 - 0.5 * bar * k}px;bottom:2.2vh;width:${bar * k}px;border:1px solid #2a2620;border-top:0;height:0.6vh"></div>
         <div style="position:absolute;left:${cssW * 0.5 - 60}px;bottom:3.4vh;width:120px;text-align:center">${bar * 100} cm</div>`;
  };
  place();
  window.addEventListener('resize', () => { [w, h] = size(); frame(); post.resize(); place(); });

  let frames = 0;
  const loop = () => {
    requestAnimationFrame(loop);
    sunMap.update(renderer, scene);
    post.render(scene, camera);
    frames += 1;
    if (frames > 3) window.__forestReady = true;
  };
  window.__bird = { kind, sheet, scene, camera, renderer, animals };
  requestAnimationFrame(loop);
}
