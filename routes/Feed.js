//Includes
const express = require('express');
const request = require('request');
const mongoose = require('mongoose');
const uuidv4 = require('uuid/v4');
const path = require('path');
const sharp = require('sharp');
mongoose.Promise = Promise;
var router = express.Router();

//Middleware
var requireAuth = require('../middlewares/RequireAuth');

//Models
var User = require('../models/UserModel');
var Post = require('../models/PostModel');
var Category = require('../models/CategoryModel');

//return user main feed
router.get('/', requireAuth, function (req, res) {
    User.findById(req.userId)
        .select('-username')
        .populate({
            path: 'follows',
            populate: {
                path: 'posts',
                select: { 'owner': 1, 'category': 1, 'fullImage': 1, 'likes': 1, 'dislikes': 1, 'createdAt': 1 },
                options: { limit: 20, sort: { 'createdAt': 'desc' } },
                populate: {
                    path: 'owner category',
                    select: { 'username': 1, 'name': 1 }
                }
            }
        })
        .exec((err, data) => {
            if (err) {
                res.status(500).json({ result: "bad", message: err.message });
            }
            else {
                var promises = [];
                data.follows.forEach(function (category, i) {

                    category.posts.forEach(function (post, i) {
                        promises.push(sharp(post.fullImage).toBuffer().then(imgData => {
                            post.image = imgData.toString('base64');
                        }));
                    });
                });


                Promise.all(promises).then(() => {
                    res.status(200).json({ result: "ok", message: "Returned posts", data: data });
                });
            }
        });
});

//return user liked images and user psots
router.get('/profile', requireAuth, function (req, res) {
    User.findById(req.userId)
        .then(user => {

            var liked = user.votes.filter(vote => { return vote.vote == 1; }).map(e => e.id);
            var postArray = [];

            Post.find({ '_id': { $in: liked } }).sort({ 'createdAt': 'desc' }).select('id smallImage').then(posts => {

                var promises = [];
                posts.forEach((post, i) => {
                    promises.push(sharp(post.smallImage).toBuffer().then(imgData => {
                        post.image = imgData.toString('base64');
                    }));
                });

                Promise.all(promises).then(() => {
                    res.status(200).json({ result: "ok", message: "Returned profile data", posts: posts });
                });
            });
            // .then(
            // Post.find({ 'owner': req.userId }).exec().then(posts => {
            //     postArray = posts;
            // }))
        });
});

//send new post
router.post('/', requireAuth, function (req, res) {
    User.findById(req.userId, (err, user) => {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message });
        }
        else {
            if (req.body.image && req.body.category) {

                //User id
                var userId = user._id;

                //Image path
                var imgBasePath = uuidv4();

                //Post Instance
                var postModel = {
                    owner: userId,
                    fullImage: path.join(uploads, imgBasePath + '.webp'),
                    smallImage: path.join(uploads, imgBasePath + '-t.webp'),
                    likes: 0,
                    dislikes: 0
                };

                Category.CreateIfNotExists(req.body.category, category => {

                    postModel.category = category._id;

                    Post.create(postModel, function (err, post) {

                        if (err) {
                            res.status(500).json({ result: "bad", message: err.message });
                        }
                        else {

                            var imgBuffer = new Buffer(req.body.image, 'base64');

                            var promises = [];
                            promises.push(
                                sharp(imgBuffer)
                                    .resize(256, 256)
                                    .webp({ quality: thumbnailQuality }).toFile(post.smallImage));


                            promises.push(
                                sharp(imgBuffer)
                                    .webp({ quality: imageQuality }).toFile(post.fullImage));

                            Promise.all(promises).then(() => {
                                category.imagecount++;
                                category.posts.push(post._id);
                                category.save();
                                res.status(200).json({ result: "ok", message: "Image uploaded succesfully" });
                            }).catch(function (err) {
                                res.status(400).json({ result: "bad", message: err.message });
                            });
                        }
                    });
                });
            }
            else {
                res.status(400).json({ result: "bad", message: "Invalid image data" });
            }
        }

    });
});

//return single post detail
router.get('/detail', requireAuth, function (req, res) {
    Post.findById(req.query.postId)
        .populate('owner', 'username')
        .populate('category', 'name')
        .exec((err, post) => {
            if (err) {
                res.status(400).json({ result: "bad", message: err.message })
            }
            else {
                sharp(post.fullImage).toBuffer().then(data => {
                    post.image = data.toString('base64');
                    res.status(200).json({ result: "ok", message: "Post returned", post: post })
                });
            }
        });
});

//get vote status
router.get('/vote', requireAuth, function (req, res) {
    User.findById(req.userId, (err, user) => {
        var vote = 0;

        for (var i = 0; i < user.votes.length; i++) {
            if (user.votes[i].id == req.query.postId) {
                vote = user.votes[i].vote;
                break;
            }
        }
        res.status(200).json({ result: "ok", message: "Vote returned", vote: vote })
    });
});

//send new vote
router.post('/vote', requireAuth, function (req, res) {
    User.findById(req.userId, (err, user) => {

        var vote = req.body.vote;
        if (vote >= 0)
            vote = 1;
        else
            vote = -1;


        //Find post index in user votes
        var index = -1;
        for (var i = 0; i < user.votes.length; i++) {
            if (user.votes[i].id == req.body.postId) {
                index = i;
                break;
            }
        }

        if (index == -1) {
            //If user didn't voted before

            var insertModel = {
                _id: new mongoose.Types.ObjectId(req.body.postId),
                vote: vote
            }
            user.votes.push(insertModel);
            user.save();

            Post.findById(req.body.postId, (err, post) => {
                if (vote == 1)
                    post.likes = post.likes + 1;
                else
                    post.dislikes = post.dislikes + 1;

                post.save();
                res.status(200).json({ result: "ok", message: "Voted post", likes: post.likes, dislikes: post.dislikes })
            });
        }
        else {
            //voted before
            prevVote = user.votes[index].vote;

            if (prevVote == vote) {
                res.status(200).json({ result: "ok", message: "Same vote" });
                return;
            }

            //update user vote
            user.votes[index].vote = vote;
            user.save();

            Post.findById(req.body.postId, (err, post) => {
                post.likes = post.likes + vote;
                post.dislikes = post.dislikes - vote;

                post.save();
                res.status(200).json({ result: "ok", message: "Voted post", likes: post.likes, dislikes: post.dislikes })
            });
        }



    });
});

module.exports = router;