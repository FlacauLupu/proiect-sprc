export const initializeHandshake = () => {
  const websocket = new WebSocket("ws://localhost:8080");
  return websocket;
}