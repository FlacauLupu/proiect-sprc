
using System;
using System.Text;
using Microsoft.EntityFrameworkCore.Storage;

namespace Backend
{
    public class Commands
    {

        public const string CommandDelim = "|";
        public const string IssuerDelim = ":";
        public const string EndMessageDelim = "<##>";

        public const string MalformedCommand = "MC";
        public const string InvalidRequest = "IR";

        public const byte Success = 1;
        public const byte Error = 0;

        public const string None = "None";

        public static byte[] CreateMessage(byte command, byte issuer, byte[] data)
        {
            byte[] message = new byte[data.Length + 3];

            message[0] = command;
            message[1] = issuer;

            Buffer.BlockCopy(data, 0, message, 2, data.Length);

            message[message.Length - 1] = 0;

            return message;
        }

        public static Message DecodeMessage(byte[] messageBuffer)
        {
            int size = messageBuffer.Length;
            if (messageBuffer[size - 1] != 0 || size < 3)
            {
                Console.WriteLine("Error");

            }

            byte command = messageBuffer[0];
            byte issuer = messageBuffer[1];
            byte[] data = new byte[size - 2];

            Array.Copy(messageBuffer, 2, data, 0, size - 2);



            return new Message(messageBuffer[0], messageBuffer[1], data);
        }
    }
    public class Message
    {
        public byte command;
        public byte issuer;
        public byte[] data;

        public Message(byte command, byte issuer, byte[] data)
        {
            this.command = command;
            this.issuer = issuer;
            this.data = data;
        }
    }

    public enum SpecialIssuers : long
    {
        ServerClient = 1
    }
}

