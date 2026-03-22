import {  useState } from "react"

interface PlayerNameDialogueProps {
  setCurrentTab: React.Dispatch<React.SetStateAction<string>> 
}

const PlayerNameDialogue = ({setCurrentTab}: PlayerNameDialogueProps) => {
  const [name, setName] = useState<string>("")
  const [error, setError] = useState<boolean>(false)

  const handleSubmit = (e) => {
    e.preventDefault();

    if (name.trim() === '') {
      setError(true);
      return;
    }

    setError(false);
    localStorage.setItem("platerName", name)
    setCurrentTab("menu")
  }

  return (
    <div className="h-screen flex items-center justify-center">
      
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl flex flex-col items-center gap-6">
        
        <h2 className="text-xl font-bold text-gray-800">
          Enter your username
        </h2>

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

          {error && <p style={{color: 'red'}}> The username can't be blank. </p>}

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
  )
}

export default PlayerNameDialogue;