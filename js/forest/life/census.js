// Who is about on a visit. Nothing here draws or moves anything, and nothing here imports three: a tool can
// run it a thousand times and count.
//
// The owner, 2026-11-15: "it is very important that you pay close attention to how common these animals are.
// Some of these animals are very rare. on most days, you will only see a small selection of these animals,
// and some travel together. On a given day you might see a handful of warbler species traveling in a group
// and on another day none at all."
//
// So every visit draws its own valley. Each kind has a `tier`: how often a kind is somewhere in such a
// valley in the middle of May, as sources have it. A tier is a mean number of animals (or pairs, or parties)
// within sight of the walk, and the number on a visit is drawn round that mean; a visit is also a quiet day
// or a busy one, and now and then a day on which a wave of migrants is moving through.
//
// What is from sources (read by agents on 2026-11-16, each claim put to a second reader; none of it seen as
// an image; the whole of it is kept in .local-assets/forest/research/animals-2026-11-16.json):
//   B  Seattle Audubon's BirdWeb, the abundance table for the Pacific Northwest Coast ecoregion, May:
//      C common, F fairly common, U uncommon, R rare, - no code. Its text is quoted where it says more.
//   P  Olympic National Park's bird list as Wikipedia gives it ("based on the NPS list"): no tag means it
//      "occurs regularly", U uncommon, R rare ("usually seen only a few times each year").
//   N  the Park Service's own mammal list for the park: C common, CL common locally, R rare.
//   A  the Park Service's amphibian list (it gives no abundance), with the state's wildlife department.
// `tier` is the second reader's judgement: how often a person who walks 600 m through such a valley in
// mid-May would have the kind somewhere in the valley round them. It is not always a judgement from those
// sources. For eleven birds the second reader read no source and judged from memory: BirdWeb's page and the
// park's list could not be opened for five (Wilson's, Orange-crowned, Yellow-rumped and Black-throated Gray
// Warblers, Common Yellowthroat), and BirdWeb's page was not opened for six (Varied Thrush, Pacific Wren,
// Dark-eyed Junco, Song Sparrow, Steller's Jay, American Robin). For at least ten more the tier is marked confirmed with the
// park's list read and BirdWeb not opened again (Brown Creeper, Red-breasted Nuthatch, Chestnut-backed
// Chickadee, Golden-crowned Kinglet, Pileated and Hairy Woodpeckers, Red-breasted Sapsucker, Cooper's Hawk,
// American Goshawk, Northern Pygmy-Owl). The bats were given one tier together, so each bat's tier is the
// agent's reading.
//
// What is the agent's own: the number each tier stands for (TIER), every `mean` that is not its tier's,
// every party's size, how often a wave comes and how strong, and how much a quiet day takes away.

// the mean number within sight of the walk that a tier stands for. Until 2026-11-18 the lower tiers were what the
// sources say of such a valley in May (some 0.6, few 0.22, rare 0.07, very rare 0.02: a 'very rare' kind was there
// on one visit in fifty). The owner: "Uncommon and rare species just need to show up more. I think 1/50 occurence
// rates are too small. Bump them up significantly. Even if it's not scientifically accurate, I'd rather have more
// animals present in their respective niches than an empty world." So now, on an ordinary day: 'some' is there on
// about 63 visits in 100, 'few' on 47, 'rare' on 35, 'very rare' on 24 (the order of the tiers is still the sources').
export const TIER = { every: 5, most: 2, some: 1, few: 0.65, rare: 0.45, 'very rare': 0.28, absent: 0 };

// The roll itself is each kind's `census`, in the kind's own file, gathered in the roll's order by
// life/species/index.js (ROLL); what its fields are is said there.

// A wave of migrants comes on about one visit in eight; on such a day each kind that travels with it is
// several times as many. Those the wave brought go about as one party, as the owner asked (life/visit.js, life/wave.js:
// who of the day's number is the wave's is drawn there, so that who is about is drawn here as it always was).
export const WAVE = { chance: 0.13, most: 5 };

export function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// a number drawn round a mean, as counts of things that come by chance are (Poisson)
function drawn(mean, r) {
  if (mean <= 0) return 0;
  if (mean > 30) return Math.max(0, Math.round(mean + Math.sqrt(mean) * (r() + r() + r() - 1.5) * 2));
  const limit = Math.exp(-mean);
  let n = 0, p = r();
  while (p > limit) { n += 1; p *= r(); }
  return n;
}

// How far into the night an hour is, as the forest's light has it: 0 by day, 1 from 20:00 to 06:00.
const night = (hour) => { const h = ((hour % 24) + 24) % 24; return h >= 20 || h < 6 ? 1 : h >= 19 ? h - 19 : h < 7 ? 7 - h : 0; };

// The visit's valley.
//   seed   a whole number: the same seed is the same valley
//   hour   the hour of the day, 0 to 24
//   busy   the busiest valley there can be, for the tools: every kind about, at the most it comes to, on a wave day
//   roll   who can be about, in order (life/species/index.js: ROLL): the census draws its numbers in that order
// Returns { seed, quiet, wave, dark, about: [{ key, parties: [size, ...] }] }: `quiet` is 0.55 (a still, wet
// day) to 1.2, `wave` 0 or how strong the migrants' wave is (0.3 to 1), `dark` how far into the night it is.
export function census(seed, hour = 12, { busy = false, roll } = {}) {
  if (!roll) throw new Error('census: no roll was given (life/species/index.js: ROLL)');
  const r = mulberry(Math.imul(seed, 2654435761) + 97);          // (the product's low 32 bits, exact for a seed of any size: as a plain product it lost them for seeds over three million)
  const dark = night(hour);
  const quiet = busy ? 1.2 : 0.55 + 0.65 * Math.sqrt(r());
  const wave = busy ? 1 : r() < WAVE.chance ? 0.3 + 0.7 * r() : 0;
  const about = [];
  for (const row of roll) {
    // who is abroad at this hour: of a kind of the day a quarter are where a walker could find them at roost
    // by night, one of the night is not about by day, and one of the dusk is about a little by day
    const share = row.clock === 'day' ? 1 - 0.75 * dark : row.clock === 'night' ? dark : row.clock === 'dusk' ? Math.max(dark, 0.15 * (1 - dark)) : 1;
    let mean = row.mean * quiet * share;
    if (row.wave && dark < 0.5) mean *= 1 + (WAVE.most - 1) * wave;
    const n = busy ? Math.max(1, Math.ceil(row.mean * 2)) * (share > 0 ? 1 : 0) : drawn(mean, r);
    const parties = [];
    for (let i = 0; i < n; i += 1) parties.push(busy ? row.party[1] : row.party[0] + Math.floor(r() * (row.party[1] - row.party[0] + 1)));
    // A kind that is `sure`: no fewer and no more parties than it says, at an hour it is abroad. The day's draw is
    // made all the same, and a party it adds is sized from numbers of its own, so that no other kind's draw moves.
    if (row.sure && share >= 0.5 && !busy) {
      parties.length = Math.min(parties.length, row.sure[1]);
      const own = parties.length < row.sure[0] ? mulberry(Math.imul(seed, 40503) + Math.imul(about.length + 1, 9973) + 7) : null;
      while (parties.length < row.sure[0]) parties.push(row.party[0] + Math.floor(own() * (row.party[1] - row.party[0] + 1)));
    }
    if (!parties.length) continue;
    about.push({ key: row.key, parties });
  }
  return { seed, quiet, wave, dark, about };
}
