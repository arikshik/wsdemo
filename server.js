"use strict";

// SETUP
process.title = 'wsdemo-node-app';
var serverPort = 1337;
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
var http = require('http');
var webSocketServer = require('websocket').server;

var messageIdSeq = Math.floor(Math.random() * (999999 - 100000) ) + 100000;
var colors = [ 'brown', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
colors.sort(function(a,b) { return Math.random() > 0.5; } );


//HTTP Server
var server = app.listen(serverPort, function () {
  var host = server.address().address;
  var port = server.address().port;
  
  console.log("EPVwsdemo listening at http://%s:%s", host, port)
})

//Servce client site
app.use(express.static('client'))
app.use('/epvwsdemo', express.static('client'))

//WebSocket Server
var wsServer = new webSocketServer({
  httpServer: server
});



//HTTP API's
// health-check
app.get('/', function (req, res) {
   res.send('Websocket Server is ALIVE');
   console.log("GET request to / (health check)");

   var obj = {
    time: (new Date()).getTime(),
    text: "CPM UPDATE!",
    author: "CPM TOPIC"
  };
  // broadcast message to all connected clients
  var json = JSON.stringify({ type:'topic', data: obj });
  for (var i=0; i < wsClients.length; i++) {
    wsClients[i].sendUTF(json);
  }

})

// publish message to topic
app.post('/publishToTopic', function (req, res) {
  
  console.log("POST request to /publishToTopic: " + JSON.stringify(req.body));
  
  
  var topic = req.body.topic;
  var message = req.body.message;

  var topicMessageObj = {
    type: "topic",
    time: (new Date()).getTime(),
    data: message,
    author: topic
  }
  
  var topicMessageString = JSON.stringify(topicMessageObj);
  for (var i=0; i < wsClients.length; i++) {

    for (var j=0; j < wsClients[i].topics.length; j++) {

      if (wsClients[i].topics[j] == topic) {
        wsClients[i].wsConnection.sendUTF(topicMessageString);
        break;
      }
    }
  }
  res.end('Message published.');
  
 
})


// Datastore
var messageHistory = [ ];
var wsClients = [ ];



//Websocket Server callbacks
wsServer.on('request', function(request) {
  console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
  var connection = request.accept(null, request.origin);   
  console.log((new Date()) + ' Connection accepted.');
  var index;
  var _userName;
  var _userColor;
  
  connection.on('message', function(message) {

    //console.log((new Date()) + ' MESSAGE RECEIVED - message:' + message.utf8Data);

    var messageObj = JSON.parse(message.utf8Data);

    if (messageObj.type == "userInit") {

      _userName = messageObj.data;
      _userColor = colors.shift();

      var wsClient = {
        userName: _userName,
        userColor: _userColor,
        wsConnection: connection,
        topics: []
      };

      index = wsClients.push(wsClient) - 1;

      connection.sendUTF(
        JSON.stringify({ 
          type:'color', 
          time:(new Date()).getTime(), 
          data: _userColor,
          author: "wsdemo_server" }
        )
      );

      if (messageHistory.length > 0) {
        connection.sendUTF(
            JSON.stringify({
              type: 'history',
              time:(new Date()).getTime(),
              data: messageHistory,
              author:'wsdemo_server'} 
          )
        );
      }
    

      console.log((new Date()) + ' USER CONNECTED - known as: ' + _userName + ' with ' + _userColor + ' color.');

    }
    else if (messageObj.type == "textMessage") {

      console.log((new Date()) + ' MESSAGE RECEIVED - message:' + message.utf8Data);

      messageHistory.push(messageObj);
      messageHistory = messageHistory.slice(-100);
      // broadcast message to all connected clients
      //var json = JSON.stringify(messageObj);
      for (var i=0; i < wsClients.length; i++) {
        wsClients[i].wsConnection.sendUTF(message.utf8Data);
        console.log((new Date()) + ' MESSAGE SENT - to:' + wsClients[i].userName +' message:' + message.utf8Data);
      }

    }
    else if (messageObj.type == "ack") {

      console.log((new Date()) + ' ACK RECEIVED - message:' + message.utf8Data);

    }
    else if (messageObj.type == "subscribe") {

      console.log((new Date()) + ' SUBSCRIBE RECEIVED - message:' + message.utf8Data);

      for (var i=0; i < wsClients.length; i++) {
        if (wsClients[i].userName == messageObj.author) {
          wsClients[i].topics.push(messageObj.data);
          console.log(wsClients[i].topics);
          break;
        }
      }


    }
    else if (messageObj.type == "unsubscribe") {

      console.log((new Date()) + ' UNSUBSCRIBE RECEIVED - message:' + message.utf8Data);

      for (var i=0; i < wsClients.length; i++) {
        if (wsClients[i].userName == messageObj.author) {
          for (var j=0; j < wsClients[i].topics.length; j++) {
            if (wsClients[i].topics[j] == messageObj.data) {                           
              wsClients[i].topics.splice(j, 1);              
              console.log(wsClients[i].topics);
              break;
            }
          }          
        }
      }

    }
    


/*

    if (message.type === 'utf8') { // accept only text
    // first message sent by user is their name
     if (userName === false) {
        // remember user name
        userName = htmlEntities(message.utf8Data);
        // get random color and send it back to the user
        userColor = colors.shift();
        connection.sendUTF(
            JSON.stringify({ type:'color', data: userColor }));
        console.log((new Date()) + ' User is known as: ' + userName
                    + ' with ' + userColor + ' color.');
      } else { // log and broadcast the message
        console.log((new Date()) + ' Received Message from '
                    + userName + ': ' + message.utf8Data);
        
        // we want to keep history of all sent messages
        var obj = {
          time: (new Date()).getTime(),
          text: htmlEntities(message.utf8Data),
          author: userName,
          color: userColor
        };
        messageHistory.push(obj);
        messageHistory = messageHistory.slice(-100);
        // broadcast message to all connected clients
        var json = JSON.stringify({ type:'message', data: obj });
        for (var i=0; i < wsClients.length; i++) {
          wsClients[i].sendUTF(json);
        }
      }
    }
    */
  });
  // user disconnected
  connection.on('close', function(connection) {

      console.log((new Date()) + " USER DISCONNECTED - " + _userName + " " + connection.remoteAddress);
      wsClients.splice(index, 1);
      colors.push(_userColor);

  });
});
