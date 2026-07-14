const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  slug:          { type: String, unique: true },
  excerpt:       { type: String, required: true },
  content:       { type: String, required: true },
  featuredImage: { type: String, required: true },
  category:      { type: String, enum: ['Fashion Tips','Care Guide','Trending','Lifestyle','Behind the Scenes'], default: 'Fashion Tips' },
  tags:          { type: [String], default: [] },
  author:        { type: String, default: 'SNERA Team' },
  views:         { type: Number, default: 0 },
  readTime:      { type: Number },
  isPublished:   { type: Boolean, default: false },
  publishedAt:   { type: Date },
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  seo: {
    metaTitle:       String,
    metaDescription: String,
    focusKeyword:    String,
    keywords:        [String],
    ogTitle:         String,
    ogDescription:   String,
    ogImage:         String,
    canonicalUrl:    String,
    noIndex:         { type: Boolean, default: false },
  },
}, { timestamps: true });

blogSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  if (this.isModified('content')) {
    const wordCount = this.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);