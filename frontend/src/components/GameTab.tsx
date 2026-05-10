import { useRef, useEffect, useContext } from "react";
import { ResponsesContext, SocketContext } from "../App";
import MainScene from "../game/scenes/MainScene";
import type { ResponseType } from "../types/ResponseType";
import LobbyScene from "../game/scenes/LobbyScene";
import type { RefObject } from "react";
import { dispatchQuitGame } from "../utils/WebSocketCommands";

interface GameProps {
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
}

export interface GameState {
  responsesRef: RefObject<Array<ResponseType>>;
  socket: WebSocket | null;
}

const GameTab = ({ setCurrentTab }: GameProps) => {
  const { responsesRef } = useContext(ResponsesContext);
  const socket = useContext(SocketContext);

  // const gameStateRef = useRef<GameState | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 1080,
      height: 720,
      backgroundColor: "#000000",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },

      scene: [LobbyScene, MainScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.scene.start("LobbyScene", {
      socket: socket,
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="w-270 h-180 bg-black border-4 border-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-white text-sm">
          <div ref={containerRef} className="w-full h-full" />
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => {
            const playerRaw = sessionStorage.getItem("player");

            if (socket && playerRaw) {
              dispatchQuitGame(socket, JSON.parse(playerRaw).id);
            } else
              console.error(
                "Error while quiting game socket or session storage is null/undefined.",
              );
            setCurrentTab("menu");
          }}
          className="px-6 py-2 bg-white text-black font-semibold rounded-lg shadow-md hover:bg-gray-100 active:scale-95 transition-all"
        >
          Quit
        </button>
      </div>
    </div>
  );
};

export default GameTab;
