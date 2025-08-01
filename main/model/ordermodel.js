// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   products: [
//     {
//       product: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Product'
//       },
//       quantity: Number
//     }
//   ],
//   totalPrice: {
//     type: Number,
//     required: true
//   },
  
//   status: {
//     type: String,
//     enum: ['Pending', 'Shipped', 'Delivered', 'Delayed'], 
//    // default: 'Pending' // e.g., Pending, Shipped, Delivered
//   },
//   priceBreakdown: {
//   subtotal: Number,
//   shipping: Number,
//   total: Number
// },

//    checkoutDetails: {
//     firstName: String,
//     lastName: String,
//     address: String,
//     city: String,
//     country: String,
//     zip: String,
//     mobile: String,
//     email: String,
//     notes: String
//   },
//   paymentMethod: {
//     type: String,
//     enum: ['COD', 'Stripe'],
//     required: true
//   },

//   paymentStatus: {
//     type: String,
//     enum: ['Pending', 'Paid', 'Failed'],
//     // default: 'Pending'
//   },
//   returnRequested: {
//   type: Boolean,
//   default: false
// },
// replacementRequested: {
//   type: Boolean,
//   default: false
// },
// returnStatus: {
//   type: String,
//  // enum: ['None', 'Requested', 'Approved', 'Rejected'],
//   default: 'None'
// },
// returnReply: {
//   type: String,
//   default: ''
// },

// replacementStatus: {
//   type: String,
//   enum: ['None', 'Requested', 'Approved', 'Rejected','pending'],
//   default: 'None'
// },
// returnReason: {
//   type: String,
//   default: ''
// },


// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('Order', orderSchema);//6
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      quantity: Number,

      // ✅ Per-product return fields
      returnStatus: {
        type: String,
        enum: ['None', 'Requested', 'Approved', 'Rejected'],
        default: 'None'
      },
      returnReason: {
        type: String,
        default: ''
      },
      returnReply: {
        type: String,
        default: ''
      },

      // Optional: you can do same for replacements if needed
      replacementStatus: {
        type: String,
        enum: ['None', 'Requested', 'Approved', 'Rejected', 'pending'],
        default: 'None'
      }
    }
  ],
  totalPrice: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['Pending', 'Shipped', 'Delivered', 'Delayed']
  },
 //1
   deliveredAt: {   
    type: Date
  },

  priceBreakdown: {
    subtotal: Number,
    shipping: Number,
    total: Number
  },

  checkoutDetails: {
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    country: String,
    zip: String,
    mobile: String,
    email: String,
    notes: String
  },

  paymentMethod: {
    type: String,
    enum: ['COD', 'Stripe'],
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed']
  },



}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);

