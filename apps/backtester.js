var _ = require('underscore');
var tools = require('../util/tools.js');
var async = require('async');

var loggingservice = require('../services/loggingservice.js');
var storageservice = require('../services/storage.js');
var exchangeapiservice = require('../services/exchangeapi.js');
var tradingadvisor = require('../services/tradingadvisor.js');
var simulatorservice = require('../services/simulator.js');

//------------------------------Config
var config = require('../config.js');
//------------------------------Config

//------------------------------InitializeModules
var logger = new loggingservice('backtester', config.debug);
var storage = new storageservice(config.exchangeSettings, config.mongoConnectionString, logger);
var exchangeapi = new exchangeapiservice(config.exchangeSettings, config.apiSettings, logger);
var advisor = new tradingadvisor(config.indicatorSettings, storage, logger);
var simulator = new simulatorservice(config.exchangeSettings, config.backTesterSettings, config.indicatorSettings, advisor, logger);
//------------------------------InitializeModules

var backtester = function() {

  this.indicatorSettings = config.indicatorSettings;

  _.bindAll(this, 'run', 'start');

};

//---EventEmitter Setup
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(backtester, EventEmitter);
//---EventEmitter Setup

backtester.prototype.run = function() {

  advisor.setIndicator(this.indicatorSettings);

  async.series(
      {
        balance: function(cb) {exchangeapi.getBalance(true, cb);},
        aggregatedCandleSticks: function(cb) {storage.getAggregatedCandleSticks(this.indicatorSettings.candleStickSizeMinutes, cb);}.bind(this)
      }, function(err, result) {
        if(result.aggregatedCandleSticks.length > 0) {
          simulator.calculate(result.aggregatedCandleSticks, result.balance.fee, this.indicatorSettings, function(result) {
            simulator.report();
            this.emit('done');
          }.bind(this));
        }
      }.bind(this)
  );

};

backtester.prototype.start = function() {

  this.run();

};

var backtesterApp = new backtester();

module.exports = backtesterApp;
