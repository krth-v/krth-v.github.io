import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createBookSystem, coverAtlasBounds } from './books.js';
import { buildHearthFire } from './hearth.js';

// ============================================================================
// CABIN ROOM — backed by a Blender-authored model (assets/cabin.glb).
//
// The cabin shell (walls, window, bookshelves, desk, and footstool) is modelled
// in Blender and exported as a single GLB. Runtime code owns its painterly wood
// maps and finish, while Blender owns the hand-hewn geometry and grain UVs.
//
// LIGHTING (scene-level lights: sun/hemi/fireplace/volumetric beam) now lives
// in lighting.js, built by main.js. This module still owns one piece of the
// lighting architecture directly: a faint night-time emissive tint applied at
// runtime onto the window woodwork's GLB material — passed in via `cfg` (the
// same time-of-day config object main.js uses for the sun/hemi).
//
// The public API: returns { group, interactives, windowAnchor, win, desk,
// update(t) }. group is filled in asynchronously once the GLB loads; every
// numeric metric below is available synchronously.
// ============================================================================

const WOOD = {
  // Iter 30 neutralizes the approved strong/quiet wall studies into luminance
  // maps. Runtime tints can now compare painted hues without discarding the
  // iteration-28 grain, knots, UVs, or daylight-scaled bounce.
  wall: 'assets/textures/ghibli_wall_value.png',
  wallBounce: 'assets/textures/ghibli_wall_bounce_value.png',
  trim: 'assets/textures/ghibli_wall_albedo_v3.png',
  walnut: 'assets/textures/ghibli_walnut_albedo_v3.png',
  rug: 'assets/textures/ghibli_rug_albedo.png',
  bookSpine: 'assets/textures/ghibli_book_spine_atlas.png',
  bookCover: 'assets/textures/ghibli_book_cover_atlas.png',
  giltLeaf: 'assets/textures/ghibli_gilt_leaf.png',
};

// Warm cream won the sage/cream/blue-gray wall study (iteration 32 review).
const WALL_DIFFUSE = '#c7b997';
const WALL_EMISSIVE = '#595242';

const BOOK_ATLAS_COLS = 5;
const BOOK_ATLAS_ROWS = 4;
// Five generated 1:4 spine strips fill each row without gutters. A tiny inset
// is still needed so distant mip levels never borrow a neighbour's cloth.
const BOOK_ATLAS_INSET = 0.0025;

function colorTexture(url, onReady, repeat = true) {
  const texture = new THREE.TextureLoader().load(url, onReady, undefined, (err) => {
    console.error(`Failed to load room texture: ${url}`, err);
    window.__woodTextureError = err;
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = window.__caps.textureAnisotropy;
  return texture;
}

function remapBookToAtlas(geometry, atlasIndex, coverBounds) {
  const uv = geometry.attributes.uv;
  if (!uv) return;
  const position = geometry.attributes.position;
  const index = geometry.index;

  // Split the FRONT board (geometry-local +x normal — the face a landed
  // volume shows the room) into its own geometry group, drawn with the shared
  // 4x5 cover-atlas material and sampling the SAME cell the open-book rig's
  // cover uses. The flight→rig swap then shows identical art on both sides
  // instead of trading a smeared spine sliver for an ornamental board (the
  // LOD-crossfade lesson: texture continuity is what kills a swap pop). The
  // BACK board is re-pinned to the lane's turn-in rows — plain binding cloth
  // by construction (book_form.py keeps the art's first/last rows motif-free).
  const frontVertices = new Set();
  if (position && index) {
    const backVertices = new Set();
    const spineTriangles = [];
    const frontTriangles = [];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let t = 0; t < index.count; t += 3) {
      const i0 = index.getX(t), i1 = index.getX(t + 1), i2 = index.getX(t + 2);
      a.fromBufferAttribute(position, i0);
      b.fromBufferAttribute(position, i1);
      c.fromBufferAttribute(position, i2);
      b.sub(a);
      c.sub(a);
      b.cross(c);
      if (Math.abs(b.x) > b.length() * 0.92) {
        if (b.x > 0) {
          frontTriangles.push(i0, i1, i2);
          frontVertices.add(i0).add(i1).add(i2);
          continue;
        }
        backVertices.add(i0).add(i1).add(i2);
      }
      spineTriangles.push(i0, i1, i2);
    }
    for (const vertex of backVertices) {
      uv.setY(vertex, 0.9785 + uv.getY(vertex) * 0.017);
    }
    if (frontTriangles.length) {
      // Planar-map the board by position onto the cover cell: u runs from the
      // spine edge (+z, the rounded back) to the fore-edge, v climbs to the
      // head (+y). This matches the rig cover's box UVs in the landing pose,
      // so the art sits upright and unmirrored on both sides of the swap.
      let yMin = Infinity, yMax = -Infinity, zMin = Infinity, zMax = -Infinity;
      for (const vertex of frontVertices) {
        a.fromBufferAttribute(position, vertex);
        yMin = Math.min(yMin, a.y); yMax = Math.max(yMax, a.y);
        zMin = Math.min(zMin, a.z); zMax = Math.max(zMax, a.z);
      }
      for (const vertex of frontVertices) {
        a.fromBufferAttribute(position, vertex);
        uv.setXY(
          vertex,
          THREE.MathUtils.lerp(coverBounds.u0, coverBounds.u1, (zMax - a.z) / (zMax - zMin)),
          THREE.MathUtils.lerp(coverBounds.v0, coverBounds.v1, (a.y - yMin) / (yMax - yMin)),
        );
      }
      const reordered = new index.array.constructor(index.count);
      reordered.set(spineTriangles, 0);
      reordered.set(frontTriangles, spineTriangles.length);
      geometry.setIndex(new THREE.BufferAttribute(reordered, 1));
      geometry.clearGroups();
      geometry.addGroup(0, spineTriangles.length, 0);
      geometry.addGroup(spineTriangles.length, frontTriangles.length, 1);
    }
  }

  const col = atlasIndex % BOOK_ATLAS_COLS;
  const row = Math.floor(atlasIndex / BOOK_ATLAS_COLS) % BOOK_ATLAS_ROWS;
  const u0 = col / BOOK_ATLAS_COLS + BOOK_ATLAS_INSET;
  const u1 = (col + 1) / BOOK_ATLAS_COLS - BOOK_ATLAS_INSET;
  // Atlas rows are authored top-to-bottom; UV v=0 addresses the image bottom.
  const v0 = 1 - (row + 1) / BOOK_ATLAS_ROWS + BOOK_ATLAS_INSET;
  const v1 = 1 - row / BOOK_ATLAS_ROWS - BOOK_ATLAS_INSET;

  // Blender now authors the curved spine as a true unwrapped 1:4 surface.
  // Cropping those authored UVs preserves arc length and eliminates the old
  // normal-projection switch that kinked motifs around the rounded shoulders.
  // Front-board vertices already hold final cover-cell coordinates.
  for (let i = 0; i < uv.count; i += 1) {
    if (frontVertices.has(i)) continue;
    const u = uv.getX(i), v = uv.getY(i);
    uv.setXY(i, THREE.MathUtils.lerp(u0, u1, u), THREE.MathUtils.lerp(v0, v1, v));
  }
  uv.needsUpdate = true;
}

// The head/tail of every closed book shows its text block: stacked page edges
// reading as fine vertical striations across the thickness. A tiny generated
// canvas (like the lamp's cookie) beats shipping another atlas PNG for what is
// essentially cream paper with ~2px pencil lines.
function pageEdgeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f0e2bc';
  ctx.fillRect(0, 0, 128, 64);
  // Two soft warm age-bands so the block doesn't read as one flat chip.
  const age = ctx.createLinearGradient(0, 0, 128, 0);
  age.addColorStop(0, 'rgba(184,144,88,0.16)');
  age.addColorStop(0.5, 'rgba(184,144,88,0)');
  age.addColorStop(1, 'rgba(184,144,88,0.20)');
  ctx.fillStyle = age;
  ctx.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 30; i += 1) {
    const x = 2 + i * 4.2 + (Math.sin(i * 12.9898) * 43758.5453 % 1) * 2.2;
    ctx.fillStyle = `rgba(150,116,72,${0.14 + ((i * 7) % 5) * 0.035})`;
    ctx.fillRect(x, 0, 1, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = window.__caps.textureAnisotropy;
  return texture;
}

function applyRoomMaterials(model, textures, coverMaterial) {
  let bookCount = 0;
  let wallMaterial = null;
  const bookMaterial = new THREE.MeshStandardMaterial({
    name: 'ghibli_book_cloth',
    map: textures.bookSpine,
    color: 0xffffff,
    metalness: 0,
    roughness: 0.88,
    envMapIntensity: 0.22,
  });
  bookMaterial.userData.__woodConfigured = true;
  const pageBlockMaterial = new THREE.MeshStandardMaterial({
    name: 'ghibli_page_block',
    map: pageEdgeTexture(),
    color: 0xffffff,
    metalness: 0,
    roughness: 0.96,
    envMapIntensity: 0.10,
  });
  pageBlockMaterial.userData.__woodConfigured = true;
  const giltMaterial = new THREE.MeshStandardMaterial({
    name: 'ghibli_raised_gilt',
    map: textures.giltLeaf,
    color: 0xd1ad55,
    metalness: 0.76,
    roughness: 0.34,
    envMapIntensity: 1.15,
  });
  giltMaterial.userData.__woodConfigured = true;
  model.traverse((o) => {
    if (!o.isMesh) return;
    // Hearth meshes reuse clay placeholder names in the GLB, but must not
    // mutate those shared cabin materials at runtime. Assign local finishes by
    // node ownership before the generic baked_* decoration below.
    if (o.name === 'Hearth_Base') {
      o.material = new THREE.MeshStandardMaterial({
        name: 'hearth_base_runtime', color: 0x3a322b,
        roughness: 0.97, metalness: 0, envMapIntensity: 0.06,
      });
      o.material.userData.__woodConfigured = true;
      return;
    }
    if (o.name === 'Hearth_Chimney') {
      o.material = new THREE.MeshStandardMaterial({
        name: 'hearth_chimney_runtime', color: 0x695e50,
        roughness: 0.98, metalness: 0, envMapIntensity: 0.05,
      });
      o.material.userData.__woodConfigured = true;
      return;
    }
    if (o.name === 'Hearth_Insert') {
      o.material = new THREE.MeshStandardMaterial({
        name: 'hearth_insert_runtime', color: 0xd8c5a2,
        roughness: 0.97, metalness: 0, envMapIntensity: 0.08,
      });
      o.material.userData.__woodConfigured = true;
      return;
    }
    if (o.name === 'Hearth_Firebox') {
      o.material = new THREE.MeshStandardMaterial({
        name: 'hearth_firebox_runtime', color: 0x241a14,
        roughness: 0.96, metalness: 0, envMapIntensity: 0.04,
      });
      o.material.userData.__woodConfigured = true;
      return;
    }
    if (o.name === 'Hearth_Grate') {
      o.material = new THREE.MeshStandardMaterial({
        name: 'hearth_grate_runtime', color: 0x28231f,
        roughness: 0.80, metalness: 0.60, envMapIntensity: 0.18,
      });
      o.material.userData.__woodConfigured = true;
      return;
    }
    if (o.name === 'Hearth_Surround_Wood' || o.name === 'Hearth_Logs') {
      // Provisional iteration-31 wood stays exact; its color decision is the
      // explicit subject of the next aesthetic iteration.
      o.material = new THREE.MeshStandardMaterial({
        name: 'hearth_wood_runtime', map: textures.walnut, color: 0xb78355,
        roughness: 0.93, metalness: 0, envMapIntensity: 0.12,
      });
      o.material.userData.__woodConfigured = true;
      return;
    }
    // The 17 Blender-authored books keep their individual silhouettes but share
    // one packed painted atlas/material. Geometry-local UV crops provide
    // the variation without 17 GPU textures or 17 material clones.
    if (!Array.isArray(o.material) && o.material && o.material.name === 'baked_books') {
      remapBookToAtlas(o.geometry, bookCount, coverAtlasBounds(bookCount));
      o.userData.bookTextureIndex = bookCount;
      bookCount += 1;
      // Two draw groups when the front board was split off (spine cloth +
      // shared cover art); a material array without groups renders nothing,
      // so fall back to the single cloth material if the split didn't apply.
      o.material = o.geometry.groups.length === 2
        ? [bookMaterial, coverMaterial]
        : bookMaterial;
      return;
    }
    if (!Array.isArray(o.material) && o.material && o.material.name === 'baked_gilt') {
      o.material = giltMaterial;
      return;
    }
    if (!Array.isArray(o.material) && o.material && o.material.name === 'baked_pages') {
      o.material = pageBlockMaterial;
      return;
    }
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const material of mats) {
      if (!material || material.userData.__woodConfigured) continue;
      material.userData.__woodConfigured = true;
      material.metalness = 0;
      material.normalMap = null;
      material.bumpMap = null;
      material.displacementMap = null;
      material.roughnessMap = null;

      if (material.name === 'baked_walls') {
        wallMaterial = material;
        material.map = textures.wall;
        material.color.set(WALL_DIFFUSE);
        // The neutral quiet map remains a wall-only painted bounce term.
        material.emissiveMap = textures.wallBounce;
        material.emissive.set(WALL_EMISSIVE);
        material.emissiveIntensity = 0;
        material.roughness = 0.92;
        material.envMapIntensity = 0.18;
      } else if (material.name === 'baked_rug') {
        material.map = textures.rug;
        material.color.set('#ffffff');
        material.roughness = 0.97;
        material.envMapIntensity = 0.08;
      } else if (material.name === 'baked_beams') {
        material.map = textures.trim;
        material.color.set('#d9c5a3');
        material.roughness = 0.92;
        material.envMapIntensity = 0.18;
      } else if (material.name === 'baked_floor') {
        material.map = textures.trim;
        material.color.set('#d8cfbe');
        material.roughness = 0.90;
        material.envMapIntensity = 0.18;
      } else if (material.name === 'baked_window') {
        material.map = textures.trim;
        material.color.set('#fff8df');
        material.roughness = 0.92;
        material.envMapIntensity = 0.18;
      } else if (material.name === 'baked_walnut' || material.name === 'baked_walnutV') {
        material.map = textures.walnut;
        // Iter 23 (gap #2): warm honey tint. The iter-19 neutral grey (#e2e2e2)
        // left the walnut albedo (~#8a6a48, sat 32%) reading taupe after AgX;
        // multiplying by this honey pushes the desk/shelf toward TARGET's amber
        // (#ba7833 lit / #85531e mid) while keeping it darker than the walls.
        material.color.set('#eccf9e');
        material.roughness = 0.90;
        material.envMapIntensity = 0.20;
      } else if (material.name === 'baked_hardware') {
        material.map = null;
        material.color.set('#40342a');
        material.metalness = 0.45;
        material.roughness = 0.88;
        material.envMapIntensity = 0.20;
      }
      material.needsUpdate = true;
    }
  });
  // The open-book rig borrows this striated stock for its text-block sides,
  // so the desk book and the shelf books read as the same paper.
  return { pageBlockMaterial, wallMaterial };
}

// ---- dimensions (must match the Blender model exactly) ----
const WALL_Z = -2.2;
// Window centre/half-extent, confirmed directly against cabin.glb's
// WindowJamb/WindowFrame/Muntin node AABBs (world centre ≈ [-2.74, 4.11,
// -2.2]; jamb half-extent ≈1.36). The previous (0, 3.0)/1.7 values were stale
// — left over from an earlier model revision — and mis-aimed both the
// sunbeam shaft and the old fill light at the wrong spot on the back wall.
const WIN_C = new THREE.Vector2(-2.74, 4.11);
const WIN_R = 1.3;
const ROOM_W = 11;
const ROOM_H = 6.4;
// Desk stands against the LEFT wall, rotated 90° to face the bookshelf, and is
// trimmed to fit snugly to the back wall. Blender desktop spans x[-5.4,-3.26]
// (centre -4.33), y[-1.55,2.11] (centre 0.28), top surface z 2.15. Mapping
// three.x = blender.x, three.z = -blender.y, three.y = blender.z.
const DESK = {
  width: 3.66, depth: 2.14, topY: 2.07, z: -0.28,
  centerX: -4.33,          // three.js x of desktop centre
  rotY: -Math.PI / 2,      // face the bookshelf (-x); +90°Z in Blender = -90°Y here
};

export function buildRoom(cfg = {}) {
  const group = new THREE.Group();
  const interactives = [];
  let wallMaterial = null;
  let woodLoaded = 0;
  window.__woodTexturesReady = false;
  const markWoodReady = () => {
    woodLoaded += 1;
    if (woodLoaded === Object.keys(WOOD).length) window.__woodTexturesReady = true;
  };
  const textures = {
    wall: colorTexture(WOOD.wall, markWoodReady),
    wallBounce: colorTexture(WOOD.wallBounce, markWoodReady),
    trim: colorTexture(WOOD.trim, markWoodReady),
    walnut: colorTexture(WOOD.walnut, markWoodReady),
    rug: colorTexture(WOOD.rug, markWoodReady, false),
    bookSpine: colorTexture(WOOD.bookSpine, markWoodReady, false),
    bookCover: colorTexture(WOOD.bookCover, markWoodReady, false),
    giltLeaf: colorTexture(WOOD.giltLeaf, markWoodReady),
  };

  // anchors + metrics (synchronous — just numbers, used immediately by main.js)
  const win = { center: WIN_C, radius: WIN_R, z: WALL_Z };
  const windowAnchor = new THREE.Vector3(WIN_C.x, WIN_C.y, WALL_Z);
  const deskInfo = { ...DESK, surfaceY: DESK.topY + 0.08 };   // ≈ 2.15, the new shelf-bottom height
  // ONE cover-art material serves the open-book rig's boards (books.js) AND
  // the shelf meshes' front-board groups (applyRoomMaterials): identical map
  // and shading on either side of the flight→rig swap, so nothing can pop.
  const coverMaterial = new THREE.MeshStandardMaterial({
    name: 'ghibli_open_book_cover',
    map: textures.bookCover,
    color: 0xffffff,
    roughness: 0.91,
    metalness: 0,
    envMapIntensity: 0.18,
  });
  coverMaterial.userData.__woodConfigured = true;
  const books = createBookSystem({
    root: group,
    interactives,
    desk: deskInfo,
    coverMaterial,
  });
  const hearthFire = buildHearthFire();
  hearthFire.group.visible = false;
  group.add(hearthFire.group);
  try { window.__hearthFire = hearthFire; } catch (_) {}

  // ---- load the Blender model ----
  const loader = new GLTFLoader();
  loader.load(
    'assets/cabin.glb',
    (gltf) => {
      const model = gltf.scene;

      // Blender owns the UV orientation and hand-hewn silhouette; JS owns the
      // original painterly maps and finish so either can be tuned independently.
      const roomMaterials = applyRoomMaterials(model, textures, coverMaterial);
      wallMaterial = roomMaterials.wallMaterial;
      window.__cabinModel = model;   // capture/debug handle (clay form validation)
      model.traverse((o) => {
        if (!o.isMesh) return;
        // Shelf books cast like every other prop: the maps refresh on the tier
        // cadence (caps.shadowUpdateEvery), which tracks the slow hover tip.
        // Only a book IN FLIGHT is excluded (books.js prepareFlight), because a
        // volume crossing the sun beam mid-room throws a wall-sized shadow.
        // The rug needs depth/GTAO and received firelight but should not add a
        // full extra draw to every frozen shadow map.
        o.castShadow = o.name !== 'Rug';
        o.receiveShadow = true;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        // window woodwork: faint warm emissive so the muntins stay readable
        // against the dark glass at night (materials are shared per group, so
        // guard against re-applying on every mesh of the window group)
        if (/^(WindowFrame|WindowJamb|Sill|Muntin)/.test(o.name)) {
          for (const m of mats) {
            if (!m || m.userData.__winTint) continue;
            m.userData.__winTint = true;
            m.emissive = new THREE.Color(cfg.beam || '#fff0cf');
            m.emissiveIntensity = cfg.mode === 'night' ? 0.05 : 0.025;
          }
        }
      });
      group.add(model);
      const fireAnchor = model.getObjectByName('Hearth_Fire_Anchor');
      if (!hearthFire.bindAnchor(fireAnchor, {
        mouthWidth: 1.317642857,
        flameWidth: 0.72,
        flameHeight: 0.94,
        floorY: 0.54432,
        apexY: 1.92752,
        minZ: 3.471178571,
        maxZ: 4.788821429,
        depthX: -4.80375,
      })) {
        console.error('Missing Hearth_Fire_Anchor in cabin.glb');
        window.__hearthBindError = 'missing Hearth_Fire_Anchor';
      } else {
        hearthFire.group.visible = true;
      }
      // Bind after the GLB is parented so every saved shelf transform is in the
      // same root space used by the extraction/return animation.
      books.bind(model, roomMaterials.pageBlockMaterial);
      window.__cabinLoaded = true;
    },
    undefined,
    (err) => {
      console.error('Failed to load cabin.glb', err);
      window.__cabinLoadError = err;
    }
  );

  // ---- window glazing -------------------------------------------------------
  // A thin glass pane set into the aperture. Kept extremely subtle: a faint
  // Fresnel reflection of the daylight environment + a whisper of cool tint, so the
  // window reads as glazed rather than an open hole — without dimming the view or
  // the light through it. Two hard rules: it must NOT cast shadow (the masked-sun
  // sunpatch depends on the aperture staying physically open) and must NOT write
  // depth (so it never occludes the sky behind it). Reflections come from
  // scene.environment (set by lighting.js) via clearcoat Fresnel; envMap is read
  // automatically at render time once the environment exists. Lives in `group`, so
  // it hides while birding.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xeaf2ff, roughness: 0.04, metalness: 0.0,
    transparent: true, opacity: 0.06, depthWrite: false,
    clearcoat: 1.0, clearcoatRoughness: 0.04, envMapIntensity: 1.2,
  });
  glassMat.userData.__noClay = true;   // glazing must stay transparent
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN_R * 1.9, WIN_R * 1.9), glassMat);
  glass.position.set(WIN_C.x, WIN_C.y, WALL_Z + 0.12);   // room-side of the muntins, facing +z
  glass.castShadow = false; glass.receiveShadow = false;
  glass.renderOrder = 5;
  group.add(glass);

  function update(t) {
    books.update(t);
    hearthFire.update(t);
  }

  function applyTime(state) {
    const dayFactor = THREE.MathUtils.clamp(state?.dayFactor ?? 1, 0, 1);
    if (wallMaterial) wallMaterial.emissiveIntensity = THREE.MathUtils.lerp(0.02, 0.50, dayFactor);
    hearthFire.applyTime(state);
  }

  return {
    group, interactives, windowAnchor,
    win, desk: deskInfo, books, hearthFire,
    glass,                  // (js/outside.js thins it while the forest is in the window: see there)
    applyTime, update,
  };
}
