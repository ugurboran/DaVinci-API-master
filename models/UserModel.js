const mongoose = require('mongoose');
var mongooseHidden = require('mongoose-hidden')({ hidden: { _id: false } })
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        select:false
    },
    password: {
        type: String,
        required: true,
        hideJSON:true
    },
    follows: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Category' }],
    votes: [{ _id:{type: mongoose.SchemaTypes.ObjectId, ref: 'Post'},vote:{type:Number}}]

}, { timestamps: true })

UserSchema.plugin(mongooseHidden);

const User = mongoose.model('User', UserSchema);
module.exports = User;