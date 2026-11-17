import * as THREE from 'three';
import { WORLD, LEGACY } from '../world/terrain.js';
import { CASTER_LAYER } from '../world/instancer.js';

// One shadow map, holding trunks, logs and snags only. Crowns are handled by the
// canopy light map, so this stays cheap and crisp. It is redrawn when the sun has
// moved, never per frame. It covers the old world's box (LEGACY), which holds every
// metre of the walk: grown to the whole valley its texels would be half again as
// wide, and the shadows on the old terrace would no longer be the ones approved.
export function createSunMap(U, size) {
  const target = new THREE.WebGLRenderTarget(size, size, { depthBuffer: true });
  target.texture.minFilter = target.texture.magFilter = THREE.NearestFilter;
  target.depthTexture = new THREE.DepthTexture(size, size, THREE.UnsignedIntType);
  // Read through a shadow sampler: the GPU compares the four texels round a point and blends the answers
  // in one read. Read texel by texel, a trunk's shadow had square steps along its edge, and a metre from
  // the eye one texel was a ruled, cornered block of light across a bough.
  target.depthTexture.minFilter = target.depthTexture.magFilter = THREE.LinearFilter;
  target.depthTexture.compareFunction = THREE.LessEqualCompare;

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1000);
  camera.layers.set(CASTER_LAYER);
  const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
  const centre = new THREE.Vector3((LEGACY.minX + LEGACY.maxX) / 2, WORLD.canopyTop / 2, (LEGACY.minZ + LEGACY.maxZ) / 2);
  const corner = new THREE.Vector3(), lastDir = new THREE.Vector3();
  // The map is rolled about the sun's direction. Upright, the edge of a standing trunk's shadow ran almost
  // along a column of texels and stepped over one texel every so many rows: on another trunk that showed as
  // a stack of offset rectangles, which no filter the width of a texel can hide. Rolled, the same edge crosses
  // the texels on the diagonal, in steps too short to see once four texels are blended.
  const ROLL = 0.7;
  const bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  let drawn = false;

  U.uSunMap.value = target.depthTexture;
  U.uSunTexel.value.set(1 / size, 1 / size);

  // Returns true when the map was redrawn this call.
  function update(renderer, scene, force = false) {
    const dir = U.uSunDir.value;
    if (drawn && !force && dir.angleTo(lastDir) < 0.006) return false;     // about a third of a degree
    camera.position.copy(centre).addScaledVector(dir, 400);
    camera.up.set(0, 1, 0).applyAxisAngle(dir, ROLL);
    camera.lookAt(centre);
    camera.updateMatrixWorld();
    let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < 8; i += 1) {
      corner.set(i & 1 ? LEGACY.maxX : LEGACY.minX, i & 2 ? WORLD.canopyTop : -6, i & 4 ? LEGACY.maxZ : LEGACY.minZ)
        .applyMatrix4(camera.matrixWorldInverse);
      minX = Math.min(minX, corner.x); maxX = Math.max(maxX, corner.x);
      minY = Math.min(minY, corner.y); maxY = Math.max(maxY, corner.y);
      minZ = Math.min(minZ, corner.z); maxZ = Math.max(maxZ, corner.z);
    }
    camera.left = minX; camera.right = maxX; camera.bottom = minY; camera.top = maxY;
    camera.near = Math.max(1, -maxZ - 5); camera.far = -minZ + 5;
    camera.updateProjectionMatrix();
    U.uSunMatrix.value.copy(bias).multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse);

    const previous = renderer.getRenderTarget(), override = scene.overrideMaterial;
    scene.overrideMaterial = depthOnly;
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(scene, camera);
    scene.overrideMaterial = override;
    renderer.setRenderTarget(previous);
    lastDir.copy(dir);
    drawn = true;
    return true;
  }

  return { update, target, dispose: () => { target.depthTexture.dispose(); target.dispose(); depthOnly.dispose(); } };
}
