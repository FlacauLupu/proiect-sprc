
using System;
using System.Text;
using Microsoft.EntityFrameworkCore.Storage;

namespace Backend
{
    public class Commands
    {


        public const byte MalformedCommand = 9;
        public const byte InvalidRequest = 9;


        public const string None = "None";

        public static byte[] CreateResponseBuffer(Response response)
        {

            byte[] messageBuffer = new byte[response.responseLength];

            int offset = 0;

            Buffer.BlockCopy(BitConverter.GetBytes(response.responseLength), 0, messageBuffer, offset, sizeof(short));
            offset += sizeof(short);

            Buffer.BlockCopy(response.eventId, 0, messageBuffer, offset, response.eventId.Length);
            offset += response.eventId.Length;

            if (response.data is not null)
                Buffer.BlockCopy(response.data, 0, messageBuffer, offset, response.data.Length);

            return messageBuffer;
        }

        public static Message DecodeMessageBuffer(byte[] messageBuffer)
        {
            int offset = 0;

            byte[] messageLength = messageBuffer[offset..sizeof(short)];
            offset += sizeof(short);

            byte command = messageBuffer[offset];
            offset += sizeof(byte);

            byte[] data = messageBuffer[offset..];

            return new Message(command, data, BitConverter.ToInt16(messageLength, 0));
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

            this.responseLength = (short)(sizeof(short) + sizeof(byte) + dataLength);

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

