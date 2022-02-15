const path = require("path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

// DOTENV
dotenv.config({path: "./.env"});

// DATABASE
const mongoDB = process.env.DB.replace(
    "<PASSWORD>",
    process.env.PASSWORD
).replace(
    "<USER>",
    process.env.USER
);

mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});

const DB = mongoose.connection;
DB.on("error", console.error.bind(console, "mongo connection failed"));

// User Schema
const User = mongoose.model(
    "User",
    new Schema({
        username: {type: String, required: true},
        password: {type: String, required: true}
    })
);

// Passport: Local Strategy
// This acts like a middleware. It'll be called when we ask passport to do the authentication.
passport.use(
    new LocalStrategy((username, password, done) => {
        User.findOne({username: username}, (err, user) => {
            if (err) {
                return done(err);
            };
            if (!user) {
                return done(null, false, {message: "No such user!"});
            };
            
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                  // passwords match! log user in
                  return done(null, user)
                } else {
                  // passwords do not match!
                  return done(null, false, { message: "Incorrect password" })
                }
              })
            return done(null, user);
        })
    })
);

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    })
})

// Express Server
const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({secret: "cats", resave: false, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({extended: false}));

app.get("/", (req, res) => {    
    res.render("index", {user: req.user});
});

app.get("/signup", (req, res) => {
    console.log(">>>>", req.body);
    res.render("signup");
});

app.post("/signup", (req, res, next) => {
    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
        const user = new User({
            username: req.body.username,
            password: hashedPassword,
        }).save((err) => {
            if (err) return next(err);
            res.redirect("/users")
        });
    });
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/"
    })
);

app.get("/users", async (req, res) => {
    const users = await User.find().limit(3);
    res.json({
        success: true,
        users: users,
    });
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
})

app.listen(3002, () => {console.log("TOP AUTHN listening...")});