//-------------------- REMOVE THIS BLOCK
var err = new Error('If you want this code to do anything, remove this code block!');
this.logger.error(err.stack);
process.exit();
//-------------------- REMOVE THIS BLOCK

var _ = require('underscore');
var async = require('async');

var exchange = function(currencyPair, apiSettings, logger) {

  this.currencyPair = currencyPair;

  // intialize your API with it's apiSettings here

  this.q = async.queue(function (task, callback) {
    this.logger.debug('Added ' + task.name + ' API call to the queue.');
    this.logger.debug('There are currently ' + this.q.running() + ' running jobs and ' + this.q.length() + ' jobs in queue.');
    task.func(function() { setTimeout(callback, 2000); });
  }.bind(this), 1);

  this.logger = logger;

  _.bindAll(this, 'retry', 'errorHandler', 'getTrades', 'getBalance', 'getOrderBook', 'placeOrder', 'orderFilled' ,'cancelOrder');

};

exchange.prototype.retry = function(method, args) {

  var self = this;

  // make sure the callback (and any other fn)
  // is bound to api
  _.each(args, function(arg, i) {
    if(_.isFunction(arg))
      args[i] = _.bind(arg, self);
  });

  // run the failed method again with the same
  // arguments after wait

  setTimeout(function() { method.apply(self, args); }, 1000*15);

};

exchange.prototype.errorHandler = function(caller, receivedArgs, retryAllowed, callerName, handler, finished) {

  return function(err, result) {

    var args = _.toArray(receivedArgs);

    var parsedError = null;

    finished();

    if(err) {

      if(JSON.stringify(err) === '{}' && err.message) {
        parsedError = err.message;
      } else {
        parsedError = JSON.stringify(err);
      }

      this.logger.error(callerName + ' Exchange API returned the following error:');
      this.logger.error(parsedError.substring(0,99));

      if(retryAllowed) {
        this.logger.error('Retrying in 15 seconds!');
        return this.retry(caller, args);
      }

    } else {

      this.logger.debug(callerName + ' Exchange API Call Result (Substring)!');
      this.logger.debug(JSON.stringify(result).substring(0,99));

    }

    handler(parsedError, result);

  }.bind(this);

};

exchange.prototype.getTrades = function(retry, cb) {

  var args = arguments;

  var wrapper = function(finished) {

    var handler = function(err, response) {

      cb(null, [{date: timestamp, price: number, amount: number}]);

    };

    // Pass this as callback to your exchange function (Expects an Err, Result output).
    this.errorHandler(this.getTrades, args, retry, 'getTrades', handler, finished);

  }.bind(this);

  this.q.push({name: 'getTrades', func: wrapper});

};

exchange.prototype.getBalance = function(retry, cb) {

  var args = arguments;

  var wrapper = function(finished) {

    var handler = function(err, response) {

      cb(null, {currencyAvailable: number, assetAvailable: number, fee: number});

    };

    // Pass this as callback to your exchange function (Expects an Err, Result output).
    this.errorHandler(this.getBalance, args, retry, 'getBalance', handler, finished);

  }.bind(this);

  this.q.push({name: 'getBalance', func: wrapper});

};

exchange.prototype.getOrderBook = function(retry, cb) {

  var args = arguments;

  var wrapper = function(finished) {

    var handler = function(err, response) {

      cb(null, {bids: [{assetAmount: number, currencyPrice: number}], asks: [{assetAmount: number, currencyPrice: number}]});

    };

    // Pass this as callback to your exchange function (Expects an Err, Result output).
    this.errorHandler(this.getOrderBook, args, retry, 'getOrderBook', handler, finished);

  }.bind(this);

  this.q.push({name: 'getOrderBook', func: wrapper});

};

exchange.prototype.placeOrder = function(type, amount, price, retry, cb) {

  var args = arguments;

  var wrapper = function(finished) {

    var handler = function(err, response) {

      cb(null, {txid: transaction_id, status: 'open'});

    };

    // Pass this as callback to your exchange function (Expects an Err, Result output).
    this.errorHandler(this.placeOrder, args, retry, 'placeOrder', handler, finished);

  }.bind(this);

  this.q.push({name: 'placeOrder', func: wrapper});

};

exchange.prototype.orderFilled = function(order, retry, cb) {

  var args = arguments;

  var wrapper = function(finished) {

    var handler = function(err, response) {

      cb(null, boolean);

    };

    // Pass this as callback to your exchange function (Expects an Err, Result output).
    this.errorHandler(this.orderFilled, args, retry, 'orderFilled', handler, finished);

  }.bind(this);

  this.q.push({name: 'orderFilled', func: wrapper});

};

exchange.prototype.cancelOrder = function(order, retry, cb) {

  var args = arguments;

  var wrapper = function(finished) {

    var handler = function(err, response) {

      cb(null, boolean);

    };

    // Pass this as callback to your exchange function (Expects an Err, Result output).
    this.errorHandler(this.cancelOrder, args, retry, 'cancelOrder', handler, finished);

  }.bind(this);

  this.q.push({name: 'cancelOrder', func: wrapper});

};

module.exports = exchange;
