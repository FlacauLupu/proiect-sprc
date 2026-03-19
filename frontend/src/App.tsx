import { useEffect, useState } from "react";
import Menu from "./components/Menu.tsx";

const App = () => {
  const [anyUserSaved, setAnyUserSaved] = useState(false);

  useEffect(() => {
    const playerName = localStorage.getItem("playerName");

    if (!playerName) setAnyUserSaved(false);
    else {
      setAnyUserSaved(true);
    }
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[url(background.png)]">
      <Menu></Menu>
      {/* conditie && game */}
      {/* conditie && dialogname */}
    </div>
  );
};

export default App;
