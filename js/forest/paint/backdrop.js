import * as THREE from 'three';
import { rng, makeCanvas, css, shift, mix, vary, stroke, dab, drainSteps } from './brush.js';

// What stands too far off to build, painted once on a strip of the sky: the valley's walls, spur behind spur
// with mist lying between them; and, on a sheet of its own that is drawn behind them (mountainSheet, at the
// foot of this file), the mountain at the valley's head. The strip is a band of directions
// (bearing from -z, turning towards +x; and elevation), so it has no distance: it does not come nearer as
// the walker walks, as a mountain does not.
//
// It covers the valley's side of the sky only. Towards +x, where the old terrace's forest stands and the
// views approved at checkpoint 1 look, there is none of it.
export const SPAN = Object.freeze({ b0: -150, b1: 24, e0: -3, e1: 26 });          // degrees
const W = 4096, H = 512;
const X = (b) => ((b - SPAN.b0) / (SPAN.b1 - SPAN.b0)) * W, Y = (e) => H - ((e - SPAN.e0) / (SPAN.e1 - SPAN.e0)) * H;
const PX = W / (SPAN.b1 - SPAN.b0), PY = H / (SPAN.e1 - SPAN.e0);                  // pixels to a degree, across and up

// The valley is a V, and its head is 20 degrees west of north, where the cabin's window and the walker on the
// river's bank both look (land.js, VIEW). Seen along its length a valley's wall climbs steadily as it stands
// off to the side, so each spur is a line through the notch: `at` degrees up where it crosses the valley's
// line, climbing `rise` degrees a degree on its own side as far as `top` (a degree a degree for the nearest
// pair, 0.4 for the furthest, which stand further back and so lie flatter), and running down `toe` degrees a
// degree on the other side to the valley's floor. Spurs come down from the left and from the right by turns,
// each nearer and darker than the last.
const HEAD = -20;
const spur = (side, at, rise, toe, top, end) => {
  const pts = [];
  for (let e = 0.6; e < at; e += 1.4) pts.push([HEAD + side * (at - e) / toe, e]);                // the toe, from the floor up to the valley's line
  for (let e = at; e < top; e += 1.6) pts.push([HEAD - side * (e - at) / rise, e]);               // up its own side
  const crest = HEAD - side * (top - at) / rise;
  for (let b = crest - side * 5, i = 0; side * (end - b) < 0; b -= side * 7, i += 1) pts.push([b, top + [0.6, -0.8, 0.9, -0.3, 0.4, -1.1][i % 6]]);   // along its top
  return pts.sort((p, q) => p[0] - q[0]);
};

// Far to near. `haze` is how much air lies in front (1 would be sky). Each skyline runs through its points
// [bearing, elevation], roughened by `rough` degrees over `grain` degrees.
//
// The mountain stands behind all the spurs with only its top showing: the owner asked that "the peak of the
// mountain just peeks above the rest of the landscape". What can be seen of the strip was measured with a
// grid painted in its place. From the bank the trees at the far end of the river's reach hide everything below
// 8 degrees, and the sky's gap is 10 degrees of bearing wide at 10 degrees up; from the window, which is
// higher and further back, the gap opens at 2 degrees. So the furthest spurs (crossing at about 10 degrees)
// and the mountain's top (to 13.4) show from both, and the nearer notches only from the window.
// Down the river, about 100 degrees west of north, there is a second, lower notch.
const LEFT_END = -66, WEST = [[-74, 19.2], [-81, 17.4], [-87, 12.5], [-92, 6.5], [-95.5, 2.4], [-97, 0.6]];        // every left spur ends at the notch down the river
const left = (at, rise, toe, top, drop) => [...WEST.map(([b, e]) => [b, Math.max(0.6, e - drop)]).reverse(), ...spur(1, at, rise, toe, top, LEFT_END)];
const LAYERS = [
  // (the mountain as it was painted on this strip until the owner asked for a more beautiful one. It is painted
  // nowhere now, and is kept for the random numbers it draws: see backdropTextures)
  { name: 'mountain', kind: 'mountain', haze: 0.42, rough: 0.4, grain: 2.6,
    points: [[-38, 0.4], [-34.5, 3.2], [-31, 6.0], [-28, 8.5], [-25.6, 10.3], [-23.4, 12.2], [-21.6, 11.6], [-20.0, 13.4], [-18.6, 12.1], [-17.0, 12.6], [-15.2, 10.9], [-13, 9.5], [-10.4, 7.6], [-7.6, 5.4], [-4.8, 3.0], [-2, 0.4]] },
  { name: 'far west', haze: 0.78, points: [[-150, 3.4], [-132, 4.6], [-116, 3.9], [-104, 2.9], [-96, 2.0], [-90, 1.4], [-85, 1.9], [-79, 1.1], [-74, 0.5]] },
  { name: 'far left', haze: 0.76, snow: 17.5, points: left(9.8, 0.42, 0.5, 19, 2.4) },
  { name: 'far right', haze: 0.74, points: spur(-1, 10.4, 0.4, 0.55, 19, 24) },
  { name: 'south wall', haze: 0.56, points: [[-150, 12], [-138, 13.6], [-126, 12.2], [-116, 8.6], [-109, 4.6], [-104.5, 1.6], [-103, 0.6]] },
  { name: 'middle left', haze: 0.62, points: left(7.2, 0.7, 0.5, 20, 1.2) },
  { name: 'middle right', haze: 0.6, points: spur(-1, 8.6, 0.62, 0.55, 20, 24) },
  { name: 'near left', haze: 0.5, trees: true, rough: 0.42, grain: 6, points: left(3.0, 1.0, 0.45, 21, 0) },
  { name: 'near right', haze: 0.48, trees: true, rough: 0.42, grain: 6, points: spur(-1, 4.4, 1.0, 0.5, 21, 24) },
  { name: 'floor', haze: 0.6, rough: 0.1, grain: 3, points: [[-150, 0.55], [24, 0.55]] },
];

// The height of a skyline at every column of the strip (-Infinity where it does not reach).
function skyline(layer, seed) {
  const r = rng(seed), pts = layer.points, out = new Float32Array(W).fill(-Infinity);
  const rough = layer.rough ?? 0.22, grain = (layer.grain ?? 4) * PX;
  const knots = Array.from({ length: 4 }, (_, o) => Array.from({ length: Math.ceil(W / (grain / 2 ** o)) + 3 }, () => r() - 0.5));
  const noise = (x) => {
    let v = 0;
    for (let o = 0; o < 4; o += 1) { const f = x / (grain / 2 ** o), i = Math.floor(f), u = f - i, s = u * u * (3 - 2 * u); v += (knots[o][i] + (knots[o][i + 1] - knots[o][i]) * s) / 2 ** o; }
    return v;
  };
  // a cubic through the points, with each point's slope taken from its neighbours
  const slope = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; return (b[1] - a[1]) / (b[0] - a[0]); });
  for (let i = 0; i + 1 < pts.length; i += 1) {
    const [b0, e0] = pts[i], [b1, e1] = pts[i + 1], h = b1 - b0;
    for (let x = Math.max(0, Math.ceil(X(b0))); x <= Math.min(W - 1, Math.floor(X(b1))); x += 1) {
      const t = (SPAN.b0 + (x / W) * (SPAN.b1 - SPAN.b0) - b0) / h, t2 = t * t, t3 = t2 * t;
      const e = (2 * t3 - 3 * t2 + 1) * e0 + (t3 - 2 * t2 + t) * h * slope[i] + (-2 * t3 + 3 * t2) * e1 + (t3 - t2) * h * slope[i + 1];
      // it is rough where it stands high and smooth where it comes down to the valley floor; and no ridge is
      // one even swell, so a slower wave runs under the roughness
      out[x] = e + (noise(x) * rough * 2 + noise(x / 5 + 911) * rough * 4.5) * Math.min(1, Math.max(0.15, e / 3));
    }
  }
  return out;
}

export function backdropTextures(look) { return drainSteps(backdropTexturesSteps(look)); }
export function* backdropTexturesSteps(look) {
  const pal = look.palette.far, r = rng(1300);
  const canvas = makeCanvas(W, H), strip = canvas.getContext('2d', { willReadFrequently: true });
  const air = makeCanvas(W, H), atx = air.getContext('2d', { willReadFrequently: true });          // red: haze. green: how squarely it faces the sun's side
  strip.fillStyle = css([210, 14, 62]); strip.fillRect(0, 0, W, H);       // never seen: under full haze it is the sky's own colour
  atx.fillStyle = 'rgb(255, 128, 0)'; atx.fillRect(0, 0, W, H);
  const hazeCss = (haze, lit) => `rgb(${Math.round(255 * haze)}, ${Math.round(255 * lit)}, 0)`;
  // the same colour as hue, saturation and lightness, which is how a brush stroke is given its colour
  const hazeHsl = (haze, lit) => { const most = Math.max(haze, lit); return most > 0 ? [haze >= lit ? 60 * (lit / haze) : 60 * (2 - haze / lit), 100, 50 * most] : [0, 0, 0]; };
  // The mountain is no longer painted on this strip: it has a sheet of its own (mountainSheet, below). Its old
  // layer is still gone through, on a canvas of one pixel, because one stream of random numbers runs through
  // every layer here and each layer's skyline is seeded by its place in the list: taken out, every spur the
  // owner approved would have another outline and other paint. As it is the strip is what it was, pixel for
  // pixel, but for where the old mountain showed, and the row of pixels along the spurs' edge in front of it.
  const nowhere = makeCanvas(1, 1).getContext('2d');
  const cut = new Float32Array(W).fill(-Infinity);                  // the highest of the spurs at each column, in degrees: what the mountain stands behind

  for (const [n, layer] of LAYERS.entries()) {
    const line = skyline(layer, 1301 + n * 17), mountain = layer.kind === 'mountain';
    const ctx = mountain ? nowhere : strip;
    if (!mountain) for (let x = 0; x < W; x += 1) cut[x] = Math.max(cut[x], line[x]);
    let x0 = 0, x1 = W - 1;
    while (x0 < W && line[x0] === -Infinity) x0 += 1;
    while (x1 > 0 && line[x1] === -Infinity) x1 -= 1;
    const body = (context) => { context.beginPath(); context.moveTo(x0, H); for (let x = x0; x <= x1; x += 1) context.lineTo(x, Y(line[x])); context.lineTo(x1, H); context.closePath(); };
    const base = mountain ? pal.snow : mix(pal.forest, pal.forestLight, 0.25 + 0.2 * (n % 3));
    body(ctx); ctx.fillStyle = css(base); ctx.fill();
    // The air in front of it, and the light. A slope that falls away towards +x faces the sun (which is always
    // on that side) and one that rises towards it is in its own shade: worked out from the skyline, column by column.
    const floor = layer.name === 'floor';
    for (let x = x0; x <= x1 && !mountain; x += 4) {              // (the old mountain's air is not laid: no random number is drawn here)
      const a = line[Math.max(x0, x - 14)], b = line[Math.min(x1, x + 14)], fall = (a - b) / (28 / PX);        // degrees of height lost per degree turned
      const lit = Math.min(1, Math.max(0, 0.5 + fall * (mountain ? 0.55 : 0.4)));
      const top = Y(Math.max(line[x], line[Math.min(x1, x + 3)]));
      if (floor) {
        // the valley's own floor runs out into the air: by the foot of the strip it is the sky
        const g = atx.createLinearGradient(0, top, 0, H); g.addColorStop(0, hazeCss(layer.haze, 0.5)); g.addColorStop(1, hazeCss(1, 0.5));
        atx.fillStyle = g;
      } else {
        // mist lies in the valleys: the air thickens down a slope from its skyline, so that the spur in front of
        // it stands clear of it, and the mountain rises out of haze
        const g = atx.createLinearGradient(0, top, 0, top + 8 * PY);
        g.addColorStop(0, hazeCss(layer.haze, lit)); g.addColorStop(1, hazeCss(Math.min(0.96, layer.haze + (mountain ? 0.34 : 0.2)), lit));
        atx.fillStyle = g;
      }
      atx.fillRect(x, top, 4, H - top);
    }
    ctx.save(); body(ctx); ctx.clip();
    if (mountain) {
      // below the snow, rock and the blue of far forest; above it, every spur with a lit side and a side in blue shade
      const snowline = 2.5;
      for (let x = x0; x <= x1; x += 9) {
        const top = Y(Math.min(line[x], snowline + (r() - 0.5) * 0.9));
        stroke(ctx, r, x, top, x + (r() - 0.5) * 30, H, 26, vary(mix(pal.rock, pal.forest, r() * 0.8), r), { ragged: 0.2, taperIn: 0.05, taperOut: 0.05 });
      }
      for (let k = 0; k < 150; k += 1) {
        const x = x0 + r() * (x1 - x0), high = line[Math.round(x)];
        if (high < snowline + 0.6) continue;
        const e = snowline + 0.2 + r() * (high - snowline - 0.2), dir = r() < 0.5 ? -1 : 1, len = (0.5 + r() * 1.6) * PX;
        // a spur: its left flank in shade, a line of rock down its crest near the top
        const px = x, py = Y(e), qx = x + dir * len * 0.5, qy = py + len * (0.7 + r() * 0.6);
        for (let s = 0; s < 5; s += 1) {
          const t = s / 5, sx = px + (qx - px) * t, sy = py + (qy - py) * t;
          stroke(ctx, r, sx, sy, sx - (10 + r() * 34), sy + 8 + r() * 30, 9 + r() * 12, vary(pal.snowShade, r, 0.6), { ragged: 0.25, taperIn: 0.1, taperOut: 0.7, alpha: 0.8 });
        }
        if (e > high - 2.2 && r() < 0.7) stroke(ctx, r, px, py, qx, qy, 3 + r() * 5, vary(r() < 0.6 ? pal.rock : pal.rockLight, r), { ragged: 0.35, lumpy: 0.5, taperIn: 0.1, taperOut: 0.6, alpha: 0.9 });
      }
      for (let x = x0; x <= x1; x += 5) {                       // rock shows along the crest, where the wind keeps the snow off
        if (r() < 0.78 || line[x] < snowline + 1) continue;
        stroke(ctx, r, x, Y(line[x]) - 1, x + (r() - 0.5) * 14, Y(line[x]) + 4 + r() * 11, 4 + r() * 6, vary(pal.rock, r), { ragged: 0.35, lumpy: 0.5, taperIn: 0.2, taperOut: 0.7, alpha: 0.85 });
      }
    } else {
      // forest seen from far off: the fall of the slope in long strokes, darker in the gullies
      const step = layer.trees ? 5 : 7;
      for (let x = x0; x <= x1; x += step) {
        const top = Y(line[x]), reach = H - top;
        for (let k = 0; k < 3; k += 1) {
          const y = top + r() * reach * 0.9, len = 14 + r() * (layer.trees ? 60 : 44), lean = (r() - 0.5) * 22;
          const c = vary(mix(pal.forest, pal.forestLight, r() < 0.3 ? 0.9 * r() : 0.2 + 0.5 * r()), r, 0.8);
          stroke(ctx, r, x, y, x + lean, y + len, 5 + r() * 9, c, { ragged: 0.2, taperIn: 0.2, taperOut: 0.6, alpha: 0.75 });
        }
        // snow still lies on the tops of the high spurs in May
        if (layer.snow && line[x] > layer.snow && r() < 0.5) stroke(ctx, r, x - 14, top + 2 + r() * 5, x + 14 + r() * 22, top + 4 + r() * (line[x] - layer.snow) * 14, 7 + r() * 8, vary(r() < 0.5 ? pal.snow : pal.snowShade, r, 0.5), { ragged: 0.3, lumpy: 0.4, taperIn: 0.3, taperOut: 0.5, alpha: 0.8 });
      }
    }
    ctx.restore();
    if (layer.trees) {
      // the nearest wall is near enough for its skyline to be trees: the same points on both sheets
      for (let x = x0 + 4; x <= x1 - 4; x += 3 + Math.floor(r() * 3)) {
        // only where the wall stands high: down in the notch a spur's edge is far off, and trees a hand tall
        // along it stood in the mist as a line of dark specks
        if (line[x] < 8) continue;
        const top = Y(line[x]), tall = 4 + r() * 6, lean = (r() - 0.5) * 3, seed = Math.floor(r() * 1e9);
        const fall = (line[Math.max(x0, x - 14)] - line[Math.min(x1, x + 14)]) / (28 / PX);
        stroke(ctx, rng(seed), x, top + 4, x + lean, top - tall, 5 + r() * 3, vary(pal.forest, r, 0.6), { ragged: 0.2, taperIn: 0.05, taperOut: 1.0 });
        // the same air lies in front of a tree on the skyline as in front of the slope it stands on. (A stroke
        // takes its colour as hue, saturation and lightness: handed black, these trees had no air in front of
        // them at all, and stood as dark specks in the sky wherever the wall behind them was lost in mist.)
        stroke(atx, rng(seed), x, top + 4, x + lean, top - tall, 5 + r() * 3, hazeHsl(layer.haze, Math.min(1, Math.max(0, 0.5 + fall * 0.4))), { ragged: 0.2, taperIn: 0.05, taperOut: 1.0 });
      }
    }
    // mist lies in the valleys between one spur and the next: long pale streaks at the foot of each
    if (!mountain && !floor) {
      for (let k = 0; k < 26; k += 1) {
        const x = x0 + r() * (x1 - x0), e = 0.4 + r() * 2.2, long = (2 + r() * 7) * PX, thick = 5 + r() * 9;
        if (line[Math.round(x)] < e + 0.5) continue;
        atx.save(); atx.translate(x, Y(e)); atx.scale(long / thick, 1);
        const g = atx.createRadialGradient(0, 0, 0, 0, 0, thick); g.addColorStop(0, `rgba(255, 128, 0, ${0.5 + r() * 0.35})`); g.addColorStop(1, 'rgba(255, 128, 0, 0)');
        atx.fillStyle = g; atx.beginPath(); atx.arc(0, 0, thick, 0, 6.283); atx.fill(); atx.restore();
      }
    }
    yield `layer ${n}`;
  }

  // One sheet for the GPU: the paint, and in alpha how much of it is left once the air has had its share. It
  // is handed over as numbers, not as a canvas: a canvas keeps its colours multiplied by their alpha, and
  // where the alpha is nothing (the sky) the colour is lost, which leaves a dark line along every skyline.
  // Both sheets are top row first, and the band's own coordinates (backdropBand) run the same way.
  const paint = strip.getImageData(0, 0, W, H), haze = atx.getImageData(0, 0, W, H);
  const data = new Uint8Array(paint.data.buffer), lit = new Uint8Array((W / 4) * (H / 4));
  for (let i = 0; i < W * H; i += 1) data[i * 4 + 3] = 255 - haze.data[i * 4];
  for (let j = 0; j < H / 4; j += 1) for (let i = 0; i < W / 4; i += 1) lit[j * (W / 4) + i] = haze.data[((j * 4 + 2) * W + i * 4 + 2) * 4 + 1];
  const texture = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  const aux = new THREE.DataTexture(lit, W / 4, H / 4, THREE.RedFormat, THREE.UnsignedByteType);
  aux.minFilter = aux.magFilter = THREE.LinearFilter;
  aux.needsUpdate = true;
  yield 'spurs';
  return { texture, aux, canvas, air, peak: mountainSheet(look, cut) };
}

// The band of sky the strip is laid on: a strip of a sphere of radius 1 about the eye.
export function backdropBand() {
  const cols = 116, rows = 8, position = [], uv = [], index = [];
  for (let j = 0; j <= rows; j += 1) {
    for (let i = 0; i <= cols; i += 1) {
      const b = THREE.MathUtils.degToRad(SPAN.b0 + (i / cols) * (SPAN.b1 - SPAN.b0)), e = THREE.MathUtils.degToRad(SPAN.e0 + (j / rows) * (SPAN.e1 - SPAN.e0));
      position.push(Math.sin(b) * Math.cos(e), Math.sin(e), -Math.cos(b) * Math.cos(e));
      uv.push(i / cols, 1 - j / rows);
    }
  }
  for (let j = 0; j < rows; j += 1) for (let i = 0; i < cols; i += 1) { const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1; index.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(index);
  return g;
}

// ---- The mountain -------------------------------------------------------------------------------------------
//
// The owner, of the mountain that stood on the strip: "not majestic enough. By majestic I don't mean bigger, I
// just mean more beautiful. It looks kinda goofy now." It was three even, rounded lumps of white with dots of
// rock on them, and read as a face. What shows of a mountain here is little: the top three degrees of it, in
// the V between the two furthest spurs, about 250 by 95 pixels of a walker's screen. At that size it is its
// outline and two or three planes of light, so those are what this is built for: one summit that stands over
// the rest, set off the middle; horns, not lumps, with rock along their crests; the sun's side of every face lit and the other side
// in blue shade, with the shadows the summits throw across the snow; and a glacier that comes down between two
// aretes into the notch.
//
// It is the same size, in the same place: its top is where the old one's was (13.4 degrees up, a little right
// of the notch).
//
// It has a sheet of its own, about twice as fine as the strip, because the strip has fewer pixels to a degree
// than the screen. And it is not painted as a picture: it is laid out by hand as lines (the crest, and the
// aretes that come down from the summits towards the eye), raised into a small relief, and that relief is what
// is drawn, so that what lies in front hides what lies behind and every face knows which way it looks. The
// sheet holds the paint with no light in it, and beside it how squarely each pixel faces the sun: the hour's
// own light is laid on it when it is drawn (BACKDROP_FRAG), so the snow is warm at noon, rose at golden hour
// and grey-blue under the moon.
export const PEAK = Object.freeze({ b0: -26.5, b1: -15.0, e0: 9.6, e1: 13.9 });          // degrees: the part of the strip the sheet covers (the mountain shows from 24.8 to 16.1 degrees left, over spurs that meet at 10.1 degrees up)
const PW = 512, PH = 192;
const PEAK_PY = PH / (PEAK.e1 - PEAK.e0);          // pixels to a degree, up (across it is nearly the same)

// The massif's lines: [bearing, depth, height], all in degrees of arc as the valley sees them. Depth is away
// from the eye, 0 at the crest. A point is seen at its height less
// TILT of its depth, since the eye looks up at it from the valley: what is nearer stands higher on the sheet
// than its height alone would put it, and hides what is behind and below.
const TILT = 0.2;
const CREST = [[-33, 1.2, 9.6], [-30.4, 0.8, 10.4], [-27.6, 0.5, 10.9], [-25.5, 0.3, 11.35], [-24.2, 0.15, 11.85], [-23.5, 0.05, 12.16], [-23.0, 0.0, 12.56],
  [-22.55, 0.05, 12.16], [-21.5, 0.15, 11.84], [-20.75, 0.1, 12.04], [-20.2, 0.05, 12.34], [-19.75, 0.0, 12.76], [-19.45, 0.0, 13.16], [-19.3, 0.0, 13.42],
  [-19.05, 0.0, 13.18], [-18.7, 0.05, 12.96], [-18.35, 0.1, 12.84], [-17.9, 0.15, 12.38], [-17.3, 0.2, 12.5], [-16.9, 0.2, 12.68], [-16.4, 0.3, 12.22],
  [-15.2, 0.5, 11.75], [-13.6, 0.8, 11.15], [-11.4, 1.1, 10.5], [-8.5, 1.5, 9.6]];
const ARETES = [
  [[-19.3, 0.0, 13.42], [-19.7, -0.8, 12.62], [-20.15, -1.8, 11.95], [-20.7, -3.0, 11.3], [-21.2, -4.4, 10.6], [-21.5, -6.0, 9.9]],      // the high summit's, down to the left: the sun's side of it is its right
  [[-23.0, 0.0, 12.56], [-22.75, -0.9, 11.95], [-22.4, -2.0, 11.36], [-22.2, -3.4, 10.72], [-22.1, -5.0, 10.0]],                          // the left summit's, down to the right: the two close on the notch
  [[-16.9, 0.2, 12.68], [-17.15, -0.8, 12.05], [-17.5, -1.9, 11.45], [-17.8, -3.2, 10.78]],                                                // the right shoulder's
  [[-24.2, 0.15, 11.85], [-24.5, -1.0, 11.2], [-24.9, -2.4, 10.5]],                                                                         // a rib off the left ridge
  [[-18.7, 0.05, 12.96], [-18.55, -0.7, 12.42], [-18.45, -1.6, 11.92], [-18.4, -2.7, 11.38]],                                                 // a rib down the high summit's sunlit face
];

// Smooth noise on a lattice of random numbers, the same on every load.
function lattice(seed) {
  const N = 64, r = rng(seed), t = new Float32Array(N * N);
  for (let i = 0; i < N * N; i += 1) t[i] = r();
  return (x, y) => {
    const fx = Math.floor(x), fy = Math.floor(y), u = x - fx, v = y - fy, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    const i0 = ((fx % N) + N) % N, j0 = ((fy % N) + N) % N, i1 = (i0 + 1) % N, j1 = (j0 + 1) % N;
    const a = t[j0 * N + i0], b = t[j0 * N + i1], c = t[j1 * N + i0], d = t[j1 * N + i1];
    return a + (b - a) * su + (c - a + (a - b + d - c) * su) * sv;
  };
}

// The height of the ground under a ridge line at (x, z): the line's own height abreast of it, less a fall that
// is steep beside the crest and eases away from it (a horn's wall, then the apron under it): as the distance
// to the power of three quarters, which is two square roots.
function ridge(pts, x, z, fall) {
  let best = -Infinity;
  for (let i = 0; i + 1 < pts.length; i += 1) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1];
    const t = Math.min(1, Math.max(0, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
    const ex = x - a[0] - dx * t, ez = z - a[1] - dz * t, d = Math.sqrt(ex * ex + ez * ez);
    const h = a[2] + (b[2] - a[2]) * t - fall * Math.sqrt(d * Math.sqrt(d));
    if (h > best) best = h;
  }
  return best;
}

// `cut`: the spurs' skyline at every column of the strip, in degrees (backdropTextures). The mountain stands
// behind them, so its sheet ends at that line: the line the spurs' paint was filled to, not the top of their
// air, which is laid four columns at a time and stands over the paint in steps (BACKDROP_FRAG lets the strip
// go where the mountain shows, so those steps are not drawn across it).
function mountainSheet(look, cut) {
  const pal = look.palette.far, rough = lattice(1501), fine = lattice(1502), wobble = lattice(1503);
  // ---- the relief, on a grid a twentieth of a degree to the cell
  // (it reaches past the sheet a degree to the left and three and a half to the right, where the sun is: what
  // stands there throws its shadow onto what the sheet shows)
  const CELL = 0.05, X0 = PEAK.b0 - 1, Z0 = -6.4, GX = Math.ceil((PEAK.b1 + 3.5 - X0) / CELL) + 1, GZ = Math.ceil((1.4 - Z0) / CELL) + 1;
  const rock = new Float32Array(GX * GZ), ground = new Float32Array(GX * GZ), even = new Float32Array(GX * GZ);
  for (let j = 0; j < GZ; j += 1) {
    for (let i = 0; i < GX; i += 1) {
      const x = X0 + i * CELL, z = Z0 + j * CELL;
      let h = ridge(CREST, x, z, 1.18);
      for (const line of ARETES) h = Math.max(h, ridge(line, x, z, 1.08));
      // broken rock: ribs and gullies down the walls, and finer grit
      const ribs = 1 - Math.abs(2 * rough(x * 2.3 + 11, z * 2.3 + 5) - 1), grit = fine(x * 6.1, z * 6.1) - 0.5;
      even[j * GX + i] = h;
      rock[j * GX + i] = h + (ribs - 0.55) * 0.1 + grit * 0.04;
    }
  }
  // Snow lies where the rock is hollow: the relief smoothed over a third of a degree fills every cirque and
  // gully to a smooth surface, and what stands above it is bare.
  const blur = (from, reach) => {
    const mid = new Float32Array(GX * GZ), out = new Float32Array(GX * GZ);
    for (let j = 0; j < GZ; j += 1) {
      let sum = 0;
      for (let i = -reach; i <= reach; i += 1) sum += from[j * GX + Math.min(GX - 1, Math.max(0, i))];
      for (let i = 0; i < GX; i += 1) { mid[j * GX + i] = sum / (2 * reach + 1); sum += from[j * GX + Math.min(GX - 1, i + reach + 1)] - from[j * GX + Math.max(0, i - reach)]; }
    }
    for (let i = 0; i < GX; i += 1) {
      let sum = 0;
      for (let j = -reach; j <= reach; j += 1) sum += mid[Math.min(GZ - 1, Math.max(0, j)) * GX + i];
      for (let j = 0; j < GZ; j += 1) { out[j * GX + i] = sum / (2 * reach + 1); sum += mid[Math.min(GZ - 1, j + reach + 1) * GX + i] - mid[Math.max(0, j - reach) * GX + i]; }
    }
    return out;
  };
  const snow = blur(blur(rock, 5), 5), wide = blur(blur(rock, 12), 12);
  const bare = new Float32Array(GX * GZ);                          // how far the rock stands out of the snow, in degrees
  const proud = new Float32Array(GX * GZ);                         // how far it stands over the ground for a degree round it: a crest does, and a knob on a face does not
  for (let k = 0; k < GX * GZ; k += 1) { bare[k] = rock[k] - (snow[k] - 0.02); proud[k] = rock[k] - wide[k]; ground[k] = Math.max(rock[k], snow[k] - 0.02); }
  // Which way each cell faces, and whether a summit stands between it and the sun. That is worked out on the
  // relief without its ribs and grit: with them every knob threw a shadow of its own, and a lit face of snow
  // was dotted with grey.
  const plain = blur(blur(even, 5), 5), shape = new Float32Array(GX * GZ);
  for (let k = 0; k < GX * GZ; k += 1) shape[k] = Math.max(even[k], plain[k] - 0.02);
  const SUN = [0.9, 0.38, -0.22], sunLong = Math.hypot(...SUN), sun = SUN.map((v) => v / sunLong), run = Math.hypot(sun[0], sun[2]);
  const at = (field, gx, gz) => {
    const i = Math.min(GX - 2, Math.max(0, Math.floor(gx))), j = Math.min(GZ - 2, Math.max(0, Math.floor(gz))), u = Math.min(1, Math.max(0, gx - i)), v = Math.min(1, Math.max(0, gz - j));
    const k = j * GX + i;
    return field[k] + (field[k + 1] - field[k]) * u + (field[k + GX] - field[k] + (field[k] - field[k + 1] + field[k + GX + 1] - field[k + GX]) * u) * v;
  };
  const light = new Float32Array(GX * GZ), steep = new Float32Array(GX * GZ);
  const stepX = (sun[0] / run) / CELL, stepZ = (sun[2] / run) / CELL, climb = sun[1] / run;
  for (let j = 0; j < GZ; j += 1) {
    for (let i = 0; i < GX; i += 1) {
      const k = j * GX + i, i0 = Math.max(0, i - 1), i1 = Math.min(GX - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(GZ - 1, j + 1);
      const sx = (shape[j * GX + i1] - shape[j * GX + i0]) / ((i1 - i0) * CELL), sz = (shape[j1 * GX + i] - shape[j0 * GX + i]) / ((j1 - j0) * CELL);
      steep[k] = Math.hypot(sx, sz);
      let lit = Math.max(0, (-sx * sun[0] + sun[1] - sz * sun[2]) / Math.hypot(sx, 1, sz));
      // towards the sun, in steps that lengthen: is the ground ever above the ray?
      for (let far = 0.08, shade = 0; lit > 0 && far < 3.2; far *= 1.32) {
        const gx = i + stepX * far, gz = j + stepZ * far;
        if (gx < 0 || gx > GX - 1 || gz < 0 || gz > GZ - 1) break;
        shade = Math.max(shade, Math.min(1, (at(shape, gx, gz) - (shape[k] + 0.012 + far * climb)) / 0.05));
        if (shade >= 1) lit = 0; else if (far * 1.32 >= 3.2) lit *= 1 - shade;
      }
      light[k] = lit;
    }
  }

  // ---- the sheet: each column of it, from the nearest ground to the furthest, so that what is nearer hides
  // what is behind. `paint` is the paint with no light in it; `face` how squarely the pixel faces the sun.
  const paint = new Uint8ClampedArray(PW * PH * 4), face = new Uint8Array(PW * PH), cover = new Float32Array(PW * PH);
  const snowRgb = [247, 248, 249], iceRgb = [206, 224, 238];
  const srgb = ([h, s, l]) => { const c = new THREE.Color().setHSL((((h % 360) + 360) % 360) / 360, s / 100, l / 100, THREE.SRGBColorSpace); return [c.r, c.g, c.b].map((v) => 255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); };
  const rockRgb = srgb(pal.rock), rockWarm = srgb(pal.rockLight);
  const put = (i, j, share, gx, gz) => {
    const o = (j * PW + i) * 4;
    // rock where it stands out of the snow and is steep, with a broken edge: the horns, the crests of the
    // aretes, the walls under them. Snow holds on everything else.
    const out = at(bare, gx, gz), slope = at(steep, gx, gz), ragged = wobble(i / 7.3, j / 7.3) - 0.5;
    // (in buttresses and bands, with snow up to the crest between them: bare the whole length of a crest, the
    // rock was a dark line drawn round the mountain)
    // And only on a crest or the wall under one. A knob of rock out in the middle of a snow face is a dark
    // dot on white, and two of those are a pair of eyes: the mountain this one replaced read as a face.
    const band = Math.min(1, Math.max(0, (wobble(i / 41 + 3, j / 23 + 8) - 0.3) / 0.22));
    const stone = Math.min(1, Math.max(0, (out - 0.03 + ragged * 0.06) / 0.03)) * Math.min(1, Math.max(0, (slope - 1.02 + ragged * 0.45 - (1 - band) * 0.5) / 0.22))
      * Math.min(1, Math.max(0, (at(proud, gx, gz) - 0.05 + ragged * 0.05) / 0.05));
    // the light, in five flat tones from shade to the sun's side, with a brush's edge between them. (In three,
    // a face that lay near one of the two edges was blotched all over with the tone beside its own.)
    const lit = Math.min(1, Math.max(0, (at(light, gx, gz) + (wobble(i / 11 + 40, j / 11 + 9) - 0.5) * 0.05 - 0.13) / 0.36));
    const tone = Math.round(lit * lit * (3 - 2 * lit) * 4) / 4;
    // snow is not one white: old ice shows blue where it is steep, and in bands across a glacier
    const icy = Math.min(1, Math.max(0, (slope - 0.75) / 0.5)) * 0.5;
    // rock is bedded: bands of lighter and darker stone that run along the wall, a little off the level
    const bed = wobble(i / 31 + 5, j / 3.1 + i / 26 + 60);
    for (let c = 0; c < 3; c += 1) {
      const white = snowRgb[c] + (iceRgb[c] - snowRgb[c]) * Math.min(1, icy), dark = rockRgb[c] + (rockWarm[c] - rockRgb[c]) * (0.05 + 0.4 * bed);
      paint[o + c] = white + (dark - white) * stone;
    }
    face[j * PW + i] = Math.round(255 * tone * (1 - 0.2 * stone));
    cover[j * PW + i] = share;
  };
  const X = (b) => ((b - SPAN.b0) / (SPAN.b1 - SPAN.b0)) * W;
  for (let i = 0; i < PW; i += 1) {
    const b = PEAK.b0 + ((i + 0.5) / PW) * (PEAK.b1 - PEAK.b0), gx = (b - X0) / CELL;
    // it ends behind the spurs, at their skyline (a column of the strip's skyline is the line's height at that
    // column's left edge: backdropTextures' `body`). Nothing of it is painted further down than that.
    const x = X(b), x0 = Math.min(W - 2, Math.max(0, Math.floor(x))), u = Math.min(1, Math.max(0, x - x0));
    const hidden = (PEAK.e1 - (cut[x0] + (cut[x0 + 1] - cut[x0]) * u)) * PEAK_PY, last = Math.min(PH - 1, Math.ceil(hidden));
    let top = PH, before = 0, beforeRow = PH + 1;
    for (let gz = 0; gz <= GZ - 1; gz += 0.5) {
      const row = (PEAK.e1 - (at(ground, gx, gz) - (Z0 + gz * CELL) * TILT)) * PEAK_PY;
      if (row < top) {
        const from = Math.max(0, Math.ceil(row));
        // each row between this ground and the last is its own place on the slope between them
        for (let j = Math.min(top - 1, last); j >= from; j -= 1) put(i, j, 1, gx, beforeRow > row ? gz + (before - gz) * Math.min(1, Math.max(0, (j - row) / (beforeRow - row))) : gz);
        if (from > 0 && from - 1 <= last && from - row > 0.02) put(i, from - 1, from - row, gx, gz);          // the row the outline cuts through is part sky
        top = from;
      }
      before = gz; beforeRow = row;
    }
    for (let j = 0; j < PH; j += 1) {
      const k = j * PW + i;
      cover[k] *= Math.min(1, Math.max(0, hidden - j));          // the share of this row that stands over the spurs' line
      paint[k * 4 + 3] = Math.round(255 * cover[k]);
    }
  }
  // the sheet's edges are sky: nothing of it may be drawn out past them
  for (let i = 0; i < PW; i += 1) { paint[i * 4 + 3] = 0; paint[((PH - 1) * PW + i) * 4 + 3] = 0; }
  for (let j = 0; j < PH; j += 1) { paint[j * PW * 4 + 3] = 0; paint[(j * PW + PW - 1) * 4 + 3] = 0; }
  // Where there is no mountain the sheet keeps the colour of the nearest paint in its column: a texture is
  // read between its pixels, and black beside the outline would be drawn into it as a dark line.
  const empty = [];
  for (let i = 0; i < PW; i += 1) {
    let first = -1, lastSeen = -1;
    for (let j = 0; j < PH; j += 1) if (cover[j * PW + i] > 0) { if (first < 0) first = j; lastSeen = j; }
    if (first < 0) { empty.push(i); continue; }
    for (let j = 0; j < PH; j += 1) {
      const from = j < first ? first : j > lastSeen ? lastSeen : -1;
      if (from < 0) continue;
      for (let c = 0; c < 3; c += 1) paint[(j * PW + i) * 4 + c] = paint[(from * PW + i) * 4 + c];
      face[j * PW + i] = face[from * PW + i];
    }
  }
  // (and a column with none of it, the column's beside it that has)
  const filled = (i) => i >= 0 && i < PW && !empty.includes(i);
  for (const i of empty) {
    let from = -1;
    for (let d = 1; d < PW && from < 0; d += 1) from = filled(i - d) ? i - d : filled(i + d) ? i + d : -1;
    if (from < 0) break;
    for (let j = 0; j < PH; j += 1) { for (let c = 0; c < 3; c += 1) paint[(j * PW + i) * 4 + c] = paint[(j * PW + from) * 4 + c]; face[j * PW + i] = face[j * PW + from]; }
  }

  const texture = new THREE.DataTexture(new Uint8Array(paint.buffer), PW, PH, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  const aux = new THREE.DataTexture(face, PW, PH, THREE.RedFormat, THREE.UnsignedByteType);
  aux.generateMipmaps = true; aux.minFilter = THREE.LinearMipmapLinearFilter; aux.magFilter = THREE.LinearFilter;
  aux.needsUpdate = true;
  // for the dev page (show=textures): the sheet as a noon's light would show it, on a sky
  const canvas = makeCanvas(PW, PH), ctx = canvas.getContext('2d'), shown = ctx.createImageData(PW, PH);
  for (let k = 0; k < PW * PH; k += 1) {
    const a = paint[k * 4 + 3] / 255, f = face[k] / 255;
    for (let c = 0; c < 3; c += 1) {
      const lit = (paint[k * 4 + c] / 255) * ([0.46, 0.56, 0.7][c] + [0.62, 0.52, 0.4][c] * f);
      shown.data[k * 4 + c] = 255 * ([0.76, 0.8, 0.84][c] * (1 - a) + Math.min(1, lit) * a);
    }
    shown.data[k * 4 + 3] = 255;
  }
  ctx.putImageData(shown, 0, 0);
  // where the sheet lies on the strip, for the shader: its corner in the strip's own coordinates, and how many
  // times smaller than the strip it is each way
  const box = [(PEAK.b0 - SPAN.b0) / (SPAN.b1 - SPAN.b0), (SPAN.e1 - PEAK.e1) / (SPAN.e1 - SPAN.e0), (SPAN.b1 - SPAN.b0) / (PEAK.b1 - PEAK.b0), (SPAN.e1 - SPAN.e0) / (PEAK.e1 - PEAK.e0)];
  return { texture, aux, canvas, box };
}
