const mongoose = require('mongoose');
var mongooseHidden = require('mongoose-hidden')({ defaultHidden: { } })

const Schema = mongoose.Schema;

const PostSchema = new Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    fullImage: { type: String, hideJSON: true, unique: true },
    smallImage: { type: String, hideJSON: true, unique: true },
    image: { type: String },
    likes: { type: Number, default: 0, min: 0 },
    dislikes: { type: Number, default: 0, min: 0 },
    privacy: { type: Number, hideJSON: true, default: 0, min: 0, max: 1 }
}, { timestamps: true })

PostSchema.plugin(mongooseHidden);

const Post = mongoose.model('Post', PostSchema);
module.exports = Post;