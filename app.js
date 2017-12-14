let http = require('http');
let url = require('url');
let WebSocketServer = require('websocket').server;

let serverIp = "10.0.0.139";

let serverPort = 8124;

function dynamicSort(property) {
    let sortOrder = -1;
    return function (a,b) {
        let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

let fetchScores = () => {
    let scores =  [
        {nick: "Pepa", score: 12},
        {nick: "Lojza", score: 14},
        {nick: "Franta", score: 1},
        {nick: "Oldřich", score: 42},
        {nick: "Uxes", score: 22},
        {nick: "Fero", score: 0},
        {nick: "Anežka", score: 116}
    ]
    return scores.sort(dynamicSort("score"))


}
let fetchOnlinePlayers = () => {
    return [
        {nick: "Pepa", score: 12, level:1 },
        {nick: "Lojza", score: 14, level:2 },
        {nick: "Franta", score: 1, level:1 },
        {nick: "Oldřich", score: 42, level:4 },
        {nick: "Uxes", score: 22, level:3 }
    ]
}


let server = http.createServer(function(request, response) {
    let path = url.parse(request.url, true).pathname;
    let req = url.parse(request.url, true).query;

    response.writeHead(200, {
        "Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive",
        'Access-Control-Allow-Origin': "*"
    });

    if(path === "/"){
        console.log("[INFO] Client does not sent required request");
    }

    /*
     * Default, ends connection, just wait some time to end up, primary waiting for exec file
     */
    setTimeout(function () {
        response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
        response.end();
    }, 3500); //this makes our ws connection so goddamit long in chrome's network monitoring
});

/*
 * Hndling web sockets
 */
wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

let spamCounter = 0;


wsServer.on('request', function(request) {


    let connection = request.accept('connection', request.origin);

    connection.on('message', function(message) {
        console.log(message);
        if (message.type === 'utf8') {
            try{
                let response;
                try{
                    response = JSON.parse(message.utf8Data);

                    if(response.onlinePlayers){
                        connection.sendUTF(JSON.stringify({players: fetchOnlinePlayers()}))
                        spamCounter++;

                    }
                    if(response.score){
                        connection.sendUTF(JSON.stringify({players: fetchScores()}))
                        spamCounter++;
                    }

                }
                catch (e){
                    response = message.utf8Data;
                    console.log("spadlo")
                }

                console.log(JSON.stringify(response, null, 4));

                console.log("spam counter", spamCounter)

            }
            catch(err){
                console.log("Catch me..", err);
            }
        }
    });
    connection.on('close', function(reasonCode, description) {
    });
});


setTimeout(function () {
    console.log("");
    console.log('[Konqueror-server] Dummy backend is running on ' + serverIp + ', port ' + serverPort);
    console.log("");

    server.listen(serverPort, serverIp);

    process.on('uncaughtException', function(err) {
        if(err.errno === 'EADDRINUSE')
            console.log("[ERROR] Konqueror node.js service seems to already running on port " + serverPort);
        else
            console.log(err);
        process.exit(1);
    });

}, 250);
