import * as THREE from 'three';
import { BOOK_CLOTH } from './bookCloth.js';

const MANUSCRIPT_BASE_URL = new URL('../content/books/', import.meta.url);

// The order matches the cabin GLB's painted-book traversal order: eight books
// on the lower shelf, then nine on the upper shelf. Each volume intentionally
// points at its own replaceable Markdown placeholder.
export const BOOK_LIBRARY = [
  { title: 'Field Notes at First Light', slug: 'field-notes-at-first-light' },
  { title: 'Counting the Uncountable', slug: 'counting-the-uncountable' },
  { title: 'The Wood Duck Morning', slug: 'the-wood-duck-morning' },
  { title: 'Friction, on Purpose', slug: 'friction-on-purpose' },
  { title: 'A Small Geometry of Rooms', slug: 'a-small-geometry-of-rooms' },
  { title: 'Tools for Quiet Problems', slug: 'tools-for-quiet-problems' },
  { title: 'Maps of Attention', slug: 'maps-of-attention' },
  { title: 'The Window Ledger', slug: 'the-window-ledger' },
  { title: 'Notes on Making', slug: 'notes-on-making' },
  { title: 'A Proof in the Margins', slug: 'a-proof-in-the-margins' },
  { title: 'The Long Way Around', slug: 'the-long-way-around' },
  { title: 'Moss, Rain, and Other Data', slug: 'moss-rain-and-other-data' },
  { title: 'The Shape of a Question', slug: 'the-shape-of-a-question' },
  { title: 'Cabinet of Half-Finished Things', slug: 'cabinet-of-half-finished-things' },
  { title: 'Birds Between Theorems', slug: 'birds-between-theorems' },
  { title: 'A Desk Facing the Wild', slug: 'a-desk-facing-the-wild' },
  { title: 'What the Lamp Remembered', slug: 'what-the-lamp-remembered' },
].map((book, index) => ({
  ...book,
  index,
  file: new URL(`${book.slug}.md`, MANUSCRIPT_BASE_URL).href,
}));

// The 4x5 cover atlas is shared by the open-book rig AND the shelf meshes'
// front boards (room.js splits those into a runtime geometry group): both
// sample the same cells through coverAtlasBounds so the flight->rig swap
// shows pixel-identical cover art on either side.
const ATLAS_COLS = 4;
const ATLAS_ROWS = 5;
const ATLAS_INSET = 0.009;
const TIP_ANGLE = THREE.MathUtils.degToRad(12);
const FLIGHT_SECONDS = 1.65;
// Opening is just the front cover swinging over (the first leaves ride it),
// so it is brisk; closing carries the whole staggered flutter and breathes.
const OPEN_SECONDS = 1.35;
const CLOSE_SECONDS = 1.65;
const RETURN_SECONDS = 1.45;

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const ease = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

export function coverAtlasBounds(index) {
  const col = index % ATLAS_COLS;
  const row = Math.floor(index / ATLAS_COLS) % ATLAS_ROWS;
  return {
    u0: col / ATLAS_COLS + ATLAS_INSET,
    u1: (col + 1) / ATLAS_COLS - ATLAS_INSET,
    v0: 1 - (row + 1) / ATLAS_ROWS + ATLAS_INSET,
    v1: 1 - row / ATLAS_ROWS - ATLAS_INSET,
  };
}

function cropGeometryToAtlas(geometry, index) {
  const uv = geometry.getAttribute('uv');
  if (!uv) return;
  if (!geometry.userData.bookBaseUv) {
    geometry.userData.bookBaseUv = new Float32Array(uv.array);
  }
  const base = geometry.userData.bookBaseUv;
  const { u0, u1, v0, v1 } = coverAtlasBounds(index);
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(
      i,
      THREE.MathUtils.lerp(u0, u1, base[i * 2]),
      THREE.MathUtils.lerp(v0, v1, base[i * 2 + 1]),
    );
  }
  uv.needsUpdate = true;
}

function makeHingedBox(width, thickness, height) {
  const geometry = new THREE.BoxGeometry(width, thickness, height, 1, 1, 1);
  geometry.translate(width * 0.5, 0, 0);
  return geometry;
}

function makePageGeometry(width, height) {
  const geometry = new THREE.PlaneGeometry(width, height, 12, 4);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(width * 0.5, 0, 0);
  geometry.getAttribute('position').setUsage(THREE.DynamicDrawUsage);
  return geometry;
}

function quadraticPoint(out, start, control, end, t) {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  out.set(
    start.x * a + control.x * b + end.x * c,
    start.y * a + control.y * b + end.y * c,
    start.z * a + control.z * b + end.z * c,
  );
  return out;
}

function buildOpenRig(root, coverMaterial, pageMaterial, pageBlockMaterial, desk) {
  const rig = new THREE.Group();
  rig.name = 'interactive_open_book';
  rig.position.set(-3.75, desk.surfaceY + 0.002, -0.05);
  // Gutter axis along world x (running away from the seated camera), boards
  // extending toward world -z: the spine edge sits on the reader's LEFT (away
  // from the window wall at z=-2.2) and the front cover flips open toward +z,
  // left-to-right like a real book. Yaw -PI/2 mirrored this. The rest pose is
  // re-seated per flight so the rig overlays the landed volume exactly.
  rig.rotation.y = Math.PI / 2;
  rig.visible = false;
  root.add(rig);

  // Shared finishes. The cloth tint tracks the opened volume's spine cloth
  // (bookCloth.js); board insides are plain paste-down paper — a flipped
  // cover must never show cover art on its inner face.
  const clothMaterial = new THREE.MeshStandardMaterial({
    name: 'ghibli_board_cloth',
    color: 0x555555,
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.12,
  });
  clothMaterial.userData.__woodConfigured = true;
  const pasteMaterial = new THREE.MeshStandardMaterial({
    name: 'ghibli_board_paste',
    color: 0xe9dfc6,
    roughness: 0.97,
    metalness: 0,
    envMapIntensity: 0.06,
  });
  pasteMaterial.userData.__woodConfigured = true;
  // Text-block sides reuse the shelf books' striated page stock, rotated a
  // quarter turn so the page boundaries run parallel to the desk on the
  // fore-edge and the head/tail walls of the closed stack.
  let blockSideMaterial = pageMaterial;
  if (pageBlockMaterial) {
    blockSideMaterial = pageBlockMaterial.clone();
    if (pageBlockMaterial.map) {
      const sideMap = pageBlockMaterial.map.clone();
      sideMap.center.set(0.5, 0.5);
      sideMap.rotation = Math.PI / 2;
      sideMap.needsUpdate = true;
      blockSideMaterial.map = sideMap;
    }
  }

  // BoxGeometry group order is +x, -x, +y, -y, +z, -z.
  const boardFaces = (artUp) => (artUp
    ? [clothMaterial, clothMaterial, coverMaterial, pasteMaterial, clothMaterial, clothMaterial]
    : [clothMaterial, clothMaterial, pasteMaterial, coverMaterial, clothMaterial, clothMaterial]);
  const blockFaces = [
    blockSideMaterial, blockSideMaterial,
    pageMaterial, pageMaterial,
    blockSideMaterial, blockSideMaterial,
  ];

  // None of the rig casts: dynamic leaves can project wall-sized rectangles
  // through the cabin's frozen sun frustum, and GTAO already grounds the
  // spread on the desk without those unstable long-range shadows.
  const bottomBoard = new THREE.Mesh(new THREE.BufferGeometry(), boardFaces(false));
  bottomBoard.receiveShadow = true;
  rig.add(bottomBoard);

  const coverHinge = new THREE.Group();
  const frontCover = new THREE.Mesh(new THREE.BufferGeometry(), boardFaces(true));
  frontCover.receiveShadow = true;
  coverHinge.add(frontCover);
  rig.add(coverHinge);

  const rightBlock = new THREE.Mesh(new THREE.BufferGeometry(), blockFaces);
  rightBlock.receiveShadow = true;
  rig.add(rightBlock);

  const leftBlock = new THREE.Mesh(new THREE.BufferGeometry(), blockFaces);
  leftBlock.receiveShadow = true;
  rig.add(leftBlock);

  // The spine plate stands vertically over the gutter edge while the book is
  // closed and flattens under the gutter as the boards spread, like a real
  // hollow back. Its pivot slides so the closed plate hugs the outside wall.
  const spinePivot = new THREE.Group();
  const spinePlate = new THREE.Mesh(new THREE.BufferGeometry(), clothMaterial);
  spinePlate.receiveShadow = true;
  spinePivot.add(spinePlate);
  rig.add(spinePivot);

  const leaves = [];
  for (let i = 0; i < 7; i += 1) {
    const hinge = new THREE.Group();
    const leaf = new THREE.Mesh(new THREE.BufferGeometry(), pageMaterial);
    leaf.castShadow = false;
    leaf.receiveShadow = true;
    hinge.add(leaf);
    rig.add(hinge);
    leaves.push({ hinge, leaf });
  }

  let dims = null;
  const disposables = [];
  const keep = (geometry) => {
    disposables.push(geometry);
    return geometry;
  };

  // Rebuild every board, block, plate, and leaf to THIS volume's world
  // dimensions (originalScale = thickness x height x depth of the unit-cube
  // book), and seat the rig on the landing spot so the closed stack overlays
  // the landed real mesh exactly: plate outer face on the spine edge, boards
  // spanning the rest of the depth, base on the desk.
  function setBook(entry, landingCenter) {
    disposables.splice(0).forEach((geometry) => geometry.dispose());
    const thickness = entry.originalScale.x;
    const boardH = entry.originalScale.y;
    const boardT = THREE.MathUtils.clamp(thickness * 0.085, 0.012, 0.02);
    const boardW = entry.originalScale.z - boardT * 0.9;
    const leafGap = 0.012;
    const blockTh = Math.max(thickness - 2 * boardT - leafGap, 0.03);
    const leftTh = blockTh * 0.30;
    dims = {
      plateT: boardT * 0.9,
      spineL: thickness - boardT * 0.5,
      coverRestY: boardT * 0.5 + 0.012,
      // Case binding: an opened board lies one JOINT-groove from the gutter
      // fold — a few millimetres — with the flattened spine hidden under it.
      joint: boardT * 0.9 + 0.006,
      coverTopY: boardT + 0.012,
      leftTh,
      leafW: boardW - 0.02,
      leafH: boardH - 0.03,
      leafRightY: boardT + blockTh + 0.002,
    };

    bottomBoard.geometry = keep(makeHingedBox(boardW, boardT, boardH));
    bottomBoard.position.y = boardT * 0.5;
    frontCover.geometry = keep(makeHingedBox(boardW, boardT, boardH));
    rightBlock.geometry = keep(makeHingedBox(boardW - 0.008, blockTh, boardH - 0.02));
    rightBlock.position.y = boardT + blockTh * 0.5;
    const leftWidth = boardW - 0.012;
    const leftGeometry = keep(makeHingedBox(leftWidth, leftTh, boardH - 0.02));
    // Move the block to the other side of the gutter without mirroring its
    // vertices. Mirrored geometry reverses the winding and surface normals,
    // which can shade as a black slab while the book closes in flight.
    leftGeometry.translate(-leftWidth, 0, 0);
    leftBlock.geometry = leftGeometry;
    // Position and pile height are owned by setOpenAmount (the pile inflates
    // under the landed leaves as pages arrive).
    const plateGeometry = keep(new THREE.BoxGeometry(dims.plateT, dims.spineL, boardH + 0.004));
    plateGeometry.translate(dims.plateT * 0.5, dims.spineL * 0.5, 0);
    spinePlate.geometry = plateGeometry;
    leaves.forEach(({ leaf }) => {
      leaf.geometry = keep(makePageGeometry(dims.leafW, dims.leafH));
    });

    cropGeometryToAtlas(frontCover.geometry, entry.book.index);
    cropGeometryToAtlas(bottomBoard.geometry, entry.book.index);
    clothMaterial.color.set(BOOK_CLOTH[entry.book.index % BOOK_CLOTH.length] || '#6b5d4a');
    rig.position.set(
      landingCenter.x,
      desk.surfaceY + 0.002,
      landingCenter.z + entry.originalScale.z * 0.5 - dims.plateT,
    );
    setOpenAmount(0);
  }

  const scratch = new THREE.Vector3();
  // Two choreographies share one progress value (iter-27 user feedback):
  // 'carry' (opening) swings the front cover over with the first leaves
  // riding it — no flutter; 'flutter' (closing) is the staggered riffle that
  // lets the leaves fall shut one by one before the cover follows.
  function setOpenAmount(amount, mode = 'carry') {
    if (!dims) return;
    const p = clamp01(amount);
    const carry = mode === 'carry';
    // Carry uses a fast-out cover (already swinging on the swap frame, flat by
    // p=0.80): the atlas cover art is revealed BY the opening motion instead of
    // popping onto a still, closed stack the instant the real mesh hides.
    const coverQ = carry ? clamp01(p / 0.80) : clamp01(p / 0.46);
    const coverP = carry ? coverQ * (2 - coverQ) : ease(coverQ);
    const theta = coverP * Math.PI * 0.5;
    spinePivot.rotation.z = theta;
    spinePivot.position.x = -dims.plateT * (1 - coverP);
    coverHinge.rotation.z = Math.PI * coverP;
    // Two-phase hinge (case binding): the first half of the swing rides the
    // spine plate's free edge like a hollow back, then the board SEATS into
    // the narrow joint beside the gutter, ending a few millimetres from the
    // fold with the flattened plate hidden underneath. The old single-arc
    // hinge parked the cover a full book-thickness away (-spineL), so the
    // leaves — hinged at the gutter — could never rest on it: they hovered
    // over bare desk from the seated camera.
    const seat = ease(clamp01((coverP - 0.5) / 0.5));
    coverHinge.position.set(
      THREE.MathUtils.lerp(-dims.spineL * Math.sin(theta), -dims.joint, seat),
      Math.max(dims.spineL * Math.cos(theta), dims.coverRestY),
      0,
    );
    // The turned-page bulk INFLATES under the landed leaves as pages arrive:
    // early leaves rest directly on the flipped cover and ride up with the
    // pile. (The old visibility toggle read as a cream slab appearing on the
    // desk from the seated camera, offset from the leaves above it.)
    const pile = carry
      ? ease(clamp01((p - 0.74) / 0.22))
      : ease(clamp01((p - 0.28) / 0.22));
    const pileScale = Math.max(pile, 0.004);
    leftBlock.visible = pile > 0.004;
    leftBlock.scale.y = pileScale;
    leftBlock.position.set(-dims.joint, dims.coverTopY + dims.leftTh * pileScale * 0.5, 0);
    const leafLeftYNow = dims.coverTopY + dims.leftTh * pile + 0.002;

    leaves.forEach(({ hinge, leaf }, index) => {
      let leafP;
      if (carry) {
        // The top leaf (last index) is pressed against the lifting cover and
        // goes over first; each one beneath trails a little further behind.
        // The clutch always LAGS the cover, so a page can never lie down
        // before the board it lands on arrives — the old leading timing left
        // flat cream sheets hovering where the cover had yet to fall.
        const lag = 0.05 + (leaves.length - 1 - index) * 0.018;
        const leafQ = clamp01((p - lag) / 0.80);
        leafP = leafQ * (2 - leafQ);
      } else {
        const start = 0.14 + index * 0.075;
        leafP = ease((p - start) / 0.36);
      }
      const angle = Math.PI * leafP;
      hinge.rotation.z = angle;
      const settle = ease(clamp01((leafP - 0.55) / 0.40));
      hinge.position.y = THREE.MathUtils.lerp(
        dims.leafRightY + index * 0.0012,
        leafLeftYNow + (leaves.length - 1 - index) * 0.0012,
        settle,
      );

      const position = leaf.geometry.getAttribute('position');
      const curl = Math.sin(angle) * (carry ? 0.012 : 0.045 + index * 0.0022);
      for (let i = 0; i < position.count; i += 1) {
        scratch.fromBufferAttribute(position, i);
        const along = clamp01(scratch.x / dims.leafW);
        const downPage = clamp01(scratch.z / dims.leafH + 0.5);
        const softEdge = 0.72 + Math.sin(downPage * Math.PI) * 0.28;
        position.setY(i, Math.sin(along * Math.PI) * curl * softEdge);
      }
      position.needsUpdate = true;
    });
  }

  return {
    group: rig,
    center: rig.position,
    setBook,
    setOpenAmount,
  };
}

/**
 * Creates one pooled animation system for all 17 Blender-authored book meshes.
 * Shelf books remain the actual raycast targets (layer 0); no invisible proxy is
 * introduced, so the PROXY_LAYER post-processing contract stays untouched.
 */
export function createBookSystem({ root, interactives, desk, coverMaterial }) {
  const entries = [];
  const byMesh = new WeakMap();
  let active = null;
  let hovered = null;
  let state = 'idle';
  let stateTime = 0;
  let openAmount = 0;
  let lastTime = null;
  let openResolve = null;
  let closeResolve = null;
  let openRig = null;
  let pageReady = false;
  let modelReady = false;

  const flightStartPosition = new THREE.Vector3();
  const flightStartQuaternion = new THREE.Quaternion();
  const flightControl = new THREE.Vector3();
  const flightEndPosition = new THREE.Vector3();
  const flightEndQuaternion = new THREE.Quaternion();
  const returnStartPosition = new THREE.Vector3();
  const returnStartQuaternion = new THREE.Quaternion();
  const returnControl = new THREE.Vector3();
  const returnEndPosition = new THREE.Vector3();
  const returnEndQuaternion = new THREE.Quaternion();
  const pathScratch = new THREE.Vector3();
  const matrixScratch = new THREE.Matrix4();
  const inverseScratch = new THREE.Matrix4();
  const centerOffset = new THREE.Vector3();
  const desiredCenter = new THREE.Vector3();
  // Landed reading pose (iter 27, user feedback): the book lies flat with its
  // FRONT cover (local +x) up, its head (local +y) toward the wall, and its
  // SPINE (local +z) toward world +z — away from the window wall at z=-2.2 and
  // on the seated reader's left, so the cover swings open left-to-right like a
  // real book. The old basis pointed the spine at the camera (world +x).
  const flatBasis = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 0, 1),
  );
  const flatQuaternion = new THREE.Quaternion().setFromRotationMatrix(flatBasis);

  window.__booksReady = false;
  window.__bookPagesReady = false;
  const pageTexture = new THREE.TextureLoader().load(
    'assets/textures/ghibli_book_pages.png',
    () => {
      pageReady = true;
      window.__bookPagesReady = true;
      if (modelReady) window.__booksReady = true;
    },
    undefined,
    (error) => {
      console.error('Failed to load the aged book-page texture', error);
      window.__bookTextureError = error;
    },
  );
  pageTexture.colorSpace = THREE.SRGBColorSpace;
  pageTexture.wrapS = pageTexture.wrapT = THREE.ClampToEdgeWrapping;
  pageTexture.minFilter = THREE.LinearMipmapLinearFilter;
  pageTexture.magFilter = THREE.LinearFilter;
  pageTexture.anisotropy = window.__caps.textureAnisotropy;

  const pageMaterial = new THREE.MeshStandardMaterial({
    name: 'ghibli_aged_book_page',
    map: pageTexture,
    color: 0xfff1c9,
    roughness: 0.98,
    metalness: 0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.08,
  });
  pageMaterial.userData.__woodConfigured = true;
  // The rig's cover shares ONE material instance with the shelf meshes' front
  // boards (created in room.js): identical map, roughness, and env response,
  // so the flight->rig swap cannot pop shading or art.

  function rootLocalTransform(object, position, quaternion, scale) {
    root.updateMatrixWorld(true);
    object.updateMatrixWorld(true);
    inverseScratch.copy(root.matrixWorld).invert();
    matrixScratch.multiplyMatrices(inverseScratch, object.matrixWorld);
    matrixScratch.decompose(position, quaternion, scale);
  }

  function wrapBook(mesh, book) {
    const parent = mesh.parent;
    const originalPosition = mesh.position.clone();
    const originalQuaternion = mesh.quaternion.clone();
    const originalScale = mesh.scale.clone();
    mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox.clone();
    const center = bounds.getCenter(new THREE.Vector3());
    // Hinge on the visible lower spine edge. Using the hidden rear edge makes
    // the convex tail arc down through the shelf before the top can lean out.
    const pivotPoint = new THREE.Vector3(center.x, bounds.min.y, bounds.max.z);

    const anchor = new THREE.Group();
    anchor.name = `book_anchor_${book.index + 1}`;
    anchor.position.copy(originalPosition);
    anchor.quaternion.copy(originalQuaternion);
    anchor.scale.copy(originalScale);

    const tip = new THREE.Group();
    tip.name = `book_tip_${book.index + 1}`;
    tip.position.copy(pivotPoint);

    parent.remove(mesh);
    parent.add(anchor);
    anchor.add(tip);
    tip.add(mesh);
    mesh.position.copy(pivotPoint).multiplyScalar(-1);
    mesh.quaternion.identity();
    mesh.scale.set(1, 1, 1);

    mesh.userData.action = 'book';
    mesh.userData.label = book.title;
    mesh.userData.labelClass = 'book';
    mesh.userData.book = book;
    mesh.userData.labelPoint = center.clone();

    const entry = {
      book,
      mesh,
      anchor,
      tip,
      parent,
      center,
      originalPosition,
      originalQuaternion,
      originalScale,
      shelfRootPosition: new THREE.Vector3(),
      shelfRootQuaternion: new THREE.Quaternion(),
      shelfRootScale: new THREE.Vector3(),
      tipAmount: 0,
      tipTarget: 0,
    };
    rootLocalTransform(anchor, entry.shelfRootPosition, entry.shelfRootQuaternion, entry.shelfRootScale);
    entries.push(entry);
    byMesh.set(mesh, entry);
    interactives.push(mesh);
    // The gilt bands and the recessed text block are child meshes plugging the
    // rim-ring openings, and the raycast is non-recursive — without their own
    // registration the hover/click would drop out exactly over the pages of a
    // tipped book. They share the book's local space (identity transforms), so
    // the parent's labelPoint stays valid on them.
    mesh.traverse((child) => {
      if (child === mesh || !child.isMesh) return;
      child.userData.action = 'book';
      child.userData.label = book.title;
      child.userData.labelClass = 'book';
      child.userData.book = book;
      child.userData.labelPoint = mesh.userData.labelPoint;
      byMesh.set(child, entry);
      interactives.push(child);
    });
  }

  function bind(model, pageBlockMaterial = null) {
    const meshes = [];
    model.traverse((object) => {
      if (object.isMesh && Number.isInteger(object.userData.bookTextureIndex)) meshes.push(object);
    });
    meshes.sort((a, b) => a.userData.bookTextureIndex - b.userData.bookTextureIndex);
    if (meshes.length !== BOOK_LIBRARY.length) {
      console.warn(`Expected ${BOOK_LIBRARY.length} interactive books; found ${meshes.length}.`);
    }
    meshes.slice(0, BOOK_LIBRARY.length).forEach((mesh, index) => wrapBook(mesh, BOOK_LIBRARY[index]));
    if (meshes[0]) openRig = buildOpenRig(root, coverMaterial, pageMaterial, pageBlockMaterial, desk);
    modelReady = true;
    if (pageReady) window.__booksReady = true;
  }

  function setHovered(mesh) {
    const next = mesh ? byMesh.get(mesh) || null : null;
    if (hovered === next) return;
    if (hovered && hovered !== active) hovered.tipTarget = 0;
    hovered = next;
    if (hovered && hovered !== active && state === 'idle') hovered.tipTarget = 1;
  }

  function prepareFlight(entry) {
    entry.mesh.traverse((object) => {
      if (object.isMesh) object.castShadow = false;
    });
    root.attach(entry.anchor);
    entry.anchor.updateMatrixWorld(true);
    flightStartPosition.copy(entry.anchor.position);
    flightStartQuaternion.copy(entry.anchor.quaternion);
    flightEndQuaternion.copy(flatQuaternion);

    // Land in the open desk space in FRONT of the MacBook and between it and
    // the resume (user feedback): the resume sheet owns z >= -0.05 and the
    // MacBook owns z <= -0.53, so the closed 0.46-deep volume drops into the
    // clear strip centred at z -0.28, pushed toward the desk's front edge.
    desiredCenter.set(-3.75, desk.surfaceY + entry.originalScale.x * 0.5, -0.28);
    centerOffset.copy(entry.center).multiply(entry.originalScale).applyQuaternion(flightEndQuaternion);
    flightEndPosition.copy(desiredCenter).sub(centerOffset);
    flightControl.copy(flightStartPosition).lerp(flightEndPosition, 0.48);
    flightControl.x += 0.82;
    flightControl.y += 0.52;
  }

  function applyFlight(amount) {
    const p = ease(amount);
    quadraticPoint(active.anchor.position, flightStartPosition, flightControl, flightEndPosition, p);
    active.anchor.quaternion.slerpQuaternions(flightStartQuaternion, flightEndQuaternion, p);
    active.tip.rotation.x = TIP_ANGLE * (1 - ease(amount / 0.34));
  }

  function beginReturn() {
    if (!active) return;
    openRig.group.visible = false;
    active.anchor.visible = true;
    active.tip.rotation.x = 0;
    active.anchor.position.copy(flightEndPosition);
    active.anchor.quaternion.copy(flightEndQuaternion);
    active.anchor.scale.copy(active.originalScale);
    returnStartPosition.copy(active.anchor.position);
    returnStartQuaternion.copy(active.anchor.quaternion);
    returnEndPosition.copy(active.shelfRootPosition);
    returnEndQuaternion.copy(active.shelfRootQuaternion);
    returnControl.copy(returnStartPosition).lerp(returnEndPosition, 0.52);
    returnControl.x += 0.82;
    returnControl.y += 0.50;
    state = 'returning';
    stateTime = 0;
  }

  function finishReturn() {
    const entry = active;
    entry.parent.attach(entry.anchor);
    entry.anchor.position.copy(entry.originalPosition);
    entry.anchor.quaternion.copy(entry.originalQuaternion);
    entry.anchor.scale.copy(entry.originalScale);
    entry.tip.rotation.x = 0;
    entry.tipAmount = 0;
    entry.tipTarget = 0;
    entry.mesh.visible = true;
    // Back in its static shelf pose the volume rejoins the cadence-refreshed
    // shadow maps; only the flight itself stays out of them (prepareFlight).
    entry.mesh.traverse((object) => {
      if (object.isMesh) object.castShadow = true;
    });
    active = null;
    state = 'idle';
    stateTime = 0;
    openAmount = 0;
    if (closeResolve) {
      const resolve = closeResolve;
      closeResolve = null;
      resolve();
    }
  }

  function open(mesh) {
    const entry = byMesh.get(mesh);
    if (!entry || active || !openRig) return null;
    active = entry;
    hovered = null;
    entry.tipTarget = 1;
    state = 'flying';
    stateTime = 0;
    openAmount = 0;
    prepareFlight(entry);
    openRig.setBook(entry, desiredCenter);
    openRig.group.visible = false;
    const finished = new Promise((resolve) => { openResolve = resolve; });
    return { book: entry.book, finished };
  }

  function close() {
    if (!active) return Promise.resolve();
    if (openResolve) {
      const resolve = openResolve;
      openResolve = null;
      resolve({ cancelled: true, book: active.book });
    }
    const finished = new Promise((resolve) => { closeResolve = resolve; });
    if (state === 'flying') {
      returnStartPosition.copy(active.anchor.position);
      returnStartQuaternion.copy(active.anchor.quaternion);
      returnEndPosition.copy(active.shelfRootPosition);
      returnEndQuaternion.copy(active.shelfRootQuaternion);
      returnControl.copy(returnStartPosition).lerp(returnEndPosition, 0.52);
      returnControl.x += 0.55;
      returnControl.y += 0.35;
      state = 'returning';
      stateTime = 0;
    } else if (state === 'opening' || state === 'open') {
      state = 'closing';
      stateTime = 0;
    }
    return finished;
  }

  // (a shelf book tipping on hover, or the active book on its way: main.js refreshes the shadow maps more often then)
  let tipping = false;
  function update(time) {
    const dt = lastTime === null ? 0 : Math.min(0.05, Math.max(0, time - lastTime));
    lastTime = time;

    tipping = false;
    for (const entry of entries) {
      if (entry === active) continue;
      const damping = 1 - Math.exp(-dt * 13);
      entry.tipAmount += (entry.tipTarget - entry.tipAmount) * damping;
      // (an eased tip never arrives: the book's matrix went on changing in its last decimals for most of a minute,
      // and for as long nothing drawn from the room's shape could be kept. Within a hundred-thousandth it is there.)
      if (Math.abs(entry.tipTarget - entry.tipAmount) < 1e-5) entry.tipAmount = entry.tipTarget;
      entry.tip.rotation.x = entry.tipAmount * TIP_ANGLE;
      if (Math.abs(entry.tipTarget - entry.tipAmount) > 0.002) tipping = true;
    }

    if (!active || dt <= 0) return;
    stateTime += dt;
    if (state === 'flying') {
      const p = clamp01(stateTime / FLIGHT_SECONDS);
      applyFlight(p);
      if (p >= 1) {
        active.anchor.visible = false;
        openRig.group.visible = true;
        state = 'opening';
        // Hand the flight's frame overshoot to the opening so the rig's first
        // visible frame already has the cover in motion — a closed rig sitting
        // still for even one frame reads as the cover art snapping.
        stateTime = Math.max(0, stateTime - FLIGHT_SECONDS);
        openAmount = clamp01(stateTime / OPEN_SECONDS);
        openRig.setOpenAmount(openAmount, 'carry');
      }
    } else if (state === 'opening') {
      openAmount = clamp01(stateTime / OPEN_SECONDS);
      openRig.setOpenAmount(openAmount, 'carry');
      if (openAmount >= 1) {
        state = 'open';
        if (openResolve) {
          const resolve = openResolve;
          openResolve = null;
          resolve({ cancelled: false, book: active.book });
        }
      }
    } else if (state === 'closing') {
      openAmount = clamp01(openAmount - dt / CLOSE_SECONDS);
      openRig.setOpenAmount(openAmount, 'flutter');
      if (openAmount <= 0) beginReturn();
    } else if (state === 'returning') {
      const p = ease(stateTime / RETURN_SECONDS);
      quadraticPoint(pathScratch, returnStartPosition, returnControl, returnEndPosition, p);
      active.anchor.position.copy(pathScratch);
      active.anchor.quaternion.slerpQuaternions(returnStartQuaternion, returnEndQuaternion, p);
      const tuck = clamp01((p - 0.64) / 0.36);
      active.tip.rotation.x = TIP_ANGLE * Math.sin(tuck * Math.PI);
      if (p >= 1) finishReturn();
    }
  }

  function getCameraAnchor() {
    if (!openRig) return null;
    return {
      center: openRig.group.localToWorld(new THREE.Vector3(0, 0.055, 0)),
      // Rig local +z maps to world +x under the +PI/2 yaw — the camera hangs
      // back over the reader's side of the desk, looking down the gutter.
      position: openRig.group.localToWorld(new THREE.Vector3(0, 1.42, 1.12)),
    };
  }

  const api = {
    bind,
    setHovered,
    open,
    close,
    update,
    getCameraAnchor,
    get activeBook() { return active ? active.book : null; },
    get state() { return state; },
    get moving() { return tipping || (active != null && state !== 'idle' && state !== 'open'); },
    get openAmount() { return openAmount; },
    get entries() { return entries; },
  };
  window.__bookSystem = api;
  return api;
}
