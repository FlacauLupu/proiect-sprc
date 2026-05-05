// network/NetworkSystem.ts
import Denque from "denque";
import { checkInGameEvents } from "../../../utils/checkEvents";
import {
  dispatchPlayerDeath,
  dispatchPlayerJump,
} from "../../../utils/WebSocketCommands";

export class NetworkSystem {
  socket!: WebSocket;

  constructor(socket: WebSocket) {
    this.socket = socket;
  }

  bindEvents(
    jumpQueue: Denque<number>,
    playersOutQueue: Denque<number>,
    seenEvents: Set<number>,
  ) {
    checkInGameEvents(this.socket, jumpQueue, playersOutQueue, seenEvents);
  }

  sendJump(playerId: number) {
    dispatchPlayerJump(this.socket, playerId);
    console.log("JUMP" + playerId);
  }

  sendDeath(playerId: number) {
    dispatchPlayerDeath(this.socket, playerId);
  }
}
