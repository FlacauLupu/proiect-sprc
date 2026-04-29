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



            short playerId;
            byte[] eventIdBuffer = new byte[2];
            eventIdBuffer[0] = (byte)((eventId >> 8) & 0xFF);
            eventIdBuffer[1] = (byte)(eventId & 0xFF);
            eventId++;
            byte[] responseBuffer;
            commandType = CommandType.Unicast;

            Response response;

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
                            response = new Response(AuthCommands.Login, eventIdBuffer, null);
                            responseBuffer = Commands.CreateResponseBuffer(response);
                            break;
                        }

                        byte[] playerBuffer = Utils.SerializePlayer(player);
                        responseBuffer = Commands.CreateResponseBuffer(new Response(AuthCommands.Login, eventIdBuffer, playerBuffer));
                        break;

                    case AuthCommands.Logout:

                        if (message.data is null)
                        {
                            response = new Response(Commands.InvalidRequest, eventIdBuffer, null);

                            responseBuffer = Commands.CreateResponseBuffer(response);
                            commandType = CommandType.Broadcast;
                            break;
                        }

                        playerId = (short)((message.data[0] << 8) | message.data[1]);

                        GameHandler.RemovePlayer(playerId);

                        response = new Response(ManagerCommands.Play, eventIdBuffer, null);
                        responseBuffer = Commands.CreateResponseBuffer(response);
                        break;

                    case ManagerCommands.Play:
                        if (message.data is null)
                        {
                            response = new Response(Commands.InvalidRequest, eventIdBuffer, null);
                            responseBuffer = Commands.CreateResponseBuffer(response);
                            break;
                        }

                        playerId = (short)((message.data[0] << 8) | message.data[1]);
                        Console.WriteLine("Player id on server commandhandler: " + playerId);
                        GameHandler.AddPlayer(playerId);
                        byte[] status = [1];

                        if (GameHandler.DoesPlayerExist(playerId))
                        {
                            status = [0];
                            if (GameHandler.gameState == GameState.Running)
                                commandType = CommandType.Broadcast;
                        }

                        response = new Response(ManagerCommands.Play, eventIdBuffer, status);
                        responseBuffer = Commands.CreateResponseBuffer(response);
                        break;

                    case ManagerCommands.Quit:
                        if (message.data is null)
                        {
                            response = new Response(Commands.InvalidRequest, eventIdBuffer, null);
                            responseBuffer = Commands.CreateResponseBuffer(new Response(Commands.InvalidRequest, eventIdBuffer, null));
                            commandType = CommandType.Broadcast;
                            break;
                        }

                        playerId = (short)((message.data[0] << 8) | message.data[1]);

                        GameHandler.RemovePlayer(playerId);

                        commandType = CommandType.Broadcast;

                        response = new Response(ManagerCommands.Quit, eventIdBuffer, null);
                        responseBuffer = Commands.CreateResponseBuffer(response);
                        break;

                    case MovingCommands.Up:
                        if (message.data is null)
                        {
                            response = new Response(Commands.InvalidRequest, eventIdBuffer, null);
                            responseBuffer = Commands.CreateResponseBuffer(response);
                            break;
                        }

                        playerId = (short)((message.data[0] << 8) | message.data[1]);


                        if (!GameHandler.DoesPlayerExist(playerId))
                        {
                            response = new Response(Commands.InvalidRequest, eventIdBuffer, null);
                            responseBuffer = Commands.CreateResponseBuffer(response);
                            break;
                        }

                        commandType = CommandType.Broadcast;

                        response = new Response(MovingCommands.Up, eventIdBuffer, message.data);
                        responseBuffer = Commands.CreateResponseBuffer(response);

                        break;

                    default:
                        response = new Response(Commands.InvalidRequest, eventIdBuffer, null);
                        responseBuffer = Commands.CreateResponseBuffer(response);
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

            if (socket is null) return;

            if (commandType == CommandType.Broadcast) Server.Broadcast(responseBuffer);
            else if (commandType == CommandType.Unicast) Server.SendResponse(socket, responseBuffer);


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