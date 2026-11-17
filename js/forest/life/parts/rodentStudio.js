import * as THREE from 'three';
import { createLight } from '../../light/shared.js';
import { createSunMap } from '../../light/sunMap.js';
import { createCanopyMap, createNoiseTexture } from '../../light/canopyMap.js';
import { createPost } from '../../post.js';
import { getLook } from '../../looks/index.js';
import { solarState } from '../../../solar.js';
import { buildBeastKind, LEGS } from '../beast.js';
import { PLANS } from '../plans.js';
import { createBeast } from '../beastRig.js';
import { paintCoat } from '../coat.js';
import { createAnimalMaterial } from '../material.js';

// The contact sheet of a small beast that climbs (forest.html?show=bird&species=<key>, for a sheet that gives
// `studio`: life/beastStudio.js sends it here): the animal alone, to one scale (`studio.wide` metres across the
// drawing, a bar `studio.bar` long), from the side, the front and above, sitting up with a cone, on a trunk head up
// and head down, and in its bound; beside its published lengths and the same lengths measured on the mesh. Drawn by
// the forest's own materials and render chain in midday light, with no canopy and no mist.
//   &pose=<name>   one pose large (POSES below)  &turn=<deg>  &zoom=<x>   &strip=scurry  six moments of a bound
//   &sheet=1       the painted coat, flat        &faces=1  faces seen from behind drawn red

export const POSES = {
  stand: { tail: 0.55, curl: 0.25, neck: 0.65 },
  alert: { sit: 1, tail: 0.7, curl: 0.35, neck: 0.85, ears: 0.6 },
  eat: { sit: 1, hold: 1, strip: 1, husk: 0.6, tail: 0.75, curl: 0.45, neck: 0.5, head: { pitch: -0.2 }, jaw: 0.5 },
  forage: { neck: 0, tail: 0.5, curl: 0.2 },
  crouch: { crouch: 1, tail: 0.3, neck: 0.5, ears: -0.4 },
  cling: { cling: 1, tail: 0.3, curl: 0.1, neck: 0.7 },
  down: { cling: 1, down: 1, tail: 0.25, neck: 0.9, head: { pitch: 0.45 } },
  scold: { cling: 1, down: 1, tail: 0.6, flick: 0.5, neck: 0.95, head: { pitch: 0.7, yaw: 0.6 }, jaw: 0.6, ears: 0.5 },
  limb: { cling: 1, grip: 0.04, tail: 0.45, curl: 0.2, neck: 0.7 },
  scurry: { scurry: 1, cycle: 0.3, tail: 0.35, neck: 0.6 },
};
// the trunk's side it clings to, seen from the side: +x of its frame up (or down) the bark, +y out of it
const ON_TRUNK = { up: [[0, 1, 0], [1, 0, 0], [0, 0, -1]], down: [[0, -1, 0], [1, 0, 0], [0, 0, 1]] };

export async function showRodent(params, sheet) {
  const look = getLook(params.get('look'));
  document.getElementById('hud').hidden = true;
  const canvas = document.getElementById('forest');
  const t0 = performance.now();
  const kind = buildBeastKind(sheet), painted = paintCoat(sheet, kind.levels[0], look);
  window.__birdMs = performance.now() - t0;

  if (params.get('sheet') === '1') {
    canvas.remove();
    painted.canvas.style.cssText = `position:fixed;left:0;top:0;height:100vh;width:${100 * painted.canvas.width / painted.canvas.height}vh;background:repeating-conic-gradient(#777 0% 25%, #999 0% 50%) 0 0/24px 24px`;
    document.body.append(painted.canvas);
    window.__forestReady = true;
    return;
  }

  const WIDE = sheet.studio.wide, BAR = sheet.studio.bar, K = WIDE / 7.2;
  const column = document.createElement('div');
  column.style.cssText = 'position:fixed;right:0;top:0;bottom:0;width:26vw;box-sizing:border-box;padding:2.2vh 1.6vw;overflow:auto;background:#efe8d8;color:#2a2620;font:1.45vh/1.5 Georgia, serif';
  document.body.append(column);
  canvas.style.width = '74vw';
  const rows = PLANS.beast.measure(kind);
  window.__birdTable = rows;
  const P = sheet.published, mm = (v) => (v === null ? '' : (v * 1000).toFixed(1));
  const share = (v) => { const text = (v * 100).toFixed(1); return `${text === '-0.0' ? '0.0' : text} %`; };
  column.innerHTML = `
    <div style="font-size:3vh;line-height:1.15">${sheet.name}</div>
    <div style="font-style:italic;font-size:1.9vh;margin-bottom:1vh">${sheet.latin}</div>
    <div>Shown: ${P.shown}. Painted and built when the page loads; nothing is downloaded.</div>
    <table style="border-collapse:collapse;margin:1.6vh 0;width:100%;font-size:1.35vh">
      <tr style="text-align:left;border-bottom:1px solid #8a8272"><th>Length, mm</th><th style="padding:0 0.7vw">built</th><th>published</th><th style="padding-left:0.7vw">off</th></tr>
      ${rows.map((r) => `<tr style="border-bottom:1px solid #d2c9b6"><td>${r.what} <sup>${r.source}</sup></td><td style="padding:0 0.7vw">${mm(r.built)}</td>
        <td>${r.mean !== null ? `${mm(r.mean)} (${mm(r.range[0])}-${mm(r.range[1])})` : `${mm(r.range[0])}-${mm(r.range[1])}`}</td>
        <td style="padding-left:0.7vw;white-space:nowrap;color:${Math.abs(r.off) > 0.05 ? '#a02818' : '#2a2620'}">${share(r.off)}</td></tr>`).join('')}
    </table>
    <div style="font-size:1.25vh">Built lengths are measured between vertices of the mesh, not read back from the numbers it was made from: head and body along the back from the nose by the poll and the withers to the root of the tail, the tail along its bone, the hind foot along the sole.</div>
    <div style="margin-top:1.4vh;font-size:1.3vh">${P.proportions.map((p) => `· ${p}`).join('<br>')}</div>
    <div style="margin-top:1.4vh;font-size:1.3vh">${P.mass}</div>
    <div style="margin-top:1.4vh;font-size:1.2vh;color:#5a5346"><b>Sources</b><br>${Object.entries(P.sources).map(([k, v]) => `<sup>${k}</sup> ${v}`).join('<br>')}</div>
    <div style="margin-top:1.4vh;font-size:1.2vh;color:#5a5346">${P.note} ${kind.triangles[0]} triangles in the close-up level, ${kind.triangles[1]} and ${kind.triangles[2]} further off; painted in ${Math.round(window.__birdMs)} ms with its body built.</div>`;

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
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 20);
  camera.position.set(0, 0, -8);
  camera.lookAt(0, 0, 0);                                    // +x is to the left of the page: the animals face left
  const frame = () => { const tall = WIDE * (h / w); camera.left = -WIDE / 2; camera.right = WIDE / 2; camera.top = tall / 2; camera.bottom = -tall / 2; camera.updateProjectionMatrix(); };
  frame();

  const material = createAnimalMaterial(U, painted.texture, { msaa: 4 });
  if (params.get('faces') === '1') {
    material.side = THREE.DoubleSide;
    material.fragmentShader = material.fragmentShader.replace(/\}\s*$/, '  if (!gl_FrontFacing) gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n}\n');
  }
  const ground = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.24, 0.21, 0.16) }), bark = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 0.24, 0.19) });
  const labels = [];
  const add = (name, x, y, pose, { turn = null, basis = null, line = true, label = null } = {}) => {
    const beast = createBeast(kind, material);
    beast.group.position.set(x, y, 0);
    if (turn) beast.group.rotation.set(...turn);
    if (basis) beast.group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(...basis.map((v) => new THREE.Vector3(...v))));
    beast.pose(pose);
    scene.add(beast.group);
    if (line) { const bar = new THREE.Mesh(new THREE.BoxGeometry(2.9 * K, 0.012 * K, 0.05 * K), ground); bar.position.set(x, y - 0.006 * K, 0.6 * K); scene.add(bar); }
    if (name) labels.push([name, ...(label || [x, y])]);
    return beast;
  };
  // a trunk to cling to: its right side (as the page has it) at x
  const trunk = (x, y, tall) => { const R = 0.6 * K; const t = new THREE.Mesh(new THREE.CylinderGeometry(R, R, tall, 24), bark); t.position.set(x - R, y, R * 0.4); scene.add(t); };
  const single = params.get('pose'), strip = params.get('strip'), quarter = Math.PI / 2;
  if (single) {
    if (!POSES[single]) throw new Error(`there is no pose called "${single}": there is ${Object.keys(POSES).join(', ')}`);
    camera.zoom = Number(params.get('zoom')) || 2.2; camera.updateProjectionMatrix();
    const pose = { ...POSES[single], cycle: Number(params.get('cycle')) || POSES[single].cycle || 0 };
    const on = POSES[single].cling ? (POSES[single].down ? ON_TRUNK.down : ON_TRUNK.up) : null;
    if (on && !POSES[single].grip) { trunk(0.25 * K, 0, 6 * K); add(single, 0.25 * K, -0.2 * K, pose, { basis: on, line: false }); }
    else add(single, 0, -0.85 * K, pose, { turn: [0, THREE.MathUtils.degToRad(Number(params.get('turn')) || 0), 0], line: !POSES[single].grip });
  } else if (strip) {
    if (strip !== 'scurry') throw new Error(`there is no gait called "${strip}"`);
    for (let i = 0; i < 6; i += 1) add(`bound, ${(i / 6).toFixed(2)}`, (2.3 - (i % 3) * 2.3) * K, (i < 3 ? 0.45 : -1.95) * K, { ...POSES.scurry, cycle: i / 6 });
  } else {
    add('side', 1.85 * K, 0.55 * K, POSES.stand);
    add('front', 0.15 * K, 0.55 * K, POSES.stand, { turn: [0, quarter, 0], line: false, label: [0.15 * K, 2.35 * K] });
    add('from above', -2.3 * K, 1.05 * K, POSES.stand, { turn: [-quarter, 0, 0], line: false, label: [-2.3 * K, 0.7 * K] });
    add(sheet.shape.cone ? 'sitting up, stripping a cone' : 'sitting up, eating', 1.85 * K, -1.6 * K, POSES.eat);
    trunk(-0.15 * K, -0.9 * K, 3.6 * K);
    add('on a trunk, head up and head down', -0.15 * K, -0.2 * K, POSES.cling, { basis: ON_TRUNK.up, line: false, label: [-2.2 * K, -0.2 * K] });
    add('', -0.15 * K, -1.6 * K, POSES.down, { basis: ON_TRUNK.down, line: false });
    add('bounding', -2.25 * K, -1.6 * K, POSES.scurry);
  }

  const over = document.createElement('div');
  over.style.cssText = 'position:fixed;left:0;top:0;width:74vw;height:100vh;pointer-events:none;font:1.5vh Georgia, serif;color:#2a2620';
  document.body.append(over);
  const place = () => {
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight, k = cssW / WIDE * camera.zoom;
    over.innerHTML = labels.map(([name, x, y]) => `<div style="position:absolute;left:${cssW / 2 - x * k - 100}px;top:${cssH / 2 - y * k + 0.1 * K * k}px;width:200px;text-align:center;white-space:nowrap">${name}</div>`).join('')
      + `<div style="position:absolute;left:${cssW * 0.5 - 0.5 * BAR * k}px;bottom:2.2vh;width:${BAR * k}px;border:1px solid #2a2620;border-top:0;height:0.6vh"></div>
         <div style="position:absolute;left:${cssW * 0.5 - 60}px;bottom:3.4vh;width:120px;text-align:center">${Math.round(BAR * 100)} cm</div>`;
  };
  place();
  window.addEventListener('resize', () => { [w, h] = size(); frame(); post.resize(); place(); });

  // Poses checked by number: one animal at the origin, posed, its skin worked out on the CPU: the soles' heights,
  // the nose's place, and the lowest and highest point of the skin.
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
    let low = Infinity, high = -Infinity;
    for (let i = 0; i < pos.count; i += 1) { const p = skin(i); low = Math.min(low, p.y); high = Math.max(high, p.y); }
    const soles = Object.keys(LEGS).map((key) => { const lay = kind.levels[0].legs[key], b = sk.bones.findIndex((bone) => bone.name === LEGS[key].chain[3]); return +lay.sole.clone().applyMatrix4(mats[b]).y.toFixed(4); });
    const nose = skin(kind.levels[0].marks.nose[0]);
    return { soles, nose: [+nose.x.toFixed(4), +nose.y.toFixed(4)], low: +low.toFixed(4), high: +high.toFixed(4) };
  };

  let frames = 0;
  const loop = () => {
    requestAnimationFrame(loop);
    sunMap.update(renderer, scene);
    post.render(scene, camera);
    frames += 1;
    if (frames > 3) window.__forestReady = true;
  };
  window.__bird = { kind, sheet, scene, camera, renderer };
  requestAnimationFrame(loop);
}
