
using System;
using System.Text;
using Microsoft.EntityFrameworkCore.Storage;

namespace Backend
{
    public class Commands
    {


        public const byte MalformedCommand = 9;
        public const byte InvalidRequest = 9;


        public const byte None = 9;

        public static byte[] CreateResponseBuffer(Response response)
        {
            byte[] messageBuffer = new byte[response.responseLength];

            int offset = 0;

            messageBuffer[offset] = (byte)((response.responseLength >> 8) & 0xFF);
            messageBuffer[offset + 1] = (byte)(response.responseLength & 0xFF);
            offset += sizeof(short);

            messageBuffer[offset] = response.command;
            offset += sizeof(byte);

            Buffer.BlockCopy(response.eventId, 0, messageBuffer, offset, response.eventId.Length);
            offset += response.eventId.Length;

            if (response.data is not null)
                Buffer.BlockCopy(response.data, 0, messageBuffer, offset, response.data.Length);

            return messageBuffer;
        }

        public static Message DecodeMessageBuffer(byte[] messageBuffer)
        {
            Console.WriteLine("FULL BUFFER: " + BitConverter.ToString(messageBuffer));
            int offset = 0;

            short messageLength = (short)((messageBuffer[0] << 8) | messageBuffer[1]);
            offset += sizeof(short);

            byte command = messageBuffer[offset];
            offset += sizeof(byte);

            int dataLength = messageLength - offset;

            if (dataLength < 0 || offset + dataLength > messageBuffer.Length)
                return new Message(command, Array.Empty<byte>(), messageLength);

            byte[] data = new byte[dataLength];
            Buffer.BlockCopy(messageBuffer, offset, data, 0, dataLength);

            return new Message(command, data, messageLength);
        }
    }
    public class Response
    {
        public byte command;
        public byte[] eventId;
        public byte[]? data;
        public short responseLength;


        public Response(byte command, byte[] eventId, byte[]? data)
        {
            this.command = command;
            this.eventId = eventId;
            this.data = data;

            int dataLength = data?.Length ?? 0;

            this.responseLength = (short)(sizeof(short) + sizeof(byte) + sizeof(short) + dataLength);

        }
    }

    public class Message
    {
        public byte command;
        public byte[]? data;
        public short messageLength;


        public Message(byte command, byte[]? data, short messageLength)
        {
            this.command = command;
            this.data = data;
            this.messageLength = messageLength;
        }

    }

}

