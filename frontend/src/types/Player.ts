export interface Player {
  id: number;
  username: string;
  coins: number;
  skill: number;
}

export interface PlayerState {
  player: Player;
  role: Role;
  sprite: Phaser.Physics.Arcade.Sprite;
}

export const Role = {
  NONE: "NONE",
  BIRD: "BIRD",
  HUNTER: "HUNTER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
