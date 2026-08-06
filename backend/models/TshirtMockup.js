const mongoose = require('mongoose');

const tshirtMockupSchema = new mongoose.Schema({
  name:    { type: String, required: true },              // "White", "Navy" etc.
  hex:     { type: String, required: true },               // swatch colour
  image:   { type: String, required: true },               // flat garment photo
  isActive: { type: Boolean, default: true },
  order:    { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('TshirtMockup', tshirtMockupSchema);