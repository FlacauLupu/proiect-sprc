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
  startGame: (gameState: any) => void;
  stopGame: () => void;
  getGameState: () => any;
};

const Game = ({ setCurrentTab }: GameProps) => {
  const frameRef = useRef<GameFrameHandle | null>(null);
  const { responsesRef } = useContext(ResponsesContext);
  const socket = useContext(SocketContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getResponse = async () => {
      const response = await checkCommandResponse(UPD_START, responsesRef);

      try {
        if (!response) return;

        const currentPlayerRaw = sessionStorage.getItem("player");
        const playersRaw = sessionStorage.getItem("players");

        if (!currentPlayerRaw || !playersRaw || !socket) {
          throw new Error("Error starting the game!");
        }

        const parsedCurrent: Player = JSON.parse(currentPlayerRaw);
        const parsedPlayers: Array<Player> = JSON.parse(playersRaw);

        const playersRecord: Record<number, PlayerState> = {};
        parsedPlayers.forEach((p) => {
          playersRecord[p.id] = { playerId: p.id, bird: null as any };
        });

        const currentPlayerState: PlayerState = {
          playerId: parsedCurrent.id,
          bird: null as any,
        };

        const gameState = {
          currentPlayer: currentPlayerState,
          players: playersRecord,
          socket,
        };

        setIsLoading(false);

        console.log("GAME STAET: " + JSON.stringify(gameState));
        frameRef.current?.startGame(gameState);
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
          {isLoading ? (
            <div className="items-center">Loading...</div>
          ) : (
            <GameFrame ref={frameRef} />
          )}
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

export default Game;
