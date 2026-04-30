using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading;
using Backend;
using Microsoft.VisualBasic;


namespace Backend
{
    public class Server
    {
        private static readonly List<Socket> _connectedClients = new List<Socket>();
        private static readonly object _lock = new object();
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
                    // lock (_lock) { _connectedClients.Add(client); }
                    Task.Run(() => HandleClient(client));

                    // Inside HandleClient() in the 'break' block (disconnect)

                }
            }
        }

        public static void SendResponse(Socket client, byte[] payload)
        {
            byte[] frame;

            if (payload.Length <= 125)
            {
                frame = new byte[payload.Length + 2];
                frame[0] = 0x82; // finalized binary frame
                frame[1] = (byte)payload.Length;
                Array.Copy(payload, 0, frame, 2, payload.Length);
            }
            else if (payload.Length <= ushort.MaxValue)
            {
                frame = new byte[payload.Length + 4];
                frame[0] = 0x82;
                frame[1] = 126;
                frame[2] = (byte)((payload.Length >> 8) & 0xFF);
                frame[3] = (byte)(payload.Length & 0xFF);
                Array.Copy(payload, 0, frame, 4, payload.Length);
            }
            else
            {
                throw new InvalidOperationException("Payload too large for a single WebSocket frame.");
            }

            client.Send(frame);
        }

        private void HandleClient(Socket client)
        {
            bool handshaked = false;

            lock (_lock)
                _connectedClients.Add(client);

            try
            {
                byte[] temp = new byte[1024];

                while (true)
                {
                    int received;

                    try
                    {
                        received = client.Receive(temp);
                    }
                    catch
                    {
                        break; // connection dropped
                    }

                    if (received == 0)
                        break;

                    if (!handshaked)
                    {
                        string request = Encoding.UTF8.GetString(temp, 0, received);
                        HandleHandshake(client, request);
                        handshaked = true;
                        continue;
                    }

                    byte[] decodedPayload = UnmaskData(temp, received);
                    if (!ValidatePayload(decodedPayload, client)) continue;

                    Message message = Commands.DecodeMessageBuffer(decodedPayload);
                    if (message.data is not null)
                        Console.WriteLine(BitConverter.ToString(message.data));
                    CommandHandler.ProcessMessage(message, client);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR: " + ex);
            }
            finally
            {
                lock (_lock)
                    _connectedClients.Remove(client);

                try { client.Shutdown(SocketShutdown.Both); } catch { }
                client.Close();
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

        private byte[] UnmaskData(byte[] buffer, int received)
        {
            if (received < 6)
            {
                return Array.Empty<byte>();
            }

            bool isMasked = (buffer[1] & 0x80) != 0;
            int payloadLength = buffer[1] & 0x7F;

            int offset = 2;
            if (payloadLength == 126) offset = 4;
            else if (payloadLength == 127) offset = 10;

            if (isMasked)
            {
                byte[] masks = new byte[4] { buffer[offset], buffer[offset + 1], buffer[offset + 2], buffer[offset + 3] };
                offset += 4;

                int payloadSize = received - offset;
                if (payloadSize <= 0)
                {
                    return Array.Empty<byte>();
                }

                byte[] payload = new byte[payloadSize];
                for (int i = 0; i < payload.Length; i++)
                {
                    payload[i] = (byte)(buffer[offset + i] ^ masks[i % 4]);
                }

                return payload;
            }

            return Array.Empty<byte>();
        }

        public static void Broadcast(byte[] payload)
        {
            lock (_lock)
            {
                foreach (var client in _connectedClients)
                {
                    if (client.Connected)
                    {
                        try { SendResponse(client, payload); }
                        catch { /* Handle disconnected client */ }
                    }
                }
            }
        }

        private bool ValidatePayload(byte[] buffer, Socket socket)
        {
            short length = (short)((buffer[0] << 8) | buffer[1]);

            if (buffer.Length != length)
            {
                byte[] responseBuffer = Commands.CreateResponseBuffer(new Response(Commands.MalformedCommand, BitConverter.GetBytes((short)0), null));
                CommandHandler.ExecuteCommand(CommandType.Unicast, responseBuffer, socket);
                return false;
            }

            return true;
        }
    }
}