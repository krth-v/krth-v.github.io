import * as THREE from 'three';
import { createLight } from '../light/shared.js';
import { createSunMap } from '../light/sunMap.js';
import { createCanopyMap, createNoiseTexture } from '../light/canopyMap.js';
import { createPost } from '../post.js';
import { getLook } from '../looks/index.js';
import { solarState } from '../../solar.js';
import { buildBeastKind, LEGS } from './beast.js';
import { PLANS } from './plans.js';
import { createBeast } from './beastRig.js';
import { paintCoat } from './coat.js';
import { createAnimalMaterial } from './material.js';

// The contact sheet of a big animal that walks (forest.html?show=bird&species=<key>, for a sheet whose plan is
// 'beast'): the animal alone, to one scale, standing from the side, the front and behind, grazing, lying and from
// above, beside its published measurements and the same lengths measured on the mesh. Drawn by the forest's own
// materials and render chain in midday light, with no canopy and no mist.
//   &pose=<name>   one pose large (stand, alert, graze, look, kneel, lie, walk, high, trot, gallop, stamp)
//                  &cycle=<0..1> where in a gait's stride; &turn=<deg>; &zoom=<x>; &bull=1 a prime bull's size and antlers
//   &strip=<gait>  six moments of one stride of a gait, from the side
//   &sheet=1       the painted coat, flat               &faces=1  faces seen from behind drawn red

export const POSES = {
  stand: {},
  alert: { neck: 1, ears: 1, head: { pitch: 0.05 } },
  graze: { neck: 0, jaw: 0.3, ears: -0.2 },
  look: { neck: 0.9, ears: 1, head: { yaw: 1.0, pitch: 0.05 } },
  kneel: { lie: 0.55, neck: 0.65 },
  lie: { lie: 1, neck: 0.55, ears: 0 },
  walk: { walk: 1 },
  high: { walk: 1, high: 1, neck: 1, ears: 1 },
  trot: { trot: 1, neck: 0.8 },
  gallop: { gallop: 1, neck: 0.75, ears: -0.3 },
  stamp: { stamp: 1, neck: 0.95, ears: 1 },
};

export async function showBeast(params, sheet) {
  if (sheet.shape.plate) return import('./plateStudio.js').then((studio) => studio.showPlate(params, sheet));      // (a beast drawn as a plate: its own sheet)
  if (sheet.studio) return import('./parts/rodentStudio.js').then((studio) => studio.showRodent(params, sheet));      // (a small one that climbs)
  const look = getLook(params.get('look'));
  document.getElementById('hud').hidden = true;
  const canvas = document.getElementById('forest');
  const t0 = performance.now();
  const kind = buildBeastKind(sheet), painted = paintCoat(sheet, kind.levels[0], look);
  window.__birdMs = performance.now() - t0;

  if (params.get('sheet') === '1') {
    canvas.remove();
    painted.canvas.style.cssText = `position:fixed;left:0;top:0;height:100vh;width:${100 * painted.canvas.width / painted.canvas.height}vh;background:#888`;
    document.body.append(painted.canvas);
    window.__forestReady = true;
    return;
  }

  const bull = params.get('bull') === '1', who = bull ? { scale: 1.07, antler: 1 } : {};
  const column = document.createElement('div');
  column.style.cssText = 'position:fixed;right:0;top:0;bottom:0;width:26vw;box-sizing:border-box;padding:2.2vh 1.6vw;overflow:auto;background:#efe8d8;color:#2a2620;font:1.45vh/1.5 Georgia, serif';
  document.body.append(column);
  canvas.style.width = '74vw';
  const rows = PLANS.beast.measure(kind);
  window.__birdTable = rows;
  const P = sheet.published, fmt = (v) => (v === null ? '' : v.toFixed(3));
  const share = (v) => { const text = (v * 100).toFixed(1); return `${text === '-0.0' ? '0.0' : text} %`; };
  column.innerHTML = `
    <div style="font-size:3vh;line-height:1.15">${sheet.name}</div>
    <div style="font-style:italic;font-size:1.9vh;margin-bottom:1vh">${sheet.latin}</div>
    <div>Shown: ${bull ? 'a prime bull, in velvet' : P.shown}. Painted and built when the page loads; nothing is downloaded.</div>
    <table style="border-collapse:collapse;margin:1.6vh 0;width:100%;font-size:1.35vh">
      <tr style="text-align:left;border-bottom:1px solid #8a8272"><th>Length, m</th><th style="padding:0 0.7vw">built</th><th>published</th><th style="padding-left:0.7vw">off</th></tr>
      ${rows.map((r) => `<tr style="border-bottom:1px solid #d2c9b6"><td>${r.what} <sup>${r.source}</sup></td><td style="padding:0 0.7vw">${fmt(r.built)}</td>
        <td>${r.mean !== null ? `${fmt(r.mean)} (${r.range[0]}-${r.range[1]})` : `${r.range[0]}-${r.range[1]}`}</td>
        <td style="padding-left:0.7vw;white-space:nowrap;color:${Math.abs(r.off) > 0.05 ? '#a02818' : '#2a2620'}">${share(r.off)}</td></tr>`).join('')}
    </table>
    <div style="font-size:1.25vh">Built lengths are measured between vertices of the mesh (a joint is the middle of the leg's ring at it), not read back from the numbers it was made from. The cow is drawn; a bull is the same body at 1.07 times, with antlers.</div>
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
  const sunMap = createSunMap(U, 512);
  const post = createPost(renderer, U, { msaa: 4, shaftSteps: 0, bloom: false });
  post.applyLook(look);
  post.applyTime(light.applyTime(solarState(13), 0));
  U.uSunDir.value.set(0.4, 0.62, -0.68).normalize();
  U.uCanopyH.value = -100;
  U.uFogDensity.value = 0;
  renderer.setClearColor(new THREE.Color(0.5, 0.47, 0.4));

  const scene = new THREE.Scene();
  const WIDE = Number(params.get('wide')) || 7.2;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
  camera.position.set(0, 0, -8);
  camera.lookAt(0, 0, 0);                                    // +x is to the left of the page: the animals face left
  const frame = () => { const tall = WIDE * (h / w); camera.left = -WIDE / 2; camera.right = WIDE / 2; camera.top = tall / 2; camera.bottom = -tall / 2; camera.updateProjectionMatrix(); };
  frame();

  const material = createAnimalMaterial(U, painted.texture, { msaa: 4 });
  if (params.get('faces') === '1') {
    material.side = THREE.DoubleSide;
    material.fragmentShader = material.fragmentShader.replace(/\}\s*$/, '  if (!gl_FrontFacing) gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n}\n');
  }
  const ground = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.24, 0.21, 0.16) });
  const labels = [], beasts = [];
  const add = (name, x, y, turn, pose, line = true) => {
    const beast = createBeast(kind, material);
    beast.pose({ ...who, ...pose });
    beast.group.position.set(x, y, 0);
    if (turn) beast.group.rotation.set(...turn);
    scene.add(beast.group);
    if (line) { const bar = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.012, 0.05), ground); bar.position.set(x, y - 0.006, 0.6); scene.add(bar); }
    labels.push([name, x, y]);
    beasts.push(beast);
    return beast;
  };
  const single = params.get('pose'), strip = params.get('strip'), quarter = Math.PI / 2;
  if (single) {
    if (!POSES[single]) throw new Error(`there is no pose called "${single}": there is ${Object.keys(POSES).join(', ')}`);
    camera.zoom = Number(params.get('zoom')) || 2.2; camera.updateProjectionMatrix();
    add(single, 0, -0.85, [0, THREE.MathUtils.degToRad(Number(params.get('turn')) || 0), 0], { ...POSES[single], cycle: Number(params.get('cycle')) || 0 }, false);
  } else if (strip) {
    if (!['walk', 'trot', 'gallop', 'high'].includes(strip)) throw new Error(`there is no gait called "${strip}"`);
    for (let i = 0; i < 6; i += 1) add(`${strip}, ${(i / 6).toFixed(2)}`, 2.3 - (i % 3) * 2.3, i < 3 ? 0.45 : -1.95, null, { ...POSES[strip], cycle: i / 6 });
  } else {
    add('side', 1.85, 0.35, null, POSES.stand);
    add('front', -0.45, 0.35, [0, quarter, 0], POSES.stand, false);
    add('behind', -2.25, 0.35, [0, -quarter, 0], POSES.stand, false);
    add('grazing', 1.85, -1.95, null, POSES.graze);
    add('lying', -0.7, -1.95, null, POSES.lie);
    add('from above', -2.55, -1.2, [-quarter, 0, 0], POSES.stand, false);
  }

  const over = document.createElement('div');
  over.style.cssText = 'position:fixed;left:0;top:0;width:74vw;height:100vh;pointer-events:none;font:1.5vh Georgia, serif;color:#2a2620';
  document.body.append(over);
  const place = () => {
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight, k = cssW / WIDE * camera.zoom;
    over.innerHTML = labels.map(([name, x, y]) => `<div style="position:absolute;left:${cssW / 2 - x * k - 80}px;top:${cssH / 2 - y * k + 0.08 * k}px;width:160px;text-align:center;white-space:nowrap">${name}</div>`).join('')
      + `<div style="position:absolute;left:${cssW * 0.5 - 0.5 * k}px;bottom:2.2vh;width:${1 * k}px;border:1px solid #2a2620;border-top:0;height:0.6vh"></div>
         <div style="position:absolute;left:${cssW * 0.5 - 60}px;bottom:3.4vh;width:120px;text-align:center">1 m</div>`;
  };
  place();
  window.addEventListener('resize', () => { [w, h] = size(); frame(); post.resize(); place(); });

  // Poses checked by number: one animal at the origin, posed, its skin worked out on the CPU. Returns the soles'
  // heights, the nose's, and the lowest and highest point of the whole skin.
  const probe = createBeast(kind);
  window.__beastCheck = (pose) => {
    probe.group.position.set(0, 0, 0); probe.group.rotation.set(0, 0, 0);
    probe.pose(typeof pose === 'string' ? POSES[pose] : pose);
    probe.group.updateMatrixWorld(true);
    const sk = probe.skeleton, mats = sk.bones.map((bone, i) => new THREE.Matrix4().multiplyMatrices(bone.matrixWorld, sk.boneInverses[i]));
    const g = kind.levels[0].geometry, pos = g.getAttribute('position'), si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight');
    const v = new THREE.Vector3(), out = new THREE.Vector3(), acc = new THREE.Vector3();
    const skin = (i) => {
      v.fromBufferAttribute(pos, i); acc.set(0, 0, 0);
      for (let k = 0; k < 4; k += 1) { const wgt = sw.getComponent(i, k); if (wgt > 0) acc.addScaledVector(out.copy(v).applyMatrix4(mats[si.getComponent(i, k)]), wgt); }
      return acc.clone();
    };
    let low = Infinity, high = -Infinity, lowAt = -1;
    for (let i = 0; i < pos.count; i += 1) { const p = skin(i); if (p.y < low) { low = p.y; lowAt = i; } high = Math.max(high, p.y); }
    const soles = Object.keys(LEGS).map((key) => { const lay = kind.levels[0].legs[key], b = sk.bones.findIndex((bone) => bone.name === LEGS[key].chain[3]); return +lay.sole.clone().applyMatrix4(mats[b]).y.toFixed(4); });
    const nose = skin(kind.levels[0].marks.nose[0]);
    return { soles, nose: [+nose.x.toFixed(3), +nose.y.toFixed(3)], low: +low.toFixed(4), lowAt, lowAtPlace: (() => { v.fromBufferAttribute(pos, lowAt); return [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)]; })(), high: +high.toFixed(3) };
  };

  let frames = 0;
  const loop = () => {
    requestAnimationFrame(loop);
    sunMap.update(renderer, scene);
    post.render(scene, camera);
    frames += 1;
    if (frames > 3) window.__forestReady = true;
  };
  window.__bird = { kind, sheet, scene, camera, renderer, beasts };
  requestAnimationFrame(loop);
}
