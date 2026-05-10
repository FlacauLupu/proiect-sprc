import type { PlayerState } from "../../../types/Player";
import seedrandom from "seedrandom";

export class PipeSystem {
  scene!: Phaser.Scene;
  pipeSeed!: seedrandom.PRNG;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  initSeed(players: Record<number, PlayerState>) {
    const seedBuilder = Object.keys(players)
      .map(Number)
      .sort((a, b) => a - b)
      .join("");
    this.pipeSeed = seedrandom(seedBuilder);
  }

  spawn(pipes: Phaser.GameObjects.Group) {
    const { width, height } = this.scene.scale;
    const rng = this.pipeSeed;

    const gap = 140 + rng() * (220 - 140);
    const centerY = 150 + rng() * (height - 300);
    const pipeWidth = 40; // Mai subțire, potrivit pentru laser
    const pipeX = width + pipeWidth;

    const topHeight = centerY - gap / 2;
    const bottomHeight = height - (centerY + gap / 2);

    // LASER DE SUS
    const top = this.scene.add
      .image(pipeX, 0, "laser")
      .setOrigin(0, 0)
      .setDisplaySize(pipeWidth, topHeight);

    this.scene.physics.add.existing(top);
    const topBody = top.body as Phaser.Physics.Arcade.Body;
    topBody.setSize(pipeWidth, topHeight);
    topBody.setVelocityX(-200);
    topBody.setImmovable(true);
    topBody.allowGravity = false;
    top.setData("scored", false);
    top.setData("isScoreTrigger", true);

    top.setInteractive();
    top.on(
      "pointerdown",
      (pointer: any, localX: number, localY: number, event: any) => {
        if (event && event.stopPropagation) event.stopPropagation();
        this.selectPipe(top);
      },
      this,
    );

    // LASER DE JOS
    const bottom = this.scene.add
      .image(pipeX, centerY + gap / 2, "laser")
      .setOrigin(0, 0)
      .setDisplaySize(pipeWidth, bottomHeight);

    this.scene.physics.add.existing(bottom);
    const bottomBody = bottom.body as Phaser.Physics.Arcade.Body;
    bottomBody.setSize(pipeWidth, bottomHeight);
    bottomBody.setVelocityX(-200);
    bottomBody.setImmovable(true);
    bottomBody.allowGravity = false;
    bottom.setData("scored", false);
    bottom.setData("isScoreTrigger", false);

    bottom.setInteractive();
    bottom.on(
      "pointerdown",
      (pointer: any, localX: number, localY: number, event: any) => {
        if (event && event.stopPropagation) event.stopPropagation();
        this.selectPipe(bottom);
      },
      this,
    );

    pipes.add(top);
    pipes.add(bottom);
  }

  cleanup(pipes: Phaser.GameObjects.Group) {
    pipes.getChildren().forEach((pipe: any) => {
      if (pipe.x < -100) {
        if (pipe.body) (pipe.body as Phaser.Physics.Arcade.Body).destroy();
        pipe.destroy();
      }
    });
  }

  selectPipe(pipe: any) {
    const previousSelected = this.scene.data.get("selectedPipe");
    if (previousSelected) {
      previousSelected.setStrokeStyle?.(0);
      previousSelected.clearTint?.();
    }
    this.scene.data.set("selectedPipe", pipe);
    // TileSprite nu are setStrokeStyle, așa că folosim tint pentru a marca selecția
    pipe.setTint?.(0xffff00);
  }

  moveSelected(deltaY: number) {
    const selectedPipe = this.scene.data.get("selectedPipe");
    if (!selectedPipe) return;

    selectedPipe.y += deltaY;
    if (selectedPipe.body) {
      const b = selectedPipe.body as Phaser.Physics.Arcade.Body;
      b.y = selectedPipe.y;
      b.setSize(selectedPipe.width, selectedPipe.height);
      b.setVelocityX(-200);
      b.updateFromGameObject();
    }
  }

  clearSelection() {
    const selectedPipe = this.scene.data.get("selectedPipe");
    if (selectedPipe) {
      selectedPipe.setStrokeStyle?.(0);
      selectedPipe.clearTint?.();
      this.scene.data.set("selectedPipe", null);
    }
  }
}
