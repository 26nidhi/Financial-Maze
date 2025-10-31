// UI Manager for HUD, menus, and overlays
import * as THREE from "three";

export class UIManager {
  constructor(maze, controls, interactionManager, callbacks) {
    this.maze = maze;
    this.controls = controls;
    this.interactionManager = interactionManager;
    this.callbacks = callbacks;
    this.currentCheckpoint = null;

    this._bindEvents();
    this._setupInteractionHandler();
  }

  _bindEvents() {
    // Pause menu
    document
      .getElementById("resume-btn")
      .addEventListener("click", this.callbacks.onResume);
    document
      .getElementById("restart-btn")
      .addEventListener("click", this.callbacks.onRestart);
    document
      .getElementById("exit-btn")
      .addEventListener("click", this.callbacks.onExit);
    document
      .getElementById("restart-btn2")
      .addEventListener("click", this.callbacks.onRestart);

    // Pause game on Escape
    document.addEventListener("pause-game", () => {
      document.getElementById("pause-menu").classList.remove("hidden");
      this.callbacks.onPause();
    });

    // Decision buttons
    document.getElementById("option-save").addEventListener("click", () => {
      this._handleChoice(true);
    });
    document.getElementById("option-spend").addEventListener("click", () => {
      this._handleChoice(false);
    });
  }

  _setupInteractionHandler() {
    this.interactionManager.onCheckpointEntered = (checkpoint) => {
      this.currentCheckpoint = checkpoint;
      this._showCheckpointUI(checkpoint);
    };
  }

  _showCheckpointUI(checkpoint) {
    const ui = document.getElementById("checkpoint-ui");
    const question = document.getElementById("decision-question");
    question.textContent = checkpoint.question;
    ui.classList.remove("hidden");
    this.controls.enabled = false;
  }

  _handleChoice(isGoodChoice) {
    if (!this.currentCheckpoint) return;

    const feedback = document.getElementById("decision-feedback");
    feedback.textContent = isGoodChoice ? "✓ Good choice!" : "✗ Not optimal";

    this.callbacks.onChoice(this.currentCheckpoint, isGoodChoice);

    setTimeout(() => {
      document.getElementById("checkpoint-ui").classList.add("hidden");
      feedback.textContent = "";
      this.currentCheckpoint.active = false;
      this.currentCheckpoint = null;
      this.controls.enabled = true;
      this.interactionManager.currentCheckpoint = null;
    }, 1200);
  }

  update(dt, score) {
    document.getElementById("score-value").textContent = score;
    const maxScore = 2000;
    const barWidth = Math.max(0, Math.min(100, (score / maxScore) * 100));
    document.getElementById("score-bar").style.width = barWidth + "%";
  }

  animateScore(score, isPositive) {
    const panel = document.getElementById("score-panel");
    panel.classList.add("animated");
    setTimeout(() => panel.classList.remove("animated"), 300);
  }

  showResults(finalScore) {
    const resultsScreen = document.getElementById("results-screen");
    const finalScoreEl = document.getElementById("final-score");
    finalScoreEl.textContent = `Final Score: ${finalScore}`;
    resultsScreen.classList.remove("hidden");
  }
}
