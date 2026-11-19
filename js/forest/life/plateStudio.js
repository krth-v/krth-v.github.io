import * as THREE from 'three';
import { createLight } from '../light/shared.js';
import { createSunMap } from '../light/sunMap.js';
import { createCanopyMap, createNoiseTexture } from '../light/canopyMap.js';
import { createPost } from '../post.js';
import { getLook } from '../looks/index.js';
import { solarState } from '../../solar.js';
import { buildBeastKind } from './beast.js';
import { PLANS } from './plans.js';
import { createBeast } from './beastRig.js';
import { paintCoat } from './coat.js';
import { createAnimalMaterial } from './material.js';

// The contact sheet of a beast drawn as a plate (forest.html?show=bird&species=<key>): the plate itself. The animal
// to one scale a row, from the side, the front, behind, above and three-quarters; each of who it may be (a cow, a
// bull, a calf); and every pose its sheet names, beside its published measurements and the same lengths measured
// on the mesh. Drawn by the forest's own materials and render chain in midday light, with no canopy and no mist.
// What is on the sheet is the species' own (`sheet.studio.rows`, `sheet.poses`, `sheet.who`):
//   studio.rows   [{ span: metres across each cell, high: metres from the ground line to the top of the row,
//                    cells: [[label, who, pose, view], ...] }, ...]: `who` a name in sheet.who, `pose` a name in
//                    sheet.poses, `view` 'side' | 'front' | 'behind' | 'above' | 'quarter' | 'rear' (three-quarters
//                    from behind) | degrees turned about the upright
//   &pose=<name>  one pose large; with &who=<name>, &view=<as above>, &zoom=<x>, &cycle=<0..1>, &beat=<n>, and
//                 &set=field:value,field:value (any fields of the pose, e.g. set=rear:1,arms:0.6,head.yaw:0.5)
//   &strip=<pose> six moments of one stride (or of one `beat`) of a pose, from the side
//   &pair=<pose>  two of it face to face in a pose (two bulls sparring: &pair=spar&who=bull), &apart=<m> between them
//   &small=1      the animal as a walker sees it far off: each of who it may be at 40, 30, 20 and 12 pixels tall,
//                 from the side and three-quarters, at the detail level the forest would draw it with; &with=<key>,
//                 <key> adds other species to the frame
//   &level=<n>    which detail level is drawn (0 the close-up's)
//   &sheet=1      the painted coat, flat                &faces=1  faces seen from behind drawn red

const QUARTER = Math.PI / 2;
const VIEWS = { side: [0, 0, 0], front: [0, QUARTER, 0], behind: [0, -QUARTER, 0], above: [-QUARTER, 0, 0], quarter: [-0.2, 0.85, 0], rear: [-0.2, -0.95, 0], away: [-0.16, Math.PI - 0.6, 0], far: [0, Math.PI, 0], up: [0, 0, QUARTER] };          // (`up`: on a trunk, climbing: the trunk at the page's left)
const viewOf = (view) => (view == null ? VIEWS.side : VIEWS[view] || [-0.12, THREE.MathUtils.degToRad(Number(view) || 0), 0]);

export async function showPlate(params, sheet) {
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
    window.__birdTable = PLANS.beast.measure(kind);
    window.__forestReady = true;
    return;
  }

  const single = params.get('pose'), strip = params.get('strip'), pair = params.get('pair'), small = params.get('small') === '1';
  const sheetMode = !single && !strip && !pair && !small;
  const COLUMN = sheetMode ? 21 : 0;                          // the column of words, vw
  const rows = PLANS.beast.measure(kind);
  window.__birdTable = rows;
  if (COLUMN) {
    const column = document.createElement('div');
    column.style.cssText = `position:fixed;right:0;top:0;bottom:0;width:${COLUMN}vw;box-sizing:border-box;padding:1.8vh 1.1vw;overflow:hidden;background:#efe8d8;color:#2a2620;font:1.3vh/1.45 Georgia, serif`;
    document.body.append(column);
    const P = sheet.published, fmt = (v) => (v === null ? '' : v.toFixed(3));
    const share = (v) => { const text = (v * 100).toFixed(1); return `${text === '-0.0' ? '0.0' : text} %`; };
    column.innerHTML = `
      <div style="font-size:2.7vh;line-height:1.15">${sheet.name}</div>
      <div style="font-style:italic;font-size:1.7vh;margin-bottom:0.8vh">${sheet.latin}</div>
      <div>Shown: ${P.shown}. Drawn as a plate, lofted and painted when the page loads; nothing is downloaded.</div>
      <table style="border-collapse:collapse;margin:1.2vh 0;width:100%;font-size:1.2vh">
        <tr style="text-align:left;border-bottom:1px solid #8a8272"><th>Length, m</th><th style="padding:0 0.5vw">built</th><th>published</th><th style="padding-left:0.5vw">off</th></tr>
        ${rows.map((r) => `<tr style="border-bottom:1px solid #d2c9b6"><td>${r.what} <sup>${r.source}</sup></td><td style="padding:0 0.5vw">${fmt(r.built)}</td>
          <td>${r.mean !== null ? `${fmt(r.mean)} (${r.range[0]}-${r.range[1]})` : `${r.range[0]}-${r.range[1]}`}</td>
          <td style="padding-left:0.5vw;white-space:nowrap;color:${Math.abs(r.off) > 0.05 ? '#a02818' : '#2a2620'}">${share(r.off)}</td></tr>`).join('')}
      </table>
      <div style="font-size:1.1vh">Built lengths are measured between vertices of the mesh (a leg's joint is a vertex the builder sets where the bone turns), not read back from the numbers it was made from.</div>
      <div style="margin-top:1vh;font-size:1.15vh">${P.proportions.map((p) => `· ${p}`).join('<br>')}</div>
      <div style="margin-top:1vh;font-size:1.15vh">${P.mass}</div>
      <div style="margin-top:1vh;font-size:1.05vh;color:#5a5346"><b>Sources</b><br>${Object.entries(P.sources).map(([k, v]) => `<sup>${k}</sup> ${v}`).join('<br>')}</div>
      <div style="margin-top:1vh;font-size:1.05vh;color:#5a5346">${kind.triangles[0]} triangles in the close-up level, ${kind.triangles[1]} and ${kind.triangles[2]} further off; painted in ${Math.round(window.__birdMs)} ms with the build.</div>`;
  }
  canvas.style.width = `${100 - COLUMN}vw`;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  const size = () => { const w = Math.round(window.innerWidth * (100 - COLUMN) / 100), h = window.innerHeight; renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(w, h, false); return [w, h]; };
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
  renderer.setClearColor(small ? new THREE.Color(0.2, 0.25, 0.17) : new THREE.Color(0.5, 0.47, 0.4));

  // one unit of the scene is a hundred pixels of the page
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  camera.position.set(0, 0, -200);
  camera.lookAt(0, 0, 0);                                    // +x is to the left of the page: the animals face left
  const frame = () => { camera.left = -w / 200; camera.right = w / 200; camera.top = h / 200; camera.bottom = -h / 200; camera.updateProjectionMatrix(); };
  frame();

  const faces = (material) => {
    if (params.get('faces') !== '1') return material;
    material.side = THREE.DoubleSide;
    material.fragmentShader = material.fragmentShader.replace(/\}\s*$/, '  if (!gl_FrontFacing) gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n}\n');
    return material;
  };
  const material = faces(createAnimalMaterial(U, painted.texture, { msaa: 4 }));
  const groundPaint = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.24, 0.21, 0.16) });
  const labels = [], beasts = [];
  const level = Number(params.get('level')) || 0;
  const WHO = sheet.who || {}, POSES = sheet.poses || {};
  const whoOf = (name) => { if (name && !WHO[name]) throw new Error(`there is no "${name}" in the sheet's who: there is ${Object.keys(WHO).join(', ')}`); return name ? WHO[name] : {}; };
  const poseOf = (name) => { if (name && name !== 'stand' && !POSES[name]) throw new Error(`there is no pose called "${name}": there is ${Object.keys(POSES).join(', ')}`); return name && POSES[name] ? POSES[name] : {}; };
  // an animal on the page: its feet at (x, y) pixels from the page's middle (x to the right, y up), `ppm` pixels to the metre
  const add = (label, x, y, ppm, who, pose, view, { line = 0, of = kind, mat = material, lod = level, flip = false } = {}) => {
    const beast = createBeast(of, mat);
    beast.pose({ ...who, ...pose });
    beast.setLevel(lod);
    const holder = new THREE.Group(), turn = viewOf(view), middle = (of.sheet.studio?.middle ?? 0) * (who.scale ?? 1) * ppm;
    // (the animal's own middle is put on the cell's: its origin is over its hips or its back, not half way along it;
    // seen from above it lies along the page, lifted clear of the row's ground line)
    if (view === 'up') y += ppm * of.sheet.size * 0.55 - middle; else x += middle * Math.cos(turn[1] + (flip ? Math.PI : 0));
    if (view === 'above') y += ppm * (of.sheet.studio?.above ?? of.sheet.body.wide * 1.6);
    holder.position.set(-x / 100, y / 100, 0);
    holder.scale.setScalar(ppm / 100);
    beast.group.rotation.set(turn[0], turn[1] + (flip ? Math.PI : 0), turn[2]);
    // (seen from above, it lies along the page: its back towards the reader)
    holder.add(beast.group);
    scene.add(holder);
    if (line && view === 'up') { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.012, ppm * of.sheet.size * 1.5 / 100, 0.02), groundPaint); bar.position.set(-x / 100 + 0.006, y / 100 + ppm * of.sheet.size * 0.75 / 100, 1.5); scene.add(bar); }
    else if (line) { const bar = new THREE.Mesh(new THREE.BoxGeometry(line / 100, 0.012, 0.02), groundPaint); bar.position.set(-x / 100, y / 100 - 0.006, 1.5); scene.add(bar); }
    if (label) labels.push([label, x, y]);
    beasts.push(beast);
    return beast;
  };
  // (a pose's fields set from the address: set=rear:1,head.yaw:0.4)
  const extra = {};
  for (const item of (params.get('set') || '').split(',').filter(Boolean)) {
    const [key, value] = item.split(':'), path = key.split('.');
    let into = extra;
    for (let k = 0; k + 1 < path.length; k += 1) into = (into[path[k]] ??= {});
    into[path[path.length - 1]] = Number(value);
  }
  const merged = (pose) => { const out = { ...pose, ...extra }; if (pose.head || extra.head) out.head = { ...(pose.head || {}), ...(extra.head || {}) }; return out; };
  const tall = sheet.studio?.high ?? sheet.body.high * 1.9, long = sheet.size;
  let bar = null;

  if (single) {
    // one pose large, or two or three of them one over another (pose=stand,swim); what swims has the water's line drawn
    const names = single.split(','), zoom = Number(params.get('zoom')) || 1, ppm = Math.min(w / (long * 1.9), h / (tall * 1.25 * names.length)) * zoom, who = whoOf(params.get('who'));
    const waterPaint = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.33, 0.4) });
    names.forEach((name, i) => {
      const P = merged({ ...poseOf(name), cycle: Number(params.get('cycle')) || poseOf(name).cycle || 0, beat: Number(params.get('beat')) || poseOf(name).beat || 0 });
      const y = names.length === 1 ? -h * 0.36 : h * 0.5 - (h * 0.94 / names.length) * (i + 1) + h * 0.05, wet = (P.swim ?? 0) > 0 && !(P.roll > 1);
      add(`${params.get('who') || ''} ${name}`.trim(), 0, y + (wet ? 0.06 * h : 0), ppm, who, P, params.get('view') ?? (params.get('turn') ? Number(params.get('turn')) : 'side'), { line: wet ? 0 : long * 1.3 * ppm });
      if (wet) { const bar = new THREE.Mesh(new THREE.BoxGeometry(long * 1.5 * ppm / 100, 0.012, 0.02), waterPaint); bar.position.set(0, (y + 0.06 * h + (sheet.body.high - 0.035) * ppm) / 100, 1.5); scene.add(bar); }
    });
    bar = ppm;
  } else if (pair) {
    const zoom = Number(params.get('zoom')) || 1, apart = Number(params.get('apart')) || sheet.studio?.apart || long * 1.2, ppm = Math.min(w / (long * 2.6), h / (tall * 1.2)) * zoom, who = whoOf(params.get('who'));
    const P = merged(poseOf(pair)), view = params.get('view') ?? 'side', turn = viewOf(view);
    // two of them on one floor, nose to nose, the whole turned as one
    const floor = new THREE.Group();
    floor.position.set(0, -h * 0.36 / 100, 0); floor.scale.setScalar(ppm / 100); floor.rotation.set(turn[0], turn[1], turn[2]);
    scene.add(floor);
    for (const side of [1, -1]) {
      const beast = createBeast(kind, material);
      beast.pose({ ...who, ...P, push: (P.push ?? 0) * side, beat: (P.beat ?? 0) + (side < 0 ? 0.37 : 0), head: { ...(P.head || {}), tilt: ((P.head || {}).tilt ?? 0) * side } });
      beast.group.position.set(-side * apart / 2, 0, 0); beast.group.rotation.set(0, side > 0 ? 0 : Math.PI, 0);
      floor.add(beast.group); beasts.push(beast);
    }
    labels.push([`${params.get('who') || ''} ${pair}`.trim(), 0, -h * 0.36]);
    bar = ppm;
  } else if (strip) {
    const ppm = Math.min(w / (long * 1.45 * 3), h / (tall * 2.5)), P = poseOf(strip), who = whoOf(params.get('who'));
    for (let i = 0; i < 6; i += 1) add(`${strip}, ${(i / 6).toFixed(2)}`, (i % 3 - 1) * (w / 3), i < 3 ? h * 0.06 : -h * 0.42, ppm, who, merged({ ...P, cycle: i / 6, beat: (P.beat ?? 0) + i / 6, rake: (P.rake ?? 0) + i / 6 }), 'side', { line: long * 1.2 * ppm });
    bar = ppm;
  } else if (small) {
    // as a walker sees it far off: each of who it may be at four sizes, from the side, three-quarters and going away
    const others = (params.get('with') || '').split(',').filter(Boolean), cast = [];
    for (const [name, who] of Object.entries(WHO).length ? Object.entries(WHO) : [['', {}]]) if (!sheet.studio?.small || sheet.studio.small.includes(name)) cast.push({ name: name || sheet.name, who, kind, material, high: (sheet.studio?.tall ?? sheet.body.high * 1.15) * (who.scale ?? 1) });
    if (others.length) {
      const { SPECIES } = await import('./species/index.js');
      for (const key of others) {
        const other = SPECIES[key];
        if (!other) throw new Error(`there is no species called "${key}"`);
        const k2 = buildBeastKind(other), m2 = faces(createAnimalMaterial(U, paintCoat(other, k2.levels[0], look).texture, { msaa: 4 }));
        cast.push({ name: other.name, who: {}, kind: k2, material: m2, high: other.studio?.tall ?? other.body.high * 1.15 });
      }
    }
    const sizes = [40, 30, 20, 12], views = ['side', 'quarter', 'away'], colW = w / (cast.length * views.length);
    sizes.forEach((px, r) => {
      const y = h * 0.36 - r * h * 0.22;
      cast.forEach((one, c) => views.forEach((view, v) => {
        add(r === 0 && v === 0 ? one.name : '', -w / 2 + colW * (c * views.length + v + 0.5), y, px / one.high, one.who, {}, view, { of: one.kind, mat: one.material, lod: px >= 16 ? 0 : 1 });
      }));
      labels.push([`${px} px`, -w / 2 + 34, y + px]);
    });
  } else {
    // the plate: the rows the species asks for
    const plan = sheet.studio?.rows || [{ span: long * 1.3, high: tall, cells: [['side', null, null, 'side'], ['front', null, null, 'front'], ['behind', null, null, 'behind'], ['above', null, null, 'above']] }];
    const need = plan.reduce((sum, row) => sum + ((w / row.cells.length) / row.span) * row.high + 30, 0), fit = Math.min(1, (h - 46) / need);
    let y = h / 2 - 8;
    for (const row of plan) {
      const cellW = w / row.cells.length, ppm = (cellW / row.span) * fit, rowH = ppm * row.high + 30 * fit;
      y -= rowH;
      row.cells.forEach(([label, who, pose, view], c) => add(label, -w / 2 + cellW * (c + 0.5), y + 22 * fit, ppm, whoOf(who), poseOf(pose), view, { line: view === 'above' ? 0 : cellW * 0.8 }));
      bar ??= ppm;
    }
  }

  const over = document.createElement('div');
  over.style.cssText = `position:fixed;left:0;top:0;width:${100 - COLUMN}vw;height:100vh;pointer-events:none;font:${single || pair ? 1.6 : 1.25}vh Georgia, serif;color:${small ? '#d8d2bc' : '#2a2620'}`;
  document.body.append(over);
  const place = () => {
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    over.innerHTML = labels.map(([name, x, y]) => `<div style="position:absolute;left:${cssW / 2 + x - 110}px;top:${cssH / 2 - y + 3}px;width:220px;text-align:center;white-space:nowrap">${name}</div>`).join('')
      + (bar ? `<div style="position:absolute;left:${cssW - 26 - bar}px;bottom:1.6vh;width:${bar}px;border:1px solid #2a2620;border-top:0;height:0.6vh"></div>
         <div style="position:absolute;left:${cssW - 26 - bar}px;bottom:2.6vh;width:${bar}px;text-align:center">1 m</div>` : '');
  };
  place();
  window.addEventListener('resize', () => { [w, h] = size(); frame(); post.resize(); place(); });

  // Poses checked by number: one animal at the origin, posed, its skin worked out on the CPU. Returns the lowest and
  // the highest point of the whole skin, where the nose is, and each foot's sole.
  const probe = createBeast(kind);
  window.__beastCheck = (pose) => {
    probe.group.position.set(0, 0, 0); probe.group.rotation.set(0, 0, 0);
    probe.pose(typeof pose === 'string' ? poseOf(pose) : pose);
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
    const soles = Object.keys(kind.legsOf).map((key) => { const lay = kind.levels[0].legs[key], b = sk.bones.findIndex((bone) => bone.name === kind.legsOf[key].chain[3]); const p = lay.sole.clone().applyMatrix4(mats[b]); return [+p.x.toFixed(3), +p.y.toFixed(3)]; });
    const nose = skin(kind.levels[0].marks.nose[0]);
    return { soles, nose: [+nose.x.toFixed(3), +nose.y.toFixed(3)], low: +low.toFixed(4), high: +high.toFixed(3) };
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
