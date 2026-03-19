import { useEffect, useState } from "react";
import Menu from "./components/Menu.tsx";

const App = () => {
  const [playerName] = useState("");

  useEffect(() => {
    return;
    const savedPlayer = localStorage.getItem(playerName);
    if (!savedPlayer) console.error("No player");
    else {
      console.log();
    }
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[url(background.png)]">
      <Menu></Menu>
    </div>
  );
};

export default App;
