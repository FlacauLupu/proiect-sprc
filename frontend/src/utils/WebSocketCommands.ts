import type { Update } from "../types/Update.ts";
import type { Player } from "../types/Player.ts";
import type { ResponseType } from "../types/ResponseType.ts";

// Commands
export const CMD_LOGIN = 1;
export const CMD_LOGOUT = 2;
export const CMD_PLAY = 3;
export const CMD_QUIT = 4;
export const CMD_JUMP = 5;
export const CMD_DEATH = 6;

// Updates
export const UPD_LOGIN = 1;
export const UPD_START = 5;
export const UPD_PLAYER_REMOVED = 6;
export const UPD_PLAYER_JUMPED = 7;

const SIZEOF_BYTES_COUNTER = 2;
const SIZEOF_COMMAND = 1;
const SIZEOF_EVENTID = 2;

export const dispatchCommand = (
  socket: WebSocket,
  command: number,
  payload: any,
) => {
  const SIZEOF_DATA = payload.byteLength;

  const totalBytesCounter = SIZEOF_BYTES_COUNTER + SIZEOF_COMMAND + SIZEOF_DATA;
  const message = new ArrayBuffer(totalBytesCounter);

  const view = new DataView(message);

  let offset = 0;

  view.setUint16(offset, totalBytesCounter, false);
  offset += SIZEOF_BYTES_COUNTER;
  view.setUint8(offset, command);

  offset += SIZEOF_COMMAND;

  new Uint8Array(message).set(payload, offset);

  socket.send(message);
};

export const dispatchLogin = (socket: WebSocket, username: string) => {
  const encodedUsername = new TextEncoder().encode(username);
  dispatchCommand(socket, CMD_LOGIN, encodedUsername);
};

export const dispatchLogout = (socket: WebSocket, playerId: number) => {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);

  view.setUint16(0, playerId, false);
  dispatchCommand(socket, CMD_LOGOUT, buffer);
};

export const dispatchPlayGame = (socket: WebSocket, playerId: number) => {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);
  console.log(`Player Id is: ${playerId}`);

  view.setUint16(0, playerId, false);
  console.log(`View is:  ${new Uint8Array(buffer)}`);
  dispatchCommand(socket, CMD_PLAY, buffer);
};

export const dispatchQuitGame = (socket: WebSocket, playerId: number) => {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);

  view.setUint16(0, playerId, false);
  dispatchCommand(socket, CMD_QUIT, buffer);
};

export const dispatchPlayerJump = (socket: WebSocket, playerId: number) => {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);

  view.setUint16(0, playerId, false);
  dispatchCommand(socket, CMD_JUMP, buffer);
};

export const dispatchPlayerDeath = (socket: WebSocket, playerId: number) => {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);

  view.setUint16(0, playerId, false);
  dispatchCommand(socket, CMD_DEATH, buffer);
};

export function parsePlayerPayload(payloadBytes: Uint8Array<ArrayBuffer>) {
  const view = new DataView(
    payloadBytes.buffer,
    payloadBytes.byteOffset,
    payloadBytes.byteLength,
  );

  let offset = 0;

  const id = view.getInt16(offset, false);
  offset += 2;
  console.log("id:", id, "| offset now:", offset);

  const usernameLength = view.getInt32(offset, false);
  offset += 4;

  console.log("usernameLength:", usernameLength, "| offset now:", offset);
  console.log(
    "remaining bytes:",
    [...payloadBytes.slice(offset)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" "),
  );

  const usernameBytes = payloadBytes.slice(offset, offset + usernameLength);
  console.log(
    "usernameBytes:",
    [...usernameBytes].map((b) => b.toString(16).padStart(2, "0")).join(" "),
  );

  const username = new TextDecoder("utf-8").decode(usernameBytes);
  offset += usernameLength;

  const coins = payloadBytes[offset++];
  const skill = payloadBytes[offset++];

  const player: Player = { id, username, coins, skill };
  return player;
}

export function parsePlayersPayload(
  payloadBytes: Uint8Array<ArrayBuffer>,
): Array<Player> {
  const view = new DataView(payloadBytes.buffer);
  let offset = 0;

  const playerCount = view.getInt16(offset, false);
  offset += 2;

  const players = [];
  for (let i = 0; i < playerCount; i++) {
    const id = view.getInt16(offset, false);
    offset += 2;

    let usernameLength = 0,
      shift = 0,
      b;
    do {
      b = payloadBytes[offset++];
      usernameLength |= (b & 0x7f) << shift;
      shift += 7;
    } while ((b & 0x80) !== 0);

    const name = new TextDecoder().decode(
      payloadBytes.slice(offset, offset + usernameLength),
    );
    offset += usernameLength;

    const coins = payloadBytes[offset++];
    const skill = payloadBytes[offset++];

    players.push({ id, username: name, coins, skill });
  }
  return players;
}

export function parseUpdatePayload(
  payloadBytes: Uint8Array<ArrayBuffer>,
): Update {
  const view = new DataView(
    payloadBytes.buffer,
    payloadBytes.byteOffset,
    payloadBytes.byteLength,
  );

  let offset = 0;

  const eventId = view.getInt16(offset, false);
  offset += 4;

  const playerId = view.getInt16(offset, false);

  return { eventId, playerId };
}

export function decodeResponse(responseBuffer: ArrayBuffer): ResponseType {
  // Array that stored the response buffer that can be passed as string into Error constructor
  const errArr = new Uint8Array(responseBuffer);

  const view = new DataView(responseBuffer);
  console.log(JSON.stringify(view));
  if (view.byteLength < SIZEOF_BYTES_COUNTER)
    throw new Error("The response is invalid, it has one byte!\n" + errArr);

  let offset = 0;

  const responseLength = view.getUint16(offset, false);

  console.log(
    `[decodeResponse] responseLength from buffer: ${responseLength}, actual byteLength: ${view.byteLength}, buffer bytes: ${[...errArr].join(",")}`,
  );

  if (responseLength !== view.byteLength)
    throw new Error(
      "The response length doesn't correspond to the response counter byte!\n" +
        `Expected: ${responseLength}, Got: ${view.byteLength}\n` +
        errArr,
    );

  if (responseLength < SIZEOF_BYTES_COUNTER + SIZEOF_COMMAND + SIZEOF_EVENTID)
    throw new Error(
      "The response length is too small for a valid response!\n" + errArr,
    );

  offset += SIZEOF_BYTES_COUNTER;

  const responseId = view.getInt8(offset);

  offset += SIZEOF_COMMAND;

  const eventId = view.getInt16(offset, false);

  offset += SIZEOF_EVENTID;

  const dataLength = responseLength - offset;

  const data = new Uint8Array(responseBuffer, offset, dataLength);

  return { responseId, eventId, data };
}

export function decodeData(responseId: number, data: Uint8Array<ArrayBuffer>) {
  if (data.byteLength === 0) throw new Error("Data is empty!");

  switch (responseId) {
    case CMD_LOGIN:
      return parsePlayerPayload(data);

    case UPD_START:
      return parsePlayersPayload(data);

    case UPD_PLAYER_JUMPED:
      if (data.length == 2)
        return new DataView(data.buffer, 0, data.byteLength).getInt16(0, false);
      throw new Error("Invalid data length for playerId.");

    case UPD_PLAYER_REMOVED:
      if (data.length == 2)
        return new DataView(data.buffer, 0, data.byteLength).getInt16(0, false);
      throw new Error("Invalid data length for playerId.");

    default:
      throw new Error("Invalid responseId.");
  }
}
