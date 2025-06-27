const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  isBestSeller: {
    type: Boolean,
    default: true
  },
  category: String,
  stock: Number,
  //image: String, //  store image filename or URL
   images: [String]  // <-- now an array of image URLs
}, {
  timestamps: true // Adds createdAt and updatedAt fields
   
});

module.exports = mongoose.model('Product', productSchema);
