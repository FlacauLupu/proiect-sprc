interface GameProps {
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>
}

const Game = ({setCurrentTab}: GameProps) => {

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      
      <div className="w-[1080px] h-[720px] bg-black border-4 border-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-white text-sm opacity-50">
          
        </div>
      </div>

      <button
        onClick={() => setCurrentTab("menu")}
        className="px-6 py-2 bg-white text-black font-semibold rounded-lg shadow-md
                  hover:bg-gray-100 active:scale-95 transition-all"
      >
        Back
      </button>

    </div>
  );
};

export default Game;