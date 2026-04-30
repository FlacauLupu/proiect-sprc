import Phaser from "phaser";
import type { PlayerState } from "../types/Player";
import Denque from "denque";
import { checkInGameEvents } from "../utils/checkEvents";
import {
  dispatchPlayerDeath,
  dispatchPlayerJump,
} from "../utils/WebSocketCommands";
import type { Player } from "../types/Player";

import { initializeHandshake } from "../utils/WebSocketConnection";

type BirdType = Phaser.Physics.Arcade.Sprite;

export default class MainScene extends Phaser.Scene {
  currentPlayer!: PlayerState;
  players!: Record<number, PlayerState>;
  playersCount!: number;

  pipes!: Phaser.GameObjects.Group;
  score = 0;
  scoreText!: Phaser.GameObjects.Text;
  pipeTimer?: Phaser.Time.TimerEvent;
  selectedPipe: Phaser.GameObjects.Rectangle | null = null;

  jumpQueue!: Denque;
  playersOutQueue!: Denque;
  seenEvents!: Set<number>;
  lastEventIdProcessed = 0;

  socket!: WebSocket;
  socketBound = false;

  constructor() {
    super({ key: "MainScene" });
  }

  setupGame(data: any) {
    this.currentPlayer = data.currentPlayer;
    this.players = data.players;
    this.socket = data.socket;

    this.playersCount = this.players ? Object.keys(this.players).length : 1;

    this.jumpQueue = new Denque();
    this.playersOutQueue = new Denque();
    this.seenEvents = new Set<number>();
  }

  init(data: any) {
    this.setupGame(data);

    let tempPlayer = sessionStorage.getItem("player");
    let tempPlayers = sessionStorage.getItem("players");

    if (tempPlayer && tempPlayers) {
      const parsedCurrent: Player = JSON.parse(tempPlayer);
      const parsedPlayers: Array<Player> = JSON.parse(tempPlayers);

      this.players = {};
      parsedPlayers.forEach((p) => {
        this.players[p.id] = { playerId: p.id, bird: null as any };
      });

      this.currentPlayer = {
        playerId: parsedCurrent.id,
        bird: null as any,
      };
      console.log(
        "INIT DATA:" +
          JSON.stringify(this.players) +
          JSON.stringify(this.currentPlayer),
      );

      this.socket = initializeHandshake();
    }
  }

  preload() {
    const g = this.add.graphics();
    g.fillStyle(0xff0000, 1);
    g.fillCircle(16, 16, 16);
    g.generateTexture("enemy", 32, 32);
    g.clear();
    g.fillStyle(0x0000ff, 1);
    g.fillCircle(16, 16, 16);
    g.generateTexture("player", 32, 32);
    g.clear();
    g.fillStyle(0x00aa00, 1);
    g.fillRect(0, 0, 64, 64);
    g.generateTexture("pipe", 64, 64);
    g.destroy();
  }

  create() {
    if (this.socket && !this.socketBound) {
      checkInGameEvents(
        this.socket,
        this.jumpQueue,
        this.playersOutQueue,
        this.seenEvents,
      );

      this.socketBound = true;
    }

    const { width, height } = this.scale;
    this.physics.world.setBounds(0, 0, width, height);

    Object.values(this.players).forEach((player) => {
      if (player.playerId !== this.currentPlayer.playerId)
        this.createBird(player, "enemy");
      else this.createBird(player, "player");
      this.pipes = this.add.group();

      this.physics.add.overlap(
        player.bird,
        this.pipes,
        () => {
          this.setPlayerDeath(player);
        },
        undefined,
        this,
      );
    });

    this.currentPlayer.bird = this.players[this.currentPlayer.playerId].bird;

    this.input.keyboard?.on(
      "keydown-SPACE",
      () => {
        if (this.socket) {
          dispatchPlayerJump(this.socket, this.currentPlayer.playerId);
          console.log("dipatch jump");
        }
      },
      this,
    );

    this.scoreText = this.add.text(20, 20, "Score: 0", {
      fontSize: "32px",
      color: "#fff",
    });

    this.pipeTimer = this.time.addEvent({
      delay: 1400,
      callback: this.spawnPipes,
      callbackScope: this,
      loop: true,
    });
  }
  update() {
    while (!this.jumpQueue.isEmpty()) {
      const playerId = this.jumpQueue.shift();
      console.log("Player that jumped: " + playerId);

      const player = this.players[playerId];
      if (!player || !player.bird) continue;

      this.flap(player);
    }

    while (!this.playersOutQueue.isEmpty()) {
      console.log("from server");
      const playerThatLeft = this.playersOutQueue.shift();
      this.players[playerThatLeft].bird.active = false;
      this.players[playerThatLeft].bird.setTint(0xff0000);

      this.playersCount--;
      if (this.playersCount === 0) this.gameOver();
    }

    Object.values(this.players).forEach((player) => {
      player.bird.angle = Phaser.Math.Clamp(
        (player.bird.body as Phaser.Physics.Arcade.Body).velocity.y / 6,
        -20,
        90,
      );
    });

    this.pipes.getChildren().forEach((pipe: any) => {
      if (pipe.getData("scored")) return;
      if (pipe.x + pipe.width < this.currentPlayer.bird.x) {
        if (pipe.y > this.currentPlayer.bird.y) {
          this.score += 1;
          this.scoreText.setText(`Score: ${this.score}`);
          this.pipes.getChildren().forEach((p: any) => {
            if (Math.abs(p.x - pipe.x) < 10) p.setData("scored", true);
          });
        }
      }
    });

    this.pipes.getChildren().forEach((pipe: any) => {
      if (pipe.x < -100) {
        if (pipe.body) (pipe.body as Phaser.Physics.Arcade.Body).destroy();
        pipe.destroy();
      }
    });

    Object.values(this.players).forEach((player) => {
      if (player.bird.y > this.scale.height || player.bird.y < 0) {
        if (this.socket) dispatchPlayerDeath(this.socket, player.playerId);
      }
    });
  }

  createBird(player: PlayerState, type: string) {
    const bird = this.physics.add.sprite(220, this.scale.height / 2, type);
    bird.setCollideWorldBounds(true);
    (bird.body as Phaser.Physics.Arcade.Body).setGravityY(800);
    bird.setCircle(12);
    player.bird = bird;
    console.log(JSON.stringify(player.bird));
    return bird;
  }

  flap(player: PlayerState) {
    player.bird.setVelocityY(-350);
    this.tweens.add({
      targets: player.bird,
      angle: -20,
      duration: 100,
    });
    if (player.bird.y <= 0 || player.bird.y >= this.scale.height)
      this.setPlayerDeath(player);
  }

  spawnPipes() {
    const { width, height } = this.scale;
    const gap = Phaser.Math.Between(140, 220);
    const centerY = Phaser.Math.Between(150, height - 150);
    const pipeWidth = 96;
    const pipeX = width + pipeWidth;

    const topHeight = centerY - gap / 2;
    const bottomHeight = height - (centerY + gap / 2);

    const top = this.add
      .rectangle(pipeX, 0, pipeWidth, topHeight, 0x00aa00)
      .setOrigin(0, 0);
    // @ts-ignore
    this.physics.add.existing(top);
    const topBody = top.body as Phaser.Physics.Arcade.Body;
    topBody.setVelocityX(-200);
    topBody.setImmovable(true);
    topBody.allowGravity = false;
    top.setData("scored", false);

    top.setInteractive();
    top.on(
      "pointerdown",
      (pointer: any, localX: number, localY: number, event: any) => {
        if (event && event.stopPropagation) event.stopPropagation();
        this.selectPipe(top);
      },
      this,
    );

    const bottom = this.add
      .rectangle(pipeX, centerY + gap / 2, pipeWidth, bottomHeight, 0x00aa00)
      .setOrigin(0, 0);
    // @ts-ignore
    this.physics.add.existing(bottom);
    const bottomBody = bottom.body as Phaser.Physics.Arcade.Body;
    bottomBody.setVelocityX(-200);
    bottomBody.setImmovable(true);
    bottomBody.allowGravity = false;
    bottom.setData("scored", false);

    bottom.setInteractive();
    bottom.on(
      "pointerdown",
      (pointer: any, localX: number, localY: number, event: any) => {
        if (event && event.stopPropagation) event.stopPropagation();
        this.selectPipe(bottom);
      },
      this,
    );

    this.pipes.add(top);
    this.pipes.add(bottom);
  }

  selectPipe(pipe: any) {
    if (this.selectedPipe) {
      this.selectedPipe.setStrokeStyle(0);
    }
    this.selectedPipe = pipe;
    pipe.setStrokeStyle(4, 0xffff00);
  }

  moveSelected(deltaY: number) {
    if (!this.selectedPipe) return;
    this.selectedPipe.y += deltaY;
    // @ts-ignore
    if (this.selectedPipe.body) {
      const b = this.selectedPipe.body as Phaser.Physics.Arcade.Body;
      b.y = this.selectedPipe.y;
      // keep velocity
      b.setSize(
        (this.selectedPipe as any).width,
        (this.selectedPipe as any).height,
      );
      b.setVelocityX(-200);
      // @ts-ignore
      b.updateFromGameObject();
    }
  }

  clearSelection() {
    if (this.selectedPipe) {
      this.selectedPipe.setStrokeStyle(0);
      this.selectedPipe = null;
    }
  }

  setPlayerDeath(player: PlayerState) {
    console.log("player death called");
    if (this.socket) dispatchPlayerDeath(this.socket, player.playerId);
  }

  gameOver() {
    console.log("game over");
    this.physics.pause();
    this.pipeTimer?.remove(false);
  }
}
