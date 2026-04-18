using System.Text;

using Backend;
using Microsoft.EntityFrameworkCore.Storage;


namespace Backend
{
    public class HandleCommands
    {

        public static byte[] ExecuteCommand(Message message)
        {


            string dataStr = Encoding.UTF8.GetString(message.data);
            Player? player = null;




            switch (message.command)
            {

                case AuthCommands.Login:
                    player = Database.GetPlayerByName(dataStr);

                    if (player is null)
                    {
                        return new byte[1];
                    }

                    byte[] data = Utils.SerializePlayer(player);
                    return Commands.CreateMessage(Commands.Success, data);

                case AuthCommands.Logout:
                    if (player is null)
                    {
                        return new byte[1];
                    }
                    HandleGame.RemovePlayer(player.Id);
                    return Commands.CreateMessage(Commands.Success, null);

                case ManagerCommands.Play:
                    if (player is null) return new byte[1];

                    HandleGame.AddPlayer(player.Id);

                    // if (HandleGame.gameState == HandleGame.GameState.Idle)

                    return Commands.CreateMessage(Commands.Success, CreatePlayersBuffer());

                case ManagerCommands.Quit:

                    if (player is null) return new byte[1];

                    HandleGame.RemovePlayer(player.Id);

                    return Commands.CreateMessage(Commands.Success, CreatePlayersBuffer());



                case MovingCommands.Up:
                    if (player is null) return new byte[1];

                    return Commands.CreateMessage(MovingCommands.Up, null);

            }
            return new byte[1];
        }

        private static byte[] CreatePlayersBuffer()
        {
            byte[] playersBuffer = new byte[HandleGame.players.Count];
            int playerStateSize = 5; // 4 bytes for id, and one for alive boolean

            for (int i = 0; i < HandleGame.players.Count; i++)
            {
                byte[] serialized = Utils.SerializePlayerState(HandleGame.players[i]);
                Buffer.BlockCopy(serialized, 0, playersBuffer, i * playerStateSize, playerStateSize);
            }

            return playersBuffer;
        }


    }
}