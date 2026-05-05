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
              // this.handlePlayerDeath(playerState);
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
          // this.handlePlayerDeath(playerState);
        }
    });
  }

  handlePlayerDeath(playerState: PlayerState) {
    this.networkSystem.sendDeath(playerState.player.id);
  }

  markPlayerDead(playerState: PlayerState) {
    if (playerState.sprite) {
      playerState.sprite.active = false;
    }
  }
}
