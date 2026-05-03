import Phaser from "phaser";
import type { ResponseType } from "../types/ResponseType";
import {
  checkCommandResponse,
  checkCommandResponseAsync,
} from "../utils/checkCommandResponse";
import { UPD_START } from "../utils/WebSocketCommands";
import type { RefObject } from "react";
import type { Player, PlayerState } from "../types/Player";

export default class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: "LobbyScene" });
  }

  loadingText!: Phaser.GameObjects.Text;

  responses: RefObject<Array<ResponseType>> | null = null;
  socket: WebSocket | null = null;

  gameStarting = false;

  init(data: any) {
    this.responses = data.responses;
    this.socket = data.socket;
    console.log("DATA: " + JSON.stringify(data));
  }
  checkStartUpdate() {
    if (!this.responses) {
      console.log("retruned from responses");
      return;
    }
    if (this.gameStarting) {
      console.log("retruned from gamestarting");
      return;
    }

    const response = checkCommandResponse(UPD_START, this.responses);
    console.log("RESPONSES:: " + JSON.stringify(this.responses.current));

    if (!response) return;

    this.gameStarting = true;
    if (this.loadingText) this.loadingText.setText("Starting...");
    this.time.delayedCall(200, () => {
      this.scene.start("MainScene", {
        socket: this.socket,
      });
    });
  }

  create() {
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
}
