import {  useState } from "react"

interface PlayerNameDialogueProps {
  setCurrentTab: React.Dispatch<React.SetStateAction<string>> 
}

const PlayerNameDialogue = ({setCurrentTab}: PlayerNameDialogueProps) => {
  const [name, setName] = useState("")


  return (
    <div className="flex flex-col justify-between items-center">

      <div className="flex flex-row justify-between">

        <form className="flex flex-row justify-between" onSubmit={(e) => {
          e.preventDefault()
          localStorage.setItem("playerName", name)
          setCurrentTab("menu")
        }}>

          <label htmlFor="username">Enter your Username: </label>
          <input type="text" value={name} onChange={(e)=>{setName(e.target.value)}}/>
          <button type="submit">Confirm</button>

        </form>

      </div>

    </div>
  )
}

export default PlayerNameDialogue;