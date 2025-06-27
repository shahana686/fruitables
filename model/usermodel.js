// const mongoose=require('mongoose')
// const userSchema=new mongoose.Schema({
//   username: {
//         type: String,
//         required: false, // or `true` if you want it mandatory
//         unique: true, // optional: prevents duplicate usernames
//         trim: true
//     },

//     email:{
//         type:String,
//        // required:true,
//     },
//     password:{
//         type:String,
//         //required:true,
//     },
    
//     PhoneNo:{
//       type:String,
//       required:true,
//  },



//  billingAddress: {
//   firstName: String,
//   lastName: String,
//   address: String,
//   city: String,
//   country: String,
//   zip: String,
//   mobile: String,
//   email: String,
//   notes: String
// },

//  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]

    
// })


// module.exports = mongoose.model("User",userSchema)

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  address: String,
  city: String,
  country: String,
  zip: String,
  mobile: String,
  email: String,
  notes: String
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    unique: true,
  },
  email: String,
  password: String,
  PhoneNo: {
    type: String,
    required: true,
  },

  // Replaces single billingAddress with multiple addresses
  addresses: [addressSchema],

  // Selected address for checkout
  selectedAddress: {
    type: mongoose.Schema.Types.ObjectId,
  },
    blocked: {
    type: Boolean,
    default: false
  },
  appliedCoupon: {
  code: String,
  discount: Number,
},


  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
});

module.exports = mongoose.model("User", userSchema);
