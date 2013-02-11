var http = require("http");
var defaultCorsHeaders = require("./lib/cors.js").defaultCorsHeaders;
var Sequelize = require("sequelize");

var sequelize = new Sequelize("chat", "bacon", "pass");



// Sequelize schema setup
var User = sequelize.define('User', {
  user_name: Sequelize.STRING
});

var Message = sequelize.define('Message', {
  content: Sequelize.STRING
});

User.hasMany(Message, {as: 'Msg'});
Message.belongsTo(User);

Message.sync();

/* .sync() makes Sequelize create the database table for us if it doesn't
 *  exist already: */
User.sync().success(function() {
  /* This callback function is called once sync succeeds. */

  // now instantiate an object and save it:
  // var newUser = User.build({user_name: "Jean Valjean",
  //                           joined: Date.now()
  //                          });
  // newUser.save().success(function() {

  //   /* This callback function is called once saving succeeds. */

  //   // Retrieve objects from the database:
  //   User.findAll({ where: {user_name: "Jean Valjean"} }).success(function(usrs) {
  //     // This function is called back with an array of matches.
  //     for (var i = 0; i < usrs.length; i++) {
  //       console.log(usrs[i].username + " has password " + usrs[i].password);
  //     }
  //  });
  // });
});

var messagesObject = {
  list: [],

  getMessages: function(res){
    var that = this,
        tmpObj,
        tmpTxt,
        isDone = false;
    this.list = [];

    Message.findAll({include: ['User']}).success(function(msgs) {
      for (var i = 0; i < msgs.length; i++) {
        // hold reference to message content
        tmpTxt = msgs[i].content;
        msgs[i].getUser().success(function(u) {
          tmpObj = {
            user_name: u.user_name,
            text: tmpTxt
          }

          // store each message in list to be returned on response end
          that.list.push(tmpObj);

          // only end response if you have all the messages
          if(that.list.length === msgs.length){
            res.end(JSON.stringify(that.list));
            console.log(that.list);
          }
        });
      }
    });
  },

  writeToDB: function(newMessage){
    var newUser,
        userFound = false;
    User.findAll({ where: {user_name: newMessage.user_name} })
      // on a successful lookup, searches through results array looking for existing user
      .success(function(usrs) {
        for (var i = 0; i < usrs.length; i++) {

          if(usrs[i].user_name === newMessage.user_name){
            newUser = usrs[i];
            userFound = true;
            // console.log('user_name ',newMessage.user_name, 'was found in table already! ');
          }
        }
        // if user was not found build and save to Users table
        if (!userFound) {
          newUser = User.build({
            user_name: newMessage.user_name,
            joined: Date.now()
          });
          // console.log(newUser);
        }

        // MESSAGE saving 
        var someMessage = Message.build({
          content: newMessage.text
        });
        newUser.addMsg(someMessage);
        newUser.save();
        someMessage.save();
      });

  }
};

var createResponse = function(code, response){
  var statusCode = code;
  var headers = defaultCorsHeaders();
  headers['Content-Type'] = "text/plain";
  response.writeHead(statusCode, headers);
  return response;
};


var handlePostRequest = function(request, response) {
  if(request.url === "/1/classes/messages"){
    request.on('data', function(chunk) {
      request.content = '';
      request.content += chunk.toString();
    });
    
    request.on('end', function() {

      var msg = JSON.parse(request.content);
      messagesObject.writeToDB(msg);
      response = createResponse(200, response);
      response.end();
    });
  }
};

var handleGetRequest = function(request, response){
  if(request.url === "/1/classes/messages"){
    response = createResponse(200, response);
    messagesObject.getMessages(response);
  }
};
 
// Handles the requests for server 
var requestListener = function(req, res) {
  console.log("Serving request type " + req.method
              + " for url " + req.url);

  var statusCode = 200;
  var headers = defaultCorsHeaders();
  headers['Content-Type'] = "text/plain";

  res.writeHead(statusCode, headers);

  // pseudo routing
  switch(req.method)
  {
    case "OPTIONS":
      res.end();
      break;
    case "GET":
      handleGetRequest(req, res);
      break;
    case "POST":
      handlePostRequest(req, res);
      break;
    default:
      res.writeHead(404, "Not found", {'Content-Type': 'text/html'});
      res.end();
  }
};

var server = http.createServer(requestListener);

var port = 9000;
var ip = "127.0.0.1";
console.log("Listening on http://" + ip + ":" + port);
server.listen(port, ip);


