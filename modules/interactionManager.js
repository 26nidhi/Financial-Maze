// Handles interaction triggers: checkpoint proximity, doors, exit
import * as THREE from "three";
import gsap from "gsap";

export class InteractionManager {
  constructor(scene, player, maze, controls) {
    this.scene = scene;
    this.player = player;
    this.maze = maze;
    this.controls = controls;
    this.currentCheckpoint = null;
    this.onCheckpointEntered = null;
    this.onExitReached = null;
    this._setup();
  }

  _setup() {
    // Listen for E/Space for interaction
    document.addEventListener("keydown", (e) => {
      if (this.currentCheckpoint && (e.code === "KeyE" || e.code === "Space")) {
        if (this.onCheckpointEntered)
          this.onCheckpointEntered(this.currentCheckpoint);
      }
    });
  }

  update(dt) {
    if (!this.currentCheckpoint) {
      // Check proximity to checkpoints
      for (let cp of this.maze.checkpoints) {
        if (!cp.active) continue;
        let dist = this.player.position.distanceTo(
          new THREE.Vector3(cp.pos.x, 1.2, cp.pos.z)
        );
        if (dist < 1.25) {
          this.currentCheckpoint = cp;
          document
            .getElementById("interaction-hint")
            .classList.remove("hidden");
          break;
        }
      }
    } else {
      // Still in zone?
      let cp = this.currentCheckpoint;
      let dist = this.player.position.distanceTo(
        new THREE.Vector3(cp.pos.x, 1.2, cp.pos.z)
      );
      if (dist > 1.4) {
        this.currentCheckpoint = null;
        document.getElementById("interaction-hint").classList.add("hidden");
      }
    }

    // Check for exit gate
    let exit = this.maze.exitGate;
    if (exit && this.player.position.distanceTo(exit.position) < 1.1) {
      if (this.onExitReached) this.onExitReached();
    }
  }

  openDoor(doorId) {
    let door = this.maze.doors[doorId];
    if (!door) return;
    // Animate door open (slide up)
    gsap.to(door.position, { y: 4.2, duration: 0.9, ease: "power2.in" });
    // Glow to green
    door.material.emissive.setHex(0x2efc7b);
    door.material.color.setHex(0x2efc7b);
    // Remove collision for this door
    setTimeout(() => {
      this.maze.doors[doorId] = null;
    }, 850);
  }

  blockDoor(doorId) {
    let door = this.maze.doors[doorId];
    if (!door) return;
    // Animate door red pulse
    gsap.to(door.material.emissive, {
      r: 1,
      g: 0,
      b: 0,
      duration: 0.14,
      yoyo: true,
      repeat: 2,
    });
    // Optionally add "locked" effect (not implemented)
  }

  setOnExitReached(cb) {
    this.onExitReached = cb;
  }
}
