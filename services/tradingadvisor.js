var _ = require('underscore');
var async = require('async');
var fs = require('fs');

var advisor = function(indicatorSettings, storage, logger) {

	this.candleStickSize = indicatorSettings.candleStickSizeMinutes;
	this.storage = storage;
	this.logger = logger;

	try {

		this.indicators = {};

		fs.readdirSync('./indicators/').forEach(function(file) {
			if(file != 'template.js' && file.indexOf('.') > 0 && file.indexOf('.js') > 0) {
				var indicator = require('../indicators/' + file);
				this.indicators[file.replace('.js', '')] = indicator;
			}
		}.bind(this));

		this.selectedIndicator = new this.indicators[indicatorSettings.indicator](indicatorSettings.options);

	} catch(err) {

		this.logger.error('Wrong indicator chosen. This indicator doesn\'t exist.');
		this.logger.error(err.stack);
		process.exit();

	}

	_.bindAll(this, 'start', 'update', 'setPosition', 'setIndicator');

};

//---EventEmitter Setup
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(advisor, EventEmitter);
//---EventEmitter Setup

advisor.prototype.start = function(callback) {

	this.storage.getLastNCompleteAggregatedCandleSticks(1000, this.candleStickSize, function(err, candleSticks) {

		this.latestTradeAdvice = {advice: 'hold'};

		for(var i = 0; i < candleSticks.length; i++) {

			var result = this.selectedIndicator.calculate(candleSticks[i]);

			if(['buy', 'sell', 'hold'].indexOf(result.advice) >= 0) {
				if(['buy', 'sell'].indexOf(result.advice) >= 0) {
					this.latestTradeAdvice = result;
				}
			} else {
				var err = new Error('Invalid advice from indicator, should be either: buy, sell or hold.');
				this.logger.error(err.stack);
				process.exit();
			}

		}

		if(['buy', 'sell'].indexOf(this.latestTradeAdvice.advice) >= 0) {
			this.emit('advice', this.latestTradeAdvice);
		}

		if(callback) {
			callback();
		}

	}.bind(this));

};

advisor.prototype.update = function(cs) {

	var result = this.selectedIndicator.calculate(cs);

	if(['buy', 'sell', 'hold'].indexOf(result.advice) >= 0) {
		this.emit('advice', result);
		return result;
	} else {
		var err = new Error('Invalid advice from indicator, should be either: buy, sell or hold.');
		this.logger.error(err.stack);
		process.exit();
	}

};

advisor.prototype.setPosition = function(pos) {

	this.selectedIndicator.setPosition(pos);

};

advisor.prototype.setIndicator = function(indicatorSettings) {

	this.selectedIndicator = new this.indicators[indicatorSettings.indicator](indicatorSettings.options);

};

module.exports = advisor;
