var irc = require('irc');
var ircClient = new irc.Client('irc.wikimedia.org', 'pusher-streamer', {
  channels: ['#en.wikipedia']
});

ircClient.addListener('message', function (from, to, message) {
  console.log(from + ' => ' + to + ': ' + message);
});