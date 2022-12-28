require('dotenv').config();
const path = require('path');
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const User = require('./db/User');
const bodyParser = require("body-parser");
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL })
}));

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));


passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/middleware",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id, firstName: profile.given_name,lastName:profile.family_name }, function (err, user) {
            return cb(err, user);
        });
    }
));

const userMessages = {};

// socket io
io.on('connection',socket =>{
    socket.on('new-message',(data)=>{
        userMessages[socket.id] = data;
        socket.broadcast.emit('message-from-backend',{message:userMessages[socket.id]});
    });
});

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/middleware',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/middleware');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get("/middleware", (req, res) => {
    if (req.isAuthenticated()) {
        // res.render('middleware');
        res.sendFile(__dirname+'/public/chat.html')
    } else {
        res.redirect('/login');
    }
});


app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/middleware');
            });
        }
    });
});

app.post('/register', (req, res) => {
    User.register({ username: req.body.username, firstName: req.body.firstName, lastName: req.body.lastName, }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/middleware');
            });
        }
    });
});

app.get('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});


server.listen(3000, () => {
    console.log('server started on port 3000.');
});