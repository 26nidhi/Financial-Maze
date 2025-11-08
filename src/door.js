// src/door.js
import * as THREE from "three";

export const doors = []; // exported list for animation loop

export function createDoor(position, texture) {
  // when called from maze.js we pass only position; but later you can pass textures
  const geom = new THREE.BoxGeometry(1.8, 2.4, 0.16);
  const mat = new THREE.MeshStandardMaterial({ color: 0x4b2e1f });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.position.copy(position);

  mesh.userData.isDoor = true;
  mesh.userData.open = false;

  const door = {
    mesh,
    openT: 0,
    open() {
      mesh.userData.open = true;
    },
    close() {
      mesh.userData.open = false;
    },
  };

  doors.push(door);
  return door;
}

export function animateDoors(dt) {
  for (const d of doors) {
    const target = d.mesh.userData.open ? 1 : 0;
    d.openT += (target - d.openT) * Math.min(1, dt * 3);
    // sliding upward for open effect
    d.mesh.position.y = 1.2 + d.openT * 2.4;
    // optionally fade or rotate when open
  }
}
