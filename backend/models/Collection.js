const mongoose = require('mongoose');
const slugify  = require('slugify');

const collectionSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true }, // "T-Shirts", "Hoodies"
  slug:        { type: String, required: true, unique: true },
  description: { type: String },
  image:       { type: String },   // thumbnail shown in shop filter / admin
  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
}, { timestamps: true });

collectionSchema.pre('validate', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Collection', collectionSchema);