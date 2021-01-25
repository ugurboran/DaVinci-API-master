//Includes
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var config = require('./config/config');

//Variables
var port = process.env.PORT || 3000;

var app = express();

mongoose.connect(config.mongoDB);
var mongoDB = mongoose.connection;

//Routes
var accountRoute = require('.//routes/Account');
var feedRoute = require('.//routes/Feed');

//Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));

app.use('/api/account', accountRoute);
app.use('/api/feed', feedRoute);
/*
app.use('/api', accountRoute);
app.use('/api', accountRoute);
*/

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
