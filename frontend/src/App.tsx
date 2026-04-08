import { useState, useEffect, useRef } from "react";

let handshakeInitiated = false;
import Menu from "./components/Menu.tsx";
import PlayerNameDialogue from "./components/PlayerNameDialogue.tsx";
import GameTab from "./components/Game.tsx";
import { connectAndHandshake } from "./network/WebSocketClient";

const App = () => {
  const [currentTab, setCurrentTab] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const didHandshake = useRef(false);

  useEffect(() => {
    const storedName = localStorage.getItem("playerName");

    if (storedName) {
      setUsername(storedName);
      setCurrentTab("menu");

      if (!didHandshake.current && !handshakeInitiated) {
        handshakeInitiated = true;
        connectAndHandshake(
          storedName,
          (socket) => {
            console.log("Handshake succeeded, socket:", socket);
            didHandshake.current = true;
            setCurrentTab("game");
          },
          (err) => {
            console.log("Handshake failed:", err);
          }
        );
      }
    } else {
      setCurrentTab("dialog");
    }
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[url(background.png)]">
      {currentTab === "menu" && <Menu setCurrentTab={setCurrentTab} />}
      {currentTab === "dialog" && (
        <PlayerNameDialogue
          setCurrentTab={setCurrentTab}
          onSetUsername={(name: string) => {
            localStorage.setItem("playerName", name);
            setUsername(name);
          }}
        />
      )}
      {currentTab === "game" && <GameTab setCurrentTab={setCurrentTab} />}
    </div>
  );
};

export default App;