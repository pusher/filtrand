$(document).ready(function() {

  // uncomment for local dev:
  //Pusher.host = "localhost";
  //Pusher.ws_port = 8090;

  // staging
  //Pusher.host = "ws.staging.pusherapp.com"


  // --------------- subject model

  window.Subject = Backbone.Model.extend({
    url: "/"
  });

  window.SubjectList = Backbone.Collection.extend({
    model: Subject,
    url: "/"
  });

  window.SubjectView = Backbone.View.extend({
    tagName:  "li",
    className: "subject",
    template: _.template($('#subject-item-template').html()),

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
  });


  //----------- tweet model

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
    template: _.template($('#tweet-item-template').html()),

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
  });

  // main view for list of tweets
  window.TweetsView = Backbone.View.extend({
    el: $("#tweets-view"),

    initialize: function() {
      Tweets.bind('add', this.addOne, this);
      Tweets.bind('reset', this.reset, this);
    },

    addOne: function(tweet) {
      var view = new TweetView({model: tweet});
      this.$("#tweet-list").prepend(view.render().el);
      $(".waiting-for-tweets").hide();
    },

    reset: function() {
      this.$("#tweet-list").empty();
     }
  });

  // main view for list of subjects
  window.SubjectsView = Backbone.View.extend({
    el: $("#subjects-view"),

    initialize: function() {
      Subjects.bind('add', this.addOne, this);
      Subjects.bind('remove', this.removeOne, this);
    },

    addOne: function(subject) {
      var view = new SubjectView({model: subject});
      this.$("#subject-list").prepend(view.render().el);
      $(".already-tracking").show();
    },

    removeOne: function() {
      if(window.Subjects.length == 0) {
        $(".already-tracking").hide();
      }
    }
  });


  //--------- helpers

  var getUrlParam = function(name) {
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(window.location.href);
    return results !== null ? results[1] : "";
  };

  // avoids the chars disallowed in channel names
  var encodeToChannelName = function(str) {
    return encodeURIComponent(str).replace('-', '-0').replace('_', '-1').replace('.', '-2')
      .replace('!', '-3').replace('~', '-4').replace('*', '-5').replace('(', '-6').replace(')', '-7');
  };

  var addSubject = function(subjectString) {
    if(subjectString !== null && subjectString !== undefined && subjectString.length > 0) {
      var sub = new Subject();
      sub.subject = subjectString;
      window.Subjects.add(sub);
      return sub;
    }
  };

  var channelName = undefined;
  var subscribeNewSubject = function(subject) {
    if(channelName == encodeToChannelName(subject)) {
      return false;
    }

    if(channelName !== undefined) {
      pusher.unsubscribe(channelName);
    }

    channelName = encodeToChannelName(subject);
    channel = pusher.subscribe(channelName);
    $("input[name=subject]").val(subject);

    window.Tweets.reset();
    $(".waiting-for-tweets").show();

    channel.bind("tweet", function(tweetJSON) {
      var tweet = new Tweet();
      tweet.image = tweetJSON.profile_image_url;
      tweet.text = tweetJSON.text;

      if(window.Tweets.length == window.maxTweets) {
        window.Tweets.last().destroy();
      }

      window.Tweets.add(tweet);
    });
  }


  // ------------- main app setup

  var subjectChannel = pusher.subscribe("subjects");
  window.Subjects = new SubjectList;

  subjectChannel.bind("subject-subscribed", function(json) {
    var alreadyShown = false;
    window.Subjects.forEach(function(subject) {
      if(subject.subject == json.subject) {
        alreadyShown = true;
      }
    });

    if(alreadyShown === false) {
      addSubject(json.subject);
    }
  });

  subjectChannel.bind("subject-unsubscribed", function(json) {
    window.Subjects.forEach(function(sub) {
      if(json.subject == sub.subject) {
        sub.destroy();
      }
    });
  });

  window.Tweets = new TweetList;
  window.maxTweets = 8;

  $('.subject-form').submit(function(){
    var subject = $("input[name=subject]").val();
    subscribeNewSubject(subject);
    return false;
  })

  $('.sidebar-subject').live("click", function(){
    subscribeNewSubject($(this).text());
    return false;
  });


  // Finally, we kick things off by creating the lis views.
  window.SubjectsView = new SubjectsView;
  window.TweetsView = new TweetsView;

  // add existing subjs (sent from server) to collection
  for(var i = 0; i < currentSubjects.length; i++) {
    addSubject(currentSubjects[i]);
  }
});