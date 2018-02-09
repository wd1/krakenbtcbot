var _ = require('underscore');
var async = require('async');

var downloader = function(refreshInterval, exchangeapi, logger){

  this.refreshInterval = refreshInterval;
  this.noTradesCount = 0;
  this.exchangeapi = exchangeapi;
  this.logger = logger;

  _.bindAll(this, 'start', 'stop', 'processTrades');

};

//---EventEmitter Setup
var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(downloader, EventEmitter);
//---EventEmitter Setup

downloader.prototype.processTrades = function(err, trades) {

  if(!err) {

    this.noTradesCount = 0;

    this.emit('update', trades);

  } else {

    this.noTradesCount += 1;

    if(this.noTradesCount >= 30) {
      this.logger.error('Haven\'t received data from the Exchange API for 30 consecutive attempts, stopping application');
      return process.exit();
    }

  }

};

downloader.prototype.start = function() {

  this.logger.log('Downloader started!');

  this.exchangeapi.getTrades(false, this.processTrades);

  this.downloadInterval = setInterval(function(){
    this.exchangeapi.getTrades(false, this.processTrades);
  }.bind(this),1000 * this.refreshInterval);

};

downloader.prototype.stop = function() {

  clearInterval(this.downloadInterval);

  this.logger.log('Downloader stopped!');

};

module.exports = downloader;
