import { useContext, useState } from "react";
import {
  CMD_LOGIN,
  dispatchLogin,
  parsePlayerPayload,
} from "../utils/WebSocketCommands";
import { SocketContext, ResponsesContext } from "../App.tsx";
import checkResponse from "../utils/checkResponse.ts";

interface PlayerNameDialogueProps {
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
}

const PlayerNameDialogue = ({ setCurrentTab }: PlayerNameDialogueProps) => {
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string>("");

  const socket = useContext(SocketContext);
  const responses = useContext(ResponsesContext);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (name.trim() === "") {
      setError("The username can't be blank.");
      return;
    }

    if (socket) {
      if (!socket) {
        setError("No connection to server.");
        return;
      }

      setError("");
      dispatchLogin(socket, name);

      const response = await checkResponse(responses, CMD_LOGIN);

      if (response[1] > 0) {
        const player = parsePlayerPayload(response.slice(2));
        sessionStorage.setItem("player", JSON.stringify(player));
        setCurrentTab("menu");
      } else alert("Error logging the player.");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl flex flex-col items-center gap-6">
        <h2 className="text-xl font-bold text-gray-800">Enter your username</h2>

        <form
          className="flex flex-col items-center gap-4 w-full"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name..."
            className="w-64 px-4 py-2 rounded-lg border border-gray-300 
                      focus:outline-none focus:ring-2 focus:ring-sky-400"
          />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button
            type="submit"
            className="w-full py-2 bg-yellow-400 text-black font-bold rounded-lg shadow-md
                      hover:bg-yellow-300 active:scale-95 transition-all"
          >
            Confirm
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlayerNameDialogue;
