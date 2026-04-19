import { useState, useEffect, createContext, useRef } from "react";
import Menu from "./components/Menu.tsx";
import PlayerNameDialogue from "./components/PlayerNameDialogue.tsx";
import GameTab from "./components/Game.tsx";
import { initializeHandshake } from "./utils/WebSocketConnection.ts";
import { checkOutGameEvents } from "./utils/checkEvents.ts";

export const SocketContext = createContext<WebSocket | null>(null);
export const ResponsesContext = createContext<Array<number>>([]);

const App = () => {
  const [currentTab, setCurrentTab] = useState("dialog");

  const [socket, setSocket] = useState<WebSocket | null>(null);

  const socketBound = useRef(false);
  const outGameSeenEvents = useRef<Set<number>>(new Set());
  const [responses, setResponses] = useState<number[]>([]);

  useEffect(() => {
    const sock = initializeHandshake();

    if (!socketBound.current) {
      setSocket(sock);
      checkOutGameEvents(sock, outGameSeenEvents.current, setResponses);

      return () => {
        sock.close(1000, "app unmount");
      };
    }
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      <ResponsesContext.Provider value={responses}>
        <div className="flex h-screen w-full items-center justify-center bg-[url(background.png)]">
          {currentTab === "menu" && <Menu setCurrentTab={setCurrentTab} />}
          {currentTab === "dialog" && (
            <PlayerNameDialogue setCurrentTab={setCurrentTab} />
          )}
          {currentTab === "game" && <GameTab setCurrentTab={setCurrentTab} />}
        </div>
      </ResponsesContext.Provider>
    </SocketContext.Provider>
  );
};

export default App;
