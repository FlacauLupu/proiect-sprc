export interface Player {
  id: number;
  username: string;
  coins: number;
  skill: number;
}

export interface PlayerState {
  playerId: number;
  bird: Phaser.Physics.Arcade.Sprite;
}
