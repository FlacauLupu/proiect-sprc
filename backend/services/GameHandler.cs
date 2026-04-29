
namespace Backend
{
    public static class GameHandler
    {
        public static List<PlayerState> players = new List<PlayerState>();
        public static GameState gameState = GameState.Stopped;

        public static void AddPlayer(int playerId)
        {
            if (gameState != GameState.Running)
            {
                // players.Add(new PlayerState(playerId));
                Console.WriteLine(playerId);

                gameState = GameState.Idle;
            }

            if (players.Count == 1)
            {
                byte[] eventIdBuffer = new byte[2];
                eventIdBuffer[0] = (byte)((CommandHandler.eventId >> 8) & 0xFF);
                eventIdBuffer[1] = (byte)(CommandHandler.eventId & 0xFF);

                // byte[]? playerStatesBuffer = Utils.SerializePlayerList();

                // Response response = new Response(ManagerCommands.Start, eventIdBuffer, );
                // CommandHandler.ExecuteCommand(CommandType.Broadcast, )
                gameState = GameState.Running;
            }

        }

        public static void RemovePlayer(int playerId)
        {
            if (gameState == GameState.Running || gameState == GameState.Idle)
            {
                players.RemoveAll(p => p.playerId == playerId);

                if (players.Count == 0)
                    gameState = GameState.Stopped;
                else if (players.Count < 2)
                    gameState = GameState.Idle;
            }
        }


        public static bool DoesPlayerExist(int playerId)
        {
            return players.Any(p => p.playerId == playerId && p.alive);
        }

        public static void PlayerDie(int playerId)
        {
            players.Any(p => p.playerId == playerId);
        }

        public class PlayerState
        {
            public int playerId;
            public bool alive;
            public string username;

            public PlayerState(int playerId, string username)
            {
                this.playerId = playerId;
                this.username = username;
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