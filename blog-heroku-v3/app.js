//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const md5 = require("md5");

const homeStartingContent = "Welcome to my blog! My name is Joseph Kligel, and I will be your host. This is a website I created completely from scratch. Everything from the server to the website design and more has been implemented by yours truly.";
const aboutContent = "This is a blog site where I share my ideas and thoughts with others. These thoughts span from menial daily entries to significant endeavors such as reporting programming progress.";
const contactContent = "You can get in touch with me via ";

const app = express();
let hiddenTitle = "";

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public/"));

mongoose.connect("mongodb+srv://jkligel:1618@cluster0-ax2hg.mongodb.net/blogDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const postSchema = {
  title: String,
  content: String
};
const userSchema = {
  email: String,
  password: String
};
const Post = mongoose.model("Post", postSchema);
const User = mongoose.model("User", userSchema);

// --------------Gets Section--------------

app.get("/", function(req, res) {
  Post.find({}, function(err, posts) {
    if (err) console.log(err);
    else {
      res.render("home", {
        journalTitle: "Home",
        startingContent: homeStartingContent,
        posts: posts
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
  const hiddenTitle = req.query.title;
  res.render("compose", {
    journalTitle: hiddenTitle
  });
});

app.route("/login")
  .get((req, res) => {
    res.render("login", {
      hiddenTitle: req.query.title
    });
  })
  .post((req, res) => {
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email: username}, (err, foundUser)=>{
      if(err) console.log(err);
      else {
        if(foundUser){
          if(foundUser.password === password) {
            res.render("compose", {
              journalTitle: req.body.hiddenTitle//fix
            });
          } else {
            res.sendFile(__dirname+"/public/error/noaccess.html");
          }
        } else res.sendFile(__dirname+"/public/error/noaccess.html");
      }
    });
  });

// --------------Posts Section--------------

app.post("/compose/:title", function(req, res) {
  const title = _.capitalize(req.params.title);

  if (title === "Daily") {
    const post = new Post({
      title: req.body.postTitle,
      content: req.body.postBody
    });

    post.save(function(err) {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    const title = _.lowerCase(req.params.title);
    mongoose.connection.db.listCollections({
      name: title
    }).next(
      function(err, collinfo) {
        if (collinfo) {
          const journalPost = new Journal({
            title: req.body.postTitle,
            content: req.body.postBody
          });

          journalPost.save(function(err) {
            if (!err) res.redirect("/" + title);
          });
        }
      }
    );
  }

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

// ---------------Other Journal Section --------------


app.get("/:journal", function(req, res) {
  const requestedTitle = _.capitalize(req.params.journal);

  mongoose.connection.db.listCollections({
    name: _.lowerCase(req.params.journal)
  }).next(function(err, collinfo) {
    if (collinfo) {

      try { //Don't know how but the next 5 lines work
        Journal = mongoose.connection.model(collinfo.name)
      } catch (e) {
        Journal = mongoose.model(collinfo.name, postSchema)
      }
      module.exports = Journal;

      Journal.find({}, function(err, foundPosts) {
        if (err) console.log(err);
        else {
          res.render("journal", {
            journalTitle: requestedTitle,
            headerTitle: header(requestedTitle),
            startingContent: "This is the " + requestedTitle.slice(0, -5) + " progess log",
            posts: foundPosts
          });
        }
      });
    } else res.sendFile(__dirname + "/public/error/404.html");
  });
});

app.get("/:journal/:postId", function(req, res) {
  const requestedJournal = req.params.journal;
  const requestedId = req.params.postId;

  mongoose.connection.db.listCollections({
    name: _.lowerCase(requestedJournal)
  }).next(function(err, collinfo) {
    if (collinfo) {
      Journal.findOne({
        _id: requestedId
      }, function(err, foundPost) {
        if (err) console.log(err);
        else {
          res.render("post", {
            title: foundPost.title,
            content: foundPost.content
          });
        }
      });
    } else res.sendFile(__dirname + "/public/error/404.html");
  });
});

// ---------------Port Section --------------

let PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log("Server started on port 3000");
});

// ---------------Miscallaneous Section --------------

function header(string) {
  var header = string.slice(0, -5);
  if (header === "Py") {
    header = "Python Programming";
  } else if (header === "Wd") {
    header = "Web Development (HTML, CSS, JS, NodeJS)";
  } else {
    header = header + " Programming";
  }
  return header;
};
