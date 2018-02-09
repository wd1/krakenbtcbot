var _ = require('underscore');
var async = require('async');
var tools = require('../util/tools.js');

var processor = function(storage, logger) {

  this.initialDBWriteDone = false;
  this.storage = storage;
  this.logger = logger;

  _.bindAll(this, 'updateCandleStick', 'createCandleSticks', 'processUpdate', 'updateCandleDB');

};

//---EventEmitter Setup
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(processor, EventEmitter);
//---EventEmitter Setup

processor.prototype.updateCandleStick = function (candleStick, tick) {

  if(!candleStick.open) {

    candleStick.open = tick.price;
    candleStick.high = tick.price;
    candleStick.low = tick.price;
    candleStick.close = tick.price;
    candleStick.volume = tick.amount;
    candleStick.vwap = tick.price;

  } else {

    var currentVwap = candleStick.vwap * candleStick.volume;
    var newVwap = tick.price * tick.amount;

    candleStick.high = _.max([candleStick.high, tick.price]);
    candleStick.low = _.min([candleStick.low, tick.price]);

    candleStick.volume = tools.round(candleStick.volume + tick.amount, 8);
    candleStick.vwap = tools.round((currentVwap + newVwap) / candleStick.volume, 8);

  }

  candleStick.close = tick.price;

  return candleStick;

};

processor.prototype.createCandleSticks = function(ticks, callback) {

  if(ticks.length > 0) {

    this.storage.getLastNonEmptyPeriod(function(err, lastStoragePeriod) {

      this.storage.getLastNonEmptyClose(function(err, lastNonEmptyClose) {

        var candleStickSizeSeconds = 60;

        var toBePushed = [];

        var previousClose = lastNonEmptyClose;

        var tickTimeStamp = ticks[0].date;

        var firstTickCandleStick = (Math.floor(ticks[0].date/candleStickSizeSeconds)*candleStickSizeSeconds);

        if(lastStoragePeriod < firstTickCandleStick && lastStoragePeriod !== 0) {
          tickTimeStamp = lastStoragePeriod + candleStickSizeSeconds;
        }

        var now = tools.unixTimeStamp(new Date().getTime());

        var startTimeStamp = (Math.floor(tickTimeStamp/candleStickSizeSeconds)*candleStickSizeSeconds);
        var stopTimeStamp = (Math.floor(now/candleStickSizeSeconds)*candleStickSizeSeconds);

        var endTimeStamp = startTimeStamp + candleStickSizeSeconds;

        while(endTimeStamp < ticks[0].date) {

          toBePushed.push({'period':startTimeStamp,'open':previousClose,'high':previousClose,'low':previousClose,'close':previousClose,'volume':0, 'vwap':previousClose});

          startTimeStamp = endTimeStamp;
          endTimeStamp = endTimeStamp + candleStickSizeSeconds;

        }

        var currentCandleStick = {'period':startTimeStamp,'open':undefined,'high':undefined,'low':undefined,'close':undefined,'volume':0,'vwap':undefined};

        ticks.forEach(function(tick) {

          tickTimeStamp = tick.date;

          if(toBePushed.length > 0) {
            previousClose = _.last(toBePushed).close;
          }

          while(tickTimeStamp >= endTimeStamp + candleStickSizeSeconds) {

            if(currentCandleStick.volume > 0) {
              toBePushed.push(currentCandleStick);
            }

            startTimeStamp = endTimeStamp;
            endTimeStamp = endTimeStamp + candleStickSizeSeconds;

            toBePushed.push({'period':startTimeStamp,'open':previousClose,'high':previousClose,'low':previousClose,'close':previousClose,'volume':0, 'vwap':previousClose});

          }

          if(tickTimeStamp >= endTimeStamp) {

            if(currentCandleStick.volume > 0) {
              toBePushed.push(currentCandleStick);
            }

            startTimeStamp = endTimeStamp;
            endTimeStamp = endTimeStamp + candleStickSizeSeconds;

            currentCandleStick = {'period':startTimeStamp,'open':undefined,'high':undefined,'low':undefined,'close':undefined,'volume':0, 'vwap':undefined};

          }

          if(tickTimeStamp >= startTimeStamp && tickTimeStamp < endTimeStamp) {

            currentCandleStick = this.updateCandleStick(currentCandleStick,tick);

          }

        }.bind(this));

        if(currentCandleStick.volume > 0) {

          toBePushed.push(currentCandleStick);

          startTimeStamp = endTimeStamp;
          endTimeStamp = endTimeStamp + candleStickSizeSeconds;

        }

        if(toBePushed.length > 0) {
          previousClose = _.last(toBePushed).close;
        }

        for(var i = startTimeStamp;i <= stopTimeStamp;i = i + candleStickSizeSeconds) {

          var beginPeriod = i;
          var endPeriod = beginPeriod + candleStickSizeSeconds;

          toBePushed.push({'period':beginPeriod,'open':previousClose,'high':previousClose,'low':previousClose,'close':previousClose,'volume':0, 'vwap':previousClose});

        }

        this.storage.push(toBePushed, callback);

      }.bind(this));

    }.bind(this));

  } else {

    callback(null);

  }

};

processor.prototype.processUpdate = function(err) {

  if(err) {

    var parsedError = JSON.stringify(err);

    if(err.stack) {
      parsedError = err.stack;
    }

    this.logger.error('Couldn\'t create candlesticks due to a database error');
    this.logger.error(parsedError);

    process.exit();

  } else {

    this.storage.getLastNCandles(1, function(err, candleSticks) {

      var latestCandleStick = candleSticks[0];

      if(!this.initialDBWriteDone) {

        this.emit('initialDBWrite');
        this.initialDBWriteDone = true;

      } else {

        this.emit('update', latestCandleStick);

      }

    }.bind(this));

  }

};

processor.prototype.updateCandleDB = function(ticks) {

  this.storage.getLastNonEmptyPeriod(function(err, period) {

    var newTicks = _.filter(ticks,function(tick){

      return tick.date >= period;

    });

    this.createCandleSticks(newTicks, this.processUpdate);

  }.bind(this));

};

module.exports = processor;
