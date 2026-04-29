import { useContext } from "react";
import { ResponsesContext, SocketContext } from "../App";
import {
  CMD_LOGOUT,
  CMD_PLAY,
  dispatchLogout,
  dispatchPlayGame,
} from "../utils/WebSocketCommands";
import checkCommandResponse from "../utils/checkCommandResponse";

interface MenuProps {
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
}

const Menu = ({ setCurrentTab }: MenuProps) => {
  const socket = useContext(SocketContext);
  const { responsesRef } = useContext(ResponsesContext);

  const handleChangeName = async () => {
    const playerRaw = sessionStorage.getItem("player"); // Could be string | null

    if (playerRaw !== null && socket !== null) {
      const playerData = JSON.parse(playerRaw);
      const playerId = playerData.id;

      dispatchLogout(socket, playerId);
      const response = await checkCommandResponse(CMD_LOGOUT, responsesRef);
      if (response) {
        setCurrentTab("dialog");
        sessionStorage.removeItem("player");
      } else alert("Error logging out the player.");
    }
  };

  const handlePlayGame = async () => {
    const playerRaw = sessionStorage.getItem("player");

    if (playerRaw !== null && socket !== null) {
      const playerData = JSON.parse(playerRaw);
      const playerId = playerData.id;
      dispatchPlayGame(socket, playerId);

      try {
        const response = await checkCommandResponse(CMD_PLAY, responsesRef);

        if (response) {
          setCurrentTab("game");
        } else alert("Error starting the game.");
      } catch (err: any) {
        console.error(err.message);
      }
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl flex flex-col items-center gap-6">
      <button
        onClick={handlePlayGame}
        className="px-8 py-4 bg-yellow-400 text-black font-bold text-lg rounded-xl shadow-lg
                    hover:bg-yellow-300 active:scale-95 transition-all duration-150"
      >
        Play
      </button>

      <button
        onClick={handleChangeName}
        className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-xl shadow-md
                    hover:bg-sky-500 active:scale-95 transition-all duration-150"
      >
        Change name
      </button>
    </div>
  );
};

export default Menu;
