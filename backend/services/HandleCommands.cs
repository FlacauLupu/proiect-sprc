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

                    byte[] data = Utils.Serialize(player);
                    return Commands.CreateMessage(Commands.Success, (byte)SpecialIssuers.ServerClient, data);

                case AuthCommands.Logout:
                    break;

                case ManagerCommands.Play:
                    if (player is null) return new byte[1];

                    HandleGame.InitGame();
                    HandleGame.AddPlayer((int)player.Id);
                    break;

                case MovingCommands.Up:
                    if (player is null) return new byte[1];

                    HandleGame.JumpPlayer((int)player.Id);
                    break;

            }
            return new byte[1];
        }

    }
}