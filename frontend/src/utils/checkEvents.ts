import Denque from "denque";
import {
  UPD_LOGIN,
  UPD_PLAYER_JUMPED,
  UPD_PLAYER_REMOVED,
  UPD_START,
  decodeData,
  decodeResponse,
} from "./WebSocketCommands";
import type { RefObject } from "react";
import type { ResponseType } from "../types/ResponseType";

const checkInGameEvents = (
  socket: WebSocket,
  jumpQueue: Denque,
  playersOutQueue: Denque,
  inGameSeenEvents: Set<number>,
) => {
  const handler = (e: MessageEvent) => {
    try {
      const response = decodeResponse(e.data);

      console.log("response: " + JSON.stringify(response));

      if (inGameSeenEvents.has(response.eventId)) return;
      inGameSeenEvents.add(response.eventId);

      if (response.responseId === UPD_PLAYER_JUMPED) {
        const playerId = decodeData(response.responseId, response.data);
        console.log("player that jumped: " + playerId);
        jumpQueue.push(playerId);
        return;
      }

      if (response.responseId === UPD_PLAYER_REMOVED) {
        const playerId = decodeData(response.responseId, response.data);
        playersOutQueue.push(playerId);
      }
    } catch (err: any) {
      console.error("Error: " + err.message);
    }
  };
  socket.addEventListener("message", handler);

  return () => {
    socket.removeEventListener("message", handler);
  };
};

const checkOutGameEvents = (
  socket: WebSocket,
  outGameSeenEventsRef: RefObject<Set<number>>,
  responsesRef: RefObject<Array<ResponseType>>,
) => {
  const handler = (e: MessageEvent) => {
    try {
      const response = decodeResponse(e.data);

      if (outGameSeenEventsRef.current.has(response.eventId)) return;
      outGameSeenEventsRef.current.add(response.eventId);

      if (
        ![UPD_PLAYER_JUMPED, UPD_PLAYER_REMOVED].includes(
          Math.abs(response.responseId),
        )
      ) {
        responsesRef.current.push(response);

        if (response.responseId === UPD_LOGIN) {
          const player = decodeData(response.responseId, response.data);

          sessionStorage.setItem("player", JSON.stringify(player));
        } else if (
          response.responseId === UPD_START &&
          response.data.byteLength > 2
        ) {
          const players = decodeData(response.responseId, response.data);

          sessionStorage.setItem("players", JSON.stringify(players));
        }
      }
    } catch (err: any) {
      console.error("Error: " + err.message);
    }
  };

  socket.addEventListener("message", handler);

  return () => {
    socket.removeEventListener("message", handler);
  };
};

export { checkInGameEvents, checkOutGameEvents };
