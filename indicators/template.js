//-------------------- REMOVE THIS BLOCK
var err = new Error('If you want this code to do anything, remove this code block!');
this.logger.error(err.stack);
process.exit();
//-------------------- REMOVE THIS BLOCK

var _ = require('underscore');
var tools = require('../util/tools.js');

var indicator = function(options) {

  this.options = options;
  this.position = {};

  _.bindAll(this, 'calculate', 'setPosition');

  if(!'option' in options) {
    var err = new Error('Invalid options for indicator, exiting.');
    this.logger.error(err.stack);
    process.exit();
  }

  // indicatorOptions
  // options: {The options required for your indicator to work}

};

//-------------------------------------------------------------------------------HelperFunctions

  // Insert your helper functions here if needed

//-------------------------------------------------------------------------------HelperFunctions

indicator.prototype.calculate = function(cs) {

  // This function receives a candlestick from the trading advisor, this is the layout of a candlestick:
  // {'period':timestamp, 'open':open price, 'high':high price, 'low':low price, 'close':close price, 'volume':volume, 'vwap':volume weighted average price}

  // Insert your calculation logic here

  // When done you should always return either 'buy', 'sell' or 'hold' And either the indicatorResult or the value null
  return {advice: advice, indicatorResult: indicatorResult};

};

indicator.prototype.setPosition = function(pos) {

  // This function is required and shouldn't be changed unless you know what you are doing.
  // Provides the indicator with information about the current position.
  // {pos: position, price: price}

  this.position = pos;

};

module.exports = indicator;
