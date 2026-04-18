import Denque from "denque";
import {
  UPD_PLAYER_JUMPED,
  UPD_PLAYER_REMOVED,
  parseUpdatePayload,
} from "./WebSocketCommands";

const checkUpdate = (
  socket: WebSocket,
  jumpQueue: Denque,
  playersOutQueue: Denque,
  seenEvents: Set<number>,
) => {
  socket.addEventListener("message", (e: MessageEvent) => {
    const data = e.data;

    const responseId = data[1];
    const { eventId, playerId } = parseUpdatePayload(data.slice(2));

    if (seenEvents.has(eventId)) return;
    seenEvents.add(eventId);

    if (responseId === UPD_PLAYER_JUMPED) {
      jumpQueue.push(playerId);
      return;
    }

    if (responseId === UPD_PLAYER_REMOVED) {
      playersOutQueue.push(playerId);
    }
  });
};

export default checkUpdate;
