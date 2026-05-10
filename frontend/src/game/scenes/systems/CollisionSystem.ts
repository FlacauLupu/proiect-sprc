import { Role, type PlayerState } from "../../../types/Player";
import { NetworkSystem } from "./NetworkSystem";

export class CollisionSystem {
  scene!: Phaser.Scene;
  networkSystem!: NetworkSystem;

  constructor(scene: Phaser.Scene, networkSystem: NetworkSystem) {
    this.scene = scene;
    this.networkSystem = networkSystem;
  }

  setupCollisions(
    playersStates: Record<number, PlayerState>,
    pipes: Phaser.GameObjects.Group,
  ) {
    Object.values(playersStates).forEach((playerState) => {
      if (playerState.role === Role.BIRD)
        if (playerState.sprite) {
          this.scene.physics.add.overlap(
            playerState.sprite,
            pipes,
            () => {
              this.handlePlayerDeath(playerState);
            },
            undefined,
            this,
          );
        }
    });
  }

  checkBoundaryCollisions(playersStates: Record<number, PlayerState>) {
    Object.values(playersStates).forEach((playerState) => {
      if (playerState.role === Role.BIRD)
        if (
          playerState.sprite.y > this.scene.scale.height ||
          playerState.sprite.y < 0
        ) {
          this.handlePlayerDeath(playerState);
        }
    });
  }

  handlePlayerDeath(playerState: PlayerState) {
    this.networkSystem.sendDeath(playerState.player.id);
  }

  markPlayerDead(playerState: PlayerState) {
    if (playerState.sprite) {
      playerState.sprite.active = false;
      playerState.sprite.setVisible(false);
    }

    const playerName =
      playerState.player.username ?? `Player ${playerState.player.id}`;

    const deathText = this.scene.add
      .text(
        this.scene.scale.width / 2,
        this.scene.scale.height / 2,
        `${playerName} has died!`,
        {
          fontSize: "48px",
          color: "#ff0000",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5)
      .setDepth(1000);

    this.scene.tweens.add({
      targets: deathText,
      alpha: 0,
      duration: 500,
      delay: 1500,
      onComplete: () => deathText.destroy(),
    });
  }
}
