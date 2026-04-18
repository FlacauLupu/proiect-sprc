import { useContext } from "react";
import { ResponsesContext, SocketContext } from "../App";
import {
  CMD_LOGOUT,
  CMD_PLAY,
  dispatchLogout,
  dispatchPlayGame,
} from "../utils/WebSocketCommands";
import checkResponse from "../utils/checkResponse";

interface MenuProps {
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
}

const Menu = ({ setCurrentTab }: MenuProps) => {
  const socket = useContext(SocketContext);
  const responses = useContext(ResponsesContext);

  const handleChangeName = async () => {
    const playerRaw = sessionStorage.getItem("player"); // Could be string | null

    if (playerRaw !== null && socket !== null) {
      const playerData = JSON.parse(playerRaw);
      const playerId = playerData.id;

      dispatchLogout(socket, playerId);
      const response = await checkResponse(responses, CMD_LOGOUT);

      if (response[1] > 0) {
        setCurrentTab("dialog");
        sessionStorage.removeItem("player");
      } else alert("Error logging out the player.");
    }
  };

  const handlePlayGame = async () => {
    const playerRaw = sessionStorage.getItem("player"); // Could be string | null

    if (playerRaw !== null && socket !== null) {
      const playerData = JSON.parse(playerRaw);
      const playerId = playerData.id;

      dispatchPlayGame(socket, playerId);

      const response = await checkResponse(responses, CMD_PLAY);

      if (response[1] > 0) {
        setCurrentTab("game");
      } else alert("Error starting the game.");
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
