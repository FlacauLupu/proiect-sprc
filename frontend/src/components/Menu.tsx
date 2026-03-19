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
    <div className="flex flex-col justify-between items-center ">
      <button onClick={handleGameStart}>Start</button>
      <button onClick={handleChangeName}>Change name</button>
    </div>
  );
};

export default Menu;