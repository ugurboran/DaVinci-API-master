var mongoose = require('mongoose');
var mongooseHidden = require('mongoose-hidden')()
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
    name: { type: String, unique: true, lowercase: true },
    imagecount: { type: Number, default: 0, min: 0 },
    posts: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Post' }]
});

//CategorySchema.plugin(mongooseHidden);

CategorySchema.statics.CreateIfNotExists = function (categoryName, next) {
    Category.findOne({ name: categoryName.toLowerCase() }, function (err, category) {
        if (!err) {
            if (!category) {
                var categoryModel = {
                    name: categoryName.toLowerCase()
                };
                Category.create(categoryModel, function (err, category) {
                    return next(category);
                });
            }
            else {
                return next(category);
            }
        }
    });

}

const Category = mongoose.model('Category', CategorySchema);
module.exports = Category;