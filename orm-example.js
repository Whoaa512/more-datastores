/* You'll need to 
 * npm install sequelize
 * before running this example. Documentation is at http://sequelizejs.com/ 
 */

var Sequelize = require("sequelize");
var sequelize = new Sequelize("chat", "bacon", "pass", {
  host: "localhost",
  port: 9000
});

/* first define the data structure by giving property names and datatypes
 * See http://sequelizejs.com for other datatypes you can use besides STRING. */
var User = sequelize.define('User', {
  user_name: : { type: Sequelize.STRING },
  joined: Sequelize.DATE
});

var Message = sequelize.define('Message', {
  msg_id: { type: Sequelize.INTEGER, autoIncrement: true },
  date_posted: { type:Sequelize.DATE, defaultValue: Sequelize.NOW }
});

Message.belongsTo(User);
User.hasMany(Message, {as: 'Messages'});

/* .sync() makes Sequelize create the database table for us if it doesn't
 *  exist already: */
User.sync().success(function() {
  /* This callback function is called once sync succeeds. */

  // now instantiate an object and save it:
  var newUser = User.build({username: "Jean Valjean",
                            joined: Date.now()
                           });
  newUser.save().success(function() {

    /* This callback function is called once saving succeeds. */

    // Retrieve objects from the database:
    User.findAll({ where: {username: "Jean Valjean"} }).success(function(usrs) {
      // This function is called back with an array of matches.
      for (var i = 0; i < usrs.length; i++) {
        console.log(usrs[i].username + " has password " + usrs[i].password);
      }
    });
  });
});
