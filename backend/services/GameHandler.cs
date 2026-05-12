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
        private static readonly int roundTransitionDelayMs = 3000;
        private static bool roundTransitionPending = false;
        private static Player? pendingWinner;


        public static void AddPlayer(Player player)
        {
            if (roundTransitionPending)
            {
                Console.WriteLine("Game transition in progress, ignoring join for player: " + player.Id);
                return;
            }

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


        public static RoundOutcome PlayerDie(short playerId)
        {
            if (playersDict.TryGetValue(playerId, out var player))
            {
                if (!player.alive || roundTransitionPending)
                {
                    return RoundOutcome.None;
                }

                player.alive = false;
                if (playersDict.Count(kv => kv.Value.alive) == 1)
                {
                    var winner = playersDict.Values.FirstOrDefault(kv => kv.alive);
                    if (winner is not null)
                    {
                        winner.player.Coins += 10;
                    }

                    pendingWinner = GetWinningPlayerSnapshot();

                    if (currentRound >= roundsCount)
                    {
                        roundTransitionPending = true;
                        gameState = GameState.Idle;
                        timer.Change(Timeout.Infinite, Timeout.Infinite);
                        gameState = GameState.Stopped;
                        return RoundOutcome.GameEnded;
                    }
                    else
                    {
                        gameState = GameState.Idle;
                        roundTransitionPending = true;
                        currentRound++;
                        timer.Change(Timeout.Infinite, Timeout.Infinite);

                        Console.WriteLine("Round ended");
                        return RoundOutcome.RoundReset;

                    }

                }
                Console.WriteLine("Player died: " + playerId);
            }
            return RoundOutcome.None;
        }

        public static void SendRoundReset()
        {
            Task.Run(async () =>
            {
                await Task.Delay(roundTransitionDelayMs);

                foreach (var kv in playersDict)
                {
                    kv.Value.alive = true;
                }

                Response response = new Response(GameCommands.RoundReset, EventId.GetEventIdBuffer(), null);
                byte[] responseBuffer = Commands.CreateResponseBuffer(response);

                gameState = GameState.Running;
                roundTransitionPending = false;

                CommandHandler.ExecuteCommand(CommandType.Broadcast, responseBuffer, null);
                timer.Change(0, 1400);
            });
        }

        public static void SendGameEnded()
        {
            var winner = pendingWinner ?? GetWinningPlayerSnapshot();
            pendingWinner = null;

            Task.Run(async () =>
            {
                await Task.Delay(roundTransitionDelayMs);

                if (winner is null)
                {
                    return;
                }

                Response response = new Response(
                    GameCommands.GameEnded,
                    EventId.GetEventIdBuffer(),
                    Utils.SerializePlayer(winner)
                );
                byte[] responseBuffer = Commands.CreateResponseBuffer(response);

                CommandHandler.ExecuteCommand(CommandType.Broadcast, responseBuffer, null);
                roundTransitionPending = false;
            });
        }

        public static void ResetGameState()
        {
            timer.Change(Timeout.Infinite, Timeout.Infinite);
            playersDict.Clear();
            playersReadyCount = 0;
            roundsCount = 0;
            currentRound = 0;
            roundTransitionPending = false;
            pendingWinner = null;
            gameState = GameState.Stopped;
        }

        private static Player? GetWinningPlayerSnapshot()
        {
            var winner = playersDict.Values
                .OrderByDescending(kv => kv.player.Coins)
                .ThenByDescending(kv => kv.alive)
                .FirstOrDefault();

            if (winner is null)
            {
                return null;
            }

            return new Player
            {
                Id = winner.player.Id,
                Username = winner.player.Username,
                Coins = winner.player.Coins,
                Skill = winner.player.Skill,
            };
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

    public enum RoundOutcome
    {
        None,
        RoundReset,
        GameEnded,
    }
}