var TwitterNode = require('twitter-node').TwitterNode;
var Pusher = require('node-pusher');

// uncomment for local
//Pusher.prototype.domain = 'localhost';
//Pusher.prototype.port = 8081;

// staging
Pusher.prototype.domain = 'api.staging.pusherapp.com';



// API

var streamer = exports;
var pusher = null;

// start tracking passed keyword
streamer.track = function(keyword) {
  var keywords = currentKeywords();
  if(!includes(keyword, keywords))
    keywords.push(keyword);

  streamer.twit = setup(keywords);
};

// stop tracking passed keyword
streamer.untrack = function(keyword) {
  var keywords = currentKeywords();
  if(includes(keyword, keywords)) {
    keywords.splice(keywords.indexOf(keyword), 1);
  }

  streamer.twit = setup(keywords);
};

// setup the streamer with a Pusher connection
streamer.appSetup = function(key, secret, appId) {
  pusher = new Pusher({
    appId: appId,
    key: key,
    secret: secret
  });
};

streamer.twitterSetup = function(username, password) {
  streamer.twitterUsername = username;
  streamer.twitterPassword = password;
};


// supporting functions

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

var currentKeywords = function() {
  var keywords = [];
  if(streamer.twit !== undefined)
    keywords = streamer.twit.trackKeywords;

  return keywords;
};

var tweetEmitter = function(tweet) {
  var channels = currentKeywords();
  for(var i in channels) {
    var channel = channels[i];
    if(tweet.text.indexOf(channel) != -1) { // channel name appears in tweet - emit it on channel
      pusher.trigger(channel, "tweet", tweet.text, null, function(err, req, res) {
        if(err) {
          console.log("Could not emit tweet event on Pusher API.");
        }
        else {
          console.log("Emitted tweet on " + channel + ": " + tweet.text)
        }
      });
    }
  }
};

var setup = function(keywords) {
  var twit = new TwitterNode({
    user: streamer.twitterUsername,
    password: streamer.twitterPassword,
    track: keywords
  });

  twit.addListener('error', function(error) {
    console.log(error.message);
  });

  twit
    .addListener('tweet', tweetEmitter)
    .addListener('end', function(resp) {
      sys.puts("wave goodbye... " + resp.statusCode);
    })
    .stream();

  return twit;
};