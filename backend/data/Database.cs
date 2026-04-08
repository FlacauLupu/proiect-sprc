using System.IO;
using Microsoft.Data.Sqlite;

namespace Backend
{
    public class Database
    {
        private static readonly string DbPath = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "game.db")
        );
        private static readonly string ConnectionString = $"Data Source={DbPath}";

        public static void Initialize()
        {
            using var connection = new SqliteConnection(ConnectionString);
            connection.Open();
            var command = connection.CreateCommand();
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS Players (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Name TEXT NOT NULL UNIQUE,
                    Coins INTEGER DEFAULT 0,
                    Skill INTEGER DEFAULT 1
                );
                
                INSERT OR IGNORE INTO Players (Id, Name, Coins, Skill) 
                 VALUES (1, 'SYSTEM', 999999, 999);
                ";
            command.ExecuteNonQuery();
        }

        public static Player? GetPlayerByName(string playerName)
        {
            using var connection = new SqliteConnection(ConnectionString);
            connection.Open();

            var command = connection.CreateCommand();
            command.CommandText = "SELECT Id, Name, Coins, Skill FROM Players WHERE Name = $name";
            command.Parameters.AddWithValue("$name", playerName);

            try
            {
                using var reader = command.ExecuteReader();

                if (reader.Read())
                {
                    return new Player
                    {
                        Id = reader.GetInt64(0),
                        Username = reader.GetString(1),
                        Coins = reader.GetInt32(2),
                        Skill = reader.GetInt32(3)
                    };
                }
                else
                {
                    return RegisterUser(playerName);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Login Error: " + ex.Message);
                return null;
            }
        }
        public static Player? RegisterUser(string playerName)
        {
            using var connection = new SqliteConnection(ConnectionString);
            connection.Open();

            var command = connection.CreateCommand();
            command.CommandText = @"
        INSERT INTO Players (Name) VALUES ($name);
        SELECT last_insert_rowid();";

            command.Parameters.AddWithValue("$name", playerName);

            try
            {
                object? result = command.ExecuteScalar();
                if (result == null) return null;
                long newId = Convert.ToInt64(result);

                return new Player(newId, playerName, 0, 1);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Registration Error: " + ex.Message);
                return null;
            }
        }
    }
}