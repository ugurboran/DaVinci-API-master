//Includes
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var path = require('path');
var config = require('./config/config');

//Variables
var port = process.env.PORT || 3000;
global.uploads = path.join(__dirname, "uploads")
global.thumbnailQuality = config.thumbnailQuality;
global.imageQuality = config.imageQuality;

var app = express();

//Initialize
mongoose.connect(config.remotemongoDB);
var mongoDB = mongoose.connection;

//Routes
var accountRoute = require('.//routes/Account');
var feedRoute = require('.//routes/Feed');
var categoryRoute = require('.//routes/Category');

//Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));

app.use('/api/account', accountRoute);
app.use('/api/feed', feedRoute);
app.use('/api/category', categoryRoute);

mongoDB.on('error', function (err, next) {
    console.log('Error occured while connecting to the database');
});

mongoDB.once('open', function () {
    console.log('Database connected');
    //Start the server
    app.listen(port, function () {
        console.log('Server started');
    });
});


module.exports = app;
