import { useState, useEffect, createContext } from "react";
import Menu from "./components/Menu.tsx";
import PlayerNameDialogue from "./components/PlayerNameDialogue.tsx";
import GameTab from "./components/Game.tsx";
import { initializeHandshake } from "./utils/WebSocketConnection.ts";

export const SocketContext = createContext<WebSocket>(initializeHandshake());
export const ResponsesContext = createContext<Array<Uint8Array>>([]);
export const UpdatesContext = createContext<Array<Uint8Array>>([]);

const App = () => {
    const [currentTab, setCurrentTab] = useState("dialog");

    const [socket, setSocket] = useState<WebSocket>();
    const [responses, setResponses] = useState<Array<Uint8Array>>([]);
    const [updates, setUpdates] = useState<Array<Uint8Array>>([]);

    useEffect(() => {
        setSocket(initializeHandshake());

        if (socket) {
            socket.onopen = () => console.log("Connected to server");
            socket.onclose = () => console.log("Player disconnected");
            socket.onerror = (e) =>
                console.log("Error when trying to connect to server: ", e);

            socket.onmessage = (e: MessageEvent) => {
                e.data[1] < 5
                    ? setResponses((prev) => [...prev, e.data])
                    : setUpdates((prev) => [...prev, e.data]);
            };

            console.log("Local Storage" + localStorage.getItem("player"));

            // Cleanup on unmount
            return () => {
                socket.close(1000, "app unmount");
            };
        }
    }, []);

    return (
        // <SocketContext.Provider value = {socket}>

        <div className="flex h-screen w-full items-center justify-center bg-[url(background.png)]">
            <ResponsesContext.Provider value={responses}>
                {currentTab === "menu" && (
                    <Menu setCurrentTab={setCurrentTab} />
                )}
                {currentTab === "dialog" && (
                    <PlayerNameDialogue setCurrentTab={setCurrentTab} />
                )}
            </ResponsesContext.Provider>

            {currentTab === "game" && (
                <UpdatesContext.Provider value={updates}>
                    <GameTab setCurrentTab={setCurrentTab} />
                </UpdatesContext.Provider>
            )}
        </div>

        // </SocketContext.Provider>
    );
};

export default App;
