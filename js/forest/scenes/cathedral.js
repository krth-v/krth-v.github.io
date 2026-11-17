// Scene 2, "Cathedral": the trail runs east between giant Douglas-firs, into
// the low sun. Hemlocks of every age stand between them, sword fern and sorrel
// cover the floor, and one fallen giant lies beside the path.
//
// s is metres along the trail; side is metres to the walker's right (+) or left (-).
// The trail bends to the right all the way through, about 70 degrees between 44 m and
// 104 m: the right is the inside of the bend, where a straight log's ends close on the
// path, and the left is the outside, where they fall away from it. Compose against
// forest.html?show=map; the layout warns about anything too near the trail or standing
// in something else.
const giants = [
  [50, -4.2, 1.1], [57, 5.0, 1.0], [64, -3.4, 1.22], [72, 10.2, 1.05], [76, -8.0, 0.95], [83, 3.4, 1.18], [90, -5.5, 1.0], [97, 7.0, 1.1],
  [54, -13, 0.95], [60, 13, 1.05], [68, -14.5, 1.1], [79, 15, 0.9], [88, -16, 1.05], [95, -12, 0.95], [102, -4.5, 1.0], [46, 9, 0.95],
];
const hemlocks = [
  [53, 8.2, 1.0], [61, -7.6, 0.9], [66, 13.6, 1.1], [74, -5.0, 0.85], [80, 9.2, 1.0], [86, -10.5, 1.1], [93, 4.6, 0.8], [99, -8.3, 1.0],
  [58, -11.2, 1.05], [73, 15.5, 0.95], [84, -13.2, 0.9],
];
const poles = [[50, 5.6, 0.9], [62, 8.4, 0.8], [69, -6.4, 1.1], [76, 8.6, 0.9], [85, -4.1, 0.75], [92, -9.0, 1.1], [96, 10.4, 0.9], [101, 3.9, 0.7]];
// saplings come up in knots where a little more light reaches the floor: [s, side, how many, within how many metres]
const knots = [[59, -3.6, 4, 2.0], [66, 8.2, 5, 2.4], [73, -3.9, 5, 2.4], [81, -3.4, 3, 1.8], [88, 5.6, 5, 2.6], [94, -3.8, 4, 2.2], [51, 3.4, 3, 1.6], [79, 3.3, 3, 1.4]];

const placements = [];
for (const [s, side, scale] of giants) placements.push({ kind: 'giant', s, side, scale });
for (const [s, side, scale] of hemlocks) placements.push({ kind: 'mature', s, side, scale });
for (const [s, side, scale] of poles) placements.push({ kind: 'pole', s, side, scale });
// The fallen giant, inside the bend. Turned a little with the trail so both ends keep their distance, and laid
// with its snapped tip towards the walker coming up the trail: end-on, the butt was a blank disc nearly two metres across.
const NURSE = { s: 70, side: 5.4, turn: Math.PI - 0.12 };
placements.push({ kind: 'log', ...NURSE, scale: 1.15 });
placements.push({ kind: 'log', s: 88, side: -10.5, turn: 0.9, scale: 0.9 });
placements.push({ kind: 'stump', s: 84, side: 7.8, scale: 1.1 });
placements.push({ kind: 'snag', s: 91, side: 9.5, scale: 1.0 });
for (const [s, side, cluster, spread] of knots) placements.push({ kind: 'sapling', s, side, cluster, spread, scale: [0.55, 1.3] });
// the fallen giant is a nursery: seedlings and a fern or two rooted in its moss.
// Its top is about 1.07 m up at the middle and falls 1.25 cm a metre towards the tip.
for (const [along, kind, scale] of [[-5.2, 'seedling', 1.1], [-3.4, 'seedling', 0.8], [-1.6, 'fern', 0.55], [0.4, 'seedling', 1.2], [2.3, 'seedling', 0.9], [4.1, 'fern', 0.5], [5.6, 'seedling', 1.0]]) {
  placements.push({ kind, ...NURSE, along, lift: 1.03 - along * 0.0125, scale });
}

export default {
  name: 'cathedral',
  from: 44, to: 104,
  placements,
  clear: [{ from: 42, to: 106, within: 17, kinds: ['giant', 'mature', 'pole', 'snag', 'log', 'stump'] }],
  // where the checkpoint frames are taken: [metres along the trail, yaw, pitch]
  views: [[47, 0, 4], [66, 38, 6], [79, -12, 34]],
};
