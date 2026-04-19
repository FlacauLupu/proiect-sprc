import Denque from "denque";
import {
  CMD_LOGIN,
  UPD_PLAYER_JUMPED,
  UPD_PLAYER_REMOVED,
  UPD_START,
  parsePlayerPayload,
  parsePlayersPayload,
  parseUpdatePayload,
} from "./WebSocketCommands";

const checkInGameEvents = (
  socket: WebSocket,
  jumpQueue: Denque,
  playersOutQueue: Denque,
  inGameSeenEvents: Set<number>,
) => {
  const handler = (e: MessageEvent) => {
    const data = new Uint8Array(e.data);

    const responseId = data[1];
    const { eventId, playerId } = parseUpdatePayload(data.slice(2));

    if (inGameSeenEvents.has(eventId)) return;
    inGameSeenEvents.add(eventId);

    if (responseId === UPD_PLAYER_JUMPED) {
      jumpQueue.push(playerId);
      return;
    }

    if (responseId === UPD_PLAYER_REMOVED) {
      playersOutQueue.push(playerId);
    }
  };
  socket.addEventListener("message", handler);

  return () => {
    socket.removeEventListener("message", handler);
  };
};

const checkOutGameEvents = (
  socket: WebSocket,
  outGameSeenEvents: Set<number>,
  setResponses: React.Dispatch<React.SetStateAction<number[]>>,
) => {
  const handler = (e: MessageEvent) => {
    const data = new Uint8Array(e.data);

    const responseId = data[1];
    const eventId = data[2];

    if (outGameSeenEvents.has(eventId)) return;
    outGameSeenEvents.add(eventId);

    if (
      [UPD_PLAYER_JUMPED, UPD_PLAYER_REMOVED].includes(Math.abs(responseId))
    ) {
      setResponses((prev) => [...prev, responseId]);

      if (responseId === CMD_LOGIN) {
        const player = parsePlayerPayload(data.slice(3));
        sessionStorage.setItem("player", JSON.stringify(player));
      } else if (responseId === UPD_START) {
        const players = parsePlayersPayload(data.slice(3));
        sessionStorage.setItem("players", JSON.stringify(players));
      }
    }
  };

  socket.addEventListener("message", handler);

  return () => {
    socket.removeEventListener("message", handler);
  };
};

export { checkInGameEvents, checkOutGameEvents };
