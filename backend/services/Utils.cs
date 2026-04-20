using System.IO;


namespace Backend
{
    public class Utils
    {
        public static byte[] SerializePlayer(Player player)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                using (BinaryWriter writer = new BinaryWriter(ms))
                {
                    writer.Write(player.Id); // Writes 4 bytes
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
                using (BinaryWriter writer = new BinaryWriter(ms))
                {
                    // Write how many players follow (e.g., 4 bytes)
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
                using (BinaryWriter writer = new BinaryWriter(ms))
                {
                    writer.Write(playerState.playerId); // Writes 4 bytes
                    writer.Write(playerState.alive);  // Writes 1 byte

                    return ms.ToArray();
                }
            }
        }
    }

}
