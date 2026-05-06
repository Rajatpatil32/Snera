const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  slug:        { type: String, required: true, unique: true },
  category:    { type: String, required: true, enum: ['Tops', 'Bottoms', 'Outerwear', 'Accessories'] },
  gender:      { type: String, enum: ['Men', 'Women', 'Unisex'], default: 'Unisex' },
  price:       { type: Number, required: true },
  comparePrice:{ type: Number },                        // Original price if on sale
  description: { type: String, required: true },
  fabric:      { type: String },
  sizes:       { type: [String], default: ['XS','S','M','L','XL','XXL'] },
  soldSizes:   { type: [String], default: [] },         // Sizes out of stock
  images:      { type: [String], default: [] },         // Image URLs/paths
  glyph:       { type: String, default: '◈' },          // Decorative fallback char
  badge:       { type: String, enum: ['New', 'Sale', ''], default: 'New' },
  isActive:    { type: Boolean, default: true },
  isFeatured:  { type: Boolean, default: false },
  tags:        { type: [String], default: [] },
  weight:      { type: Number, default: 200 },          // GSM or grams
  careInstructions: { type: String }
}, { timestamps: true });

// Auto-generate slug before save
productSchema.pre('save', async function(next) {
  if (this.isModified('name') && !this.slug) {
    const slugify = require('slugify');
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  return this.images.length > 0 ? this.images[0] : null;
});

module.exports = mongoose.model('Product', productSchema);
