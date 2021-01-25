var config = require('./config/config');
var jwt = require('jsonwebtoken');

module.exports = function(payload)
{
    return jwt.sign(payload, config.secret, { expiresIn: config.tokenExpireTime });
}