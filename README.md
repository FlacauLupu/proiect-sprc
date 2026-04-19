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
2 - logout + payload (eventId: Int)
3 - playGame + payload (eventId: Int)
4 - quit game + payload (eventId: Int)

failures:

-1 - login failure
-2 - logout failure
-3 - playGame failure
-4 - quit game failure

---UPDATES---
5 - startGame + payload (eventId: Int, players: Array<Player>)
6 - player removed + payload (eventId: Int, playerdId: int)
7 - player jumped + payload (eventId: Int playerdId: int,)

payload:

any number of bytes sent, including 0, any data type

#####################
{numberOfTotalBytesOfThisRequest: <byte>}{commandId: <byte>}{payload: <byte[]>}
