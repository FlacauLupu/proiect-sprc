using System.IO;


namespace Backend
{
    public class Utils
    {
        public static byte[] Serialize(Player player)
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
    }

}
