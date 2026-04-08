using System.Collections;
using System.Diagnostics.Tracing;

namespace Backend
{


    class HandleGame
    {
        public static ArrayList players = new ArrayList();
        public static GameState gameState = GameState.None;
        public static void InitGame()
        {
            gameState = GameState.Idle;
            if (players.Count == 2)
                gameState = GameState.Running;
        }

        public static void AddPlayer(int playerId)
        {
            if (gameState == GameState.Idle)
                players.Add(new PlayerState(playerId));
        }

        // public static void RemovePlayer(Player player)
        // {
        //     players.Remove(player);
        // }

        public static void JumpPlayer(int playerId)
        {
            if (gameState == GameState.Running) { }


        }
        public enum GameState
        {
            None,
            Stopped,
            Idle,
            Running,
        }

        public class PlayerState
        {
            public int playerId;
            public bool alive;

            public PlayerState(int playerId)
            {
                this.playerId = playerId;
            }

            public void PlayerDie()
            {
                this.alive = false;

            }

        }


    }
}