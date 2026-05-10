// network/NetworkSystem.ts
import Denque from "denque";
import { checkInGameEvents } from "../../../utils/checkEvents";
import {
  dispatchPlayerDeath,
  dispatchPlayerJump,
} from "../../../utils/WebSocketCommands";
import type { InGameEvent } from "../../../types/InGameEvent";

export class NetworkSystem {
  socket!: WebSocket;

  constructor(socket: WebSocket) {
    this.socket = socket;
  }

  bindEvents(inGameEventsQueue: InGameEvent[]) {
    // jumpQueue: Denque<number>,
    // playersOutQueue: Denque<number>,
    // // seenEvents: Set<number>,
    // pipesSpawnQueue: Denque<number>,
    return checkInGameEvents(this.socket, inGameEventsQueue);
  }

  sendJump(playerId: number) {
    dispatchPlayerJump(this.socket, playerId);
    // console.log("JUMP" + playerId);
  }

  sendDeath(playerId: number) {
    dispatchPlayerDeath(this.socket, playerId);
  }
}
