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
    this.scoreText = this.scene.add.text(20, 20, "Coins: 0", {
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
      if (!pipe.getData("isScoreTrigger")) return; // skip pipe-ul de jos
      if (pipe.getData("scored")) return; // deja punctat

      if (pipe.x + pipe.width < currentPlayerState.sprite.x) {
        pipe.setData("scored", true);
        this.coins += 10;
        this.scoreText.setText(`Coins: ${this.coins}`);
      }
    });
  }

  getScore(): number {
    return this.coins;
  }

  reset() {
    this.coins = 0;
    this.scoreText.setText("Coins: 0");
  }
}
