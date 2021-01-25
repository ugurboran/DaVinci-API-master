//Includes
var express = require('express');
var request = require('request');
var auth = require('basic-auth');
var bcrypt = require('bcryptjs');
var signToken = require('../signToken');

var config = require('../config/config');

var router = express.Router();

//Middleware
var requireAuth = require('../middlewares/RequireAuth');

//Models
var User = require('../models/UserModel');

//register new Account
router.post('/', function (req, res) {
    if (req.body.username && req.body.email && req.body.password) {

        //Hash user password
        var bcryptSalt = bcrypt.genSaltSync();
        var hash = bcrypt.hashSync(req.body.password, bcryptSalt);

        var userInstance = {
            username: req.body.username,
            email: req.body.email,
            password: hash
        }

        User.create(userInstance, (err, user) => {
            if (err) {
                if (err.name == "BulkWriteError")
                    res.status(304).json({ result: "bad", message: "Username already exists" });
            }
            else {
                res.status(201).json({ result: "ok", message: "Account created succesfully" });
            }
        });
    }
    else {
        res.status(400).json({ result: "bad", message: "Missing user credentials" });
    }
});

//get authentication token
router.post('/authenticate', function (req, res) {
    const credentials = auth(req);

    //Credentials Supplied
    if (credentials) {
        User.findOne({
            $or: [
                { username: credentials.name },
                { email: credentials.name }]
        }).exec((err, user) => {
            if (err) {
                res.status(500).json({ result: "bad", message: "Critical error occured" });
            }
            else if (!user) {
                res.status(400).json({ result: "bad", message: "User not found" });
            }
            else if (bcrypt.compareSync(credentials.pass, user.password)) {
                //Create a new token with username

                const payload = {
                    id: user.id,
                    user: user.username
                };
                var token = signToken(payload);
                res.status(200).json({ result: "ok", message: "Authentication succesful", token: token, tokenExpire: config.tokenExpireTime });
            }
            else {
                res.status(400).json({ result: "bad", message: "Incorrect password" });
            }
        });

    }
    else {
        res.json({ result: "bad", message: "Authentication failed" });
    }

});

router.post('/verifyToken', requireAuth, function (req, res) {
    res.status(200).json({ result: "ok", message: "Token valid" });
});

//reset user password
router.post('/resetPassword', function (req, res) {
    if (req.body.username && req.body.password) {
        update = { password: req.body.password };
        User.findOneAndUpdate({
            $or: [
                { username: req.body.username },
                { email: req.body.username }]
        }, update, err => {
            if (err)
                res.status(500).json({ result: "bad", message: "Critical error occured" });
            else
                res.status(200).json({ result: "ok", message: "Password changed successfully" });
        });
    }
});

//delete user Account
router.delete('/', requireAuth, function (req, res) {
    User.findByIdAndRemove(req.userId, (err, user) => {
        if (err)
            res.status(400).json({ result: "bad", message: "Critical error occured" });
        else
            res.status(200).json({ result: "ok", message: "Account deleted succesfully", user: user.username });
    });
});

module.exports = router;