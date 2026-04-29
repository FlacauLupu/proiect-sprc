using System.Net.Sockets;
using System.Text;
using System.Buffers.Binary;

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
            if (socket is null)
            {
                Console.WriteLine("Socket is null!");
                return;
            }

            byte[] responseBuffer;
            commandType = CommandType.Unicast;

            Response response;

            try
            {
                eventId++;

                Player? player;
                switch (message.command)
                {

                    case AuthCommands.Login:
                        string playerName = "";

                        if (message.data is not null)
                            playerName = Encoding.UTF8.GetString(message.data) ?? "";

                        player = Database.GetPlayerByName(playerName);

                        if (player is null)
                        {
                            response = new Response(AuthCommands.Login, EventId.GetEventIdBuffer(), null);
                            responseBuffer = Commands.CreateResponseBuffer(response);
                            break;
                        }

                        byte[] playerBuffer = Utils.SerializePlayer(player);
                        response = new Response(AuthCommands.Login, EventId.GetEventIdBuffer(), playerBuffer);
                        responseBuffer = Commands.CreateResponseBuffer(response);
                        break;

                    case AuthCommands.Logout:

                        if (message.data is null)
                        {
                            response = new Response(Commands.InvalidRequest, EventId.GetEventIdBuffer(), null);

                            responseBuffer = Commands.CreateResponseBuffer(response);
                            commandType = CommandType.Broadcast;
                            break;
                        }

                        short playerId = (short)((message.data[0] << 8) | message.data[1]);

                        GameHandler.RemovePlayer(playerId);

                        response = new Response(ManagerCommands.Play, EventId.GetEventIdBuffer(), null);
                        responseBuffer = Commands.CreateResponseBuffer(response);
                        break;

                    case ManagerCommands.Play:
                        if (message.data is null)
                        {
                            response = new Response(Commands.InvalidRequest, EventId.GetEventIdBuffer(), null);
                            responseBuffer = Commands.CreateResponseBuffer(response);
                            break;
                        }

                        playerId = (short)((message.data[0] << 8) | message.data[1]);

                        player = Database.GetPlayerById(playerId);

                        // check if player exist in the database and if it is already in the game
                        if (player is not null && !GameHandler.playersDict.ContainsKey(player.Id))
                            GameHandler.AddPlayer(player);
                        else response = new Response(ManagerCommands.Play, EventId.GetEventIdBuffer(), null);


                        response = new Response(ManagerCommands.Play, EventId.GetEventIdBuffer(), null);
                        responseBuffer = Commands.CreateResponseBuffer(response);
                        break;

                    case ManagerCommands.Quit:
                        if (message.data is null)
                        {
                            response = new Response(Commands.InvalidRequest, EventId.GetEventIdBuffer(), null);
                            responseBuffer = Commands.CreateResponseBuffer(response);
                            commandType = CommandType.Broadcast;
                            break;
                        }

                        playerId = (short)((message.data[0] << 8) | message.data[1]);

                        GameHandler.RemovePlayer(playerId);

                        commandType = CommandType.Broadcast;

                        response = new Response(ManagerCommands.Quit, EventId.GetEventIdBuffer(), null);
                        responseBuffer = Commands.CreateResponseBuffer(response);
                        break;

                    case MovingCommands.Up:
                        if (message.data is null)
                        {
                            response = new Response(Commands.InvalidRequest, EventId.GetEventIdBuffer(), null);
                            responseBuffer = Commands.CreateResponseBuffer(response);
                            break;
                        }

                        playerId = (short)((message.data[0] << 8) | message.data[1]);


                        if (!GameHandler.playersDict.ContainsKey(playerId))
                        {
                            response = new Response(Commands.InvalidRequest, EventId.GetEventIdBuffer(), null);
                            responseBuffer = Commands.CreateResponseBuffer(response);
                            break;
                        }

                        commandType = CommandType.Broadcast;

                        response = new Response(MovingCommands.Up, EventId.GetEventIdBuffer(), message.data);
                        responseBuffer = Commands.CreateResponseBuffer(response);

                        break;

                    default:
                        response = new Response(Commands.InvalidRequest, EventId.GetEventIdBuffer(), null);
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



    }

    public enum CommandType
    {
        Unicast,
        Broadcast,
    }

    public static class EventId
    {
        private static byte[] buffer = { 0x00, 0x01 };
        private static short eventId;

        public static byte[] GetEventIdBuffer()
        {
            eventId = BinaryPrimitives.ReadInt16BigEndian(buffer);
            BinaryPrimitives.WriteInt16BigEndian(buffer, (short)(eventId + 1));
            eventId++;

            return buffer;
        }


    }
}