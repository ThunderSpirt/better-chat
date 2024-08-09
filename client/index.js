let _isNameReg = false
let NAME = ""
let UUID = ""
let pk = ""

const net = require("node:net")
const fs = require("fs")
const color = require("colors")
const path = require("node:path")
if(!fs.existsSync(path.resolve('./cfg.json'))) {
    fs.appendFileSync(path.resolve('./cfg.json'), JSON.stringify({address: "0.0.0.0", port: 32523}))
    console.log("[LOG] INFO:".bgCyan + " Created configuration file %s", path.resolve("./cfg.json"))
}
const options = require('./cfg.json')
const EventEmitter = require("node:events")
const crypto = require("crypto")
process.title = "BetterChat Client | Pending username..."
function UUIDGen() {
    let uuid = []
    uuid.push(crypto.createHash("sha256").update(Date.now().toString()).digest("hex").toString().slice(0, 8))
    uuid.push(Buffer.from(crypto.randomBytes(8)).toString("hex").slice(0, 4))
    uuid.push((Buffer.from("12c-").toString("hex").slice(1, 3) + crypto.createHash("sha256").update(crypto.randomBytes(8)).digest("hex").toString()).slice(0, 4))
    uuid.push((crypto.createHash("sha512").update(Buffer.from(crypto.randomBytes(8))).digest("hex").toString().slice(1, 2) + Buffer.from(crypto.randomBytes(15)).toString("hex")).slice(4,12))
    return uuid.join('-')
}

/**
 * Payload class.
 * Used for further parsing business. Don't care 'bout diz
 */
class Payload {
    /**
     * 
     * @param {string} m 
     * @param {string} u 
     * @param {string | number} t 
     * @param {(string | undefined)} [n=NAME] 
     */
    constructor(m, u, t, n) {
        if(typeof m !== "string" || typeof u !== "string" || parseInt(t) == NaN) {
            throw new TypeError("Invalid input. [PAYLOAD class]") // wanna know where is the input from
        }
        this.message = m // Message
        this.user = u // UUID
        this.time = t // Timestamp
        this.name = (!!n) ? n : NAME  
    }
}
class _Timer {
    _cooldown = 0
    _interv = 0
    constructor() {}
    setCD(ms) {
        this._cooldown = parseInt(ms)
    }
    getCD() {
        return this._cooldown
    }
    update() {
        if(this._cooldown > 0) {
            this._cooldown -= 1
        } else {
            clearInterval(this._interv)
        }
    }
    interv(id) {
        this._interv = id
    }
}
class CLUtil {
    /**
     * Create a client with provided UUID.
     * Modified code by TCP-Toolkit. Under tcp-client folder.
     * @author NullifiedTheDev
     * @param {string} _UUID
     */
    constructor(_UUID) {
        this.UUID = _UUID || UUIDGen()
        this.socket = net.createConnection({port: parseInt(options.port) !== NaN ? parseInt(options.port) : 32523, host: net.isIP(options.address) ? options.address : "0.0.0.0"}, () => {
            console.log("Connected to server.")
            this.socket.setKeepAlive(5000)
            this.socket.setNoDelay(true)
        })
    }

    
    parser(inp=new Payload("*empty*", UUID, Date.now())) {
        if(!inp instanceof Payload) {
            throw new TypeError("Invalid input. [CLUtil class/parser method]")
        }
        return {hdr: "MSG", msg: inp.message, uuid: inp.user, ts: inp.time, name: inp.name}
    }

    /**
         * Handles data. From TCP-Toolkit made compatible with the new chat
         * @param {Buffer} input 
         * @returns 
         */
    datahandler(input) {
        try {
            return JSON.parse(input.toString("utf-8"))
        } catch(e) {
            return {hdr: "MSG", msg: "*Message couldn't be parsed!", uuid: "c0ffee00-1234-1234-abcdabcd", ts: Date.now(), name: "(unknown)"}
        }
    }

    /**
     * Self explainatory name.
     * @returns... yk!
     */
    getSocket() {
        return this.socket
    }

    /**
     * Self explainatory name.
     * @returns... yk!
     */
    getUUID() {
        return this.UUID
    }
}

/*
Schema:
----------------------------------
{
    hdr: "MSG", 
    msg: "*Message couldn't be parsed!", 
    uuid: "c0ffee00-1234-1234-abcdabcd", 
    ts: Date.now(), 
    name: "(unknown)"
}
----------------------------------
*/
let cl = new CLUtil()
let tm = new _Timer()
exports.cl = cl
cl.getSocket()
    .on("connect", () => {
        cl.getSocket().setKeepAlive(5000)
        cl.getSocket().setNoDelay(true)
    }).on("data", (d) => {
        let JSONified = cl.datahandler(d.toString("utf8"))
        // console.log("Income received")
        if(JSONified.hdr === "ENC" && !!JSONified.pk) {pk = JSON.parse(d.toString('utf8')).pk} // well... not used yet (public key)
        if(JSONified.hdr === "MSG") {
            if(!!/([a-f]|[0-9]){8}\-([a-f]|[0-9]){4}\-([a-f]|[0-9]){4}\-([a-f]|[0-9]){8}/gmi.test(JSONified.uuid) && !!JSONified.ts && JSONified.name) {
                // console.log("Income received #1")
                let _dp = new Date(!!JSONified.ts ? JSONified.ts : Date.now())
                console.log(`${"[".gray}${(("0" + _dp.getHours()).slice(-2).toString().green + ":".white + ("0" + _dp.getMinutes()).slice(-2).toString().green + ":".white + ("0" + _dp.getSeconds()).slice(-2).toString().green)}${"]".gray} ${"[".gray}${new String(JSONified?.name).toString().cyan}${"]".gray}: ${JSONified.msg.white}`)
            }
        }
    }).on("error", (e) => {
        if(e.message.includes("ECONNREFUSED")) {
            console.log("[LOG] ERROR:".bgRed + ` Connection refused. ${options.address}:${options.port}\n` + "[LOG] ERROR:".bgRed + " If you believe everything is alright, please contact the server owner.")
        }
    })

if(!process.stdin.isTTY) {
    throw new Error("STDIN is not TTY. Couldn't start this client because you need a solution for tihs...")
}

process.stdin.setEncoding("utf-8")
process.stdin.resume()
process.stdin.on("data", (d) => {
    if(!_isNameReg) {
        if(d.toString().trim().length < 1) {
            process.stdout.moveCursor(-d?.length, -3)
            process.stdout.clearScreenDown()
            process.stdout.write("Empty name.\n")
            return;
        }
        if(d.toString().trim().length > 24) {
            process.stdout.moveCursor(-d?.length, -3)
            process.stdout.clearScreenDown()
            process.stdout.write("Too long name (24 chars max)\n")
            return;
        }
        NAME = d.toString("utf-8").trim()
        _isNameReg = true
        console.clear()
        process.title = "BetterChat Client | " + NAME
        return false
    }
    if(d.toString().trim().length < 1) {
        process.stdout.moveCursor(0, -1)
        return false
    }

    if(tm.getCD()> 0) {
        process.stdout.moveCursor(0, -1)
        console.log(`[LOG] WARN:`.yellow + ` You're sending too fast. Please wait ${tm._cooldown}ms before sending another message.\n` + `[LOG] WARN:`.yellow + " Your message haven't sent.")
        return false
    }

    let payload = cl.parser(new Payload(d.toString().trim(), cl.getUUID(), Date.now(), NAME))

    process.stdout.moveCursor(-d.length, -1)
    process.stdout.clearLine() 
    cl.getSocket().write(JSON.stringify(payload))
    tm.setCD(170)
    let __ = setInterval(() => {tm.update()}, 1)
    tm.interv(__)
})
