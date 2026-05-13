import Phaser from "phaser";
import type { PlayerState } from "../../types/Player";
import Denque from "denque";
import { Role } from "../../types/Player";
import type { Player } from "../../types/Player";
import { InitSystem } from "./systems/InitSystem";
import { PipeSystem } from "./systems/PipeSystem";
import { PlayerSystem } from "./systems/PlayerSystem";
import { NetworkSystem } from "./systems/NetworkSystem";
import { ScoreSystem } from "./systems/ScoreSystem";
import { CollisionSystem } from "./systems/CollisionSystem";
import {
  dispatchReady,
  UPD_GAME_NOT_READY,
  UPD_PLAYER_JUMPED,
  UPD_PLAYER_REMOVED,
  UPD_GAME_ENDED,
  UPD_ROUND_RESET,
  UPD_SPAWN_PIPE,
  CMD_GRAVITY,
  CMD_MIRROR,
  CMD_MADNESS,
} from "../../utils/WebSocketCommands";
import type { InGameEvent } from "../../types/InGameEvent";

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
  roundText!: Phaser.GameObjects.Text;

  // Queues
  pipesSpawnQueue: Denque = new Denque();
  jumpQueue: Denque = new Denque();
  playersOutQueue: Denque = new Denque();
  inGameEventsQueue: InGameEvent[] = [];
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
  gameEnded = false;
  pipeTimer?: Phaser.Time.TimerEvent;

  cleanUpEventsHandler!: any;

  setupPlayersPosition = this.createSetupPlayersPosition();

  constructor() {
    super({ key: "MainScene" });
  }

  init(data: any) {
    this.socket = data.socket;
  }

  preload() {
    this.load.image("hero", "hero-removebg-preview.png");
    this.load.image("enemy", "enemy-removebg-preview.png");
    this.load.image("laser", "laser.png");
    this.load.image("background", "gamebgr_v2.png");

    const g = this.add.graphics();

    g.fillStyle(0x00aa00, 1);
    g.fillRect(0, 0, 64, 64);
    g.generateTexture("pipe", 64, 64);
    g.destroy();
  }

  create() {
    // this.add
    //   .rectangle(0, 0, 1080, 720, 0xffffff)
    //   .setOrigin(0, 0)
    //   .setAlpha(0.04)
    //   .setDepth(10000); // optional safety

    // const scaleX = this.scale.width / bg.width;
    // const scaleY = this.scale.height / bg.height;

    // const scale = Math.max(scaleX, scaleY);
    // bg.setScale(scale);

    const bg = this.add.image(0, 0, "background").setOrigin(0, 0);

    // Folosește dimensiunile reale ale jocului din config
    bg.displayWidth = this.sys.game.config.width as number;
    bg.displayHeight = this.sys.game.config.height as number;

    bg.setTint(0xffffff); // default, fără efect

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
      this.cleanUpEventsHandler = this.networkSystem.bindEvents(
        this.inGameEventsQueue,
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

    this.input.keyboard?.on(
      "Q",
      () => {
        if (this.socket) {
          if (this.currentPlayerState.role === Role.HUNTER)
            this.networkSystem.sendPowerup(currentPlayer.id, CMD_GRAVITY);
        }
      },
      this,
    );
    this.input.keyboard?.on(
      "W",
      () => {
        if (this.socket) {
          if (this.currentPlayerState.role === Role.HUNTER)
            this.networkSystem.sendPowerup(currentPlayer.id, CMD_MIRROR);
        }
      },
      this,
    );
    this.input.keyboard?.on(
      "E",
      () => {
        if (this.socket) {
          if (this.currentPlayerState.role === Role.HUNTER)
            this.networkSystem.sendPowerup(currentPlayer.id, CMD_MADNESS);
        }
      },
      this,
    );

    this.scoreSystem.init();

    this.roundText = this.add
      .text(
        this.scale.width - 20,
        20,
        `Round: ${this.currentRound}/${this.rounds}`,
        {
          fontSize: "24px",
          color: "#ffffff",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 3,
        },
      )
      .setOrigin(1, 0) // aliniat la dreapta sus
      .setDepth(1000);

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

  updateGame() {
    while (this.inGameEventsQueue.length > 0) {
      const inGameEvent = this.inGameEventsQueue.shift();
      if (inGameEvent) this.processEvent(inGameEvent);
    }

    this.playerSystem.update(this.playersStates);

    this.scoreSystem.updateCoins(this.pipes, this.currentPlayerState);

    this.pipeSystem.cleanup(this.pipes);

    this.collisionSystem.checkBoundaryCollisions(this.playersStates);
  }

  processEvent(inGameEvent: InGameEvent) {
    if (inGameEvent.responseId === UPD_PLAYER_JUMPED) {
      if (typeof inGameEvent.data === "number")
        this.playerSystem.flap(this.playersStates[inGameEvent.data]);
    } else if (inGameEvent.responseId === UPD_SPAWN_PIPE) {
      this.pipeSystem.spawn(this.pipes);
      this.pipesSpawnQueue.pop();
      this.setupPlayersPosition();
    } else if (inGameEvent.responseId === UPD_PLAYER_REMOVED) {
      if (typeof inGameEvent.data === "number") {
        const playerThatLeft = inGameEvent.data;

        this.collisionSystem.markPlayerDead(this.playersStates[playerThatLeft]);
        this.playersCount--;
        if (this.playersCount === 0) this.gameOver();
      }
    } else if (inGameEvent.responseId === UPD_ROUND_RESET) {
      this.resetRoundState();
    } else if (inGameEvent.responseId === UPD_GAME_ENDED) {
      if (
        inGameEvent.data &&
        typeof inGameEvent.data === "object" &&
        !Array.isArray(inGameEvent.data) &&
        "username" in inGameEvent.data &&
        "coins" in inGameEvent.data
      ) {
        this.showWinnerScreen(inGameEvent.data as Player);
      }
    } else if (inGameEvent.responseId === UPD_GAME_NOT_READY) {
      this.cleanUpEventsHandler();
      this.scene.start("LobbyScene", {
        socket: this.socket,
      });
    }
  }

  executePowerUp() {}

  gameOver() {
    // console.log("game over");
    this.physics.pause();
    this.pipeTimer?.remove(false);
  }

  private resetRoundState() {
    if (this.gameEnded) return;

    this.playersCount = Object.keys(this.playersStates).length;
    this.currentRound += 1;
    this.scoreSystem.reset();

    this.pipes.getChildren().forEach((pipe: any) => {
      if (pipe.body) {
        (pipe.body as Phaser.Physics.Arcade.Body).destroy();
      }
      pipe.destroy();
    });
    this.pipes.clear(true, true);

    Object.values(this.playersStates).forEach((playerState) => {
      const sprite = playerState.sprite;
      if (!sprite) return;

      sprite.setActive(true);
      sprite.setVisible(true);
      sprite.setAlpha(1);
      sprite.setAngle(0);
      sprite.setVelocity(0, 0);
      sprite.x = 220;
      sprite.y = this.scale.height / 2;

      const body = sprite.body as Phaser.Physics.Arcade.Body | undefined;
      if (body) {
        body.enable = true;
        body.reset(sprite.x, sprite.y);
        body.setVelocity(0, 0);
      }
    });

    this.roundText?.setText(`Round: ${this.currentRound}/${this.rounds}`);
    this.physics.resume();
  }

  private showWinnerScreen(winner: { username: string; coins: number }) {
    if (this.gameEnded) return;

    this.gameEnded = true;
    this.isGameReady = false;
    this.physics.pause();
    this.cleanUpEventsHandler?.();

    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setDepth(5000);

    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 - 50,
        `Winner: ${winner.username}\nCoins: ${winner.coins}`,
        {
          fontSize: "40px",
          color: "#ffffff",
          fontStyle: "bold",
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setDepth(5001);

    const replayButton = this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 50, "Replay", {
        fontSize: "28px",
        color: "#111111",
        backgroundColor: "#f6c445",
        padding: { left: 18, right: 18, top: 10, bottom: 10 },
      })
      .setOrigin(0.5)
      .setDepth(5001)
      .setInteractive({ useHandCursor: true });

    replayButton.on("pointerdown", () => {
      this.scene.start("LobbyScene", {
        socket: this.socket,
      });
    });
  }

  shutdown() {
    this.cleanUpEventsHandler?.();
  }
}
