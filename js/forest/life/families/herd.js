import { elk, elkHome } from '../beasts.js';

// Big animals that go about as a herd: the Roosevelt elk (life/species/rooseveltElk.js). What a herd does and where
// it lives is life/beasts.js. The family has one kind yet, and its numbers are in its code.
//
// It is not on the shared skeleton (life/behave.js), and that is a choice (2026-11-16). The skeleton's unit is one
// animal: its activities, its `react`, its `leave` and `come` are each one animal's. A herd is one mind for a party:
// its leader decides for all of them (grazing, lying up, watching the walker, moving off in single file, running,
// leaving, walking in), each member steps by the herd's state and its own place in the file, the herd comes in one
// behind another by one way and goes out by one way. On the skeleton every activity would hand the frame back to
// that shared mind (`react` taking every frame), the bird's flush would never run, and `a.to` would reset what the
// herd already lays whole each step. What the skeleton has gained from it instead is the herd's legs and its sense
// of the walker, for a beast that lives alone: `a.gait` and `a.walkerNear` (life/behave.js).
export default { fields: {}, act: () => elk, home: () => elkHome };
