const mongoose = require('mongoose');

// One row per Design Studio request. `accepted` flips to true when the visitor
// clicks "Order via WhatsApp" — those rows become real training data.
const designQuerySchema = new mongoose.Schema({
  category: { type: String, default: '' },
  concept:  { type: String, required: true, maxlength: 600 },
  prediction: {
    fit:     String,
    palette: String,
    fabric:  String,
    detail:  String,
  },
  // Optional admin-corrected labels (same shape). If present they win over `prediction`.
  corrected: {
    fit:     String,
    palette: String,
    fabric:  String,
    detail:  String,
  },
  accepted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('DesignQuery', designQuerySchema);