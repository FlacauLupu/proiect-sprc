using System.Collections.Generic;

namespace Backend
{
    public static class HandleGame
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

        // public static void Jump(int playerId)
        // {
        //     if (gameState == GameState.Running)
        //     {
        //         players.RemoveAll(p => p.playerId == playerId);

        //         if (players.Count == 0)
        //             gameState = GameState.Idle;
        //     }
        // }

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
            public bool alive = true;

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