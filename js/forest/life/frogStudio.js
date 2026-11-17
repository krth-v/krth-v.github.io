import * as THREE from 'three';
import { createLight } from '../light/shared.js';
import { createSunMap } from '../light/sunMap.js';
import { createCanopyMap, createNoiseTexture } from '../light/canopyMap.js';
import { createPost } from '../post.js';
import { getLook } from '../looks/index.js';
import { solarState } from '../../solar.js';
import { buildFrogKind } from './frog.js';
import { PLANS } from './plans.js';
import { createFrog } from './frogRig.js';
import { paintFrog } from './frogCoat.js';
import { createAnimalMaterial } from './material.js';

// The contact sheet of a frog or a toad (forest.html?show=bird&species=<key>, for a sheet whose plan is 'frog'): the
// animal alone, to one scale, sitting from the side, the front and from above, then calling, in a leap and kicking
// through water, beside its published length and the same length measured on the mesh. Drawn by the forest's own
// materials and render chain in midday light, with no canopy and no mist.
//   &pose=<name>   one pose large (sit, alert, call, look, gape, leap, walk, swim)    &cycle=<0..1>  where in a stride or a kick
//                  &turn=<deg>  &zoom=<x>
//   &strip=<gait>  six moments of one stride (walk), one kick (swim) or one leap (leap), from the side
//   &sheet=1       the painted skin, flat                 &faces=1  faces seen from behind drawn red

export const POSES = {
  sit: {},
  alert: { lift: 1, head: { pitch: 0.1 } },
  call: { lift: 0.9, sac: 1, head: { pitch: 0.18 } },
  look: { lift: 0.5, head: { yaw: 0.9 } },
  gape: { lift: 0.4, jaw: 1 },
  leap: { leap: 1, height: 0.04 },
  walk: { walk: 1, lift: 0.4 },
  swim: { swim: 1, afloat: true },
};

export async function showFrog(params, sheet) {
  const look = getLook(params.get('look'));
  document.getElementById('hud').hidden = true;
  const canvas = document.getElementById('forest');
  const t0 = performance.now();
  const kind = buildFrogKind(sheet), painted = paintFrog(sheet, kind.levels[0], look);
  window.__birdMs = performance.now() - t0;
  const L = sheet.shape.svl / 1000;

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
  const rows = PLANS.frog.measure(kind);
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
    <div style="font-size:1.25vh">Built lengths are measured between vertices of the mesh (the snout's tip and the vent), not read back from the numbers it was made from.</div>
    <div style="margin-top:1.4vh;font-size:1.3vh">${P.proportions.map((p) => `· ${p}`).join('<br>')}</div>
    <div style="margin-top:1.4vh;font-size:1.3vh">${P.mass}</div>
    <div style="margin-top:1.4vh;font-size:1.2vh;color:#5a5346"><b>Sources</b><br>${Object.entries(P.sources).map(([k, v]) => `<sup>${k}</sup> ${v}`).join('<br>')}</div>
    <div style="margin-top:1.4vh;font-size:1.2vh;color:#5a5346">${P.note} ${kind.triangles[0]} triangles in the close-up level, ${kind.triangles[1]} and ${kind.triangles[2]} further off.</div>`;

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
  const WIDE = L * 11.5, K = L;
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
  const labels = [], frogs = [];
  const add = (name, x, y, turn, pose, line = true) => {
    const frog = createFrog(kind, material);
    frog.pose(pose);
    frog.group.position.set(x * K, y * K, 0);
    if (turn) frog.group.rotation.set(...turn);
    scene.add(frog.group);
    if (line) { const bar = new THREE.Mesh(new THREE.BoxGeometry(3.4 * K, 0.012 * K, 0.5 * K), ground); bar.position.set(x * K, y * K - 0.006 * K, 0.25 * K); scene.add(bar); }
    labels.push([name, x * K, y * K]);
    frogs.push(frog);
    return frog;
  };
  const single = params.get('pose'), strip = params.get('strip'), quarter = Math.PI / 2;
  if (single) {
    if (!POSES[single]) throw new Error(`there is no pose called "${single}": there is ${Object.keys(POSES).join(', ')}`);
    camera.zoom = Number(params.get('zoom')) || 2.6; camera.updateProjectionMatrix();
    add(single, 0, -0.35, [0, THREE.MathUtils.degToRad(Number(params.get('turn')) || 0), 0], { ...POSES[single], cycle: Number(params.get('cycle')) || 0 }, false);
  } else if (strip) {
    if (!['walk', 'swim', 'leap'].includes(strip)) throw new Error(`there is no gait called "${strip}"`);
    for (let i = 0; i < 6; i += 1) add(`${strip}, ${(i / 6).toFixed(2)}`, 3.4 - (i % 3) * 3.4, i < 3 ? 1.5 : -1.2, null, { ...POSES[strip], cycle: i / 6, ...(strip === 'leap' ? { leap: Math.sin((i / 5) * Math.PI), height: Math.sin((i / 5) * Math.PI) * 0.5 * L } : {}) });
  } else {
    add('sitting', 3.4, 1.7, null, POSES.sit);
    add('front', 0, 1.7, [0, quarter, 0], POSES.sit, false);
    add('from above', -3.2, 1.9, [-quarter, 0, 0], POSES.sit, false);
    add('calling', 3.4, -0.1, null, POSES.call);
    add('leaping', 0, -0.1, null, { ...POSES.leap, height: 0.35 * L });
    add('kicking', -3.4, -0.1, null, { ...POSES.swim, cycle: 0.75 }, false);
    add('walking', 3.4, -1.9, null, { ...POSES.walk, cycle: 0.2 });
    add('alert', 0, -1.9, null, POSES.alert);
    add('mouth open', -3.4, -1.9, null, POSES.gape);
  }

  const over = document.createElement('div');
  over.style.cssText = 'position:fixed;left:0;top:0;width:74vw;height:100vh;pointer-events:none;font:1.5vh Georgia, serif;color:#2a2620';
  document.body.append(over);
  const bar = [0.005, 0.01, 0.02, 0.05, 0.1].reduce((best, v) => (Math.abs(v - L * 1.5) < Math.abs(best - L * 1.5) ? v : best));
  const place = () => {
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight, k = cssW / WIDE * camera.zoom;
    over.innerHTML = labels.map(([name, x, y]) => `<div style="position:absolute;left:${cssW / 2 - x * k - 80}px;top:${cssH / 2 - y * k + 0.08 * L * k}px;width:160px;text-align:center;white-space:nowrap">${name}</div>`).join('')
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
  window.__bird = { kind, sheet, scene, camera, renderer, frogs };
  requestAnimationFrame(loop);
}
