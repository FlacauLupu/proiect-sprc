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
        const view = new Uint8Array(buffer);

        // Get the first byte of the response
        const issuerId = view[0]; 

        // If it's a 0, it means there has been an error
        if (issuerId === ENDING) {
            onError();
            return;
        }

        // Else, get the part of the data depicting the player name
        // (starting from the second byte and ending with the second to last byte)
        const playerBytes = view.slice(1, view.length - 1);
        const player = new TextDecoder().decode(playerBytes);

        // Send the playerId and the player username to the client
        onSuccess(issuerId, player);
        console.log("Received login data from server.\nPlayer ID:", issuerId, " ,Username", player);
    };
};