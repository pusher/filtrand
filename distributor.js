var sys = require('sys');
var TwitterNode = require('./vendor/twitter-node').TwitterNode;
var Pusher = require('node-pusher');

var distributor = exports;
var pusher = null;
var latestKeywords = [];

// uncomment for local
//Pusher.prototype.domain = 'localhost';
//Pusher.prototype.port = 8081;

// staging
//Pusher.prototype.domain = 'api.staging.pusherapp.com';

distributor.updateKeywords = function(keywords) {
  latestKeywords = keywords;
};

// setup the streamer with a Pusher connection
distributor.setupPusher = function(key, secret, appId) {
  pusher = new Pusher({
    appId: appId,
    key: key,
    secret: secret
  });
};

distributor.distribute = function(source, content, data) {
  for(var i in latestKeywords) {
    var channel = latestKeywords[i];
    if(content.indexOf(channel) != -1) { // channel name appears in content - emit on channel
      emit(source + "-" + channel, "update", data);
    }
  }
};

var emit = function(channel, event, data) {
  pusher.trigger(channel, event, data, null, function(err, req, res) {
    if(err) {
      console.log("Could not emit event on Pusher API.");
    }
    else {
      console.log("Emitted " + event + " on " + channel);
    }
  });
};

