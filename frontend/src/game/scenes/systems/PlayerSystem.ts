import type { PlayerState } from "../../../types/Player";
import { Role } from "../../../types/Player";

export class PlayerSystem {
  scene!: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createBird(playerState: PlayerState, type: string, gravityY = 800) {
    const bird = this.scene.physics.add.sprite(
      220,
      this.scene.scale.height / 2,
      type,
    );

    bird.setCollideWorldBounds(true);
    (bird.body as Phaser.Physics.Arcade.Body).setGravityY(gravityY);

    bird.setCircle(12);

    playerState.sprite = bird;
    bird.setScale(0.2);
    bird.setVisible(false);
    return bird;
  }

  createHunter(_playerState: PlayerState) {
    // playerState.sprite = this.scene.physics.add.sprite(0, 0, "hero");
    // playerState.sprite.active = false;
  }

  flap(playerState: PlayerState) {
    playerState.sprite.setVelocityY(-350);
    this.scene.tweens.add({
      targets: playerState.sprite,
      angle: -20,
      duration: 100,
    });
  }

  update(playersStates: Record<number, PlayerState>) {
    Object.values(playersStates).forEach((playerState) => {
      if (playerState.role === Role.BIRD && playerState.sprite) {
        playerState.sprite.angle = Phaser.Math.Clamp(
          (playerState.sprite.body as Phaser.Physics.Arcade.Body).velocity.y /
            6,
          -20,
          90,
        );
      }
    });
  }
}
