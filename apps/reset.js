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
var logger = new loggingservice('reset', config.debug);
var storage = new storageservice(config.exchangeSettings, config.mongoConnectionString, logger);
//------------------------------InitializeModules

var reset = function() {

  this.indicatorSettings = config.indicatorSettings;

  _.bindAll(this, 'start');

};

//---EventEmitter Setup
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(reset, EventEmitter);
//---EventEmitter Setup

reset.prototype.start = function(collection) {

  storage.dropCollection(collection, function(err) {
    logger.log(collection + ' dropped.');
    this.emit('done');
  }.bind(this));

};

var resetApp = new reset();

module.exports = resetApp;
