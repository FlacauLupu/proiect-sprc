import GameFrame from "./GameFrame";
import { useRef, useEffect, useState, useContext } from "react";
import type { Player } from "../types/Player";
import { ResponsesContext } from "../App";
import { UPD_START } from "../utils/WebSocketCommands";
import { parsePlayersPayload } from "../utils/WebSocketCommands";
import checkResponse from "../utils/checkResponse";

interface GameProps {
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
}
export type GameFrameHandle = {
  startGame: () => void;
  stopGame: () => void;
};
const GameTab = ({ setCurrentTab }: GameProps) => {
  const frameRef = useRef<GameFrameHandle>({} as GameFrameHandle);

  const enemiesRef = useRef<Array<Player> | null>(null);

  const responses = useContext(ResponsesContext);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getResponse = async () => {
      while (true) {
        const response = await checkResponse(responses, UPD_START);
        const playersRaw = response.slice(2);

        if (playersRaw && playersRaw.length > 0) {
          frameRef?.current.startGame();
          setIsLoading(false);
          enemiesRef.current = parsePlayersPayload(playersRaw);

          break;
        }
      }
    };
    getResponse();
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="w-270 h-180 bg-black border-4 border-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-white text-sm opacity-50">
          {isLoading ? <div>Loading...</div> : <GameFrame ref={frameRef} />}
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
