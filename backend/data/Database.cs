using Microsoft.Data.Sqlite;

var connectionString = "Data Source=game.db";

using var connection = new SqliteConnection(connectionString);
connection.Open();

var command = connection.CreateCommand();
command.CommandText =
@"
CREATE TABLE IF NOT EXISTS Players (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Coins INTEGER DEFAULT 0,
    Skill INTEGER DEFAULT 1,
);
";

command.ExecuteNonQuery();