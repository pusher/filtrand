var sys = require('sys');

var tracker = exports;
keywords = [];
callbacks = [];

// start tracking passed keyword
tracker.track = function(channel) {
  var keyword = getSubject(channel);
  if(!includes(keyword, keywords)) {
    keywords.push(keyword);
  }

  updateDataSources();
};

// stop tracking passed keyword
tracker.untrack = function(channel) {
  var keyword = getSubject(channel);
  if(includes(keyword, keywords)) {
    keywords.splice(keywords.indexOf(keyword), 1);
  }

  updateDataSources();
};

tracker.bind = function(callback) {
  callbacks.push(callback);
};

tracker.getKeywords = function() {
  return keywords;
};

// supporting functions

var getSubject = function(channel) {
  // hack
  var subject = channel.replace("twitter-", "");
  return subject;
};

var updateDataSources = function() {
  for(var i in callbacks) {
    callbacks[i](keywords);
  }
};

var includes = function(item, array) {
  var included = false;
  for(var i = 0; i < array.length; i++) {
    if(item == array[i]) {
      included = true;
      break;
    }
  }

  return included;
};