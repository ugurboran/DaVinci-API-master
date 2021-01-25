const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    data: { type: Buffer },
    category: { type: String, lowercase: true },
    likes: { type: Number, default: 0, min: 0 },
    dislikes: { type: Number, default: 0, min: 0 }
}, { timestamps: true })

const Image = mongoose.model('Image', ImageSchema);
module.exports = Image;