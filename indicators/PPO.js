var _ = require('underscore');
var tools = require('../util/tools.js');

var indicator = function(options) {

  this.options = options;
  this.position = {};
  this.indicator = {};
  this.previousIndicator = {};
  this.advice = 'hold';
  this.length = 0;

  _.bindAll(this, 'calculate', 'setPosition');

  if(!'neededPeriods' in options || !'longPeriods' in options || !'shortPeriods' in options || !'emaPeriods' in options || !'buyThreshold' in options || !'sellThreshold' in options) {
    var err = new Error('Invalid options for PPO indicator, exiting.');
    this.logger.error(err.stack);
    process.exit();
  }

  // indicatorOptions
  // options: {neededPeriods: number, longPeriods: number, shortPeriods: number, emaPeriods: number, buyThreshold: number, sellThreshold: number}

};

//-------------------------------------------------------------------------------HelperFunctions
var calculateEma = function(periods, priceToday, previousEma) {

  if(!previousEma) {
    previousEma = priceToday;
  }

  var k = 2 / (periods + 1);
  var ema = (priceToday * k) + (previousEma * (1 - k));

  return ema;

};
//-------------------------------------------------------------------------------HelperFunctions

indicator.prototype.calculate = function(cs) {

  this.length += 1;
  this.previousIndicator = this.indicator;

  var usePrice = cs.close;

  var emaLong = calculateEma(this.options.longPeriods, usePrice, this.previousIndicator.emaLong);
  var emaShort = calculateEma(this.options.shortPeriods, usePrice, this.previousIndicator.emaShort);

  var PPO = ((emaShort - emaLong) / emaLong) * 100;
  var PPOSignal = calculateEma(this.options.emaPeriods, PPO, this.previousIndicator.PPOSignal);
  var PPOHistogram = tools.round(PPO - PPOSignal, 8);

  this.indicator = {'emaLong': emaLong, 'emaShort': emaShort, 'PPO': PPO, 'PPOSignal': PPOSignal, 'result': PPOHistogram};

  if(this.previousIndicator.result <= this.options.buyThreshold && this.indicator.result > this.options.buyThreshold) {

    this.advice = 'buy';

  } else if(this.previousIndicator.result >= this.options.sellThreshold && this.indicator.result < this.options.sellThreshold) {

    this.advice = 'sell';

  } else {

    this.advice = 'hold';

  }

  if(this.length >= this.options.neededPeriods) {

    return {advice: this.advice, indicatorValue: this.indicator.result};

  } else {

    return {advice: 'hold', indicatorValue: null};

  }

};

indicator.prototype.setPosition = function(pos) {

  this.position = pos;

};

module.exports = indicator;
