
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
                players.Add(new PlayerState(playerId));
                gameState = GameState.Idle;
            }

            if (players.Count == 2)
                gameState = GameState.Running;

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

            public PlayerState(int playerId)
            {
                this.playerId = playerId;
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