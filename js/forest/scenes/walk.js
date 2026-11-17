// The rest of the walk: what stands where. Some of it is still a blockout in stand-ins: hemlocks for the
// colonnade. The old cedar (plants/cedar.js), the falls' rock, the footbridge,
// the maples (plants/maple.js), the willows at the back of the beach (plants/alder.js; the alders and the rest
// of the willows are laid by world/layout.js), the driftwood (plants/deadwood.js), the valley's conifers
// (plants/spire.js, which stand where the layout's `spruce` and `slopes` are), the trail shelter
// (plants/shelter.js), the old apple tree (plants/apple.js), the young trees at the clearing's edge and the
// cabin (plants/cabin.js) are themselves.
// The Cathedral (scenes/cathedral.js) is not touched.
//
// s is a place on the walk by name, with metres on from it ('cedar+6'), or metres along the walk; side is
// metres to the walker's right (+) or left (-). A placement can give x and z outright. Compose against
// forest.html?show=map&walk=1.
const placements = [];
const on = (place, metres) => `${place}${metres < 0 ? '-' : '+'}${Math.abs(metres)}`;        // 'maples-8'
const TREES = ['giant', 'mature', 'spruce', 'pole', 'snag', 'log', 'stump'];
// the shrubs and tall ferns of the understory (world/layout.js UNDER_KINDS): what stands knee high and more
const SHRUBS = ['salmon', 'elder', 'club', 'ladyfern', 'bracken'];
const clear = [];

// What grows on a nurse log: seedlings and a fern or two rooted in its moss. Its top is about 0.93 m up at
// the middle for a log of scale 1, and falls 1.25 cm a metre towards the tip.
const nursery = (log, rows) => {
  for (const [along, kind, scale] of rows) placements.push({ kind, s: log.s, side: log.side, turn: log.turn, along, lift: 0.9 * log.scale - along * 0.0125, scale });
};

// ---- the deep wood behind the cabin: the second nurse log, and the colonnade
const NURSE2 = { s: 'deepwood+27', side: -6.2, turn: Math.PI + 0.2, scale: 1.05 };
placements.push({ kind: 'log', ...NURSE2 });
nursery(NURSE2, [[-5.5, 'seedling', 1.0], [-3.6, 'seedling', 1.3], [-1.5, 'fern', 0.5], [0.6, 'seedling', 0.9], [2.4, 'seedling', 1.2], [4.4, 'fern', 0.55], [5.9, 'seedling', 0.8]]);
// the gap it tore when it came down: nothing else stands along it
clear.push({ from: 'deepwood+17', to: 'deepwood+37', within: 11, kinds: TREES });
// The colonnade: a row of hemlocks that all took root on one fallen trunk, long since rotted from under them.
for (let i = 0; i < 6; i += 1) placements.push({ kind: 'mature', s: on('colonnade', -9 + i * 3.6), side: -5.2 - (i % 2) * 0.3, scale: 0.72 + ((i * 5) % 4) * 0.07 });
clear.push({ from: 'colonnade-14', to: 'colonnade+14', within: 11, kinds: TREES });

// ---- the old cedar, in its wet ground (plants/cedar.js: it is built for this spot), with dead trunks standing
// in the wet beside it. The trail comes at it from the east and bends round it to the north, eight metres from
// its middle; the creek rises between its roots. It is given no yaw, as the fir that stood in for it was not:
// a placement draws three random numbers then, and one that drew two would move every plant scattered after it.
placements.push({ kind: 'cedar', x: -47, z: 38.5 });
placements.push({ kind: 'snag', x: -52, z: 43, scale: 1.2 });
placements.push({ kind: 'snag', x: -55, z: 33, scale: 0.9 });
placements.push({ kind: 'snag', x: -60.5, z: 44.5, scale: 0.75 });
clear.push({ x: -46, z: 37, within: 15, kinds: TREES });
clear.push({ x: -47, z: 38.5, within: 4.4, kinds: ['fern', 'sorrel', 'seedling', 'sapling', 'skunk'] });          // nothing grows out of its foot
// the spring is seen from the trail: between the tread and its water the ground is trodden, and nothing stands knee high
clear.push({ x: -43.2, z: 32.1, within: 2.0, kinds: ['fern', 'seedling', 'sapling', 'skunk'] });
clear.push({ x: -43.1, z: 30.2, within: 1.3, kinds: ['fern', 'seedling', 'sapling', 'skunk'] });
clear.push({ x: -47, z: 38.5, within: 4.6, kinds: SHRUBS });
clear.push({ x: -43.4, z: 31.4, within: 3.4, kinds: SHRUBS });
// (and no shrub as tall as a walker between the trail and the tree: two salmonberries stood before its foot and its hollow)
clear.push({ x: -47, z: 38.5, within: 9.5, kinds: ['salmon', 'elder'] });

// ---- the footbridge at the head of the falls (plants/footbridge.js): a foot log, its hewn top level with the
// tread. It is laid by the placement that laid the log that stood in for it, with the same fields given, so that
// it draws the two random numbers that log drew and nothing laid after it moves.
placements.push({ kind: 'footbridge', s: 'bridge', side: 0, turn: 0, tread: 0, close: true, solid: true });
// ---- the rock of the falls (plants/crag.js): built where it stands, in the world's own heights (its record's is 0)
placements.push({ kind: 'crag', x: -50.2, z: -5.6, yaw: 0, height: 0 });
clear.push({ from: 'bridge-7', to: 'bridge+7', within: 5, kinds: TREES });
// nothing tall on the ravine's own lip beside the falls, where the valley is first seen
clear.push({ x: -50, z: -8, within: 7, kinds: TREES });
// The falls are looked at from the west rim, down into the bowl, and from below, up the creek: no sapling
// stands in the bowl or on the slope between the rim and the pool, and none in the creek's way down the ravine.
// Nothing is rooted in the pool or under the rock that walls it, and no stone lies on the rock's face.
clear.push({ x: -50.6, z: -8.6, within: 5.2, kinds: ['sapling'] });
// (nor any shrub there, nor on the rim between the trail and the falling water, nor in the pool's way out)
clear.push({ x: -50.6, z: -8.6, within: 6.4, kinds: SHRUBS });
clear.push({ x: -52.7, z: -7.0, within: 3.2, kinds: SHRUBS });
clear.push({ x: -50.4, z: -3.6, within: 3.4, kinds: SHRUBS });
clear.push({ x: -53.4, z: -13.2, within: 2.6, kinds: ['sapling'] });
clear.push({ x: -49.9, z: -8.2, within: 2.9, kinds: ['fern', 'sorrel', 'seedling', 'cobble', 'rock'] });
clear.push({ x: -50.4, z: -5.0, within: 1.7, kinds: ['fern', 'sorrel', 'seedling', 'cobble', 'rock'] });
clear.push({ x: -50.6, z: -33.8, within: 0.6, kinds: ['sapling'] });
clear.push({ x: -50.6, z: -39.1, within: 0.6, kinds: ['sapling'] });
// (and on the west rim's edge nothing stands between the trail and the falling water)
clear.push({ x: -52.7, z: -7.0, within: 1.5, kinds: ['fern', 'sorrel', 'seedling'] });

// ---- the third nurse log, on the hill beside the ravine
const NURSE3 = { s: 'ravine-3', side: -8, turn: 0.35, scale: 0.95 };
placements.push({ kind: 'log', ...NURSE3 });
nursery(NURSE3, [[-4.8, 'seedling', 1.2], [-2.6, 'seedling', 0.9], [-0.6, 'seedling', 1.3], [1.4, 'fern', 0.5], [3.3, 'seedling', 1.0], [5.2, 'seedling', 0.8]]);

// ---- the river: driftwood thrown up on the cobbles by high water (plants/deadwood.js). A drift log is built
// with its root wad at its own -x, and lies with the wad upstream: a yaw about +y carries its far end, +x, to
// (cos, -sin). Two mossy logs stood in for it, each of which drew two random numbers: those are drawn still.
placements.push({ spent: 4 });
for (const [x, z, yaw, scale, phase, tint] of [
  // along the back of the beach, at a walker's right hand as he follows the water up
  [-50.0, -84.9, -1.5, 0.62, 0.7, 0.55],
  // on the fan at the creek's mouth
  [-56.2, -75.9, -2.45, 0.5, 2.9, 0.4],
  // where the beach ends, against the bank the current comes down on: one great trunk, and what has lodged on it
  [-52.7, -100.6, -1.44, 0.86, 4.4, 0.6], [-51.2, -101.6, -1.2, 0.5, 1.6, 0.48], [-54.1, -101.0, -1.7, 0.32, 5.5, 0.35],
  // at the head of the far bar, and along it
  [-70.6, -112.4, -1.2, 1.0, 3.6, 0.52], [-72.5, -110.6, -0.95, 0.5, 0.2, 0.66], [-70.4, -101.2, -1.75, 0.55, 2.4, 0.42],
  // on the bar below the bend, where the river has turned west
  [-97.5, -84.6, 2.95, 0.7, 1.0, 0.5],
]) placements.push({ kind: 'drift', x, z, yaw, scale, phase, tint, close: true });

// ---- willows along the back of the beach, where the bank's face rises from the cobbles: a walker has them at
// his right hand, and the trail lies between them and the water. The layout itself lays none here, where the
// cabin's window looks (world/layout.js). x, z, scale (a willow is 5 m tall at scale 1), yaw, phase, tint.
for (const [x, z, scale, yaw, phase, tint] of [
  [-47.5, -79.6, 0.6, 0.4, 1.1, 0.4], [-46.7, -81.9, 0.8, 2.3, 3.0, 0.62],
  [-47.3, -88.0, 0.72, 4.1, 5.2, 0.5], [-46.4, -89.9, 0.56, 1.2, 0.3, 0.35], [-45.9, -92.3, 0.8, 5.4, 2.2, 0.58],
]) placements.push({ kind: 'willow', x, z, scale, yaw, phase, tint });

// ---- the maples at the foot of the hill, where the walk turns for home (plants/maple.js): six bigleaf maples
// round the bend, four outside it and two inside, their limbs over the trail. Each is the one tree turned
// its own way: `limb` is the spot its great low limb goes out towards. Four hemlocks stood in for them, each
// of which drew three random numbers: those are drawn still (`spent`), and a maple draws none.
placements.push({ spent: 12 });
for (const [x, z, scale, limb, phase, tint] of [
  [-38.6, -109.0, 0.95, [-36.4, -99.0], 0.4, 0.42],        // outside the bend, the first a walker comes under: its limb is the hall's door
  [-34.4, -95.4, 1.12, [-27.0, -101.6], 2.1, 0.55],        // inside it, the greatest of them
  [-26.0, -108.6, 1.05, [-28.8, -100.4], 4.0, 0.36],
  [-27.2, -88.4, 1.0, [-20.4, -92.8], 5.3, 0.62],
  [-14.6, -97.6, 1.02, [-21.4, -94.6], 1.2, 0.5],
  [-11.4, -85.8, 0.88, [-18.6, -83.6], 3.1, 0.44],
]) placements.push({ kind: 'maple', x, z, scale, yaw: Math.atan2(-(limb[1] - z), limb[0] - x), phase, tint });
// no conifer stands in the hall, and no dead wood lies in it; under the maples there are ferns, and no hemlock sapling
clear.push({ from: 'maples-13', to: 'maples+27', within: 13, kinds: TREES });
clear.push({ from: 'maples-11', to: 'maples+26', within: 10, kinds: ['sapling'] });
// (and no alder at the tread's edge where a walker comes in under the first maple's limb: the hall's door is the maple's)
clear.push({ from: 'maples-16', to: 'maples+27', within: 6, kinds: ['alder'] });

// ---- the trail shelter, under the trees at the clearing's edge (plants/shelter.js), 8.5 m to the walker's
// left with its open front to the trail, and the stones it stands on: no tree near it, nothing growing through
// its floor, and no young hemlock up through its eaves
placements.push({ kind: 'shelter', s: 'shelter', side: -8.5, turn: -Math.PI / 2 });
placements.push({ kind: 'footing', s: 'shelter', side: -8.5, turn: -Math.PI / 2 });
clear.push({ from: 'shelter-9', to: 'shelter+9', within: 14, kinds: TREES });
clear.push({ s: 'shelter', side: -8.5, within: 3.3, kinds: ['grass', 'fern', 'sorrel', 'seedling'] });
clear.push({ s: 'shelter', side: -8.5, within: 5.2, kinds: ['sapling'] });
// (no shrub or bracken in it or before its open front, and none under the old apple tree)
clear.push({ s: 'shelter', side: -8.5, within: 4.4, kinds: SHRUBS });
clear.push({ s: 'shelter', side: -4.4, within: 3.4, kinds: SHRUBS });
// (nor a tall one between a walker coming up the clearing and the shelter: a salmonberry stood before it)
clear.push({ s: 'shelter-10', side: -5, within: 5.5, kinds: ['salmon', 'elder'] });
clear.push({ s: 'shelter-4', side: -6, within: 5, kinds: ['salmon', 'elder'] });
clear.push({ x: -25.95, z: -65.5, within: 4.6, kinds: SHRUBS });

// ---- the old apple tree (plants/apple.js), alone in the grass on the walker's right where the walk comes out
// of the maples into the clearing, thirteen metres before the shelter: out of the strip the cabin's window
// looks along, and in the window's view at its right-hand side. It leans down the hill and a little towards the
// trail, and its low limb comes over to the tread's edge at a walker's head. No young hemlock grows up through it.
placements.push({ kind: 'apple', s: 'shelter-13', side: 6.5, turn: 2.4, phase: 2.6, tint: 0.5 });
clear.push({ s: 'shelter-13', side: 6.5, within: 7.5, kinds: ['sapling'] });

// ---- the clearing's east edge, where the forest is taking the field back: young Sitka spruce and red alder
// (plants/spire.js, plants/alder.js; a national park's report of its old homestead fields has both coming in at
// their edges), from head height to a house's. All on the walker's left, north and south of the shelter, none
// before its open front, and none where the cabin's window looks. Each is one of a scattered kind set down
// since the valley was laid out: it gives its own yaw, phase and tint, and draws nothing. s, side, scale
// (a spruce is 46 m tall at scale 1, an alder 25 m), yaw, phase, tint.
for (const [kind, s, side, scale, yaw, phase, tint] of [
  ['spruce', 'shelter-8.5', -6.5, 0.16, 0.7, 1.9, 0.45],
  ['alder',  'shelter+7',   -5.6, 0.42, 2.2, 0.6, 0.55],
  ['spruce', 'shelter+9.5', -7.6, 0.2,  4.1, 3.3, 0.6],
  ['alder',  'shelter+11.5', -5.2, 0.33, 5.0, 4.4, 0.4],
  ['spruce', 'shelter+12.5', -7.2, 0.12, 2.9, 5.6, 0.5],
]) placements.push({ kind, s, side, scale, yaw, phase, tint, still: true, spacing: 1.6 });

// ---- two small fallen hardwoods, for what grows on such wood (plants/flowers.js; index.js sets the fungi on
// them, by `grows`: the column of the fungi's sheet). An alder that came down off the bank where the walk
// leaves the beach, with oyster mushrooms along its flank; and a maple's limb inside the hall's bend, with
// turkey tails. Each is the terrace's own log made small (5 m long, a foot and a half through, its bark a
// conifer's under its moss), set down since the valley was laid out: it gives its own turn, phase and tint and
// draws nothing.
const HARDWOOD = [
  { s: 'beach+12', side: -3.6, turn: 0.22, scale: 0.32, phase: 1.3, tint: 0.5, grows: 2 },
  { s: 'maples+11', side: 3.3, turn: -0.3, scale: 0.3, phase: 4.1, tint: 0.45, grows: 3 },
];
for (const { s, side, turn, scale, phase, tint } of HARDWOOD) placements.push({ kind: 'log', s, side, turn, scale, phase, tint, still: true });
// (nothing knee high between the walk and either of them, or on them: what grows on them is to be seen from the walk)
for (const { s, side } of HARDWOOD) for (const along of [-2.2, 0, 2.2]) {
  const [name, more] = s.split(/([+-].*)/);
  clear.push({ s: `${name}${Number(more) + along >= 0 ? '+' : ''}${Number(more) + along}`, side: side * 0.62, within: 1.9, kinds: ['fern', 'sapling', 'seedling', 'pole', 'vine', ...SHRUBS] });
  clear.push({ s: `${name}${Number(more) + along >= 0 ? '+' : ''}${Number(more) + along}`, side, within: 2.3, kinds: ['sapling', 'pole', 'vine', 'salmon', 'elder'] });
}

// ---- the cabin: two great trunks on the brink, with the valley between them from the window
placements.push({ kind: 'giant', x: -33.5, z: -5.6, scale: 1.0 });
placements.push({ kind: 'giant', x: -16.6, z: -5.0, scale: 0.98 });
// and the cabin itself (plants/cabin.js), unturned: its window's wall faces north, and its window is on the
// valley's axis only at this spot (plants/cabin.js works the spot out from the room's own numbers and the
// window's vantage, as SITE, and the page stops if the two do not agree). Its timbers, its roof and its stone
// are a kind each, for the three materials.
for (const kind of ['cabin', 'cabinroof', 'cabinstone']) placements.push({ kind, x: -19.26702, z: 9.7065, yaw: 0 });

// The forest floor's flowers (world/layout.js: carpet, trillium) go where its sorrel goes: ground cleared of the
// one is cleared of the others. (The zones above were written before there were flowers, and named the kinds
// there were: a bleeding heart then stood on the rim before the falling water, in the one view that has all of
// the fall, four carpets were rooted in the pool or under the rock that walls it, and five plants grew out of
// the old cedar's foot.)
for (const zone of clear) if (zone.kinds.includes('sorrel')) zone.kinds = [...zone.kinds, 'carpet', 'trillium'];

export default {
  name: 'walk', walk: true,
  placements, clear,
  fungi: HARDWOOD.map(({ s, side, grows }) => ({ s, side, grows })),
  // Where the blockout's frames are taken: a place on the walk with a yaw and a pitch in degrees (a positive
  // yaw looks to the walker's left), or `from: 'window'`, the cabin's window (world/structures.js), with a
  // bearing from straight out of it.
  views: [
    { name: '01 cabin door', s: 'cabin', yaw: 0, pitch: 0 },
    { name: '02 deep wood', s: 'deepwood+8', yaw: 0, pitch: 2 },
    { name: '03 nurse log two', s: 'deepwood+18', yaw: 35, pitch: -4 },
    { name: '04 colonnade', s: 'colonnade-16', yaw: 14, pitch: 6 },
    { name: '04b trilliums in the colonnade', s: 'colonnade+17', yaw: 20, pitch: -24 },
    { name: '05 the old cedar ahead', s: 'cedar-8', yaw: 6, pitch: 9 },
    { name: '06 round the old cedar', s: 'cedar+4', yaw: 44, pitch: 7 },
    { name: '06b up the old cedar', s: 'cedar+10', yaw: 84, pitch: 40 },
    { name: '06c the spring', s: 'cedar+8', yaw: 14, pitch: -13 },
    { name: '07 along the creek', s: 'gully+2', yaw: 22, pitch: -6 },
    { name: '08 footbridge', s: 'bridge-7', yaw: 0, pitch: -8 },
    { name: '08b bleeding heart by the footbridge', s: 'bridge-8', yaw: 26, pitch: -22 },
    { name: '09 head of the falls', s: 'bridge+1', yaw: -42, pitch: -22 },
    { name: '09b the falls from the rim', s: 'bridge+7.5', yaw: -128, pitch: -31 },
    { name: '10 down the hill', s: 'brink+8', yaw: 0, pitch: -3 },
    { name: '11 the ravine', s: 'ravine', yaw: -80, pitch: -14 },
    { name: '12 stepping stones', s: 'stones-7', yaw: 0, pitch: -8 },
    { name: '13 up the ravine to the falls', s: 'stones+5', yaw: -166, pitch: 0 },
    { name: '14 into the clearing', s: 'stones+5', yaw: 0, pitch: 0 },
    { name: '15 the long view', s: 'river', yaw: 13, pitch: 3 },
    { name: '16 the river', s: 'river+7', yaw: 22, pitch: -6 },
    { name: '16b up into the alders', s: 'stones+14', yaw: 75, pitch: 28 },
    { name: '17 across the river', s: 'beach', yaw: 80, pitch: 2 },
    { name: '17b the far wall from the beach', s: 'beach', yaw: 80, pitch: 16 },
    { name: '18 down the river', s: 'river+3', yaw: 105, pitch: -2 },
    { name: '19 on the cobbles', s: 'beach-2', yaw: 25, pitch: -24 },
    { name: '19a driftwood where the beach ends', s: 'beach+1', yaw: 40, pitch: -8 },
    { name: '19b the maples from the beach', s: 'beach+2', yaw: 0, pitch: 10 },
    { name: '19c oyster mushrooms on a fallen alder', s: 'beach+10', yaw: 55, pitch: -15 },
    { name: '20 through the maples', s: 'maples-8', yaw: 0, pitch: 5 },
    { name: '20b under the maples, looking back', s: 'maples+22', yaw: 180, pitch: 6 },
    { name: '20c turkey tails on a fallen limb', s: 'maples+9', yaw: -64, pitch: -20 },
    { name: '20d red-belted conks on a snag', s: 'meadow-10', yaw: 31, pitch: 16 },
    { name: '21 up the clearing', s: 'meadow-6', yaw: 0, pitch: 3 },
    { name: '21b the old apple tree', s: 'shelter-18', yaw: -55, pitch: 8 },
    { name: '22 the grass', s: 'meadow+6', yaw: -55, pitch: -14 },
    { name: '23 trail shelter', s: 'shelter-11', yaw: 30, pitch: 0 },
    { name: '23b the edge of the clearing', s: 'shelter+1', yaw: 22, pitch: 6 },
    { name: '23c down the clearing', s: 'shelter+17', yaw: 165, pitch: 2 },
    { name: '23d lichen in the spruces', s: 'shelter+18', yaw: 121, pitch: 39 },
    { name: '24 the lit window', s: 'top-5', yaw: 0, pitch: 5 },
    { name: '24b the cabin', s: 'top+8', yaw: -20, pitch: 2 },
    { name: '24c the cabin, looking back', s: 'cabin+10', yaw: 165, pitch: 2 },
    { name: '25 from the window', from: 'window', bearing: -20, pitch: -6 },
    { name: '26 from the window, the mountain', from: 'window', bearing: -20, pitch: 6 },
  ],
};
