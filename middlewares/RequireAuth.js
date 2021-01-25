var config = require('../config/config');
var jwt = require('jsonwebtoken');

//Use this middleware when a method needs an authentication before execution.
module.exports = function (req, res, next) {
    const token = req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, config.secret, function (err, decoded) {
            if (err) {
                return res.json({ result: "bad", message: "Invalid token" });
            }
            else {
                req.token = token;
                req.userId = decoded.id;
                next();
            }
        });
    }
    else {
        return res.json({ result: "bad", message: "Failed to authenticate" });
    }
}
