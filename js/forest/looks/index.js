// The painted treatment. A look is data only: a palette, how the brush behaves,
// and how light, mist and the final grade are set. There is one, gouache: the
// owner chose it at checkpoint 1 over a watercolour (2026-11-13: "Keep gouache,
// it is beautiful"). The watercolour and its wash and paper passes are in git
// history, in the commit of milestone 1.
//
// Colours are [hue 0..360, saturation 0..100, lightness 0..100].

const gouache = {
  name: 'gouache',
  // Opaque paint: crisp ragged edges, strong value steps, saturated darks.
  paint: { ragged: 0.2, vary: 1.0, streak: 1.0 },
  palette: {
    firBark:       { furrow: [16, 32, 15], face: [26, 18, 27], ridge: [30, 14, 35] },
    hemlockBark:   { furrow: [14, 30, 16], face: [20, 20, 26], ridge: [24, 15, 33] },
    firNeedle:     { dark: [150, 32, 13], mid: [128, 34, 22], light: [100, 40, 33], tip: [88, 48, 42] },
    hemlockNeedle: { dark: [140, 30, 15], mid: [118, 36, 26], light: [96, 42, 38], tip: [78, 55, 50] },
    // western redcedar: bark in long fibrous strips, red-brown where it is fresh and grey where it has weathered;
    // sprays of scales, a yellower green than any needle; and the wood of its dead tops, bleached silver
    cedarBark:     { furrow: [13, 36, 14], face: [19, 24, 27], ridge: [27, 13, 40] },
    cedarNeedle:   { dark: [128, 34, 15], mid: [106, 40, 26], light: [90, 44, 36], tip: [78, 48, 44] },
    silverWood:    { dark: [32, 9, 33], light: [42, 9, 66] },
    driftWood:     { dark: [34, 9, 40], light: [42, 11, 70] },                          // a trunk the river carried: weathered pale, a warmer grey than a dead top's
    hewnWood:      { dark: [30, 11, 27], light: [39, 12, 56] },                         // a foot log's top and its handrail: weathered, and a shade browner than a dead top's silver
    shakeWood:     { dark: [26, 13, 21], light: [35, 12, 47] },                         // split cedar ninety years in the rain (plants/shelter.js): darker than either, and browner
    cabinWood:     { dark: [22, 30, 17], light: [29, 27, 42] },                         // the cabin's hewn timbers (plants/cabin.js): kept, and under a roof: browner and warmer than wood left to the rain
    // skunk cabbage, in leaf in May: a lighter, yellower green than anything else on the forest floor, its midrib pale
    skunk: { dark: [104, 46, 27], mid: [90, 54, 40], light: [78, 58, 52], rib: [70, 42, 66], stalk: [76, 36, 55] },
    // bigleaf maple in May: leaves new and thin, a yellow-green with the light in it; vine maple under it, lighter
    // still; the moss that pads a maple's limbs, olive going to gold at its hanging ends; licorice fern on them
    maple:       { dark: [104, 44, 21], mid: [90, 54, 33], light: [79, 60, 43], pale: [71, 64, 52], vein: [72, 46, 64], stalk: [50, 48, 44], twig: [28, 22, 22], flower: [62, 62, 62] },
    vineMaple:   { dark: [100, 46, 27], mid: [84, 58, 41], light: [72, 64, 53], pale: [66, 66, 62], stalk: [18, 48, 42], twig: [86, 34, 32] },
    hangingMoss: { dark: [98, 42, 12], mid: [88, 46, 20], light: [78, 50, 30], gold: [66, 54, 40] },
    licorice:    { dark: [126, 40, 20], mid: [108, 46, 31], light: [94, 52, 43], stem: [70, 34, 34] },
    // the riverside. Red alder: a duller, bluer green than the maple's, its leaves new in May; its bark hardly ever
    // its own colour under crusts of lichen (kept nearly without hue: a cool grey is blue in a tree's shade). Willow
    // on the bars: a greyer green again, the backs of its leaves silvery, its young stems olive.
    alder:     { dark: [122, 36, 16], mid: [110, 40, 25], light: [100, 44, 34], pale: [92, 46, 42], vein: [84, 32, 48], twig: [24, 18, 20], cone: [24, 36, 15], trunk: [44, 7, 50] },
    alderBark: { bark: [30, 12, 38], white: [52, 6, 70], ash: [48, 5, 55], green: [96, 14, 47], scar: [20, 18, 15] },
    willow:    { dark: [108, 30, 19], mid: [98, 32, 27], light: [90, 34, 35], pale: [84, 34, 42], silver: [98, 14, 52], twig: [46, 42, 34] },
    // the old apple tree of the clearing (plants/apple.js), in blossom: leaves a plain mid green, paler beneath;
    // petals white with the pink of the bud still on some; twigs dark, and the year's shoots reddish
    apple: { dark: [114, 40, 20], mid: [104, 44, 29], light: [94, 48, 38], pale: [86, 44, 47], vein: [80, 36, 54], twig: [14, 20, 18], shoot: [22, 36, 30],
      petal: [344, 55, 95], blush: [342, 62, 87], bud: [345, 60, 62], heart: [54, 72, 58] },
    // the valley's own conifers (plants/spire.js). Sitka spruce: stiff needles, blue-green to yellow-green as the
    // sources have them and bloomed white beneath; painted a blue-green well short of saturated (a cool colour is
    // bluer still in a tree's shade, whose light is blue already). Its bark is thin and in scales a hand's breadth
    // or less across: greyish purple, silver where it has weathered, red-brown where a scale has lately gone.
    // (The slopes' hemlock is painted in the hemlock's own needles and bark, above.)
    spruceNeedle: { dark: [160, 24, 12], mid: [150, 23, 20], light: [136, 22, 30], tip: [120, 24, 39] },
    spruceBark:   { furrow: [340, 12, 13], face: [330, 6, 31], ridge: [24, 7, 47], rust: [14, 32, 28] },
    // The shrubs of the water's edge, the wet ground and the openings (plants/shrubs.js), in the middle of May.
    // Salmonberry: a plain mid green, its canes golden brown, its flowers pink going to purple and its first berries
    // orange. Red elderberry: a duller green, its flower heads cream. Devil's club: great leaves, new and light,
    // on pale stems thick with yellow spines. Red huckleberry: the lightest and yellowest green, twigs and all.
    // Bracken, new this month, and lady fern, which comes up new every spring: light yellow-greens.
    salmon:   { dark: [114, 42, 22], mid: [103, 48, 32], light: [93, 52, 41], pale: [85, 52, 48], vein: [84, 36, 54], cane: [36, 46, 33], flower: [322, 60, 54], berry: [26, 84, 56] },
    elder:    { dark: [114, 36, 20], mid: [104, 40, 29], light: [94, 44, 38], pale: [86, 42, 46], vein: [80, 34, 54], stem: [34, 16, 36], flower: [56, 44, 86], bud: [74, 40, 68] },
    club:     { dark: [112, 44, 23], mid: [100, 50, 34], light: [90, 54, 45], vein: [78, 40, 62], stalk: [70, 34, 48], stem: [36, 22, 44], spine: [46, 44, 62] },
    huckle:   { dark: [110, 44, 25], mid: [99, 50, 35], light: [90, 53, 43], pale: [83, 52, 49], twig: [96, 48, 32] },
    bracken:  { dark: [104, 40, 25], mid: [94, 46, 36], light: [84, 50, 46], pale: [76, 50, 54], stalk: [68, 36, 42], fiddle: [40, 42, 44] },
    ladyFern: { dark: [106, 40, 27], mid: [93, 46, 40], light: [81, 50, 52], stem: [72, 38, 46] },
    // The small things (paint/flowers.js), in the middle of May. False lily-of-the-valley: glossy, a deeper green
    // than sorrel, its spikes white. Trillium: white when new, pink going to rose as it ages. Bleeding heart: its
    // leaves bluish, its hearts pink. Candy flower: white to pink, veined. Stream violet: yellow. Foamflower: white.
    // English daisy: white rays, some flushed pink, round a yellow middle.
    mayLily:  { dark: [128, 44, 20], mid: [116, 48, 30], light: [104, 52, 40], vein: [96, 40, 54], stalk: [92, 36, 40], flower: [70, 18, 94] },
    trillium: { dark: [122, 40, 21], mid: [111, 44, 30], light: [100, 46, 39], vein: [94, 34, 50], stalk: [80, 30, 40], petal: [64, 14, 95], aged: [334, 44, 72], deep: [328, 50, 52], sepal: [100, 40, 36], heart: [52, 82, 58] },
    bleeding: { dark: [150, 26, 33], mid: [142, 26, 43], light: [132, 26, 54], stalk: [18, 34, 48], heart: [336, 66, 63], tip: [338, 44, 88] },
    candy:    { dark: [118, 42, 24], mid: [106, 48, 35], light: [94, 52, 45], petal: [330, 36, 93], vein: [332, 60, 68], stalk: [72, 30, 50] },
    violet:   { dark: [124, 44, 22], mid: [112, 48, 32], light: [100, 52, 42], petal: [52, 92, 56], line: [300, 40, 26] },
    foam:     { dark: [116, 40, 24], mid: [106, 44, 33], light: [96, 48, 42], flower: [62, 12, 95], stalk: [40, 26, 40] },
    daisy:    { dark: [112, 42, 24], mid: [102, 46, 33], light: [92, 50, 42], ray: [50, 36, 94], blush: [338, 52, 82], disc: [46, 94, 54], stalk: [86, 36, 42] },
    // What grows on dead wood. Red-belted conk: grey-black, a red-orange belt, a pale rim, cream underneath.
    // Artist's conk: brown, white underneath. Oyster mushroom: cream. Turkey tail: banded browns, a grey-blue, tan.
    conk:     { top: [24, 10, 15], belt: [14, 76, 43], band: [28, 58, 50], rim: [44, 48, 86], under: [48, 34, 84] },
    artist:   { top: [28, 22, 30], band: [30, 18, 43], rim: [44, 18, 86], under: [46, 12, 90] },
    oyster:   { cap: [34, 40, 70], shade: [28, 30, 50], gill: [40, 36, 78] },
    turkey:   { bands: [[22, 40, 20], [28, 46, 36], [204, 12, 42], [34, 36, 58], [30, 22, 76]], rim: [44, 28, 88], under: [44, 20, 86] },
    // Methuselah's beard: a pale yellow-green, greyer where it is old
    beard:    { dark: [84, 24, 36], mid: [78, 28, 47], light: [72, 32, 58] },
    twig: [22, 30, 20],
    fern: { dark: [132, 42, 19], mid: [112, 48, 31], light: [96, 54, 45], stem: [60, 35, 30] },
    fernOld: [32, 45, 30],
    sorrel: { dark: [125, 38, 24], light: [105, 45, 40] },
    moss: { dark: [98, 38, 16], light: [84, 42, 29] },
    splitWood: { dark: [18, 26, 11], light: [27, 24, 31] },
    ground: { path: [27, 30, 27], humus: [24, 32, 11], mossDark: [100, 40, 16], mossLight: [85, 45, 28], needle: [24, 55, 28], needlePale: [35, 40, 42], twig: [22, 25, 18] },
    // the valley: the bar's cobbles, the old clearing's grass, the river (milky with rock flour) and the creek (clear over a dark bed)
    gravel: { sand: [36, 12, 42], cool: [212, 4, 52], warm: [32, 12, 57], pale: [45, 10, 71], dark: [205, 6, 25], rust: [22, 30, 40] },
    meadow: { base: [74, 30, 25], blade: [86, 44, 37], light: [72, 48, 49], straw: [46, 42, 59], dark: [96, 34, 17] },
    // a river off a glacier: milky, a green-blue, the paler where it is thin over its stones
    river: { deep: [186, 38, 25], light: [174, 34, 47], foam: [185, 14, 90] },
    // what a mirrored tree is painted with: darker and greyer than the tree
    mirrored: { conifer: [160, 28, 13], leaf: [102, 34, 24] },
    creek: { deep: [165, 32, 6], light: [150, 26, 13], foam: [190, 12, 92],
      open: { deep: [188, 26, 19], light: [182, 24, 32] } },          // where no crown stands over it: the sky's on it, and the sun on its stones
    // the rock of the falls: dark where it is wet or in shade, a warm grey where a bed's face has weathered, pale lichen, rust where iron has run
    rock: { dark: [212, 12, 12], mid: [208, 8, 21], warm: [34, 12, 31], pale: [44, 10, 42], lichen: [88, 16, 50], rust: [22, 34, 27] },
    // what stands too far off to build: forested spurs, rock, snow, and the wood and stone of the stand-ins
    far: { forest: [172, 24, 17], forestLight: [142, 22, 27], rock: [250, 9, 29], rockLight: [28, 12, 48], snow: [205, 30, 95], snowShade: [216, 36, 71] },
    built: { log: [24, 26, 21], shake: [28, 14, 30], mossRoof: [92, 36, 22], stone: [40, 6, 34], lamp: [38, 92, 62] },
  },
  shade: { band: [-0.02, 0.2], bandNoise: 0.35, shadowTint: [0.7, 0.82, 1.0], warmth: 1.0, glow: 0.7, mossy: 0.55, nightFill: 1.8, farSun: 0.42, peakSun: 1.25 },
  mist: { density: 0.011, base: 2.0, falloff: 0.035, sunInMist: 0.7, shafts: 1.0 },
  // The night the owner asked for (2026-11-14: "A small lantern. This also means the night environment and
  // moonlight need to be darker so that the lantern makes sense"). `moon`, `fill` and `air` are how much is left
  // of the night's own light as it was approved at checkpoint 1: the moon; the fill from the sky and the ground,
  // which is all the light there is under closed crowns; the mist's colour and the sky's. (With all three at a
  // half, the tread in the Cathedral's shade twenty metres ahead read 4 of 255, where it read 14: the black
  // strip of milestone 1 again. The fill is let down less than the moon.) The lantern's and the window's
  // light: a colour (red, green, blue), how strong, and how far it carries in metres.
  // `open`: how much is left, by night, of the extra share of the sky's fill that open ground takes.
  night: { moon: 0.45, fill: 0.72, air: 0.55, open: 0.45, lantern: { colour: [1.0, 0.6, 0.27], strength: 2.2, reach: 18 }, window: { colour: [1.0, 0.66, 0.34], strength: 2.4, reach: 16 } },
  post: { saturation: 1.1, contrast: 1.06, vignette: 0.3, bloom: 0.12 },
};

const LOOKS = { gouache };
// No name asks for the default. A name that is not a look is a mistake, and the page says so: painted
// quietly in the default instead, a misspelt ?look= passed for the look it named.
export function getLook(name) {
  if (name === undefined || name === null || name === '') return gouache;
  if (!Object.hasOwn(LOOKS, name)) throw new Error(`there is no look called "${name}": there is ${Object.keys(LOOKS).join(' and ')}`);
  return LOOKS[name];
}
