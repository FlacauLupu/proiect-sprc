commands: first byte

1 - login + payload (username: string)
2 - logout + payload (playerdId: int)
3 - play game + payload (playerdId: int)
4 - quit game + payload (playerdId: int)
5 - jump + payload (playerdId: int)
6 - die + payload (playerdId: int)

responses: first byte
success:

1 - login + payload (player: Player)
2 - logout
3 - playGame
4 - quit game

failures:

-1 - login
-2 - logout
-3 - playGame
-4 - quit game

---UPDATES---
5 - startGame + payload (players: Array<Player>)
6 - player removed + payload (playerdId: int)
7 - player jumped + payload (playerdId: int)

payload:

any number of bytes sent, including 0, any data type

#####################
{numberOfTotalBytesOfThisRequest: <byte>}{commandId: <byte>}{payload: <byte[]>}
