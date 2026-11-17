import * as THREE from 'three';
import { createLight, LIGHT_PARS } from '../light/shared.js';
import { createSunMap } from '../light/sunMap.js';
import { createCanopyMap, createNoiseTexture } from '../light/canopyMap.js';
import { createPost } from '../post.js';
import { getLook } from '../looks/index.js';
import { solarState } from '../../solar.js';
import { buildKind, createBird } from './rig.js';
import { paintBird } from './plumage.js';
import { createAnimalMaterial } from './material.js';
import { PLANS, planOf } from './plans.js';
import { SPECIES, ROLL } from './species/index.js';

// The contact sheet of one species (forest.html?show=bird&species=<key>): the bird alone on paper, to one
// scale, from the side, the front and above, and in flight from above and below, beside its published
// measurements and the same lengths measured on the mesh. It is drawn by the forest's own materials and
// render chain in midday light, with no canopy and no mist, so the paint is what the forest will show.
//   &pose=<name>  one large view in a pose of the forest, for looking closely     &sheet=1  the painted sheet, flat


const PROP = /* glsl */`
  ${LIGHT_PARS}
  varying vec3 vWorld; varying vec3 vNormal;
  uniform vec3 uColour;
  void main() { gl_FragColor = vec4(forestShade(uColour, normalize(vNormal), vWorld, 1.0, 0.0), 1.0); }
`;
const PROP_VERT = /* glsl */`
  varying vec3 vWorld; varying vec3 vNormal;
  void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vWorld = wp.xyz; vNormal = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * wp; }
`;

// A species' contact sheet, whichever its body plan: each plan has a page of its own (life/plans.js `studio`).
export async function showBird(params) {
  const key = params.get('species') || 'varied-thrush';
  if (!Object.hasOwn(SPECIES, key)) throw new Error(ROLL.some((row) => row.key === key) ? `"${key}" is on the roll and has no body yet (life/species/)` : `there is no species called "${key}": there is ${Object.keys(SPECIES).join(' and ')}`);
  const sheet = SPECIES[key];
  return planOf(sheet).studio(params, sheet);
}

// A bird's contact sheet.
export async function birdStudio(params, sheet) {
  const look = getLook(params.get('look'));
  // how many metres the drawing is across, and how long its scale bar is: a small bird is drawn larger
  const WIDE = sheet.plate.wide, BAR = sheet.plate.bar, K = WIDE / 0.8;
  document.getElementById('hud').hidden = true;
  const canvas = document.getElementById('forest');

  const t0 = performance.now();
  const kind = buildKind(sheet), painted = paintBird(sheet, look);
  window.__birdMs = performance.now() - t0;

  if (params.get('sheet') === '1') {
    canvas.remove();
    painted.canvas.style.cssText = `position:fixed;left:0;top:0;height:100vh;width:${100 * painted.canvas.width / painted.canvas.height}vh;background:repeating-conic-gradient(#777 0% 25%, #999 0% 50%) 0 0/24px 24px`;
    document.body.append(painted.canvas);
    window.__forestReady = true;
    return;
  }

  // the column of words on the right
  const column = document.createElement('div');
  column.style.cssText = 'position:fixed;right:0;top:0;bottom:0;width:26vw;box-sizing:border-box;padding:2.2vh 1.6vw;overflow:auto;background:#efe8d8;color:#2a2620;font:1.45vh/1.5 Georgia, serif';
  document.body.append(column);
  canvas.style.width = '74vw';
  const rows = PLANS.bird.measure(kind);
  window.__birdTable = rows;
  const P = sheet.published, fmt = (v) => (v === null ? '' : v.toFixed(1));
  const share = (v) => { const text = (v * 100).toFixed(1); return `${text === '-0.0' ? '0.0' : text} %`; };            // a rounded nothing has no sign
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
    <div style="font-size:1.25vh">Built lengths are measured between vertices of the mesh, not read back from the numbers it was made from.</div>
    <div style="margin-top:1.4vh;font-size:1.3vh"><b>Proportions the wing and tail are laid out to</b><br>${P.proportions.map((p) => `· ${p}`).join('<br>')}</div>
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
  // a plate's light: from the upper left, in front; no canopy over it and no mist in it
  U.uSunDir.value.set(0.4, 0.62, -0.68).normalize();
  U.uCanopyH.value = -100;
  U.uFogDensity.value = 0;
  renderer.setClearColor(new THREE.Color(0.5, 0.47, 0.4));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.set(0, 0, -3);
  camera.lookAt(0, 0, 0);                                    // +x is to the left of the page: the birds face left
  const frame = () => { const tall = WIDE * (h / w); camera.left = -WIDE / 2; camera.right = WIDE / 2; camera.top = tall / 2; camera.bottom = -tall / 2; camera.updateProjectionMatrix(); };
  frame();

  const material = createAnimalMaterial(U, painted.texture, { msaa: 4 });
  const wood = new THREE.ShaderMaterial({ uniforms: { ...U, uColour: { value: new THREE.Color(0.06, 0.042, 0.03) } }, vertexShader: PROP_VERT, fragmentShader: PROP });
  const poses = sheet.poses;
  const labels = [];
  const add = (name, x, y, turn, pose, perch, below) => {                     // below: how far under the bird's feet its caption goes (m)
    const bird = createBird(kind, material);
    bird.pose(pose);
    bird.group.position.set(x, y, 0);
    if (turn) bird.group.rotation.set(...turn);
    scene.add(bird.group);
    // what it stands on turns with it: a limb across under its feet, or bark along under them
    if (perch) {
      // bark from above the bill to below the tail's tip, or a limb seen end-on
      const prop = pose.board ? new THREE.Mesh(new THREE.BoxGeometry(0.33 * K, 0.02 * K, 0.12 * K), wood) : new THREE.Mesh(new THREE.CylinderGeometry(perch, perch, 0.3, 24), wood);
      if (!pose.board) prop.rotation.x = Math.PI / 2;
      prop.position.set(pose.board ? -0.02 * K : 0, pose.board ? -0.01 * K : -perch, 0);
      bird.group.add(prop);
    }
    labels.push([name, x, y, below]);
    return bird;
  };
  const single = params.get('pose');
  if (single) {
    if (!poses[single]) throw new Error(`${sheet.name} has no pose called "${single}": it has ${Object.keys(poses).join(', ')}`);
    const zoom = Number(params.get('zoom')) || 2.4;
    camera.zoom = zoom; camera.updateProjectionMatrix();
    const [panX, panY] = (params.get('pan') || '0,0').split(',').map(Number);           // metres, to look at one part closely
    camera.position.x -= panX; camera.position.y += panY;
    add(single, 0, -0.03 * K, poses[single].board ? [0, 0, Math.PI / 2] : [0, THREE.MathUtils.degToRad(Number(params.get('turn')) || 0), 0], poses[single], poses[single].perch || poses[single].board);
  } else {
    const top = 0.12 * K, low = -0.13 * K, quarter = Math.PI / 2;
    const prop = poses.perched.perch || poses.perched.board;
    // a bird on bark is drawn head up, and hangs further below its feet than one on a limb: it stands higher, its caption lower
    // its caption goes over its bill: under its tail the caption would lie across the flying birds' heads
    const on = poses.perched.board, y = on ? top - 0.01 * K : top - 0.03 * K, under = on ? -0.178 * K : undefined;
    add(on ? 'side, on bark' : 'side, perched', 0.25 * K, y, on ? [0, 0, quarter] : null, poses.perched, prop, under);
    add(on ? 'from behind' : 'front', 0.03 * K, y, on ? [-quarter, 0, quarter, 'ZXY'] : [0, quarter, 0], poses.perched, on ? null : prop, under);
    add('from above', -0.2 * K, top + 0.03 * K, [-quarter, 0, 0], poses.level);
    // in flight the bird heads up the page, so that its wings lie across it
    add('flight, from above', 0.2 * K, low + 0.01 * K, [-quarter, 0, quarter, 'ZXY'], poses.flight, null, 0.166 * K);
    add('flight, from below', -0.2 * K, low + 0.01 * K, [quarter, 0, quarter, 'ZXY'], poses.flight, null, 0.166 * K);
  }

  // captions and the scale bar sit over the drawing
  const over = document.createElement('div');
  over.style.cssText = 'position:fixed;left:0;top:0;width:74vw;height:100vh;pointer-events:none;font:1.5vh Georgia, serif;color:#2a2620';
  document.body.append(over);
  const place = () => {
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight, k = cssW / WIDE * camera.zoom;          // pixels of the page to a metre of the drawing
    over.innerHTML = labels.map(([name, x, y, below]) => `<div style="position:absolute;left:${cssW / 2 - x * k - 80}px;top:${cssH / 2 - y * k + (below ?? (single ? 0.1 : (name.startsWith('flight') ? 0.125 : 0.07)) * K) * k}px;width:160px;text-align:center;white-space:nowrap">${name}</div>`).join('')
      + `<div style="position:absolute;left:${cssW * 0.5 - BAR / 2 * k}px;bottom:2.2vh;width:${BAR * k}px;border:1px solid #2a2620;border-top:0;height:0.6vh"></div>
         <div style="position:absolute;left:${cssW * 0.5 - 60}px;bottom:3.4vh;width:120px;text-align:center">${BAR * 100} cm</div>`;
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
  window.__bird = { kind, sheet, scene, camera, renderer };
  requestAnimationFrame(loop);
}
