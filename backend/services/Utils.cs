using System.IO;
using System.Text;


namespace Backend
{
    public class Utils
    {
        /*   public static byte[] SerializePlayer(Player player)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                using (BinaryWriter writer = new BinaryWriter(ms, Encoding.UTF8))
                {
                    writer.Write(player.Id); // Writes 2 bytes
                    writer.Write(player.Username);  // Writes 4 bytes
                    writer.Write(player.Coins); // Writes 1 byte
                    writer.Write(player.Skill); // Writes 1 byte

                    return ms.ToArray();
                }
            }
        }

        public static byte[] SerializePlayerList(List<Player> players)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                using (BinaryWriter writer = new BinaryWriter(ms, Encoding.UTF8))
                {
                    writer.Write(players.Count);

                    foreach (var p in players)
                    {
                        writer.Write(p.Id);
                        writer.Write(p.Username);
                        writer.Write(p.Coins);
                        writer.Write(p.Skill);
                    }
                    return ms.ToArray();
                }
            }
        }

        public static byte[] SerializePlayerState(GameHandler.PlayerState playerState)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                using (BinaryWriter writer = new BinaryWriter(ms, Encoding.UTF8))
                {
                    writer.Write(playerState.playerId); // Writes 4 bytes
                    writer.Write(playerState.alive);  // Writes 1 byte

                    return ms.ToArray();
                }
            }
        }
    }

}
*/
        public static byte[] SerializePlayer(Player player)
        {
            using (MemoryStream ms = new MemoryStream())
            using (BinaryWriter writer = new BinaryWriter(ms, Encoding.UTF8))
            {
                WriteInt16BE(writer, player.Id);
                WriteStringBE(writer, player.Username);
                writer.Write(player.Coins);
                writer.Write(player.Skill);

                return ms.ToArray();
            }
        }

        public static byte[] SerializePlayerStates(List<GameHandler.PlayerState> playerStates)
        {
            using (MemoryStream ms = new MemoryStream())
            using (BinaryWriter writer = new BinaryWriter(ms, Encoding.UTF8))
            {
                WriteInt16BE(writer, (short)playerStates.Count);

                foreach (var p in playerStates)
                {
                    WriteInt16BE(writer, p.player.Id);
                    WriteStringBE(writer, p.player.Username);
                    writer.Write(p.player.Coins);
                    writer.Write(p.player.Skill);
                }

                return ms.ToArray();
            }
        }


        public static void WriteInt32BE(BinaryWriter writer, int value)
        {
            var bytes = BitConverter.GetBytes(value);
            if (BitConverter.IsLittleEndian)
                Array.Reverse(bytes);

            writer.Write(bytes);
        }

        public static void WriteInt16BE(BinaryWriter writer, short value)
        {
            var bytes = BitConverter.GetBytes(value);
            if (BitConverter.IsLittleEndian)
                Array.Reverse(bytes);

            writer.Write(bytes);
        }

        public static void WriteStringBE(BinaryWriter writer, string value)
        {
            var stringBytes = Encoding.UTF8.GetBytes(value);

            // Write length first (big endian)
            WriteInt32BE(writer, stringBytes.Length);

            writer.Write(stringBytes);
        }
    }

}
