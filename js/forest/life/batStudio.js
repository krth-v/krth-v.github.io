import * as THREE from 'three';
import { createLight } from '../light/shared.js';
import { createSunMap } from '../light/sunMap.js';
import { createCanopyMap, createNoiseTexture } from '../light/canopyMap.js';
import { createPost } from '../post.js';
import { getLook } from '../looks/index.js';
import { solarState } from '../../solar.js';
import { buildBatKind, compareBat } from './bat.js';
import { createBat } from './batRig.js';
import { paintBat } from './batPaint.js';
import { createAnimalMaterial } from './material.js';

// The contact sheet of a bat (forest.html?show=bird&species=<key>, for a sheet whose plan is 'bat'): the bat alone,
// to one scale, in four moments of its wingbeat, from above with its wings spread, from the front, hanging in the
// roost and crawling, beside its published measurements and the same lengths measured on the mesh. Drawn by the
// forest's own materials and render chain in midday light, with no canopy and no mist.
//   &pose=<name>   one pose large (flight, up, down, rise, glide, fold, roost, crawl, cling, above, front, side)
//                  &cycle=<0..1> where in the stroke; &turn=<deg>; &zoom=<x>
//   &strip=flight  eight moments of one wingbeat, from the side           &sheet=1  the painted sheet, flat

export const POSES = {
  flight: { flap: 1, cycle: 0.3 }, up: { flap: 1, cycle: 0 }, down: { flap: 1, cycle: 0.55 }, rise: { flap: 1, cycle: 0.8 },
  glide: {}, fold: { fold: 1 }, roost: { hang: 1 }, crawl: { crawl: 1 }, cling: { crawl: 1, tilt: 75 },
};

export async function showBat(params, sheet) {
  const look = getLook(params.get('look'));
  document.getElementById('hud').hidden = true;
  const canvas = document.getElementById('forest');
  const t0 = performance.now();
  const kind = buildBatKind(sheet), painted = paintBat(sheet, kind.levels[0], look);
  window.__birdMs = performance.now() - t0;

  if (params.get('sheet') === '1') {
    canvas.remove();
    painted.canvas.style.cssText = 'position:fixed;left:0;top:0;height:100vh;width:100vh;background:#888';
    document.body.append(painted.canvas);
    window.__forestReady = true;
    return;
  }

  const column = document.createElement('div');
  column.style.cssText = 'position:fixed;right:0;top:0;bottom:0;width:26vw;box-sizing:border-box;padding:2.2vh 1.6vw;overflow:auto;background:#efe8d8;color:#2a2620;font:1.45vh/1.5 Georgia, serif';
  document.body.append(column);
  canvas.style.width = '74vw';
  const rows = compareBat(sheet, kind.levels[0]);
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
    <div style="font-size:1.25vh">Built lengths are measured between vertices of the mesh, not read back from the numbers it was made from. Wingbeat drawn: ${sheet.flight.rate} a second (${sheet.flight.note})</div>
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
  const WIDE = Number(params.get('wide')) || 1.1;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 20);
  camera.position.set(0, 0, -4);
  camera.lookAt(0, 0, 0);                                    // +x is to the left of the page: the bats face left
  const frame = () => { const tall = WIDE * (h / w); camera.left = -WIDE / 2; camera.right = WIDE / 2; camera.top = tall / 2; camera.bottom = -tall / 2; camera.updateProjectionMatrix(); };
  frame();

  const material = createAnimalMaterial(U, painted.texture, { msaa: 4 });
  if (params.get('faces') === '1') {
    material.side = THREE.DoubleSide;
    material.fragmentShader = material.fragmentShader.replace(/\}\s*$/, '  if (!gl_FrontFacing) gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n}\n');
  }
  const ground = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.24, 0.21, 0.16) });
  const labels = [], bats = [];
  const add = (name, x, y, turn, pose, line = null) => {
    const bat = createBat(kind, material);
    bat.pose(pose);
    bat.group.position.set(x, y, 0);
    if (turn) bat.group.rotation.set(...turn);
    scene.add(bat.group);
    if (line) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.002, 0.01), ground); bar.position.set(x, y + line[0], 0.05); bar.rotation.z = line[1] || 0; scene.add(bar); }
    labels.push([name, x, y + (line && line[0] < 0 ? -0.1 : -0.1)]);
    bats.push(bat);
    return bat;
  };
  const single = params.get('pose'), strip = params.get('strip'), quarter = Math.PI / 2, D = Math.PI / 180;
  if (single) {
    camera.zoom = Number(params.get('zoom')) || 4; camera.updateProjectionMatrix();
    const turn = [0, (Number(params.get('turn')) || 0) * D, 0], cycle = Number(params.get('cycle'));
    if (single === 'above') add('from above', 0, 0, [-quarter, 0, 0], { flap: 0 });
    else if (single === 'front') add('from the front', 0, 0, [0, quarter, 0], { ...POSES.down });
    else if (single === 'side') add('side', 0, 0, turn, {});
    else if (POSES[single]) add(single, 0, single === 'roost' ? 0.05 : 0, turn, { ...POSES[single], ...(Number.isNaN(cycle) ? {} : { cycle }) }, single === 'roost' ? [0, 0] : single === 'crawl' ? [0, 0] : null);
    else throw new Error(`there is no pose called "${single}": there is ${Object.keys(POSES).join(', ')}, above, front and side`);
  } else if (strip) {
    if (strip !== 'flight') throw new Error('there is only the strip "flight"');
    for (let i = 0; i < 8; i += 1) add(`stroke ${(i / 8).toFixed(2)}`, 0.39 - (i % 4) * 0.26, i < 4 ? 0.2 : -0.1, null, { flap: 1, cycle: i / 8 });
  } else {
    [0, 0.28, 0.55, 0.8].forEach((c, i) => add(`flight, ${c.toFixed(2)} of the stroke`, 0.39 - i * 0.26, 0.22, null, { flap: 1, cycle: c }));
    add('from above', 0.39, -0.06, [-quarter, 0, 0], { flap: 0 });
    add('from the front', 0.13, -0.06, [0, quarter, 0], { flap: 1, cycle: 0.55 });
    add('roosting', -0.13, -0.02, null, { hang: 1 }, [0.0015, 0]);
    add('crawling', -0.39, -0.1, null, { crawl: 1 }, [-0.0015, 0]);
  }

  const over = document.createElement('div');
  over.style.cssText = 'position:fixed;left:0;top:0;width:74vw;height:100vh;pointer-events:none;font:1.5vh Georgia, serif;color:#2a2620';
  document.body.append(over);
  const place = () => {
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight, k = cssW / WIDE * camera.zoom;
    over.innerHTML = labels.map(([name, x, y]) => `<div style="position:absolute;left:${cssW / 2 - x * k - 100}px;top:${cssH / 2 - y * k}px;width:200px;text-align:center;white-space:nowrap">${name}</div>`).join('')
      + `<div style="position:absolute;left:${cssW * 0.5 - 0.05 * k}px;bottom:2.2vh;width:${0.1 * k}px;border:1px solid #2a2620;border-top:0;height:0.6vh"></div>
         <div style="position:absolute;left:${cssW * 0.5 - 60}px;bottom:3.4vh;width:120px;text-align:center">10 cm</div>`;
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
  window.__bird = { kind, sheet, scene, camera, renderer, bats };
  requestAnimationFrame(loop);
}
