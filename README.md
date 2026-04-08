commands:

1 - login
2 - logout
3 - play game
4 - quit game
5 - jump

issuers:

1 - client/server
2 - 255 - issuer_id/user_id

data:

any number of bytes sent, including 0, any data type

ending:

0

ex login:

commandform:
11"alex"0
responseform:
ok: 1<Player>0
error: 0

ex play game:

commandform:
3{playerId: int}0
responseform:
ok: 1{birdsId: Array<byte>}0
error: 0

ex jump:
this is in parallel: 5{birdId: byte}0
with this: 5{birdId: byte}0
