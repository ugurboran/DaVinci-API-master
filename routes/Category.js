//Includes
const express = require('express');
const request = require('request');
const sharp = require('sharp');

var router = express.Router();

//Middleware
var requireAuth = require('../middlewares/RequireAuth');

//Models
var User = require('../models/UserModel');
var Post = require('../models/PostModel');
var Category = require('../models/CategoryModel');

//return category posts with small image
router.get('/', requireAuth, function (req, res) {
    Category.findById(req.query.categoryId).populate({
        path: 'posts',
        select: { 'smallImage': 1 },
        options: {
            sort: { 'createdAt': 'desc' }
        }
    }).exec(function (err, category) {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message })
        }
        else if (category) {

            var promises = [];
            category.posts.forEach(function (post, i) {
                promises.push(sharp(post.smallImage).toBuffer().then(data => {
                    post.image = data.toString('base64');
                }));
            });

            Promise.all(promises).then(() => {
                res.status(200).json({ result: "ok", message: "ok", category: category });
            });
        }
        else {
            res.status(500).json({ result: "bad", message: "Category not found" });
        }
    });
});

//get current follow status
router.get('/follow', requireAuth, function (req, res) {
    User.findById(req.userId, (err, user) => {
        if (err) {
            res.status(400).json({ result: "bad", message: err.message });
        }
        else {
            var index = user.follows.indexOf(req.query.categoryId);

            if (index > -1)
                res.status(200).json({ result: "ok", message: "Follow status returned", follow: 1 });
            else
                res.status(200).json({ result: "ok", message: "Follow status returned", follow: 0 });
        }
    });
});

//(un)follow category
router.post('/follow', requireAuth, function (req, res) {
    User.findById(req.userId, (err, user) => {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message });
        }
        else {
            if (req.body.categoryId) {
                Category.findById(req.body.categoryId, (err, category) => {
                    if (err) {
                        res.status(400).json({ result: "bad", message: "Category not found" });
                    }
                    else {
                        index = user.follows.indexOf(category.id);

                        //If user already follows then unfollow category
                        if (index > -1) {
                            user.follows.pull(category.id);
                            user.save();
                            res.status(200).json({ result: "ok", message: "Category unfollowed" });
                        }
                        else {
                            user.follows.push(category._id);
                            user.save();
                            res.status(200).json({ result: "ok", message: "Category followed" });
                        }
                    }
                });
            }
        }
    });
});

//return popular categories with 4 most liked images
router.get('/popular', requireAuth, function (req, res) {
    //Find categories with most images
    //Find images with most likes from these categories
    Category.find().sort({ imagecount: 'desc' }).limit(10).populate({
        path: 'posts',
        select: { 'smallImage': 1, 'likes': 1 },
        options: { limit: 8 }
    }).sort({ likes: 'desc' }).exec((err, categories) => {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message })
        }
        else {
            var promises = [];

            categories.forEach(function (entry, i) {
                var posts = entry["posts"];
                posts.forEach(function (post, i) {
                    promises.push(sharp(post.smallImage).toBuffer().then(data => {
                        post.image = data.toString('base64');
                    }));
                });
            });

            Promise.all(promises).then(() => {
                res.status(200).json({ result: "ok", message: "ok", categories: categories });
            });
        }
    });
});

//autocomplete for category search
router.get('/autocomplete', requireAuth, function (req, res) {
    Category.find({ name: new RegExp('^' + req.query.search, 'g') }).select('name').limit(8).exec((err, result) => {
        if (err)
            res.status(500).json({ result: "bad", message: err.message });
        else
            res.status(200).json({ result: "ok", message: "ok", results: result });
    });
});

//return matching categories
router.get('/search', requireAuth, function (req, res) {
    Category.find({ name: new RegExp('^' + req.query.category, 'g') }).limit(5).select('name imagecount').populate({
        path: 'posts',
        select: { 'smallImage': 1 },
        options: {
            limit: 4,
            sort: { 'createdAt': 'desc' }
        }
    }).exec(function (err, categories) {
        if (err) {
            res.status(500).json({ result: "bad", message: err.message })
        }
        else {

            var promises = [];
            categories.forEach(function (entry, i) {
                var posts = entry["posts"];
                posts.forEach(function (post, i) {
                    promises.push(sharp(post.smallImage).toBuffer().then(data => {
                        post.image = data.toString('base64');
                    }));
                });
            });

            Promise.all(promises).then(() => {
                res.status(200).json({ result: "ok", message: "ok", categories: categories });
            });
        }
    });
});

module.exports = router;