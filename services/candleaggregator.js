var _ = require('underscore');
var tools = require('../util/tools.js');

var aggregator = function(candleStickSizeMinutes, storage, logger) {

	this.storage = storage;
	this.candleStickSizeMinutes = candleStickSizeMinutes;
	this.logger = logger;
	this.previousCompleteCandleStickPeriod = 0;

	_.bindAll(this, 'update', 'setCandleStickSize');

};

//---EventEmitter Setup
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(aggregator, EventEmitter);
//---EventEmitter Setup

aggregator.prototype.update = function() {

	this.storage.getLastCompleteAggregatedCandleStick(this.candleStickSizeMinutes, function(err, completeCandleStick) {

		if(completeCandleStick) {

			if(this.previousCompleteCandleStickPeriod === 0) {

				this.previousCompleteCandleStickPeriod = completeCandleStick.period;

			}

			if(completeCandleStick.period !== this.previousCompleteCandleStickPeriod) {

				this.logger.log('Created a new ' + this.candleStickSizeMinutes + ' minute candlestick!');
				this.logger.log(JSON.stringify(completeCandleStick));

				this.previousCompleteCandleStickPeriod = completeCandleStick.period;

				this.storage.removeOldDBCandles(this.candleStickSizeMinutes, function(err) {

					this.emit('update', completeCandleStick);

				}.bind(this));

			}

		}

	}.bind(this));

};

aggregator.prototype.setCandleStickSize = function(candleStickSizeMinutes) {

	this.candleStickSizeMinutes = candleStickSizeMinutes;

	this.storage.getLastCompleteAggregatedCandleStick(this.candleStickSizeMinutes, function(err, completeCandleStick) {

		if(completeCandleStick) {

			this.previousCompleteCandleStickPeriod = completeCandleStick.period;

		}

	}.bind(this));

};

module.exports = aggregator;
