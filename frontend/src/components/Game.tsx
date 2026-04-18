import { useRef, useState, useContext, useEffect } from "react";
import GameFrame from "./GameFrame";
import { UpdatesContext } from "../App";
import { parsePlayersPayload, UPD_START } from "../utils/WebSocketCommands";
import type { Player } from "../types/Player";

interface GameProps {
    setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
}

const GameTab = ({ setCurrentTab }: GameProps) => {
    const frameRef = useRef<any>(null);
    const enemiesRef = useRef<Array<Player> | null>(null);
    const playerRef = useRef<Player | null>(null);

    const updates = useContext(UpdatesContext);

    // const [enemies, setEnemies] = useState<Array<Player> | null>(null);
    // const [player, setPlayer] = useState<Player>();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (updates?.length) {
            const playersRaw = updates
                .toReversed()
                .find((up) => up[1] === UPD_START)
                ?.slice(2);
            if (playersRaw && playersRaw.length > 0) {
                setIsLoading(false);

                enemiesRef.current = parsePlayersPayload(playersRaw);

                const storedPlayer = sessionStorage.getItem("player");
                if (storedPlayer) playerRef.current = JSON.parse(storedPlayer);
            }
        }
    }, [updates]);

    return (
        <div className="h-screen flex flex-col items-center justify-center">
            <div className="w-[1080px] h-[720px] bg-black border-4 border-gray-800 rounded-xl shadow-2xl overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-white text-sm opacity-50">
                    {isLoading ? (
                        <div> Loading </div>
                    ) : (
                        <GameFrame
                            ref={frameRef}
                            player={player}
                            enemies={enemies}
                        />
                    )}
                </div>
            </div>

            <div className="flex gap-3 mt-4">
                <button
                    onClick={() => frameRef.current?.moveSelectedObstacle(-50)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-500 active:scale-95 transition-all"
                >
                    Move Up
                </button>

                <button
                    onClick={() => frameRef.current?.moveSelectedObstacle(50)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-500 active:scale-95 transition-all"
                >
                    Move Down
                </button>

                <button
                    onClick={() => frameRef.current?.clearSelection()}
                    className="px-4 py-2 bg-gray-200 text-black rounded-md shadow hover:bg-gray-100 active:scale-95 transition-all"
                >
                    Clear
                </button>

                <button
                    onClick={() => setCurrentTab("menu")}
                    className="px-6 py-2 bg-white text-black font-semibold rounded-lg shadow-md hover:bg-gray-100 active:scale-95 transition-all"
                >
                    Back
                </button>
            </div>
        </div>
    );
};

export default GameTab;
