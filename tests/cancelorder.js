//------------------------------Config
var config = require('../config.js');
//------------------------------Config

var exchangeapiservice = require('../services/exchangeapi.js');
var loggingservice = require('../services/loggingservice.js');
var _ = require('underscore');

var logger = new loggingservice('cancelOrderTest', config.debug);
var api = new exchangeapiservice(config.exchangeSettings, config.apiSettings, logger);

api.getBalance(true, function(err, result) {

  var processOrder = function(err, result) {

    setTimeout(function() {

      api.cancelOrder(result.txid, true, function(err, result) {

        logger.log('Cancelled: ' + result);

        if(result) {

          logger.log('Test completed successfully.');

        } else {

          logger.log('Test failed');

        }

      });

    }, 30000);

    logger.log('Order placed, waiting 30 seconds before cancelling.');

  };

  if(result.currencyAvailable > 5) {

    api.placeOrder('buy', 100000, 0.00005, true, processOrder);

  } else if(result.assetAvailable > 0.00005) {

    api.placeOrder('sell', 0.00005, 100000, true, processOrder);

  } else {

    logger.log('Insufficient funds to run test.');

  }

});
