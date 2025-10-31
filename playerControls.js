// Handles player movement, camera, and collision in the maze
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

export class PlayerControls {
  constructor(camera, scene, maze) {
    this.camera = camera;
    this.scene = scene;
    this.maze = maze;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.moveState = { forward: 0, back: 0, left: 0, right: 0 };
    this.enabled = false;
    this.playerObj = new THREE.Object3D(); // Capsule collider parent
    this.playerObj.position.set(1.5, 1.2, 1.5);
    this.capsule = { radius: 0.34, height: 1.45 };

    // Camera setup
    this.camera.position.set(0, 1.3, 0);
    this.playerObj.add(this.camera);
    scene.add(this.playerObj);

    // Pointer lock controls (mouse look)
    this.controls = new PointerLockControls(this.camera, document.body);
    this.scene.add(this.controls.getObject());

    // Head-bob
    this.bobTime = 0;

    // Input listeners
    this._bindEvents();
  }

  _bindEvents() {
    document.addEventListener("keydown", (e) => this._onKey(e, true));
    document.addEventListener("keyup", (e) => this._onKey(e, false));
    document.body.addEventListener("click", () => {
      if (!this.enabled) this.controls.lock();
    });
    this.controls.addEventListener("lock", () => {
      this.enabled = true;
    });
    this.controls.addEventListener("unlock", () => {
      this.enabled = false;
    });
  }

  _onKey(e, down) {
    switch (e.code) {
      case "KeyW":
        this.moveState.forward = down ? 1 : 0;
        break;
      case "KeyS":
        this.moveState.back = down ? 1 : 0;
        break;
      case "KeyA":
        this.moveState.left = down ? 1 : 0;
        break;
      case "KeyD":
        this.moveState.right = down ? 1 : 0;
        break;
      case "Escape":
        document.dispatchEvent(new CustomEvent("pause-game"));
        break;
    }
  }

  update(dt) {
    if (!this.enabled) return;

    // Calculate direction
    this.direction.set(0, 0, 0);
    if (this.moveState.forward) this.direction.z -= 1;
    if (this.moveState.back) this.direction.z += 1;
    if (this.moveState.left) this.direction.x -= 1;
    if (this.moveState.right) this.direction.x += 1;
    this.direction.normalize();

    // Acceleration and Damping
    const speed = 4.1;
    this.velocity.x += this.direction.x * speed * dt;
    this.velocity.z += this.direction.z * speed * dt;
    this.velocity.multiplyScalar(0.82);

    // Move player
    let move = this.velocity.clone().multiplyScalar(dt);
    // Collision with maze
    move = this.maze.resolveCollision(
      this.playerObj.position,
      move,
      this.capsule
    );

    this.playerObj.position.add(move);

    // Head-bob (if moving)
    if (this.direction.length() > 0.01) {
      this.bobTime += dt * 7.6;
      this.camera.position.y = 1.25 + Math.sin(this.bobTime) * 0.07;
    } else {
      this.camera.position.y = 1.25;
      this.bobTime = 0;
    }
  }
}
