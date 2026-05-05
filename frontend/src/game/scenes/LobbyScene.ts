import Phaser from "phaser";
import type { ResponseType } from "../../types/ResponseType";
import {
  checkCommandResponse,
  checkCommandResponseAsync,
} from "../../utils/checkCommandResponse";
import { UPD_START } from "../../utils/WebSocketCommands";
import type { RefObject } from "react";
import type { Player, PlayerState } from "../../types/Player";

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
  }
  checkStartUpdate() {
    if (!this.responses) {
      return;
    }
    if (this.gameStarting) {
      return;
    }

    const response = checkCommandResponse(UPD_START, this.responses);

    if (!response) return;

    this.gameStarting = true;
    if (this.loadingText) this.loadingText.setText("Starting...");
    this.time.delayedCall(200, () => {
      this.scene.start("MainScene", {
        socket: this.socket,
        responses: this.responses,
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
