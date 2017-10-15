let http = require('http');
let url = require('url');
let WebSocketServer = require('websocket').server;

let serverIp = "0.0.0.0";

let serverPort = 8124;


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




wsServer.on('request', function(request) {


    let connection = request.accept('connection', request.origin);

    connection.on('message', function(message) {
        console.log(message);
        if (message.type === 'utf8') {
            try{
                let response;
                try{
                    response = JSON.parse(message.utf8Data);
                }
                catch (e){
                    response = message.utf8Data;
                }

                console.log(JSON.stringify(response, null, 4));

                connection.sendUTF(JSON.stringify({message: "cosik"}))

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
