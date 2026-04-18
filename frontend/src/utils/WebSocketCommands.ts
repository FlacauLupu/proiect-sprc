import type { Player } from "../types/Player.ts"

// Commands

const CMD_LOGIN = 1;
const ISSUER = 1;
const ENDING = 0;

export const dispatchLogin = (
    websocket: WebSocket,
    username: string,
    onSuccess: (issuerId: number, player: string) => void,
    onError: () => void
) => {
    const encoder = new TextEncoder();
    const usernameBytes = encoder.encode(username); // convert the username into an array of bytes

    // create a byte array big enough for [ CMD (1 byte), ISSUER (1 byte), username (N bytes), ENDING (1 byte) ]
    const message = new Uint8Array(1 + 1 + usernameBytes.length + 1);

    message[0] = CMD_LOGIN;                 // first byte = 1, meaning it's a login command
    message[1] = ISSUER;                    // second byte = 1, meaning the client is sending the command
    message.set(usernameBytes, 2);          // the username placed after the first two bytes
    message[message.length - 1] = ENDING;   // the last byte, meaning the end of the transmitted data

    // Send the data to the server
    websocket.send(message.buffer);
    console.log("Event sent with the following content\n: ", message.buffer);



    websocket.onmessage = (event: MessageEvent) => {

        // The incoming data arrives as raw bytes, so we wrap it in Uint8Array to read it byte by byte
        const buffer = event.data as ArrayBuffer;
        console.log("Buffer received: " + buffer.byteLength);
        const view = new Uint8Array(buffer);

        // Get the first byte of the response
        const issuerId = view[0];

        // If it's a 0, it means there has been an error
        if (issuerId === ENDING) {
            onError();
            return;
        }

        // Else, get the part of the data depicting the player name
        // (starting from the third byte and ending with the second to last byte)
        const playerBytes = view.slice(2, view.length - 1);
        parsePlayerPayload(playerBytes)

        console.log("Received login data from server.");
    };

    

};

function parsePlayerPayload(payloadBytes: Uint8Array<ArrayBuffer>): Player {
  console.log("=== parsePlayerPayload ===");
  console.log("Total bytes:", payloadBytes.byteLength);
  console.log("Raw bytes:", [...payloadBytes].map(b => b.toString(16).padStart(2, '0')).join(' '));

  const view = new DataView(
    payloadBytes.buffer,
    payloadBytes.byteOffset,
    payloadBytes.byteLength
  );

  let offset = 0;

  const id = view.getInt32(offset, true);
  offset += 4;
  console.log("id:", id, "| offset now:", offset);

  // 7-bit length prefix
  let usernameLength = 0;
  let shift = 0;
  let byte;
  do {
    byte = payloadBytes[offset++];
    console.log("length-prefix byte:", byte.toString(16), "| shift:", shift);
    usernameLength |= (byte & 0x7F) << shift;
    shift += 7;
  } while ((byte & 0x80) !== 0);

  console.log("usernameLength:", usernameLength, "| offset now:", offset);
  console.log("remaining bytes:", [...payloadBytes.slice(offset)].map(b => b.toString(16).padStart(2, '0')).join(' '));

  const usernameBytes = payloadBytes.slice(offset, offset + usernameLength);
  console.log("usernameBytes:", [...usernameBytes].map(b => b.toString(16).padStart(2, '0')).join(' '));

  const username = new TextDecoder("utf-8").decode(usernameBytes);
  console.log("username:", username);
  offset += usernameLength;

  const coins = payloadBytes[offset++];
  const skill = payloadBytes[offset++];
  console.log("coins:", coins, "skill:", skill);

  const player: Player = { id, username, coins, skill };
  localStorage.setItem("player", JSON.stringify(player));
//   return player;
}