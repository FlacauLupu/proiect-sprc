import Phaser from "phaser";
import type { PlayerState } from "../../types/Player";
import Denque from "denque";
import { Role } from "../../types/Player";
import { InitSystem } from "./systems/InitSystem";
import { PipeSystem } from "./systems/PipeSystem";
import { PlayerSystem } from "./systems/PlayerSystem";
import { NetworkSystem } from "./systems/NetworkSystem";
import { ScoreSystem } from "./systems/ScoreSystem";
import { CollisionSystem } from "./systems/CollisionSystem";
import type { RefObject } from "react";
import type { ResponseType } from "../../types/ResponseType";
import { dispatchReady } from "../../utils/WebSocketCommands";

export default class MainScene extends Phaser.Scene {
  // Game state
  currentPlayerState!: PlayerState;
  playersStates!: Record<number, PlayerState>;
  playersCount!: number;
  birds!: Record<number, PlayerState>;
  hunter!: PlayerState;

  pipes!: Phaser.GameObjects.Group;

  rounds!: number;
  currentRound!: number;

  // Queues
  pipesSpawnQueue: Denque = new Denque();
  jumpQueue: Denque = new Denque();
  playersOutQueue: Denque = new Denque();
  // seenEvents: Set<number> = new Set<number>();
  lastEventIdProcessed = 0;

  // Socket
  socket!: WebSocket;
  socketBound = false;

  // Systems
  initSystem!: InitSystem;
  pipeSystem!: PipeSystem;
  playerSystem!: PlayerSystem;
  networkSystem!: NetworkSystem;
  scoreSystem!: ScoreSystem;
  collisionSystem!: CollisionSystem;

  // Game state flags
  isGameReady = false;
  pipeTimer?: Phaser.Time.TimerEvent;

  responses!: RefObject<Array<ResponseType>>;

  setupPlayersPosition = this.createSetupPlayersPosition();

  constructor() {
    super({ key: "MainScene" });
  }

  init(data: any) {
    this.socket = data.socket;
    this.responses = data.responses;
  }

  preload() {
    this.load.image("hero", "hero-removebg-preview.png");
    this.load.image("enemy", "enemy-removebg-preview.png");
    this.load.image("laser", "laser.png");
    this.load.image("background", "gamebgr-removebg-preview.png");

    const g = this.add.graphics();

    g.fillStyle(0x00aa00, 1);
    g.fillRect(0, 0, 64, 64);
    g.generateTexture("pipe", 64, 64);
    g.destroy();
  }

  create() {
    this.add
      .rectangle(0, 0, 1080, 720, 0xffffff)
      .setOrigin(0, 0)
      .setAlpha(0.04)
      .setDepth(10000); // optional safety
    const bg = this.add.image(0, 0, "background").setOrigin(0, 0);

    // const scaleX = this.scale.width / bg.width;
    // const scaleY = this.scale.height / bg.height;

    // const scale = Math.max(scaleX, scaleY);
    // bg.setScale(scale);

    bg.displayWidth = this.scale.width;
    bg.displayHeight = this.scale.height;

    this.initializeSystems();
    this.setupGame();
  }

  private initializeSystems() {
    this.initSystem = new InitSystem(this);
    this.pipeSystem = new PipeSystem(this);
    this.playerSystem = new PlayerSystem(this);
    this.networkSystem = new NetworkSystem(this.socket);
    this.scoreSystem = new ScoreSystem(this);
    this.collisionSystem = new CollisionSystem(this, this.networkSystem);
  }

  private setupGame() {
    if (this.socket && !this.socketBound) {
      this.networkSystem.bindEvents(
        this.jumpQueue,
        this.playersOutQueue,
        this.pipesSpawnQueue,
        // this.seenEvents,
      );
      this.socketBound = true;
    }

    const gameState = this.initSystem.loadGameState();
    if (!gameState) {
      this.time.delayedCall(100, () => this.setupGame());
      return;
    }

    const { currentPlayer, players } = gameState;

    dispatchReady(this.socket, currentPlayer.id);

    this.playersStates = this.initSystem.initializePlayers(players);

    this.playersCount = Object.keys(this.playersStates).length;
    this.rounds = this.playersCount;
    this.currentRound = 1;

    this.hunter = Object.values(this.playersStates)[this.currentRound - 1];

    // console.log("HUNTER IS: " + JSON.stringify(this.hunter));

    for (const id of Object.keys(this.playersStates)) {
      this.playersStates[Number(id)].role =
        Number(id) !== this.hunter.player.id ? Role.BIRD : Role.HUNTER;
    }

    this.currentPlayerState = this.playersStates[currentPlayer.id];

    this.isGameReady = true;

    this.pipeSystem.initSeed(this.playersStates);

    this.initSystem.setupWorldBounds();

    this.pipes = this.add.group();

    let birdType;

    Object.values(this.playersStates).forEach((playerState) => {
      if (playerState.role === Role.BIRD) {
        birdType =
          playerState.player.id === this.currentPlayerState.player.id
            ? "hero"
            : "enemy";
        this.playerSystem.createBird(playerState, birdType);
      } else if (playerState.role === Role.HUNTER)
        this.playerSystem.createHunter(playerState);
    });

    // Setup collisions
    this.collisionSystem.setupCollisions(this.playersStates, this.pipes);

    this.input.keyboard?.on(
      "keydown-SPACE",
      () => {
        if (this.socket) {
          if (this.currentPlayerState.role === Role.BIRD)
            this.networkSystem.sendJump(currentPlayer.id);
        }
      },
      this,
    );

    this.scoreSystem.init();

    // this.pipeTimer = this.time.addEvent({
    //   delay: 1400,
    //   callback: () => this.pipeSystem.spawn(this.pipes),
    //   callbackScope: this,
    //   loop: true,
    // });
  }

  createSetupPlayersPosition() {
    let hasBeenCalled = false;

    return () => {
      if (!hasBeenCalled) {
        Object.values(this.playersStates).forEach((playerState) => {
          if (playerState.role === Role.BIRD) {
            playerState.sprite.x = 220;
            playerState.sprite.y = this.scale.height / 2;
            playerState.sprite.setVisible(true);
          }
        });
        hasBeenCalled = true;
      }
    };
  }

  update() {
    if (this.isGameReady) this.updateGame();
  }

  private updateGame() {
    while (!this.pipesSpawnQueue.isEmpty()) {
      this.pipeSystem.spawn(this.pipes);
      this.pipesSpawnQueue.pop();
      this.setupPlayersPosition();
    }
    // Process jump queue
    while (!this.jumpQueue.isEmpty()) {
      const playerId = this.jumpQueue.shift();

      this.playerSystem.flap(this.playersStates[playerId]);
    }

    // Process players out queue
    while (!this.playersOutQueue.isEmpty()) {
      const playerThatLeft = this.playersOutQueue.shift();
      this.collisionSystem.markPlayerDead(this.playersStates[playerThatLeft]);
      this.playersCount--;
      if (this.playersCount === 0) this.gameOver();
    }

    this.playerSystem.update(this.playersStates);

    this.scoreSystem.updateCoins(this.pipes, this.currentPlayerState);

    this.pipeSystem.cleanup(this.pipes);

    this.collisionSystem.checkBoundaryCollisions(this.playersStates);
  }

  executePowerUp() {}

  gameOver() {
    // console.log("game over");
    this.physics.pause();
    this.pipeTimer?.remove(false);
  }
}
