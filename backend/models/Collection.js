const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  slug:         { type: String, unique: true },
  description:  String,
  image:        String,
  imageAspectRatio: { type: String, enum: ['9:16', '16:9'], default: '16:9' }, // controls how the banner image is framed on the homepage
  icon:         String,
  products:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isActive:     { type: Boolean, default: true },
  isFeatured:   { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  seo: {
    metaTitle:       String,
    metaDescription: String,
    keywords:        [String],
    ogTitle:         String,
    ogDescription:   String,
    ogImage:         String,
    canonicalUrl:    String,
  },
}, { timestamps: true });

collectionSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

module.exports = mongoose.model('Collection', collectionSchema);