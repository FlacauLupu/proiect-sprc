using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading;

namespace Backend
{
    public class Server
    {
        static void Main(string[] args)
        {
            // Start the server on port 8080
            new Server(8080).Run();
        }

        private Socket _listener;

        public Server(int port)
        {
            _listener = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
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

                    // In a real game, you'd use Task.Run(() => HandleClient(client)) 
                    // so multiple players can play at once.
                    HandleClient(client);
                }
            }
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

                    if (!handshaked)
                    {
                        // Pass the 'message' we just received as the 'data'
                        HandleHandshake(client, message);
                        handshaked = true;
                    }
                    else
                    {
                        // After handshake, messages are "Masked" (encoded).
                        // If you see gibberish here, we need to add the Unmasking logic!
                        Console.WriteLine($"Encrypted WebSocket Frame received: {message}");
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
    }
}