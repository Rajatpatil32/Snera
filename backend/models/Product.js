const mongoose = require('mongoose');

// ─── Color Group sub-schema ───────────────────────────────────────────────────
// Each colour variant (e.g. "Black", "White", "Sage Green") has its own
// image set and optionally its own sold-out sizes.
const colorGroupSchema = new mongoose.Schema({
  name:      { type: String, required: true },   // "Black", "Sage Green" etc.
  hex:       { type: String, required: true },   // "#1C1B18" – used for the swatch dot
  images:    { type: [String], default: [] },    // Ordered image URLs for this colour
  soldSizes: { type: [String], default: [] },    // Sizes OOS for this colour specifically
  isDefault: { type: Boolean, default: false },  // Which colour loads first on listing
}, { _id: true });

// ─── Product schema ───────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  slug:         { type: String, required: true, unique: true },
  category:     { type: String, required: true, enum: ['Tops', 'Bottoms', 'Outerwear', 'Accessories'] },
  gender:       { type: String, enum: ['Men', 'Women', 'Unisex'], default: 'Unisex' },
  price:        { type: Number, required: true },
  comparePrice: { type: Number },

  description:      { type: String, required: true },
  fabric:           { type: String },
  careInstructions: { type: String },

  sizes:    { type: [String], default: ['XS','S','M','L','XL','XXL'] },
  // Global soldSizes kept for backwards compat; per-colour soldSizes live in colorGroups
  soldSizes: { type: [String], default: [] },

  // ── New: colour groups ────────────────────────────────────────────────────
  // Each entry = one colour with its own images.
  // Replaces the flat `images` array for new products.
  // Old flat images still supported for backwards compat.
  colorGroups: { type: [colorGroupSchema], default: [] },

  // Flat images fallback (used if no colorGroups set)
  images: { type: [String], default: [] },

  glyph:      { type: String, default: '◈' },
  badge:      { type: String, enum: ['New', 'Sale', ''], default: 'New' },
  isActive:   { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  tags:       { type: [String], default: [] },
  weight:     { type: Number, default: 200 },
}, { timestamps: true });

// ─── Auto slug ────────────────────────────────────────────────────────────────
productSchema.pre('save', async function (next) {
  if (this.isModified('name') && !this.slug) {
    const slugify = require('slugify');
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// ─── Virtual: primary image (first image of default colour) ──────────────────
productSchema.virtual('primaryImage').get(function () {
  if (this.colorGroups?.length) {
    const def = this.colorGroups.find(c => c.isDefault) || this.colorGroups[0];
    return def?.images?.[0] || null;
  }
  return this.images?.[0] || null;
});

module.exports = mongoose.model('Product', productSchema);