# Filtrand

A twitter subject streamer.  A demo of Pusher's new web hook feature.

## Getting started

    npm install .

Add the following environment variables

    export TWITTER_USERNAME=""
    export TWITTER_PASSWORD=""

    export PUSHER_KEY=""
    export PUSHER_SECRET=""
    export PUSHER_APP_ID=""

Run

    node server.js

Configure Web Hooks on Pusher to point to <http://your-machine/webhooks>. You might find a service like [localtunnel](http://progrium.com/localtunnel/) useful.

Visit <http://localhost:5000/>

--------

Uses: Pusher, jQuery, Backbone.js, Underscore.js, Node.js, npm, node-pusher, node-twitter, Express, Jade.
