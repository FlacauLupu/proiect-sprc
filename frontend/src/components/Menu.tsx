interface MenuProps {
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
}

const Menu = ({setCurrentTab}: MenuProps) => {

  const handleChangeName = () => {
    localStorage.removeItem("playerName");
    setCurrentTab("dialog");
  };

  const handleGameStart = () => {
    setCurrentTab("game");
  }

    return (
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl flex flex-col items-center gap-6">
        <button
          onClick={handleGameStart}
          className="px-8 py-4 bg-yellow-400 text-black font-bold text-lg rounded-xl shadow-lg
                    hover:bg-yellow-300 active:scale-95 transition-all duration-150"
        >
          Start
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