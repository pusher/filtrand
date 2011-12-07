var sys = require('sys');
var url = require("url");
var express = require("express");
var streamer = require("./streamer");

var appTitle = "Filtrand";

// setup twitter streamer
streamer.appSetup(process.env.PUSHER_KEY, process.env.PUSHER_SECRET, process.env.PUSHER_APP_ID);
streamer.twitterSetup(process.env.TWITTER_USERNAME, process.env.TWITTER_PASSWORD);



// setup server
var app = express.createServer();
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());

// routes

// main page
app.get("/", function (req, res) {
  var returnVars = {
    key: process.env.PUSHER_KEY,
    layout: false,
    appTitle: appTitle,
    currentSubjects: streamer.currentSubjects()
  };

  // just for setting form field value
  var subject = url.parse(req.url, true).query["subject"];
  if(!subject) {
    returnVars["subject"] = "";
  }
  else {
    returnVars["subject"] = subject;
  }

  res.render('index.jade', returnVars);
});

// receive a web hook indicating subject channel occupied or vacated
var OCCUPIED_EVENT = "channel_occupied";
var VACATED_EVENT = "channel_vacated";
app.post("/subject_interest_hook", function (req, res) {
  var body = req.body;
  var channel = body.data.channel;
  var event = body.data.event;

  console.log(streamer.channelToSubject(channel), event, channel)

  // we could authenticate the web hook here

  if(channel != "subjects") {
    if(event == OCCUPIED_EVENT) {
      streamer.track(channel);
    } else if(event == VACATED_EVENT) {
      streamer.untrack(channel);
    }
  }

  res.send("{}");
});


// run server

var port = process.env.PORT || 5000;
app.listen(port);
console.log("Listening for WebHooks on port " + port + " at " + "/subject_interest_hook")
