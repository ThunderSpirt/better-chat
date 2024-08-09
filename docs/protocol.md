# Intro
All data is served over TCP. Clients pass data to each other in JSON format.
This document defines how to use the format.
# Schema
```json
{
    "hdr": "MSG", 
    "msg": "*Message couldn't be parsed!", 
    "uuid": "c0ffee00-1234-1234-abcdabcd", 
    "ts": Date.now(), 
    "name": "(unknown)"
}
```
TODO: Encrypt message under RSA algorithm with a very looooooong passphrase. Any evidence of existence of the public and private key is DELETED with 3 overwrites.
# Verification Process
(none. that's client business)