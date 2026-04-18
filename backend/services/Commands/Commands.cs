
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

        public static byte[] CreateMessage(byte command, byte[]? data)
        {
            data ??= Array.Empty<byte>();

            byte commandLength = (byte)(2 + data.Length);
            byte[] message = new byte[commandLength];

            message[0] = commandLength;
            message[1] = command;

            Buffer.BlockCopy(data, 0, message, 2, data.Length);

            return message;
        }

        public static Message DecodeMessage(byte[] messageBuffer)
        {
            byte commandLength = messageBuffer[0];


            byte command = messageBuffer[1];
            byte[] data = new byte[commandLength - 2];

            Buffer.BlockCopy(messageBuffer, 2, data, 0, data.Length);

            return new Message(command, data);
        }
    }
    public class Message
    {
        public byte command;
        public byte[] data;

        public Message(byte command, byte[] data)
        {
            this.command = command;
            this.data = data;
        }
    }

}

