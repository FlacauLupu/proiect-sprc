using System.Threading;
using System.Net.Sockets;

namespace Backend
{
    public static class GameHandler
    {
        public static Dictionary<short, PlayerState> playersDict = new();
        public static GameState gameState = GameState.Stopped;

        public static int roundsCount;
        public static int currentRound;
        public static Timer timer = new Timer(GameHandler.GeneratePipe, null, Timeout.Infinite, 1400);
        public static int playersReadyCount = 0;


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

                SendStart();



            }
            else Console.WriteLine("Player count: " + playersDict.Count);

        }

        private static void SendStart()
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

        public static void GeneratePipe(object? state)
        {
            Response response = new Response(GameCommands.SpawnPipe, EventId.GetEventIdBuffer(), null);

            byte[] responseBuffer = Commands.CreateResponseBuffer(response);

            CommandHandler.ExecuteCommand(CommandType.Broadcast, responseBuffer, null);
        }

        public static void RemovePlayer(short playerId)
        {
            if (gameState == GameState.Running || gameState == GameState.Idle)
            {

                if (playersDict.Remove(playerId))
                {
                    Console.WriteLine("Player was removed: " + playerId);
                    playersReadyCount--;

                    if (playersReadyCount == 0)
                    {
                        gameState = GameState.Stopped;
                        timer.Change(Timeout.Infinite, Timeout.Infinite);
                    }

                    else if (playersReadyCount < 2)
                    {
                        gameState = GameState.Idle;
                        timer.Change(Timeout.Infinite, Timeout.Infinite);

                        Response response = new Response(GameCommands.NotReady, EventId.GetEventIdBuffer(), null);
                        byte[] responseBuffer = Commands.CreateResponseBuffer(response);
                        CommandHandler.ExecuteCommand(CommandType.Broadcast, responseBuffer, null);

                    }
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