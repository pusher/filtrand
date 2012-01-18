var sys = require('sys');
var url = require("url");
var crypto = require("crypto");
var express = require("express");
var streamer = require("./streamer");

var appTitle = "Filtrand";

// setup twitter streamer
streamer.appSetup(process.env.PUSHER_KEY, process.env.PUSHER_SECRET, process.env.PUSHER_APP_ID);
streamer.twitterSetup(process.env.TWITTER_USERNAME, process.env.TWITTER_PASSWORD);

// setup server
var app = express.createServer();
app.use(express.static(__dirname + '/public'));

// storing raw body in request
app.use(function (req, res, next) {
  req.on('data', function (data) {
    if (req.rawBody === undefined) {
      req.rawBody = '';
    }
    req.rawBody += data;
  });
  next();
});

// body parser
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

  res.render('index.jade', returnVars);
});

// receive a web hook indicating subject channel occupied or vacated
app.post("/subject_interest_hook", function (req, res) {
  var events = req.body.events;

  var digest = crypto.createHmac('sha256', process.env.PUSHER_SECRET)
    .update(req.rawBody)
    .digest('hex');

  if (req.headers['x-pusher-appkey'] !== process.env.PUSHER_KEY ||
      req.headers['x-pusher-hmac-sha256'] !== digest) {
    console.log("WebHook denied", req.body);
    res.send({}, 403);
    return;
  }

  console.log("WebHook received", req.body);

  for (var i=0; i < events.length; i++) {
    var event = events[i].name;
    var channel = events[i].channel;

    if (channel != "subjects") {
      if (event == "channel_occupied") {
        streamer.track(channel);
      } else if (event == "channel_vacated") {
        streamer.untrack(channel);
      }
    }
  };

  res.send({});
});


// run server

var port = process.env.PORT || 5000;
app.listen(port);
console.log("Listening for WebHooks on port " + port + " at " + "/subject_interest_hook")
