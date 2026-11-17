import * as THREE from 'three';

// Walk along the trail, look anywhere. Scroll, W/S or the arrow keys move, and shift
// makes a walk a run; dragging turns the head. The gaze is an offset from the trail's
// heading, so it is carried round the bends.
//
// Forward is the way the walker looks (the owner, 2026-11-15: "when the camera turns around, pressing W should
// still cause the character to move forward"). There are only two ways to go on a trail, so W takes whichever
// of them is nearer the gaze, S the other, and the scroll wheel goes by the same rule.
// `state.free`, when set, is a place to look from that is not on the trail at all: { x, y, z, yaw, pitch },
// with yaw the bearing about +y (0 looks along -z) and both in radians. The cabin's window is one.
export function createTrailController({ trail, camera, element, eyeHeight = 1.6 }) {
  const state = { s: 0, speed: 0, yaw: 0, pitch: 0, push: 0, auto: null, free: null };
  const keys = new Set();
  const position = new THREE.Vector3(), tangent = new THREE.Vector3(), euler = new THREE.Euler(0, 0, 0, 'YXZ');
  // Metres per second. A walk was 1.4, a person's own pace, and the owner found it "far too slow": 579 m of
  // trail took seven minutes. At 3.2 it takes three, and at a run under a minute and a half.
  const WALK = 3.2, RUN = 7.0;
  const SCROLL = 2.0;                                 // metres per second for each unit of push: a notch of the wheel is about a metre, a steady scroll about the run's pace
  // A run is slowed through the trail's tightest bends: the view turns with the trail, and a bend of 4.5
  // degrees a metre taken at 7 m/s swings it more than 30 degrees a second. No faster than this many radians a
  // second, which a walk never reaches.
  const SWING = 0.42;
  const ahead = new THREE.Vector3(), bend = new THREE.Vector3();
  let drag = null, way = 1;                           // way: 1 where forward is the way the trail's metres run, -1 where it is back along them

  // A key released while the window is elsewhere, or under Cmd on macOS, never
  // sends keyup. Let go of everything when focus goes, and ignore shortcuts.
  const release = () => { keys.clear(); drag = null; };
  const onKeyDown = (e) => { if (e.metaKey || e.ctrlKey || e.altKey) { keys.clear(); return; } keys.add(e.code); };
  const onKeyUp = (e) => { if (e.key === 'Meta') keys.clear(); else keys.delete(e.code); };
  const onWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey) return;                                         // a trackpad pinch arrives as ctrl + wheel
    const pixels = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);      // lines and pages, where a browser reports those
    // One notch of a mouse wheel (100 pixels) carries the walker about three quarters of a metre, and a
    // steady scroll holds about 5 m/s. At a third of this a notch was a quarter of a metre and the loop took 1,100.
    state.push = THREE.MathUtils.clamp(state.push - pixels * 0.012, -3.6, 3.6);
  };
  const onDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;       // a right click opens a menu and its pointerup never arrives
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
    element.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    // grab-style: the scene follows the pointer, as in a panorama viewer
    state.yaw += (e.clientX - drag.x) * 0.0035;
    state.pitch = THREE.MathUtils.clamp(state.pitch + (e.clientY - drag.y) * 0.0035, -1.3, 1.3);
    drag.x = e.clientX; drag.y = e.clientY;
  };
  const onUp = () => { drag = null; };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  element.addEventListener('wheel', onWheel, { passive: false });
  element.addEventListener('pointerdown', onDown);
  element.addEventListener('pointermove', onMove);
  element.addEventListener('pointerup', onUp);
  element.addEventListener('pointercancel', onUp);
  element.addEventListener('lostpointercapture', onUp);
  window.addEventListener('blur', release);
  document.addEventListener('visibilitychange', release);

  function update(dt) {
    if (state.free) {
      camera.position.set(state.free.x, state.free.y, state.free.z);
      euler.set(state.free.pitch, state.free.yaw, 0);
      camera.quaternion.setFromEuler(euler);
      camera.updateMatrixWorld();
      return;
    }
    if (state.auto) {
      // scripted pose, used by the verifier and the benchmark
      state.s = state.auto.s; state.yaw = state.auto.yaw; state.pitch = state.auto.pitch; state.speed = 0;
    } else {
      // Which way along the trail is forward: the way nearer the gaze. Looking nearly square across the trail
      // it stays what it was (from 80 to 100 degrees off), so that it cannot flicker between the two there.
      const facing = Math.cos(state.yaw);
      if (facing > 0.17) way = 1; else if (facing < -0.17) way = -1;
      const forward = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
      const pace = keys.has('ShiftLeft') || keys.has('ShiftRight') ? RUN : WALK;
      let want = way * (forward * pace + state.push * SCROLL);
      // how sharply the trail bends here and a stride or two on, in radians a metre: what a run is held to
      const going = Math.sign(want) || way;
      trail.sample(state.s, position, tangent);
      trail.sample(state.s + going * 1.5, ahead, bend);
      let turn = tangent.angleTo(bend) / 1.5;
      trail.sample(state.s + going * 4, ahead, tangent);
      turn = Math.max(turn, bend.angleTo(tangent) / 2.5);
      const most = SWING / Math.max(turn, 1e-4);
      if (Math.abs(want) > most) want = Math.sign(want) * most;
      state.push *= Math.exp(-dt * 2.2);              // a scroll is a push that dies away
      state.speed += (want - state.speed) * (1 - Math.exp(-dt * 4));
      // (kept between 0 and the trail's length: the stretch the walk shares with the old loop is sampled as the
      // old loop was only for metres in that range, and a walker who turns round would soon be below 0)
      state.s = (((state.s + state.speed * dt) % trail.length) + trail.length) % trail.length;
    }
    trail.sample(state.s, position, tangent);
    camera.position.set(position.x, position.y + eyeHeight, position.z);
    euler.set(state.pitch, Math.atan2(-tangent.x, -tangent.z) + state.yaw, 0);
    camera.quaternion.setFromEuler(euler);
    camera.updateMatrixWorld();
  }

  function dispose() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    element.removeEventListener('wheel', onWheel);
    element.removeEventListener('pointerdown', onDown);
    element.removeEventListener('pointermove', onMove);
    element.removeEventListener('pointerup', onUp);
    element.removeEventListener('pointercancel', onUp);
    element.removeEventListener('lostpointercapture', onUp);
    window.removeEventListener('blur', release);
    document.removeEventListener('visibilitychange', release);
  }

  return { state, update, dispose };
}
