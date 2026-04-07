export function connectAndHandshake(
  username: string,
  onSuccess: (ws: WebSocket) => void,
  onError?: (err: Event | CloseEvent) => void
) {
  const url = "ws://localhost:8080";
  const socket = new WebSocket(url);

  socket.onopen = () => {
    console.log("Connected to", url);

    socket.send(
      JSON.stringify({
        type: "HANDSHAKE",
        payload: { username },
      })
    );
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === "HANDSHAKE_ACK") {
        console.log("Handshake OK");
        onSuccess(socket);
      }
    } catch (e) {
      console.error("Invalid JSON from server:", e);
      if (onError) onError(e as Event);
    }
  };

  return socket;
}