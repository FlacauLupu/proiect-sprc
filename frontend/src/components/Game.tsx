import GameFrame from "./GameFrame";
import { useRef, useEffect, useState, useContext } from "react";
import { ResponsesContext, SocketContext } from "../App";
import { UPD_START } from "../utils/WebSocketCommands";
import checkCommandResponse from "../utils/checkCommandResponse";
import type { Player, PlayerState } from "../types/Player";

interface GameProps {
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
}
export type GameFrameHandle = {
  setGameState: (gameState: any) => void;
  getGameState: () => any;
  startGame: () => void;
  stopGame: () => void;
};
const GameTab = ({ setCurrentTab }: GameProps) => {
  const frameRef = useRef<GameFrameHandle>({} as GameFrameHandle);

  const responses = useContext(ResponsesContext);

  const socket = useContext(SocketContext);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getResponse = async () => {
      const response = await checkCommandResponse(UPD_START, responses);
      let currentPlayer: Player | null;
      let players: Array<PlayerState> | null;

      try {
        if (response) {
          const currentPlayerRaw = sessionStorage.getItem("player");
          const playersRaw = sessionStorage.getItem("players");

          if (currentPlayerRaw && playersRaw && socket) {
            currentPlayer = JSON.parse(currentPlayerRaw);
            players = JSON.parse(playersRaw);
          } else throw new Error("Error starting the game!");

          frameRef.current?.setGameState({
            currentPlayer,
            players,
            socket,
          });
          setIsLoading(false);

          frameRef?.current.startGame();
        }
      } catch (err: any) {
        console.error(err.message);
      }
    };

    getResponse();
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="w-270 h-180 bg-black border-4 border-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-white text-sm opacity-50">
          <GameFrame ref={frameRef} />

          {isLoading && <div className="loading-overlay">Loading...</div>}
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => {
            frameRef.current?.stopGame();
            setCurrentTab("menu");
          }}
          className="px-6 py-2 bg-white text-black font-semibold rounded-lg shadow-md hover:bg-gray-100 active:scale-95 transition-all"
        >
          Surrender
        </button>
      </div>
    </div>
  );
};

export default GameTab;
