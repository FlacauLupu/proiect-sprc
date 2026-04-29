
namespace Backend
{
    public static class GameHandler
    {
        public static Dictionary<short, PlayerState> playersDict = new();
        public static GameState gameState = GameState.Stopped;


        public static void AddPlayer(Player player)
        {
            if (gameState != GameState.Running)
            {
                playersDict[player.Id] = new PlayerState(player);

                gameState = GameState.Idle;
            }

            if (playersDict.Count == 2)
            {
                byte[] eventIdBuffer = new byte[2];
                eventIdBuffer[0] = (byte)((CommandHandler.eventId >> 8) & 0xFF);
                eventIdBuffer[1] = (byte)(CommandHandler.eventId & 0xFF);

                byte[] playerStatesBuffer = Utils.SerializePlayerStates(playersDict.Values.ToList());

                Response response = new Response(ManagerCommands.Start, eventIdBuffer, playerStatesBuffer);
                byte[] resposeBuffer = Commands.CreateResponseBuffer(response);

                CommandHandler.ExecuteCommand(CommandType.Broadcast, resposeBuffer);
                gameState = GameState.Running;
            }

        }

        public static void RemovePlayer(short playerId)
        {
            if (gameState == GameState.Running || gameState == GameState.Idle)
            {

                playersDict.Remove(playerId);


                if (playersDict.Count == 0)
                    gameState = GameState.Stopped;
                else if (playersDict.Count < 2)
                    gameState = GameState.Idle;
            }
        }


        public static void PlayerDie(short playerId)
        {
            playersDict[playerId].alive = false;
        }

        public class PlayerState
        {
            public Player player;
            public bool alive;

            public PlayerState(Player player)
            {
                this.player = player;
                this.alive = true;
            }

        }

    }
    public enum GameState
    {
        None,
        Stopped,
        Idle,
        Running,
    }
}