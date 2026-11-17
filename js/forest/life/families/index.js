import ground from './ground.js';
import creeper from './creeper.js';
import skulker from './skulker.js';
import corvid from './corvid.js';
import trunk from './trunk.js';
import bough from './bough.js';
import herd from './herd.js';
import sallier from './sallier.js';
import owl from './owl.js';
import raptor from './raptor.js';
import fowl from './fowl.js';
import shore from './shore.js';
import swimmer from './swimmer.js';
import scurrier from './scurrier.js';
import bear from './bear.js';
import mustelid from './mustelid.js';
import crawler from './crawler.js';
import foliage from './foliage.js';
import thicket from './thicket.js';
import scratcher from './scratcher.js';
import stream from './stream.js';
import plunger from './plunger.js';
import aerial from './aerial.js';
import hoverer from './hoverer.js';
import canopy from './canopy.js';
import bat from './bat.js';
import hopper from './hopper.js';
import { WAY, faultsOf } from '../bodies.js';

// Families. A kind lives by a family: its file's `way` names the family and gives the kind's own numbers beside
// what every way has (life/species/index.js says what that is), and a kind that needs nothing of the engine to find
// its home gives that too (`home`, `spot`: small functions of their own arguments that import nothing), so that a
// kind's file imports nothing. A family is a file of its own here, which an agent can write without touching
// another, and answers:
//   fields       what its numbers are, which every way of it is checked against as the ways are bound
//   act(way)     what one of the kind does: (bird, world) => a step for each frame, as life/visit.js asks of a way
//   home(way)    where one of the kind lives on a visit, if the kind's file does not say: (habitat, r, taken, hour)
//   spot(way)    where it is each time it comes, if not its home (and the kind's file does not say)
// The families so far: ground (the thrush), creeper (the creeper), skulker (the wren), corvid (the jay), trunk (the
// nuthatch and the woodpecker), bough (the chickadee and the kinglet), herd (the elk). What every animal's life is
// made of, whatever its family, is to be life/behave.js.
export const FAMILIES = {
  ground, creeper, skulker, corvid, trunk, bough, herd, sallier,
  // (placeholders until their families are built: 2026-11-16)
  owl, raptor, fowl, shore, swimmer, scurrier, bear, mustelid, crawler, foliage, thicket, scratcher, stream, plunger, aerial, hoverer, canopy, bat, hopper,
};

// Each kind's way bound to its family: what life/visit.js lives by. Every fault in every way, all at once, is
// thrown as the page's error, as the registry throws a body's.
export function bind(ways) {
  const faults = [], bound = {};
  for (const [key, way] of Object.entries(ways)) {
    const file = `life/species/${key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}.js`;
    const family = Object.hasOwn(FAMILIES, way.family) ? FAMILIES[way.family] : null;
    if (!family) { faults.push(`${file}: way.family should be one of ${Object.keys(FAMILIES).join(', ')} (it is ${JSON.stringify(way.family)})`); continue; }
    const own = faultsOf(way, { ...WAY, ...family.fields }, 'way');
    if (!way.home && !family.home) own.push('way.home is missing, and its family has none');
    faults.push(...own.map((fault) => `${file}: ${fault}`));
    if (own.length) continue;
    bound[key] = { ...way, act: family.act(way), home: way.home || family.home(way) };
    const spot = way.spot || (family.spot && family.spot(way));
    if (spot) bound[key].spot = spot;
  }
  if (faults.length) throw new Error(`${faults.length} ${faults.length === 1 ? 'fault' : 'faults'} in the animals' ways:\n${faults.join('\n')}`);
  return bound;
}
