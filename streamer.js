var sys = require('sys');
var TwitterNode = require('./vendor/twitter-node').TwitterNode;
var Pusher = require('node-pusher');

var subjectToChannel = {};

// uncomment for local
//Pusher.prototype.domain = 'localhost';
//Pusher.prototype.port = 8081;

// staging
//Pusher.prototype.domain = 'api.staging.pusherapp.com';



// API

var streamer = exports;
var pusher = null;

// start tracking passed subject
streamer.track = function(channel) {
  var subject = streamer.getSubject(channel);
  var subjects = currentSubjects();

  if(!includes(subject, subjects))
    subjects.push(subject);

  streamer.twit = setup(subjects);
};

// stop tracking passed subject
streamer.untrack = function(channel) {
  var subject = streamer.getSubject(channel);
  var subjects = currentSubjects();

  if(includes(subject, subjects)) {
    subjects.splice(subjects.indexOf(subject), 1);
  }

  streamer.twit = setup(subjects);
};

streamer.addSubject = function(subject) {
  if(!subjectToChannel.hasOwnProperty(subject)) {
    subjectToChannel[subject] = makeChannelName(subject);
  }
};

streamer.getSubject = function(channel) {
  for(var subject in subjectToChannel) {
    if(subjectToChannel[subject] == channel) {
      return subject;
    }
  }
};

streamer.getChannel = function(subject) {
  return subjectToChannel[subject];
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

var makeChannelName = function(subject) {
  return subject.replace(/[^A-Za-z0-9_\-=@,.;]/g, "") + Math.random();
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

var currentSubjects = function() {
  var subjects = [];
  if(streamer.twit !== undefined)
    subjects = streamer.twit.trackKeywords;

  return subjects;
};

var tweetEmitter = function(tweet) {
  var subjects = currentSubjects();
  for(var i in subjects) {
    if(tweet.text.indexOf(subjects[i]) != -1) { // subject appears in tweet - emit it on channel
      emit(subjects[i], tweet);
    }
  }
};

var emit = function(subject, tweet) {
  var channel = streamer.getChannel(subject);
  pusher.trigger(channel, "tweet", tweet, null, function(err, req, res) {
    if(err) {
      console.log("Could not emit tweet event on Pusher API.");
    }
    else {
      console.log("Emitted tweet about " + subject + ": " + tweet.text)
    }
  });
};

var setup = function(subjects) {
  var twit = new TwitterNode({
    user: streamer.twitterUsername,
    password: streamer.twitterPassword,
    track: subjects
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