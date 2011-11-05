var sys = require('sys');
var TwitterNode = require('./vendor/twitter-node').TwitterNode;

var twitterSource = exports;
var callbacks = [];

twitterSource.setDistributor = function(distributor) {
  twitterSource.distributor = distributor;
};

twitterSource.supplyCredentials = function(username, password) {
  twitterSource.twitterUsername = username;
  twitterSource.twitterPassword = password;
};

twitterSource.track = function(keywords) {
  console.log(keywords)
  var twit = new TwitterNode({
    user: twitterSource.twitterUsername,
    password: twitterSource.twitterPassword,
    track: keywords
  });

  twit.addListener('error', function(error) {
    console.log(error.message);
  });
  twit
    .addListener('tweet', function(tweet) {
      twitterSource.distributor.distribute("twitter", tweet.text, tweet);
    })
    .addListener('end', function(resp) {
      sys.puts("wave goodbye... " + resp.statusCode);
    })
    .stream();

  return twit;
};