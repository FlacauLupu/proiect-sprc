import Phaser from "phaser";
import type { ResponseType } from "../../types/ResponseType";
import { checkCommandResponse } from "../../utils/checkCommandResponse";
import {
  decodeData,
  dispatchPlayGame,
  UPD_SPAWN_PIPE,
  UPD_START,
} from "../../utils/WebSocketCommands";
import type { RefObject } from "react";
import { NetworkSystem } from "./systems/NetworkSystem";
import type { InGameEvent } from "../../types/InGameEvent";
export default class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: "LobbyScene" });
  }

  loadingText!: Phaser.GameObjects.Text;

  // responses: RefObject<Array<ResponseType>> | null = null;
  socket: WebSocket | null = null;
  networkSystem!: NetworkSystem;
  inGameEventsQueue: InGameEvent[] = [];

  cleanUpEventsHandler!: any;

  gameStarting = false;

  init(data: any) {
    // this.responses = data.responses;
    this.socket = data.socket;
  }
  checkStartUpdate() {
    // if (!this.responses) {
    //   return;
    // }

    if (this.inGameEventsQueue.length > 0) {
      const inGameEvent = this.inGameEventsQueue.shift();
      console.log("InGameEvent: " + inGameEvent);
      if (inGameEvent?.responseId === UPD_START) {
        console.log("START");

        if (Array.isArray(inGameEvent.data)) {
          sessionStorage.setItem("players", JSON.stringify(inGameEvent.data));
        }

        this.gameStarting = true;
        if (this.loadingText) this.loadingText.setText("Starting...");
        this.cleanUpEventsHandler();
        this.scene.start("MainScene", {
          socket: this.socket,
        });
      }
    }
  }

  create() {
    if (this.socket) {
      this.networkSystem = new NetworkSystem(this.socket);
      this.cleanUpEventsHandler = this.networkSystem.bindEvents(
        this.inGameEventsQueue,
      );
      const playerRaw = sessionStorage.getItem("player");
      if (playerRaw) {
        const playerData = JSON.parse(playerRaw);
        const playerId = playerData.id;
        dispatchPlayGame(this.socket, playerId);
      }
    } else console.error("Socket is null or undefined!");

    const { width, height } = this.scale;

    this.loadingText = this.add
      .text(width / 2, height / 2, "Loading game...", {
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Check for a start update after the loading text exists
    this.checkStartUpdate();
  }

  update() {
    this.checkStartUpdate();
  }

  shutdown() {
    this.cleanUpEventsHandler?.();
  }
}
