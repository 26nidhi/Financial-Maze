// src/player.js
import * as THREE from "three";

let controlsRef = null;
let cameraRef = null;
let mazeRef = null;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const move = { forward: false, back: false, left: false, right: false };

export function setupPlayer(camera, controls, mazeGroup) {
  cameraRef = camera;
  controlsRef = controls;
  mazeRef = mazeGroup;

  // keyboard handlers
  const onKey = (e) => {
    const isDown = e.type === "keydown";
    if (e.code === "KeyW") move.forward = isDown;
    if (e.code === "KeyS") move.back = isDown;
    if (e.code === "KeyA") move.left = isDown;
    if (e.code === "KeyD") move.right = isDown;
  };
  document.addEventListener("keydown", onKey);
  document.addEventListener("keyup", onKey);
}

export function updatePlayer(dt, camera, mazeGroup) {
  if (!controlsRef || !controlsRef.isLocked) return;

  const speed = 3.0;
  direction.set(0, 0, 0);
  if (move.forward) direction.z -= 1;
  if (move.back) direction.z += 1;
  if (move.left) direction.x -= 1;
  if (move.right) direction.x += 1;

  if (direction.lengthSq() > 0) direction.normalize();

  // world-space movement
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3()
    .crossVectors(new THREE.Vector3(0, 1, 0), forward)
    .normalize();

  const moveVec = new THREE.Vector3();
  moveVec.addScaledVector(forward, -direction.z);
  moveVec.addScaledVector(right, direction.x);
  if (moveVec.lengthSq() > 0) moveVec.normalize();

  // propose position
  const newPos = camera.position
    .clone()
    .add(moveVec.multiplyScalar(speed * dt));

  // very simple collision: cast ray from newPos to nearby walls, prevent movement when close
  if (!collides(newPos, mazeGroup)) {
    camera.position.copy(newPos);
  }
}

export function playerPosition() {
  return cameraRef ? cameraRef.position.clone() : new THREE.Vector3();
}

function collides(pos, mazeGroup) {
  // cast a small sphere test vs wall boxes (very simple)
  const testRadius = 0.5;
  for (const obj of mazeGroup.children) {
    if (obj.userData.isWall || obj.userData.isDoor) {
      const box = new THREE.Box3().setFromObject(obj);
      // expand box by -testRadius so we detect when player would intersect
      box.expandByScalar(-testRadius);
      if (box.containsPoint(pos)) return true;
    }
  }
  return false;
}
