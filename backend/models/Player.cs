using System.ComponentModel.DataAnnotations;


public class Player
{
    [Key] // This makes 'Id' the Primary Key
    public int Id { get; set; }

    public string Username { get; set; } = string.Empty;

    public int coins { get; set; } = 0;
    public int skill { get; set; } = 1;

}
