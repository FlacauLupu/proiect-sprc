interface GameProps {
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>
}

const Game = ({setCurrentTab}: GameProps) => {

  return (
    <div
      style = {{
        width: 300,
        height: 300,
        background: "#000",
        boxSizing: "border-box"
      }} className="flex flex-col"
    >
      <button onClick={() =>setCurrentTab("menu")}>Back</button>
    </div>
  );
};

export default Game;