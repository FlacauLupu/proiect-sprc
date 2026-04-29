import {
  useState,
  useEffect,
  createContext,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import Menu from "./components/Menu.tsx";
import PlayerNameDialogue from "./components/PlayerNameDialogue.tsx";
import GameTab from "./components/Game.tsx";
import { initializeHandshake } from "./utils/WebSocketConnection.ts";
import { checkOutGameEvents } from "./utils/checkEvents.ts";
import type { ResponseType } from "./types/ResponseType.ts";

export const SocketContext = createContext<WebSocket | null>(null);
type ResponsesContextType = {
  responsesRef: RefObject<Array<ResponseType>>;
  // setResponses: Dispatch<SetStateAction<Array<ResponseType>>>;
  // outGameSeenEventsRef: RefObject<Set<number>>;
};

export const ResponsesContext = createContext<ResponsesContextType>({
  responsesRef: { current: [] },
  // setResponses: () => {},
  // outGameSeenEventsRef: { current: new Set() },
});

const App = () => {
  const [currentTab, setCurrentTab] = useState("dialog");

  const [socket, setSocket] = useState<WebSocket | null>(null);

  const socketBound = useRef(false);
  // const [outGameSeenEvents, setOutGameSeenEvents] = useState<Set<number>>(
  //   new Set(),
  // );
  // const [responses, setResponses] = useState<Array<ResponseType>>([]);

  const outGameSeenEventsRef = useRef<Set<number>>(new Set());
  const responsesRef = useRef<Array<ResponseType>>([]);

  useEffect(() => {
    const sock = initializeHandshake();

    if (!socketBound.current) setSocket(sock);
    // responsesRef.current = responses;
    // outGameSeenEventsRef.current = outGameSeenEvents;

    checkOutGameEvents(sock, outGameSeenEventsRef, responsesRef);

    return () => {
      sock.close(1000, "app unmount");
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      <ResponsesContext.Provider value={{ responsesRef }}>
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
