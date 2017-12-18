let WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({port: 8124}),
    clients = new Map();

const questions = require("./questions.json");

function getRandomQuestion() {
    let numOfQ = questions.length
    let randIndex = Math.floor(Math.random() * (numOfQ + 1));

    return questions[randIndex]

}

wss.on('connection', function(ws) {

    ws.on('message', function(message) {
        let data = JSON.parse(message)
        console.log("datá", data)
        clients.set(data.nick, ws);

        if(data.onlinePlayers){
            let onlinePlayers = []
            clients.forEach( (val, key) => {
                if(key != data.nick){
                    onlinePlayers.push({nick: key, score: 0, level: 0})
                }
            } )

            //ws.send(JSON.stringify({players: onlinePlayers}))

            sendAll();

        }

        if(data.chooseUser){

            //send mesage to opponent
            clients.get(data.opponent).send(JSON.stringify({offerGame: true, opponent: data.nick}))
        }
        if(data.acceptOpponent){
            clients.get(data.opponent).send(JSON.stringify({gameAccepted: true, opponent: data.nick}))
        }
        if(data.refuseOpponent){
            clients.get(data.opponent).send(JSON.stringify({gameRefused: true, opponent: data.nick}))
        }

        if(data.getQuestion){
            let question = getRandomQuestion();
            clients.get(data.nick).send(JSON.stringify({randomQuestion: true, opponent: data.opponent, question: question}))
            clients.get(data.opponent).send(JSON.stringify({randomQuestion: true, opponent: data.nick, question: question}))
        }

    });
});

function sendAll () {


    clients.forEach( (ws, nick)=> {

        let response = []

        clients.forEach( (val, key)=> {
            if(key != nick){
                response.push({nick: key, score: 0, level: 0})
            }
        })

        ws.send(JSON.stringify({players: response}));
    } )
}