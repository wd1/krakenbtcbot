var _ = require('underscore');
var async = require('async');
var Bitstamp = require('bitstamp-api');

var exchange = function(currencyPair, apiSettings, logger) {

  this.currencyPair = currencyPair;

  this.bitstamp = new Bitstamp(apiSettings.apiKey, apiSettings.secret, apiSettings.clientId);

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

      this.logger.error(callerName + ': Bitstamp API returned the following error:');
      this.logger.error(parsedError.substring(0,99));

      if(retryAllowed) {
        this.logger.error('Retrying in 15 seconds!');
        return this.retry(caller, args);
      }

    } else {

      this.logger.debug(callerName + ': Bitstamp API Call Result (Substring)!');
      this.logger.debug(JSON.stringify(result).substring(0,99));

    }

    handler(parsedError, result);

  }.bind(this);

};

exchange.prototype.getTrades = function(retry, cb) {

  var args = arguments;

  var wrapper = function(finished) {

    var pair = this.currencyPair.pair;

    var handler = function(err, response) {

      if(!err) {

        var trades = _.map(response, function(t) {

          return {date: parseInt(t.date), price: parseFloat(t.price), amount: parseFloat(t.amount)};

        });

        var result = _.sortBy(trades, function(trade){ return trade.date; });

        cb(null, result);

      } else {

        cb(err, null);

      }

    };

    this.bitstamp.transactions({time: 'hour'}, this.errorHandler(this.getTrades, args, retry, 'getTrades', handler, finished));

  }.bind(this);

  this.q.push({name: 'getTrades', func: wrapper});

};

exchange.prototype.getBalance = function(retry, cb) {

  var args = arguments;

  var wrapper = function(finished) {

    var asset = this.currencyPair.asset;
    var currency = this.currencyPair.currency;

    var pair = this.currencyPair.pair;

    var handler = function(err, result) {

      if(!err) {

        cb(null, {currencyAvailable:result.usd_available, assetAvailable:result.btc_available, fee:result.fee});

      } else {

        cb(err, null);

      }

    };

    this.bitstamp.balance(this.errorHandler(this.getBalance, args, retry, 'getBalance', handler, finished));

  }.bind(this);

  this.q.push({name: 'getBalance', func: wrapper});

};

exchange.prototype.getOrderBook = function(retry, cb) {

  var args = arguments;

  var wrapper = function (finished) {

    var pair = this.currencyPair.pair;

    var handler = function(err, result) {

      if(!err) {

        var bids = _.map(result.bids, function(bid) {
          return {assetAmount: bid[1], currencyPrice: bid[0]};
        });

        var asks = _.map(result.asks, function(ask) {
          return {assetAmount: ask[1], currencyPrice: ask[0]};
        });

        cb(null, {bids: bids, asks: asks});

      } else {

        cb(err, null);

      }

    };

    this.bitstamp.order_book(1, this.errorHandler(this.getOrderBook, args, retry, 'getOrderBook', handler, finished));

  }.bind(this);

  this.q.push({name: 'getOrderBook', func: wrapper});

};

exchange.prototype.placeOrder = function(type, amount, price, retry, cb) {

  var args = arguments;

  var wrapper = function(finished) {

    var pair = this.currencyPair.pair;

    var handler = function(err, result) {

      if(!err) {

        if(!result.error) {

          cb(null, {txid: result.id, status: 'open'});

        } else {

          cb(result.error, null);

        }

      } else {

        cb(err, null);

      }

    };

    if(type === 'buy') {

      this.bitstamp.buy(amount, price, this.errorHandler(this.placeOrder, args, retry, 'placeOrder', handler, finished));

    } else if (type === 'sell') {

      this.bitstamp.sell(amount, price, this.errorHandler(this.placeOrder, args, retry, 'placeOrder', handler, finished));

    } else {

      cb(new Error('Invalid order type!'), null);

    }

  }.bind(this);

  this.q.push({name: 'placeOrder', func: wrapper});

};

exchange.prototype.orderFilled = function(order, retry, cb) {

  var args = arguments;

  var wrapper = function(finished) {

    var handler = function(err, result) {

      if(!err) {

        var open = _.find(result, function(o) {

          return o.id === order;

        }, this);

        if(open) {

          cb(null, false);

        } else {

          cb(null, true);

        }

      } else {

        cb(err, null);

      }

    };

    this.bitstamp.open_orders(this.errorHandler(this.orderFilled, args, retry, 'orderFilled', handler, finished));

  }.bind(this);

  this.q.push({name: 'orderFilled', func: wrapper});

};

exchange.prototype.cancelOrder = function(order, retry, cb) {

  var args = arguments;

  this.orderFilled(order, retry, function(err, filled) {

    if(!filled && !err) {

      var wrapper = function(finished) {

        var handler = function(err, result) {

          if(!err) {

            if(!result.error) {
              cb(null, true);
            } else {
              cb(null, false);
            }

          } else {

            cb(err, null);

          }

        };

        this.bitstamp.cancel_order(order,this.errorHandler(this.cancelOrder, args, retry, 'cancelOrder', handler, finished));

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
