import { Role, type PlayerState } from "../../../types/Player";

export class ScoreSystem {
  scene!: Phaser.Scene;
  coins = 0;
  scoreText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init() {
    this.coins = 0;
    this.scoreText = this.scene.add.text(20, 20, "Score: 0", {
      fontSize: "32px",
      color: "#fff",
    });
  }

  updateCoins(
    pipes: Phaser.GameObjects.Group,
    currentPlayerState: PlayerState,
  ) {
    if (currentPlayerState.role !== Role.BIRD) return;
    pipes.getChildren().forEach((pipe: any) => {
      if (pipe.getData("scored")) return;

      if (pipe.x + pipe.width < currentPlayerState.sprite.x) {
        if (pipe.y > currentPlayerState.sprite.y) {
          this.coins += 1;
          this.scoreText.setText(`Coins: ${this.coins}`);
          pipes.getChildren().forEach((p: any) => {
            if (Math.abs(p.x - pipe.x) < 10) p.setData("coins", true);
          });
        }
      }
    });
  }

  getScore(): number {
    return this.coins;
  }

  reset() {
    // this.score = 0;
    // this.scoreText.setText("Score: 0");
  }
}
