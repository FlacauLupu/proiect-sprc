import type { Player } from "../types/Player.ts";

// Commands
export const CMD_LOGIN = 1;
export const CMD_LOGOUT = 2;
export const CMD_PLAY = 3;
export const CMD_QUIT = 4;
export const CMD_JUMP = 5;
export const CMD_DEATH = 6;

// Updates
export const UPD_START = 5;
export const UPD_PLAYER_REMOVED = 6;
export const UPD_PLAYER_JUMPED = 7;

export const dispatchCommand = (
    socket: WebSocket,
    command: number,
    payload: any,
) => {
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payload);

    const totalBytes = 3 + payloadBytes.length;
    const message = new Uint8Array(totalBytes);

    message[0] = totalBytes;
    message[1] = command;
    message.set(payloadBytes, 2);

    // Send the data to the server
    socket.send(message.buffer);
};

export const dispatchLogin = (socket: WebSocket, username: string) => {
    dispatchCommand(socket, CMD_LOGIN, username);
};

export const dispatchLogout = (socket: WebSocket, playerId: number) => {
    dispatchCommand(socket, CMD_LOGOUT, playerId);
};

export const dispatchPlayGame = (socket: WebSocket, playerId: number) => {
    dispatchCommand(socket, CMD_PLAY, playerId);
};

export const dispatchQuitGame = (socket: WebSocket, playerId: number) => {
    dispatchCommand(socket, CMD_QUIT, playerId);
};

export const dispatchPlayerJump = (socket: WebSocket, playerId: number) => {
    dispatchCommand(socket, CMD_JUMP, playerId);
};

export const dispatchPlayerDeath = (socket: WebSocket, playerId: number) => {
    dispatchCommand(socket, CMD_DEATH, playerId);
};
// TODO: dispatchPlay and dispatchUp

export function parsePlayerPayload(payloadBytes: Uint8Array<ArrayBuffer>) {
    const view = new DataView(
        payloadBytes.buffer,
        payloadBytes.byteOffset,
        payloadBytes.byteLength,
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
        console.log(
            "length-prefix byte:",
            byte.toString(16),
            "| shift:",
            shift,
        );
        usernameLength |= (byte & 0x7f) << shift;
        shift += 7;
    } while ((byte & 0x80) !== 0);

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
        [...usernameBytes]
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" "),
    );

    const username = new TextDecoder("utf-8").decode(usernameBytes);
    console.log("username:", username);
    offset += usernameLength;

    const coins = payloadBytes[offset++];
    const skill = payloadBytes[offset++];
    console.log("coins:", coins, "skill:", skill);

    const player: Player = { id, username, coins, skill };
    // localStorage.setItem("player", JSON.stringify(player));
    return player;
}

export function parsePlayersPayload(
    payloadBytes: Uint8Array<ArrayBuffer>,
): Array<Player> {
    const view = new DataView(payloadBytes.buffer);
    let offset = 0;

    const playerCount = view.getInt32(offset, true);
    offset += 4;

    const players = [];
    for (let i = 0; i < playerCount; i++) {
        const id = view.getInt32(offset, true);
        offset += 4;

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
