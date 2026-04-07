using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading;
using Backend;


namespace Backend
{
    public class Server
    {
        private Socket _listener;

        public Server(int port)
        {
            _listener = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            _listener.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
            _listener.Bind(new IPEndPoint(IPAddress.Any, port));
            _listener.Listen(10);
            Console.WriteLine($"Server started on port {port}...");
        }

        public void Run()
        {
            while (true)
            {
                if (_listener.Poll(1000, SelectMode.SelectRead))
                {
                    Socket client = _listener.Accept();
                    Console.WriteLine("New player connected!");

                    Task.Run(() => HandleClient(client));
                }
            }
        }

        private void SendResponse(Socket client, byte[] payload)
        {
            byte[] frame = new byte[payload.Length + 2];

            frame[0] = 0x81; // 0x81 means "This is a finalized Text frame"
            frame[1] = (byte)payload.Length; // For small messages, byte 2 is just the length

            Array.Copy(payload, 0, frame, 2, payload.Length);

            client.Send(frame);
        }

        private void HandleClient(Socket client)
        {
            bool handshaked = false;

            while (client.Connected)
            {

                if (client.Available > 0)
                {

                    byte[] buffer = new byte[client.Available];
                    int received = client.Receive(buffer);
                    string message = Encoding.UTF8.GetString(buffer, 0, received);

                    if (received < 5)
                    {
                        byte[] messageBytes = Commands.CreateMessage(Commands.MalformedCommand, "server", Commands.None);
                        SendResponse(client, messageBytes);
                    }

                    if (!handshaked)
                    {
                        // Pass the 'message' we just received as the 'data'
                        HandleHandshake(client, message);
                        handshaked = true;
                    }
                    else
                    {


                    }
                }
                Thread.Sleep(10); // Prevents the CPU from hitting 100%
            }
        }

        private void HandleHandshake(Socket client, string data)
        {
            var match = Regex.Match(data, "Sec-WebSocket-Key: (.*)");
            if (!match.Success) return;

            string key = match.Groups[1].Value.Trim();
            string magicString = key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

            byte[] hash = SHA1.Create().ComputeHash(Encoding.UTF8.GetBytes(magicString));
            string responseKey = Convert.ToBase64String(hash);

            string response = "HTTP/1.1 101 Switching Protocols\r\n" +
                              "Upgrade: websocket\r\n" +
                              "Connection: Upgrade\r\n" +
                              "Sec-WebSocket-Accept: " + responseKey + "\r\n\r\n";


            client.Send(Encoding.UTF8.GetBytes(response));
            Console.WriteLine("Handshake sent! Postman should now be 'Connected'.");
        }

        private string UnmaskData(byte[] buffer, int received)
        {
            // 1. The first byte tells us the type (0x81 is typical for Text)
            bool isMasked = (buffer[1] & 0x80) != 0;
            int payloadLength = buffer[1] & 0x7F; // Simplified: assumes length < 126

            int offset = 2;
            if (payloadLength == 126) offset = 4;
            else if (payloadLength == 127) offset = 10;

            if (isMasked)
            {
                // The next 4 bytes are the Masking Key
                byte[] masks = new byte[4] { buffer[offset], buffer[offset + 1], buffer[offset + 2], buffer[offset + 3] };
                offset += 4;

                // The rest is the actual data (the payload)
                byte[] payload = new byte[received - offset];
                for (int i = 0; i < payload.Length; i++)
                {
                    // The magic "Unmasking" step (XOR operation)
                    payload[i] = (byte)(buffer[offset + i] ^ masks[i % 4]);
                }

                string decodedMessage = Encoding.UTF8.GetString(payload);
                return decodedMessage;
                // Now you can pass this to your GameFlowController!
                // _gameFlow.HandleCommand(decodedMessage);
            }

            return "";
        }
    }
}