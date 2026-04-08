import { useState, useEffect, useRef } from "react";
import Menu from "./components/Menu.tsx";
import PlayerNameDialogue from "./components/PlayerNameDialogue.tsx";
import GameTab from "./components/Game.tsx";
import { initializeHandshake  } from "./utils/WebSocketConnection.ts";

const App = () => {

  const [currentTab, setCurrentTab] = useState("")
  
  const websocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const websocket = initializeHandshake();
    websocketRef.current = websocket;

    websocket.onopen = () => setCurrentTab("dialog");
    websocket.onclose = () => console.log("Player disconnected");
    websocket.onerror = (e) => console.log("Error when trying to connect to server: ", e);

    // Cleanup on unmount
    return () => {
      websocket.close(1000, "app unmount");
    }

  }, [])


  return (
    <div className="flex h-screen w-full items-center justify-center bg-[url(background.png)]">

      {(currentTab === "menu") && <Menu setCurrentTab={setCurrentTab}/>}
      {(currentTab === "dialog") && <PlayerNameDialogue setCurrentTab={setCurrentTab}/>}
      {(currentTab === "game") && <GameTab setCurrentTab={setCurrentTab}/>}

    </div>
  );
};

export default App;