var _ = require('underscore');
var config = require('../config.js');
var loggingservice = require('../services/loggingservice.js');

var storageservice = require('../services/storage.js');
var dataprocessor = require('../services/dataprocessor.js');

var logger = new loggingservice('dbHealthTest', config.debug);
var storage = new storageservice(config.exchangeSettings, config.mongoConnectionString, logger);
var processor = new dataprocessor(storage, logger);

storage.getAllCandlesSince(0, function(err, loopArray) {

  var testPeriod = _.first(loopArray).period - 60;
  var success = true;

  var previousCS;

  _.each(loopArray, function(cs) {

    if(cs.period !== testPeriod + 60) {
      logger.log('There is a gap between the following two candlesticks:');
      logger.log('Previous: ' + JSON.stringify(previousCS));
      logger.log('Current: ' + JSON.stringify(cs));
      success = false;
    }

    previousCS = cs;
    testPeriod += 60;

  });

  if(success) {
    logger.log("Database OK!");
  } else {
    logger.log("Database corrupt/incomplete, empty your database and try collecting historical information again");
  }

});
