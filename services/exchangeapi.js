var _ = require('underscore');
var fs = require('fs');

var api = function(exchangeSettings, apiSettings, logger) {

  this.exchange = exchangeSettings.exchange;
  this.currencyPair = exchangeSettings.currencyPair;
  this.logger = logger;

  try {

    this.exchanges = {};

    fs.readdirSync('./exchanges/').forEach(function(file) {
      if(file != 'template.js' && file.indexOf('.') > 0 && file.indexOf('.js') > 0) {
        var exchange = require('../exchanges/' + file);
        this.exchanges[file.replace('.js', '')] = exchange;
      }
    }.bind(this));

    this.selectedExchange = new this.exchanges[this.exchange](this.currencyPair, apiSettings[this.exchange], this.logger);

  } catch(err) {

    this.logger.error('Wrong exchange chosen. This exchange doesn\'t exist.');
    this.logger.error(err.stack);
    process.exit();

  }

  _.bindAll(this, 'getTrades', 'getBalance', 'getOrderBook', 'placeOrder', 'orderFilled' ,'cancelOrder');

};

api.prototype.getTrades = function(retry, cb) {

  this.selectedExchange.getTrades(retry, cb);

};

api.prototype.getBalance = function(retry, cb) {

  this.selectedExchange.getBalance(retry, cb);

};

api.prototype.getOrderBook = function(retry, cb) {

  this.selectedExchange.getOrderBook(retry, cb);

};

api.prototype.placeOrder = function(type, amount, price, retry, cb) {

  this.selectedExchange.placeOrder(type, amount, price, retry, cb);

};

api.prototype.orderFilled = function(order, retry, cb) {

  this.selectedExchange.orderFilled(order, retry, cb);

};

api.prototype.cancelOrder = function(order, retry, cb) {

  this.selectedExchange.cancelOrder(order, retry, cb);

};

module.exports = api;
