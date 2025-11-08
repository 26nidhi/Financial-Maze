// src/maze.js
import * as THREE from "three";

/**
 * createMaze(group, wallTexture, createDoorFn, createCheckpointFn)
 * - group: THREE.Group parent to attach walls/doors
 * - wallTexture: loaded texture
 * - createDoorFn: callback to create doors (returns door object)
 * - createCheckpointFn: callback to create checkpoints (returns cp object)
 */
export function createMaze(
  group,
  wallTexture,
  createDoorFn,
  createCheckpointFn
) {
  const cols = 11,
    rows = 11;
  const cell = 2;
  const halfW = (cols * cell) / 2;

  const wallGeom = new THREE.BoxGeometry(cell, 2.2, cell);
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTexture,
    roughness: 0.85,
  });

  // create border walls
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0 || c === 0 || r === rows - 1 || c === cols - 1) {
        const w = new THREE.Mesh(wallGeom, wallMat);
        w.position.set(
          c * cell - halfW + cell / 2,
          1.1,
          r * cell - halfW + cell / 2
        );
        w.userData.isWall = true;
        group.add(w);
      }
    }
  }

  // manual internal walls (simple sample)
  const addWallAt = (cx, cz) => {
    const w = new THREE.Mesh(wallGeom, wallMat);
    w.position.set(
      cx * cell - halfW + cell / 2,
      1.1,
      cz * cell - halfW + cell / 2
    );
    w.userData.isWall = true;
    group.add(w);
  };

  addWallAt(5, 3);
  addWallAt(3, 5);
  addWallAt(6, 6);
  addWallAt(2, 8);

  // create one door and checkpoint pair (you can create many pairs)
  const doorPos = new THREE.Vector3(0, 1, -4);
  const door = createDoorFn(doorPos);
  if (door && door.mesh) group.add(door.mesh);

  const cpPos = new THREE.Vector3(0, 0.05, -6);
  const cp = createCheckpointFn(cpPos, {
    question: "Saving vs Spending?",
    goodEffect: (updateScore) => {
      updateScore(+500);
      if (door) door.open();
    },
    badEffect: (updateScore) => {
      updateScore(-200);
      if (door) door.close();
    },
  });
  if (cp && cp.mesh) group.add(cp.mesh);
}
