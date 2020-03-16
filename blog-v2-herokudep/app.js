//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");

const homeStartingContent = "Welcome to my blog! My name is Joseph Kligel, and I will be your host. This is a website I created completely from scratch. Everything from the server to the website design and more has been implemented by yours truly.";
const aboutContent = "This is a blog site where I share my ideas and thoughts with others. These thoughts span from menial daily entries to significant endeavors such as reporting programming progress.";
const contactContent = "You can get in touch with me via ";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://jkligel:1618@cluster0-ax2hg.mongodb.net/blogDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const postSchema = {
  title: String,
  content: String
};

const Post = mongoose.model("Post", postSchema);

app.get("/", function(req, res) {
  Post.find({}, function(err, posts) {
    if (err) console.log(err);
    else {
      res.render("home", {
        journalTitle: "Home",
        startingContent: homeStartingContent,
        posts: posts,
      });
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about", {
    aboutContent: aboutContent
  });
});

app.get("/contact", function(req, res) {
  res.render("contact", {
    contactContent: contactContent
  });
});

app.get("/compose", function(req, res) {
  res.render("compose");
});

app.post("/compose", function(req, res) {
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });

  post.save(function(err) {
    if (!err) {
      res.redirect("/");
    }
  });
});

app.get("/posts/:postId", function(req, res) {
  const requestedId = req.params.postId;

  Post.findOne({
    _id: requestedId
  }, function(err, post) {
    if (err) console.log(err);
    else {
      res.render("post", {
        title: post.title,
        content: post.content
      });
    }
  });
});

// ---------------New Journal Section --------------

const journalSchema = {
  journalName: String,
  posts: [postSchema]
};

const Journal = mongoose.model("Journal", journalSchema);

app.get("/:journal", function(req, res) {
  const requestedTitle = _.capitalize(req.params.journal);

  Journal.findOne({
      journalName: requestedTitle
    }, function(err, foundJournal) {
      if (err) console.log(err);
      else if (!foundJournal) {
        const journal = new Journal({
          journalName: requestedTitle
        });
        journal.save();
        res.redirect("/" + requestedTitle);
      } else {
        res.render("journal", {
          journalTitle: foundJournal.journalName,
          startingContent: "This is the " + foundJournal.journalName + " Journal.",
          posts: foundJournal.posts
        });
      }
    });

  });

// ---------------Port Section --------------
let PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log("Server started on port 3000");
});
