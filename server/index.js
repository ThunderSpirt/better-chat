const crypto = require('crypto'); 
const net = require("net")
const fs = require("fs")
const color = require("colors")
const path = require("node:path")
if(!fs.existsSync(path.resolve('./cfg.json'))) {
    fs.appendFileSync(path.resolve('./cfg.json'), JSON.stringify({port: 32523, address: "0.0.0.0"}))
    console.log("[LOG] INFO:".bgCyan + " Created configuration file %s", path.resolve("./cfg.json"))
}
const config = require('./cfg.json')

let pk;

process.title = "BetterChat Server | Connecting..."

class PacketUtil {
    constructor() {}
    datahandler(input) {
        try {
            let JSONified = JSON.parse(input.toString("utf-8"))
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
            let _ = /([a-f]|[0-9]){8}\-([a-f]|[0-9]){4}\-([a-f]|[0-9]){4}\-([a-f]|[0-9]){8}/gmi
            if(!typeof JSONified.hdr == 'string' || !JSONified.msg.length <= 0 || !_.test(JSONified.uuid) || parseInt(ts) === NaN || JSONified.name.length <= 0) {
                return false
            } else {
                return true
            }
        } catch(e) {
            return false
        }
    }
}

// gen()

const s = net.createServer().listen(isNaN(config.port) ? config.port : 32523, net.isIP(config.address) ? config.address : "0.0.0.0", 256, () => {
    process.title = "BetterChat Server | Online"
    process.stdout.write('Sucess! Listening on ' + s.address().address + ':' + s.address().port + '\nNotice: Packets sent by client will not be parsed.\n')
})

let conn = []
let lastMSGByIP = new Map()
s.on("connection", (sk) => {
    conn.push(sk)
    sk.setKeepAlive(5000);
    sk.setNoDelay(true)
    sk.setEncoding("utf-8")
    sk.on("close", () => {
        let ind = conn.indexOf(sk)
        if(ind > -1) {
            conn.splice(ind, 1)
        }
    })
    sk.on("data", (d) => {
        try {
            let JSONified = JSON.parse(d.toString("utf-8"))
            let thisIP = sk.address().address

            let lmbi = lastMSGByIP.get(thisIP)
            if(JSONified.ts - lmbi < 300) {
                return false
            }

            lastMSGByIP.set(thisIP, JSONified.ts)
            
            let m = new PacketUtil()
            let r = m.datahandler(d)

            if(r === false) {
                return false
            }
            // console.log(d.toString())
            conn.forEach(c => {
                c.write(d.toString("utf-8"))
            })
        }
        catch(e) {
            sk.destroy()
        }
    })
    sk.on("error", () => {})
}).on("error", (e) => {
    console.log("An error occured: " + e.name + " " + e.message + "\nStack: " + e.stack)
})

// process.on("beforeExit", () => {
//     fs.rmSync(path.resolve("./public_key"))
// })