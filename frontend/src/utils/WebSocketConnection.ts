export const SERVER_HOSTNAME = "localhost";

export const initializeHandshake = () => {
  const websocket = new WebSocket(`ws://${SERVER_HOSTNAME}:8080`);

  websocket.binaryType = "arraybuffer";

  websocket.addEventListener("open", () => {
    console.log("Connected to C# Backend");
  });

  websocket.addEventListener("error", (event) => {
    console.error("WebSocket Connection Error:", event);
  });

  websocket.addEventListener("close", (event) => {
    console.log("WebSocket Connection closed:", event);
  });

  return websocket;
};
