export interface Player {
    id: number,
    username: string,
    coins: number,
    skill: number,
    bird?: Phaser.Physics.Arcade.Sprite
}