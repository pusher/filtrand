$(document).ready(function() {

  // uncomment for local dev:
  //Pusher.host = "localhost";
  //Pusher.ws_port = 8090;

  // staging
  //Pusher.host = "ws.staging.pusherapp.com"

  // tweet model
  window.Tweet = Backbone.Model.extend({
    url: "/",

    defaults: function() {
      return {
        date: new Date().getTime()
      };
    }
  });

  // list of tweets model
  window.TweetList = Backbone.Collection.extend({
    model: Tweet,
    url: "/",

    comparator: function(tweet) {
      return window.Tweets.order(tweet);
    },

    order: function(tweet) {
      return -tweet.get('date');
    }
  });

  // view for a tweet
  window.TweetView = Backbone.View.extend({

    tagName:  "li",
    className: "tweet",
    template: _.template($('#item-template').html()),

    // listens for changes to its model, re-rendering.
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    // re-render the contents of the tweet.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },

    // remove this view from the DOM.
    remove: function() {
      $(this.el).remove();
    },

    // remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }
  });

  // appview - top level of UI
  window.AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#filtrandapp"),

    // At initialization we bind to the relevant events on the Tweets
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting tweets that might be saved in *localStorage*.
    initialize: function() {
      Tweets.bind('add', this.addOne, this);
      Tweets.bind('reset', this.addAll, this);

      Tweets.fetch();
    },

    // Add a single item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(tweet) {
      var view = new TweetView({model: tweet});
      this.$("#tweet-list").prepend(view.render().el);
    },

    // Add all items in the Tweets collection at once.
    addAll: function() {
      Tweets.each(this.addOne);
    }
  });

  function getSubject() {
    var splitUrl = window.location.href.split("/");
    return splitUrl[splitUrl.length - 1];
  }




  // main app setup

  // Enable pusher logging - don't include this in production
  Pusher.log = function(message) {
    if (window.console && window.console.log) window.console.log(message);
  };

  // Flash fallback logging - don't include this in production
  WEB_SOCKET_DEBUG = true;

  var channel = pusher.subscribe(getSubject());

  // global collection of tweets
  window.Tweets = new TweetList;
  window.maxTweets = 8;

  // Finally, we kick things off by creating the **App**.
  window.App = new AppView;

  channel.bind('tweet', function(tweet) {
    var tweet = new Tweet();
    tweet.text = tweet.text;

    if(window.Tweets.length == window.maxTweets)
      window.Tweets.last().destroy();

    window.Tweets.add(tweet);
  });
});