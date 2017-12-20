let WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({port: 8124}),
    clients = new Map();

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync("./players.json");
const db = low(adapter);

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
        let record = db.find({nick: data.nick}).value();
        if(!record){
            db.set({nick: data.nick, level:0, score:0}).write();
        }


        try{

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
                clients.get(data.nick).send(JSON.stringify({randomQuestion: true, opponent: data.opponent, question: question, realm: data.realm}))
                clients.get(data.opponent).send(JSON.stringify({randomQuestion: true, opponent: data.nick, question: question, realm: data.realm}))
            }

            if(data.incrementUserLevel){
                console.log("peru tam ten level")
                let actualLevel = db.find({nick: data.nick}).value().level;
                db.find({nick: data.nick}).set("level", actualLevel + 1).write();
            }
            if(data.quitting){
                console.log("someone's leaving: ", data.nick)
                clients.delete(data.nick)
                clients.get(data.opponent).send(JSON.stringify({quitting: true, opponent: data.nick}))
            }
            if(data.lostGame){
                clients.get(data.opponent).send(JSON.stringify({won: true, opponent: data.nick}))
            }
        }
        catch(e){
            //this one is no longer online
            console.log(data.opponent, " this one is no longer online")
            clients.delete(data.opponent)
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

        try{
            ws.send(JSON.stringify({players: response}));
        }
        catch(e){
            //this one is no longer online
            clients.delete(nick)
        }
    } )
}