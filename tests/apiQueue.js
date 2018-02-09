//------------------------------Config
var config = require('../config.js');
//------------------------------Config

var exchangeapiservice = require('../services/exchangeapi.js');
var loggingservice = require('../services/loggingservice.js');
var _ = require('underscore');
var async = require('async');

var logger = new loggingservice('apiQueueTest', config.debug);
var api = new exchangeapiservice(config.exchangeSettings, config.apiSettings, logger);

var test = function() {

  var oldTimestamp = new Date().getTime();

  var call = function(callback) {

    logger.log('Received request for API data.');

    api.getTrades(false, function(err, result) {

      if(err) {
        logger.log('API Returned Error.');
        callback(err);
      } else if(result) {
        logger.log('Received data from API.');
        callback(null);
      }

    });

  };

  async.each([call,call], function(func, next) {

    func(next);

  }, function(err) {

    var newTimestamp = new Date().getTime();

    if(err) {
      logger.log('test failed');
      process.exit();
    } else {
      if(newTimestamp - oldTimestamp > 2000) {
        logger.log('test succeeded');
      } else {
        logger.log('test failed');
      }
      process.exit();
    }

  });

};

test();
