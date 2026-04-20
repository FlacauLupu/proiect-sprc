using System.Net.Sockets;
using System.Text;

using Backend;
using Microsoft.EntityFrameworkCore.Storage;


namespace Backend
{
    public static class CommandHandler
    {
        public static Socket? socket;
        private static CommandType commandType;
        public static short eventId = 1;

        public static void ProcessMessage(Message message)
        {
            if (socket is null) { return; }



            int playerId;
            byte[] eventIdBuffer = BitConverter.GetBytes(eventId);
            eventId++;
            byte[] responseBuffer;
            commandType = CommandType.Unicast;

            try
            {
                switch (message.command)
                {

                    case AuthCommands.Login:
                        string playerName = "";

                        if (message.data is not null)
                            playerName = Encoding.UTF8.GetString(message.data) ?? "";

                        Player? player;
                        player = Database.GetPlayerByName(playerName);

                        if (player is null)
                        {
                            responseBuffer = Commands.CreateResponseBuffer(new Response(AuthCommands.Login, eventIdBuffer, null));
                            break;
                        }

                        byte[] playerBuffer = Utils.SerializePlayer(player);
                        responseBuffer = Commands.CreateResponseBuffer(new Response(AuthCommands.Login, eventIdBuffer, playerBuffer));
                        break;

                    case AuthCommands.Logout:

                        if (message.data is null)
                        {
                            responseBuffer = Commands.CreateResponseBuffer(new Response(Commands.InvalidRequest, eventIdBuffer, null));
                            commandType = CommandType.Broadcast;
                            break;
                        }

                        playerId = BitConverter.ToInt32(message.data);
                        GameHandler.RemovePlayer(playerId);


                        responseBuffer = Commands.CreateResponseBuffer(new Response(ManagerCommands.Play, eventIdBuffer, null));
                        break;

                    case ManagerCommands.Play:
                        if (message.data is null)
                        {
                            responseBuffer = Commands.CreateResponseBuffer(new Response(Commands.InvalidRequest, eventIdBuffer, null));
                            break;
                        }

                        playerId = BitConverter.ToInt32(message.data);
                        GameHandler.AddPlayer(playerId);
                        byte[] status = [1];

                        if (GameHandler.DoesPlayerExist(playerId))
                        {
                            status = [0];
                            if (GameHandler.gameState == GameState.Running)
                                commandType = CommandType.Broadcast;
                        }

                        responseBuffer = Commands.CreateResponseBuffer(new Response(ManagerCommands.Play, eventIdBuffer, status));
                        break;

                    case ManagerCommands.Quit:
                        if (message.data is null)
                        {
                            responseBuffer = Commands.CreateResponseBuffer(new Response(Commands.InvalidRequest, eventIdBuffer, null));
                            commandType = CommandType.Broadcast;
                            break;
                        }

                        playerId = BitConverter.ToInt32(message.data);
                        GameHandler.RemovePlayer(playerId);

                        commandType = CommandType.Broadcast;

                        responseBuffer = Commands.CreateResponseBuffer(new Response(ManagerCommands.Quit, eventIdBuffer, null));
                        break;

                    case MovingCommands.Up:
                        if (message.data is null)
                        {
                            responseBuffer = Commands.CreateResponseBuffer(new Response(Commands.InvalidRequest, eventIdBuffer, null));
                            break;
                        }

                        playerId = BitConverter.ToInt32(message.data);

                        if (!GameHandler.DoesPlayerExist(playerId))
                        {
                            responseBuffer = Commands.CreateResponseBuffer(new Response(Commands.InvalidRequest, eventIdBuffer, null));
                            break;
                        }

                        commandType = CommandType.Broadcast;
                        responseBuffer = Commands.CreateResponseBuffer(new Response(MovingCommands.Up, eventIdBuffer, message.data));

                        break;

                    default:
                        responseBuffer = Commands.CreateResponseBuffer(new Response(Commands.InvalidRequest, eventIdBuffer, null));
                        break;

                }
                ExecuteCommand(commandType, responseBuffer);


            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR: " + ex.Message);
            }



        }

        public static void ExecuteCommand(CommandType commandType, byte[] responseBuffer)
        {
            Console.WriteLine("dadas");

            if (socket is null) return;

            if (commandType == CommandType.Broadcast) Server.Broadcast(responseBuffer);
            else if (commandType == CommandType.Unicast) Server.SendResponse(socket, responseBuffer);
            Console.WriteLine("dadas1231");


        }

        private static byte[] CreatePlayersBuffer()
        {
            byte[] playersBuffer = new byte[GameHandler.players.Count];
            int playerStateSize = 5; // 4 bytes for id, and one for alive boolean

            for (int i = 0; i < GameHandler.players.Count; i++)
            {
                byte[] serialized = Utils.SerializePlayerState(GameHandler.players[i]);
                Buffer.BlockCopy(serialized, 0, playersBuffer, i * playerStateSize, playerStateSize);
            }

            return playersBuffer;
        }


    }

    public enum CommandType
    {
        Unicast,
        Broadcast,
    }
}