import { TIER } from '../census.js';
import { validate } from '../bodies.js';
import brownCreeper from './brownCreeper.js';
import redBreastedNuthatch from './redBreastedNuthatch.js';
import chestnutBackedChickadee from './chestnutBackedChickadee.js';
import goldenCrownedKinglet from './goldenCrownedKinglet.js';
import pileatedWoodpecker from './pileatedWoodpecker.js';
import americanThreeToedWoodpecker from './americanThreeToedWoodpecker.js';
import hairyWoodpecker from './hairyWoodpecker.js';
import redBreastedSapsucker from './redBreastedSapsucker.js';
import variedThrush from './variedThrush.js';
import pacificWren from './pacificWren.js';
import darkEyedJunco from './darkEyedJunco.js';
import foxSparrow from './foxSparrow.js';
import songSparrow from './songSparrow.js';
import stellersJay from './stellersJay.js';
import sootyGrouse from './sootyGrouse.js';
import ruffedGrouse from './ruffedGrouse.js';
import americanRobin from './americanRobin.js';
import swainsonsThrush from './swainsonsThrush.js';
import wilsonsWarbler from './wilsonsWarbler.js';
import townsendsWarbler from './townsendsWarbler.js';
import orangeCrownedWarbler from './orangeCrownedWarbler.js';
import yellowRumpedWarbler from './yellowRumpedWarbler.js';
import blackThroatedGrayWarbler from './blackThroatedGrayWarbler.js';
import macgillivraysWarbler from './macgillivraysWarbler.js';
import commonYellowthroat from './commonYellowthroat.js';
import hermitWarbler from './hermitWarbler.js';
import pacificSlopeFlycatcher from './pacificSlopeFlycatcher.js';
import hammondsFlycatcher from './hammondsFlycatcher.js';
import oliveSidedFlycatcher from './oliveSidedFlycatcher.js';
import willowFlycatcher from './willowFlycatcher.js';
import violetGreenSwallow from './violetGreenSwallow.js';
import warblingVireo from './warblingVireo.js';
import rufousHummingbird from './rufousHummingbird.js';
import bandTailedPigeon from './bandTailedPigeon.js';
import vauxsSwift from './vauxsSwift.js';
import americanDipper from './americanDipper.js';
import spottedSandpiper from './spottedSandpiper.js';
import commonMerganser from './commonMerganser.js';
import harlequinDuck from './harlequinDuck.js';
import beltedKingfisher from './beltedKingfisher.js';
import baldEagle from './baldEagle.js';
import coopersHawk from './coopersHawk.js';
import sharpShinnedHawk from './sharpShinnedHawk.js';
import americanGoshawk from './americanGoshawk.js';
import barredOwl from './barredOwl.js';
import northernSawWhetOwl from './northernSawWhetOwl.js';
import westernScreechOwl from './westernScreechOwl.js';
import northernSpottedOwl from './northernSpottedOwl.js';
import northernPygmyOwl from './northernPygmyOwl.js';
import rooseveltElk from './rooseveltElk.js';
import blackBear from './blackBear.js';
import douglasSquirrel from './douglasSquirrel.js';
import stripedSkunk from './stripedSkunk.js';
import olympicChipmunk from './olympicChipmunk.js';
import townsendsChipmunk from './townsendsChipmunk.js';
import pacificFisher from './pacificFisher.js';
import riverOtter from './riverOtter.js';
import yumaMyotis from './yumaMyotis.js';
import pacificChorusFrog from './pacificChorusFrog.js';
import roughSkinnedNewt from './roughSkinnedNewt.js';
import northernRedLeggedFrog from './northernRedLeggedFrog.js';
import westernRedBackedSalamander from './westernRedBackedSalamander.js';
import ensatina from './ensatina.js';
import westernToad from './westernToad.js';
import olympicTorrentSalamander from './olympicTorrentSalamander.js';
import copesGiantSalamander from './copesGiantSalamander.js';
import littleBrownMyotis from './littleBrownMyotis.js';
import silverHairedBat from './silverHairedBat.js';
import bigBrownBat from './bigBrownBat.js';

// The animals, a kind to a file. A kind's file is all there is of it: who is about on a visit (`census`), and,
// once it is built, its body (`published`, `card`, `shape`, `poses`, and `plumage` for a bird or `coat` for a
// beast), how it lives on a visit (`way`) and what it says (`voices`). Adding an animal is filling in its file.
//   census   who is about (life/census.js): `tier`, how often the kind is in such a valley in the middle of May
//            (what each tier stands for is TIER in life/census.js), and `source`, the codes it was set from;
//            then what differs from one animal alone by day:
//              mean    the mean number of animals, pairs or parties, where it is not the tier's own
//              party   [fewest, most] animals that go about together
//              clock   'day' (the default) | 'night' | 'dusk' (dusk, dawn and the night) | 'any'
//              wave    it comes with the migrants' wave: on a wave day there are more of it, and those the wave
//                      brought go about as one party (life/wave.js)
//              extra   not on the owner's list: read because it is part of such a valley, built only if asked for
//   way      how it lives on a visit (life/visit.js):
//              family    the family whose life it lives (life/families/: ground, creeper, skulker, corvid, trunk,
//                        bough, herd), and beside the rest of these the family's own numbers for this kind, which
//                        are checked against the family's `fields` as the ways are bound to their families
//              there     the chance that it is there when the visit begins (it is to come otherwise)
//              gap       [least, most] seconds that it is away when it goes off for a while
//              home      where one of the kind lives on a visit, found in the habitat from the visit's own random
//                        numbers: null if nowhere along the walk suits it (its family's, if the file gives none)
//              spot      where it is each time it comes: somewhere about its home
//              together  a pair, a party or a herd, which goes about together
//              herd      (a herd) there or not as one, its members a few seconds apart
//              passing   it only passes through: gone for good, it is not about again elsewhere in the valley
//            A way is data, and small functions of their own arguments that import nothing (`home`, `spot`, a
//            trunk bird's `suits`, `bear` and `moving`), so that a kind's file imports nothing: what needs the
//            engine is its family's.
//   voices   what it says (world.say in life/agents.js), by the word it says it with, each played by sound/index.js
//            as a recording (`file`; `level`, how loud it is beside the others; `near`, within this many metres it
//            is at full strength, and beyond it falls off as a voice does in the open, by half for twice the
//            distance, to nothing at the reach the animal's own behaviour gives the call; `credit`, whose the
//            recording is), or made in the page (`synth`), or `silent`
//
// Every kind on the roll has a file, built or not, and is listed here in the roll's order. A visit's census
// draws its random numbers kind by kind in that order, so a kind put in among the others changes what every
// kind after it draws, and so every visit's valley: a new kind goes at the end. Each file is checked as it is
// loaded against what its plan's body must hold (life/bodies.js), and a fault stops the page with its name.
const FILES = {
  brownCreeper, redBreastedNuthatch, chestnutBackedChickadee, goldenCrownedKinglet, pileatedWoodpecker,
  americanThreeToedWoodpecker, hairyWoodpecker, redBreastedSapsucker, variedThrush, pacificWren, darkEyedJunco,
  foxSparrow, songSparrow, stellersJay, sootyGrouse, ruffedGrouse, americanRobin, swainsonsThrush,
  wilsonsWarbler, townsendsWarbler, orangeCrownedWarbler, yellowRumpedWarbler, blackThroatedGrayWarbler,
  macgillivraysWarbler, commonYellowthroat, hermitWarbler, pacificSlopeFlycatcher, hammondsFlycatcher,
  oliveSidedFlycatcher, willowFlycatcher, violetGreenSwallow, warblingVireo, rufousHummingbird, bandTailedPigeon,
  vauxsSwift, americanDipper, spottedSandpiper, commonMerganser, harlequinDuck, beltedKingfisher, baldEagle,
  coopersHawk, sharpShinnedHawk, americanGoshawk, barredOwl, northernSawWhetOwl, westernScreechOwl,
  northernSpottedOwl, northernPygmyOwl, rooseveltElk, blackBear, douglasSquirrel, stripedSkunk, olympicChipmunk,
  townsendsChipmunk, pacificFisher, riverOtter, yumaMyotis, pacificChorusFrog, roughSkinnedNewt, northernRedLeggedFrog,
  westernRedBackedSalamander, ensatina, westernToad, olympicTorrentSalamander, copesGiantSalamander,
  // (2026-11-16, at the end, so that no earlier kind's draw changes: the bats of the valley besides the Yuma Myotis)
  littleBrownMyotis, silverHairedBat, bigBrownBat,
};
// every fault in every kind's file, all at once, as the page's error (life/bodies.js)
const faults = Object.entries(FILES).flatMap(([name, kind]) => validate(kind, `${name}.js`));
if (faults.length) throw new Error(`${faults.length} ${faults.length === 1 ? 'fault' : 'faults'} in the animals' files:\n${faults.join('\n')}`);
export const KINDS = Object.values(FILES);

// who can be about on a visit, in order (life/census.js draws from it)
export const ROLL = KINDS.map(({ key, name, census: { tier, source, ...more } }) => ({ key, name, tier, source, mean: TIER[tier], party: [1, 1], clock: 'day', wave: false, extra: false, ...more }));
// the kinds that have a body, by the key the address and the layout use
export const SPECIES = Object.fromEntries(KINDS.filter((kind) => kind.shape).map((kind) => [kind.key, kind]));
// how each kind that has been built lives on a visit (life/visit.js)
export const WAYS = Object.fromEntries(KINDS.filter((kind) => kind.way).map((kind) => [kind.key, kind.way]));
