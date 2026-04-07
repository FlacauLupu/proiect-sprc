
using System;
using System.Text;

namespace Backend
{
    public class Commands
    {

        public const string CommandDelim = "|";
        public const string IssuerDelim = ":";
        public const string EndMessageDelim = "<##>";

        public const string MalformedCommand = "MC";
        public const string InvalidRequest = "IR";

        public const string Request = "Req";
        public const string Deny = "Den";
        public const string Accept = "Acc";
        public const string Add = "Add";
        public const string Remove = "Rem";
        public const string None = "None";


        public static byte[] CreateMessage(string command, string issuer, string data)
        {
            if (command == null) return Array.Empty<byte>();
            if (data == null) data = None;

            return Encoding.Unicode.GetBytes(command + CommandDelim + issuer + IssuerDelim + data + EndMessageDelim);
        }

        public static Message DecodeMessage(string message)
        {
            string[] parts = message.Split(new string[] { CommandDelim }, StringSplitOptions.None);

            if (parts.Length != 3) return new Message(MalformedCommand, None, None);
            return new Message(parts[0], parts[1], parts[2]);
        }


        public class Message
        {
            public string Command { get; set; }
            public string Issuer { get; set; }
            public string Data { get; set; }

            public Message(string command, string issuer, string data)
            {
                this.Command = command;
                this.Issuer = issuer;
                this.Data = data;
            }
        }
    }
}

