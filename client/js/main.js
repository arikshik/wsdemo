
(function ($) {
    "use strict";
    
    var webSocketServerAddress = '18.220.253.248';
    var webSocketServerPort = '1337';

    var nameInput = $('#nameInput');
    var connectBtn = $('#connectBtn');
    var messagesArea = $('#messagesArea');
    var messageInput = $('#messageInput');
    var sendMessageBtn = $('#sendMessageBtn');
    var connectBtnText = $('#connectBtnText');
    var topic1btn = $('#topic1btn');
    var topic2btn = $('#topic2btn');
    var topic3btn = $('#topic3btn');
    var topic1sub = false;
    var topic2sub = false;
    var topic3sub = false;

    var connection;
    var username;
    var myColor;
    

    //Websocket Support Check
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    if (!window.WebSocket) {
        messagesArea.html('Sorry, but your browser doesn\'t support WebSocket.');
      nameInput.hide();
      connectBtn.attr("disabled", true);
      return;
    }

    $('#connectBtn').on('click',function(){

        connection = new WebSocket('ws://' + webSocketServerAddress + ':' + webSocketServerPort);
        connection.onopen = function () {
          // first we want users to enter their names
          console.log('Websocket connection established.');
          connectBtn.attr("disabled", true);
          nameInput.attr("disabled", true);
          connectBtnText.text("Connected");
          username = nameInput.val();
          sendMessageBtn.attr("disabled", false);
          messageInput.attr("disabled", false);

          topic1btn.attr("disabled", false);
          topic2btn.attr("disabled", false);
          topic3btn.attr("disabled", false);

          sendMessage("userInit", username, username);
        };
        connection.onerror = function (error) {
          // just in there were some problems with connection...
          console.log('Websocket connection failed:', error);
        };

        connection.onmessage = function (message) {

            console.log("RECEIVED MESSAGE - message:" + message.data);

            try {

                var messageObj = JSON.parse(message.data);

            } catch (e) {

              console.log('ERROR - invalid JSON: ', message.data);
              return;
            }
                        
            if (messageObj.type == 'color') { 
              
              myColor = messageObj.data;              
            }
            else if (messageObj.type == 'history') {
                for (var i=0; i < messageObj.data.length; i++) {
                    console.log('HISTORY' + i+1 + ': ' + messageObj.data[i].data);
                    addMessage('history', messageObj.data[i].author, messageObj.data[i].data, messageObj.data[i].color, new Date(messageObj.data[i].time));
                }
            }
            else if (messageObj.type == 'textMessage') {

                sendMessage("ack", "ack", username, "");
                
                addMessage('textMessage', messageObj.author, messageObj.data, messageObj.color, new Date(messageObj.time));


                //new Date(json.data.time)
                //
              
            }
            else if (messageObj.type == 'topic') {

                sendMessage("ack", "ack", username, "");
                
                addMessage('topic', messageObj.author, messageObj.data, 'red', new Date(messageObj.time));


                //new Date(json.data.time)
                //
              
            } 


  
          };
      
    });


    $('#topic1btn').on('click',function(){

       
        if (topic1sub) {
            
            sendMessage("unsubscribe", "TASKS", username, myColor);
            topic1sub = false;
            $(this).css("background-color", "lightskyblue");    
        }
        else {
            
            sendMessage("subscribe", "TASKS", username, myColor);
            topic1sub = true;
            $(this).css("background-color", "blue");               
        }

    });

    $('#topic2btn').on('click',function(){

       
        if (topic2sub) {
            
            sendMessage("unsubscribe", "10bis", username, myColor);
            topic2sub = false;
            $(this).css("background-color", "lightskyblue");    
        }
        else {
            
            sendMessage("subscribe", "10bis", username, myColor);
            topic2sub = true;
            $(this).css("background-color", "blue");               
        }

    });

    $('#topic3btn').on('click',function(){

       
        if (topic3sub) {
            
            sendMessage("unsubscribe", "ALERTS", username, myColor);
            topic3sub = false;
            $(this).css("background-color", "lightskyblue");    
        }
        else {
            
            sendMessage("subscribe", "ALERTS", username, myColor);
            topic3sub = true;
            $(this).css("background-color", "blue");               
        }

    });    



    $('#sendMessageBtn').on('click',function(){

        sendMessage("textMessage", messageInput.val(), username, myColor);
        messageInput.val('');

    });    

    function sendMessage(_type, _data, _author, _color) {

        var messageDataObj = {
            type: _type,
            time: (new Date()).getTime(),
            data: _data,
            author: _author,
            color: _color
          };

        var message = JSON.stringify(messageDataObj);
        connection.send(message);

    }

    function addMessage(type, author, data, color, dt) {

        var font_weight = 'noraml';
        var _char = '@';
        if (type == 'topic') {

            font_weight = 'bold';
            _char = '==>'
        }
        
        messagesArea.append(
            '<p>' + 
            '<span style="color:' + color + '; font-weight:' + font_weight + ';">'
                + author + 
            '</span> ' + _char + ' ' + 
            (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':' + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes()) + ': ' + 
            data + 
            '</p>'
        );
        
        messagesArea.scrollTop(messagesArea[0].scrollHeight);

    }

})(jQuery);