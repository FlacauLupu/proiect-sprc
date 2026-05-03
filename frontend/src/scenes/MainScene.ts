import Phaser from "phaser";
import type { PlayerState } from "../types/Player";
import Denque from "denque";
import { checkInGameEvents } from "../utils/checkEvents";
import seedrandom from "seedrandom";
import {
  dispatchPlayerDeath,
  dispatchPlayerJump,
} from "../utils/WebSocketCommands";
import type { Player } from "../types/Player";
import { Role } from "../types/Player";

type BirdType = Phaser.Physics.Arcade.Sprite;

export default class MainScene extends Phaser.Scene {
  currentPlayerState!: PlayerState;
  players!: Record<number, Player>;
  playersCount!: number;
  birds!: Record<number, PlayerState>;
  hunter!: PlayerState;

  pipes!: Phaser.GameObjects.Group;
  pipeSeed!: seedrandom.PRNG;

  score = 0;
  scoreText!: Phaser.GameObjects.Text;
  pipeTimer?: Phaser.Time.TimerEvent;
  selectedPipe: Phaser.GameObjects.Rectangle | null = null;

  rounds!: number;
  currentRound!: number;

  jumpQueue: Denque = new Denque();
  playersOutQueue: Denque = new Denque();
  seenEvents: Set<number> = new Set<number>();
  lastEventIdProcessed = 0;

  socket!: WebSocket;
  socketBound = false;

  isGameReady = false;

  constructor() {
    super({ key: "MainScene" });
  }
  enEvents = new Set<number>();

  init(data: any) {
    this.socket = data.socket;
    // this.currentPlayer = data.currentPlayer;
    // this.players = data.players;
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

  setupRound() {
    this.hunter = {
      player: Object.values(this.players)[this.currentRound],
      role: Role.HUNTER,
      sprite: 
    };
  }

  setupGame() {
    if (this.socket && !this.socketBound) {
      checkInGameEvents(
        this.socket,
        this.jumpQueue,
        this.playersOutQueue,
        this.seenEvents,
      );

      this.socketBound = true;
    }

    const currentPlayerRaw = sessionStorage.getItem("player");
    const playersRaw = sessionStorage.getItem("players");

    try {
      if (!currentPlayerRaw || !playersRaw) {
        console.log("Game stats are not defined");
        this.time.delayedCall(100, () => this.setupGame());
        return;
      }
      this.isGameReady = true;

      const parsedCurrentPlayer = JSON.parse(currentPlayerRaw);
      const parsedPlayers = JSON.parse(playersRaw);

      this.birds = {};

      parsedPlayers.forEach((p: Player) => {
        this.birds[p.id] = {
         player: p,
         role: Role.NONE,
          sprite: null as any,
        };
      });

      const seedBuilder = Object.keys(this.players)
        .map(Number)
        .sort((a, b) => a - b)
        .join("");
      this.pipeSeed = seedrandom(seedBuilder);

      this.currentPlayerState = {
             player: parsedCurrentPlayer,
         role: Role.NONE,
          sprite: null as any,
      };

      this.playersCount = this.players ? Object.keys(this.players).length : 1;
      this.rounds = this.playersCount;
      this.currentRound = 1;
    } catch (err) {
      console.error("Invalid game state in storage");
    }

    const { width, height } = this.scale;
    this.physics.world.setBounds(0, 0, width, height);

    Object.values(this.players).forEach((player) => {
      if (player.id !== this.currentPlayerState.player.id)
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
        } else console.log("SOCKET IS NULL");
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

  create() {
    console.log("MainScene CREATED");
    this.setupGame();
  }
  update() {
    if (this.isGameReady) this.updateGame();
    else console.log("Game is not ready");
  }

  updateGame() {
    while (!this.jumpQueue.isEmpty()) {
      const playerId = this.jumpQueue.shift();

      const playerState = this.birds[playerId];
      if (!playerState || !playerState.sprite || !(playerState.role === Role.BIRD)) {
        console.log("player is null");
        continue;
      }

      this.flap(playerState);
    }

    while (!this.playersOutQueue.isEmpty()) {
      const playerThatLeft = this.playersOutQueue.shift();
      this.birds[playerThatLeft].sprite.active = false;
      this.birds[playerThatLeft].sprite.setTint(0xff0000);

      this.playersCount--;
      if (this.playersCount === 0) this.gameOver();
    }

    Object.values(this.birds).forEach((bird) => {
      bird.sprite.angle = Phaser.Math.Clamp(
        (bird.sprite.body as Phaser.Physics.Arcade.Body).velocity.y / 6,
        -20,
        90,
      );
    });

    this.pipes.getChildren().forEach((pipe: any) => {
      if (pipe.getData("scored")) return;

      if ()

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

  executePowerUp() {}

  createBird(player: PlayerState, type: string) {
    const bird = this.physics.add.sprite(220, this.scale.height / 2, type);
    bird.setCollideWorldBounds(true);
    (bird.body as Phaser.Physics.Arcade.Body).setGravityY(800);
    bird.setCircle(12);
    player.sprite = bird;
    return bird;
  }

  createHunter(player: PlayerState) {
    // de modificat appereance-ul hunterului

     player.sprite = this.physics.add.sprite(0, 0,"hunter")
  }

  flap(playerState: PlayerState) {
    playerState.sprite.setVelocityY(-350);
    this.tweens.add({
      targets: playerState.sprite,
      angle: -20,
      duration: 100,
    });
    if (playerState.sprite.y <= 0 || playerState.sprite.y >= this.scale.height)
      this.setPlayerDeath(playerState);
  }

  spawnPipes() {
    const { width, height } = this.scale;

    const rng = this.pipeSeed;

    const gap = 140 + rng() * (220 - 140);
    const centerY = 150 + rng() * (height - 300);
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

  setPlayerDeath(playerState: PlayerState) {
    if (this.socket) dispatchPlayerDeath(this.socket, playerState.player.id);
  }

  gameOver() {
    console.log("game over");
    this.physics.pause();
    this.pipeTimer?.remove(false);
  }
}
