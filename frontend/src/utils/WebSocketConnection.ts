export const initializeHandshake = () => {
  const websocket = new WebSocket("ws://localhost:8080");
  websocket.binaryType = "arraybuffer";
  return websocket;
}