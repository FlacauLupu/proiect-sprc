
using System.Net.Sockets;

namespace Backend
{
    public static class GameHandler
    {
        public static Dictionary<short, PlayerState> playersDict = new();
        public static GameState gameState = GameState.Stopped;

        public static int roundsCount;
        public static int currentRound;


        public static void AddPlayer(Player player)
        {
            if (gameState != GameState.Running)
            {
                playersDict[player.Id] = new PlayerState(player);
                Console.WriteLine("Player joined: " + player.Id);

                gameState = GameState.Idle;
            }

            if (playersDict.Count >= 2)
            {

                byte[] playerStatesBuffer = Utils.SerializePlayerStates(playersDict.Values.ToList());

                Response response = new Response(ManagerCommands.Start, EventId.GetEventIdBuffer(), playerStatesBuffer);
                byte[] resposeBuffer = Commands.CreateResponseBuffer(response);

                CommandHandler.ExecuteCommand(CommandType.Broadcast, resposeBuffer, null);
                gameState = GameState.Running;

                roundsCount = playersDict.Count;
                currentRound = 1;

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
                if (playersDict.Count(kv => kv.Value.alive) == 1)
                {
                    if (currentRound++ == roundsCount) gameState = GameState.Stopped;
                    else
                    {
                        gameState = GameState.Idle;

                        Console.WriteLine("Round ended");

                        foreach (var kv in playersDict)
                            kv.Value.alive = true;

                        gameState = GameState.Running;

                    }

                }
                Console.WriteLine("Player died: " + playerId);
            }

        }

        public static bool CheckAndSpendPlayerBalance(short playerId, int amount)
        {
            if (playersDict.TryGetValue(playerId, out var val))
            {
                if (val.player.Coins - amount < 0) return false;

                val.player.Coins -= amount;
                return true;
            }
            return false;

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