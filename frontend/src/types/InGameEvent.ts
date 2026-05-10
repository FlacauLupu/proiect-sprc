import type { Player } from "./Player";

export interface InGameEvent {
  eventId: number;
  responseId: number;
  data: number | Player | Player[] | null;
}
