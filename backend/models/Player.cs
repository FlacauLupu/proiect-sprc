using System.ComponentModel.DataAnnotations;


public class Player
{
    [Key]
    public long Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public int Coins { get; set; }
    public int Skill { get; set; }

    // Empty constructor is often helpful for frameworks
    public Player() { }

    public Player(long id, string username, int coins, int skill)
    {
        Id = id;
        Username = username;
        Coins = coins;
        Skill = skill;
    }
}
