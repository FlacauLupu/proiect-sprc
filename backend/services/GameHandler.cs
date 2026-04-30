
using System.Net.Sockets;

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
                Console.WriteLine("Player joined: " + player.Id);

                gameState = GameState.Idle;
            }

            if (playersDict.Count == 1)
            {

                byte[] playerStatesBuffer = Utils.SerializePlayerStates(playersDict.Values.ToList());

                Response response = new Response(ManagerCommands.Start, EventId.GetEventIdBuffer(), playerStatesBuffer);
                byte[] resposeBuffer = Commands.CreateResponseBuffer(response);

                CommandHandler.ExecuteCommand(CommandType.Broadcast, resposeBuffer, null);
                gameState = GameState.Running;
                Console.WriteLine("Game is starting!");
            }
            else Console.WriteLine("Player count: " + playersDict.Count);

        }

        public static void RemovePlayer(short playerId)
        {
            if (gameState == GameState.Running || gameState == GameState.Idle)
            {

                if (playersDict.Remove(playerId))
                {
                    Console.WriteLine("Player was removed: " + playerId);

                    if (playersDict.Count == 0)
                        gameState = GameState.Stopped;
                    else if (playersDict.Count < 2)
                        gameState = GameState.Idle;
                }
            }
        }


        public static void PlayerDie(short playerId)
        {
            if (playersDict.TryGetValue(playerId, out var player))
            {
                player.alive = false;
                Console.WriteLine("Player died: " + playerId);
            }

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