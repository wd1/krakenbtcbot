var _ = require('underscore');
var async = require('async');
var btce = require('btc-e');

var exchange = function(currencyPair, apiSettings, logger) {

  this.currencyPair = currencyPair;

  this.btce = new btce(apiSettings.apiKey, apiSettings.secret);

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

    var pair = this.currencyPair.pair.toLowerCase();

    var handler = function(err, response) {

      if(!err) {

        var trades = _.map(response.reverse(), function(entry) {

          return {date: parseInt(entry.date), price: parseFloat(entry.price), amount: parseFloat(entry.amount)};

        });

        cb(null, trades);

      } else {

        cb(err, null);

      }

    };

    this.btce.trades(pair, this.errorHandler(this.getTrades, args, retry, 'getTrades', handler, finished));

  }.bind(this);

  this.q.push({name: 'getTrades', func: wrapper});

};

exchange.prototype.getBalance = function(retry, cb) {

  var args = arguments;

  var wrapper = function(finished) {

    var asset = this.currencyPair.asset.toLowerCase();
    var currency = this.currencyPair.currency.toLowerCase();

    var handler = function(err, response) {

      if(!err) {

        cb(null, {assetAvailable: response.return.funds[asset], currencyAvailable: response.return.funds[currency], fee: 0.2});

      } else {

        cb(err, null);

      }

    };

    this.btce.getInfo(this.errorHandler(this.getBalance, args, retry, 'getBalance', handler, finished));

  }.bind(this);

  this.q.push({name: 'getBalance', func: wrapper});

};

exchange.prototype.getOrderBook = function(retry, cb) {

  var args = arguments;

  var wrapper = function(finished) {

    var pair = this.currencyPair.pair.toLowerCase();

    var handler = function(err, response) {

      if(!err) {

        var bids = _.map(response.bids, function(bid) {
          return {assetAmount: bid[1], currencyPrice: bid[0]};
        });

        var asks = _.map(response.asks, function(ask) {
          return {assetAmount: ask[1], currencyPrice: ask[0]};
        });

        cb(null, {bids: bids, asks: asks});

      } else {

        cb(err, null);

      }

    };

    this.btce.depth(pair, this.errorHandler(this.getOrderBook, args, retry, 'getOrderBook', handler, finished));

  }.bind(this);

  this.q.push({name: 'getOrderBook', func: wrapper});

};

exchange.prototype.placeOrder = function(type, amount, price, retry, cb) {

  var args = arguments;

  var wrapper = function(finished) {

    var pair = this.currencyPair.pair.toLowerCase();

    var handler = function(err, response) {

      if(!err) {

        var status = 'open';

        if(response.return.order_id === 0) {

          status = 'filled';

        }

        cb(null, {txid: response.return.order_id, status: status});

      } else {

        cb(err, null);

      }

    };

    if(type === 'buy') {

      this.btce.trade(pair, 'buy', price, amount, this.errorHandler(this.placeOrder, args, retry, 'placeOrder', handler, finished));

    } else if (type === 'sell') {

      this.btce.trade(pair, 'sell', price, amount, this.errorHandler(this.placeOrder, args, retry, 'placeOrder', handler, finished));

    } else {

      cb(new Error('Invalid order type!'), null);

    }

  }.bind(this);

  this.q.push({name: 'placeOrder', func: wrapper});

};

exchange.prototype.orderFilled = function(order, retry, cb) {

  var args = arguments;

  var wrapper = function(finished) {

    var handler = function(err, response) {

      if(!err) {

        if(response.return[order]) {

          cb(null, false);

        } else {

          cb(null, true);

        }

      } else {

        cb(err, null);

      }

    };

    this.btce.orderInfo(order, this.errorHandler(this.orderFilled, args, retry, 'orderFilled', handler, finished));

  }.bind(this);

  this.q.push({name: 'orderFilled', func: wrapper});

};

exchange.prototype.cancelOrder = function(order, retry, cb) {

  var args = arguments;

  this.orderFilled(order, retry, function(err, filled) {

    if(!filled && !err) {

      var wrapper = function(finished) {

        var handler = function(err, response) {

          if(!err) {

            if(response.return.order_id === order) {
              cb(null, true);
            } else {
              cb(null, false);
            }

          } else {

            cb(err, null);

          }

        };

        this.btce.cancelOrder(order, this.errorHandler(this.cancelOrder, args, retry, 'cancelOrder', handler, finished));

      }.bind(this);

      this.q.push({name: 'cancelOrder', func: wrapper});

    } else if(filled && !err) {

      cb(null, false);

    } else {

      cb(err, null);

    }

  }.bind(this));

};

module.exports = exchange;
