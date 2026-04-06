import { useEffect } from "react";
import * as ReactUseWebSocket from "react-use-websocket";

// Cope with different bundling interop: check several shapes.
const resolvedUseWebSocket =
  (ReactUseWebSocket as any).useWebSocket ?? // named export
  (ReactUseWebSocket as any).default?.useWebSocket ?? // nested on default
  (ReactUseWebSocket as any).default?.default ?? // double-wrapped
  (ReactUseWebSocket as any).default; // plain default

const resolvedReadyState =
  (ReactUseWebSocket as any).ReadyState ??
  (ReactUseWebSocket as any).default?.ReadyState ??
  (ReactUseWebSocket as any).default?.default?.ReadyState;

const useHook = () => {
  if (typeof resolvedUseWebSocket !== "function") {
    console.error(
      "react-use-websocket export shape unexpected",
      Object.keys(ReactUseWebSocket),
      ReactUseWebSocket,
    );
    return;
  }

  const WS_URL = "ws://localhost:8080";
  const { sendJsonMessage, lastJsonMessage, readyState } = resolvedUseWebSocket(
    WS_URL,
    {
      share: false,
      shouldReconnect: () => true,
    },
  );

  // Run when the connection state (readyState) changes
  useEffect(() => {
    console.log("Connection state changed");
    if (resolvedReadyState && readyState === resolvedReadyState.OPEN) {
      sendJsonMessage({
        event: "subscribe",
        data: {
          channel: "general-chatroom",
        },
      });
    }
  }, [readyState]);

  // Run when a new WebSocket message is received (lastJsonMessage)
  useEffect(() => {
    console.log(`Got a new message: ${lastJsonMessage}`);
  }, [lastJsonMessage]);
};

export default useHook;
