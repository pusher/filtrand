var sys = require('sys');
var url = require("url");
var streamer = require("./streamer");
var express = require("express");

var appTitle = "Filtrand";

// setup twitter streamer
streamer.appSetup(process.env.PUSHER_KEY, process.env.PUSHER_SECRET, process.env.PUSHER_APP_ID);
streamer.twitterSetup(process.env.TWITTER_USERNAME, process.env.TWITTER_PASSWORD);

// setup server
var app = express.createServer();
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());


// routes

// display tweets for :subject
app.get("/:subject", function (req, res) {
  var subject = req.params["subject"];
  res.render ('subject.jade', {
    subject: subject,
    key: process.env.PUSHER_KEY,
    layout: false,
    appTitle: appTitle
  });
});

// display subject entry form or redirect to subject page after submission
app.get("/", function (req, res) {
  var urlObj = url.parse(req.url, true);
  var subject = urlObj.query["subject"];

  if(subject !== undefined) {
    res.redirect("/" + subject)
  }
  else {
    res.render ('index.jade', {
      subject: "",
      layout: false,
      appTitle: appTitle
    });
  }
});

// receive a web hook indicating subject channel occupied or vacated
var OCCUPIED_EVENT = "occupied";
var VACATED_EVENT = "vacated";
app.post("/subject_interest_hook", function (req, res) {
  var body = req.body;
  var channel = body.data.channel;
  var event = body.data.event;

  console.log(channel, event)
  // we could authenticate the web hook here

  if(event == OCCUPIED_EVENT) {
    streamer.track(channel);
  } else if(event == VACATED_EVENT) {
    streamer.untrack(channel);
  }

  res.send("{}");
});


// run server

var port = 5000
app.listen(process.env.PORT || port);
console.log("Listening for WebHooks on port " + port + " at " + "/subject_interest_hook")
