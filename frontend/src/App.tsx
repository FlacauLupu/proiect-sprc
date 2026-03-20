import { useState } from "react";
import Menu from "./components/Menu.tsx";
import PlayerNameDialogue from "./components/PlayerNameDialogue.tsx";
import GameTab from "./components/Game.tsx";

const App = () => {

  const [currentTab, setCurrentTab] = useState("")
  
  if (!currentTab)
 { if (localStorage.getItem("playerName")) setCurrentTab("menu")
    else setCurrentTab("dialog")
}
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[url(background.png)]">

      {(currentTab === "menu") && <Menu setCurrentTab={setCurrentTab}/>}
      {(currentTab === "dialog") && <PlayerNameDialogue setCurrentTab={setCurrentTab}/>}
      {(currentTab === "game") && <GameTab setCurrentTab={setCurrentTab}/>}

    </div>
  );
};

export default App;