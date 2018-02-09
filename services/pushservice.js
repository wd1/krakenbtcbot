var _ = require('underscore');
var push = require( 'pushover-notifications' );

var pusher = function(pushOver, logger) {

  this.logger = logger;

  if(pushOver.pushUserId && pushOver.pushAppToken) {

    var userId = pushOver.pushUserId;
    var appToken = pushOver.pushAppToken;

    this.p = new push( {
      user: userId,
      token: appToken
    });

    this.configured = true;

  } else {

    this.configured = false;

  }

  _.bindAll(this, 'send');

};

pusher.prototype.send = function(title, message, sound, priority) {

  if(this.configured) {

    var msg = {
      message: message,
      title: title,
      sound: title, // optional
      priority: priority // optional
    };

    this.p.send( msg, function( err, result ) {
      if ( err ) {
        throw err;
      }

      this.logger.log('Push notification sent!');
    }.bind(this));

  } else {

    this.logger.log('Push Service Misconfigured');

  }

};

module.exports = pusher;
