const userSchema = require("../model/usermodel");
const Otp = require('../model/otpmodel');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Product=require('../model/productmodel')
const Cart = require('../model/cartmodel');
const Order = require('../model/ordermodel');
 const client = require("../utils/twilio");
 const PDFDocument = require('pdfkit');
 const path = require('path');
const fs = require('fs');
const Stripe = require('stripe');
const mongoose = require("mongoose"); // Add at top
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
//const stripe = Stripe('{{stripePublicKey}}'); //4
const Coupon = require('../model/coupon');
const Review=require('../model/review')
const saltrounds = 10;

const signupuser = async (req, res) => {
  try {
    
    const { email, PhoneNo, password, confirm } = req.body;
    const user = await userSchema.findOne({ email });
    if (user) {
      return res.render("user/signup", { message: "user already exits" });
    }

    if (password !== confirm) {
      return res.render("user/signup", { message: "password do not match" });
    }
    const hashedpassword = await bcrypt.hash(password, saltrounds);
    const newuser = new userSchema({
      email,
      PhoneNo,
      password: hashedpassword,
    });

    await newuser.save();
    //  console.log('✅ New User Saved:', newuser);
    res.render("user/signup", { success: " Signin Successfully" });
  } catch (error) {
    console.log(error);
    res.render("user/signup", { message: "wrong" });
  }
};
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userSchema.findOne({ email });
    if (!user) {
      return res.render("user/login", { message: "user does not exit" });
    }
    
    // ✅ Check if the user is blocked
    if (user.blocked) {
      return res.render("user/login", { message: "Your account has been blocked" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("user/login", { message: "incorrect password" });
    }
    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });


    // Set cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    //res.render('user/index')
    res.redirect("/user/index");
  } catch (error) {
    console.log(error);
  }
};
const loadSignup = (req, res) => {
  res.render("user/signup");
};

const loadLogin = (req, res) => {
  res.render("user/login");
};


const loaduserindex = async (req, res) => {
  try {
    const user = req.user; // JWT user from middleware
    
    // Fetch products
    const products = await Product.find({});
    const bestSellers = await Product.find({ isBestSeller: true });
    const vegetableProducts = await Product.find({ category: "vegetable" });
    

    // Get user's wishlist IDs as strings, handle if user or wishlist is missing
    const wishlistIds = user?.wishlist ? user.wishlist.map(id => id.toString()) : [];
      


    // Add inWishlist flag to all products arrays
    const addWishlistFlag = (items) => {
      return items.map(item => ({
        ...item.toObject(),
        inWishlist: wishlistIds.includes(item._id.toString())
      }));
    };

    // Add flag for each list
    const productsWithWishlistFlag = addWishlistFlag(products);
    const bestSellersWithWishlistFlag = addWishlistFlag(bestSellers);
    const vegetableProductsWithWishlistFlag = addWishlistFlag(vegetableProducts);

    res.render("user/index", { 
      user, 
      products: productsWithWishlistFlag, 
      bestSellers: bestSellersWithWishlistFlag,
      vegetableProducts: vegetableProductsWithWishlistFlag,
       
    });
  } catch (error) {
    console.log("Error in loaduserindex:", error);
  }
 };

const viewcart = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await userSchema.findById(userId);
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    let subtotal = 0;
    let reversedItems = [];

    if (cart && Array.isArray(cart.items) && cart.items.length > 0) {
      reversedItems = cart.items.slice().reverse();
      subtotal = reversedItems.reduce((acc, item) => {
        return acc + item.productId.price * item.quantity;
      }, 0);
    }

    const shipping = 3;
    const discount = user.appliedCoupon?.discount || 0;
    const couponCode = user.appliedCoupon?.code || null;
    const couponMessage = user.appliedCoupon?.message || null;

    const total = subtotal + shipping - discount;

    

    res.render('user/cart', {
      items: reversedItems,
      subtotal,
      shipping,
      discount,
      total,
      couponCode,
      couponMessage
    });
  } catch (error) {
    console.error("Error loading cart:", error.message);
    res.redirect('/user/404');
  }
};


// const viewcart = async (req, res) => {
//   const userId = req.user._id;

//   try {
//     const user = await userSchema.findById(userId);
//     const cart = await Cart.findOne({ userId }).populate('items.productId');

//     let subtotal = 0;
//     let reversedItems = [];

//     if (cart) {
//       reversedItems = cart.items.slice().reverse();
//       subtotal = reversedItems.reduce((acc, item) => {
//         return acc + item.productId.price * item.quantity;
//       }, 0);
//     }

//     const shipping = 3; // flat rate
//     const discount = user.appliedCoupon?.discount || 0;
//     const total = subtotal + shipping - discount;

//     res.render('user/cart', {
//       items: reversedItems,
//       subtotal,
//       shipping,
//       discount,
//       total
//     });
//   } catch (error) {
//     console.error("Error loading cart:", error.message);
//     res.redirect('/user/404');
//   }
// };


// const viewcart = async (req, res) => {
//   const userId = req.user._id;

//   try {
//     const cart = await Cart.findOne({ userId }).populate('items.productId');

//      let subtotal = 0;
//     let reversedItems = [];

//     if (cart) {
//       // Reverse the cart items (newest first)
//       reversedItems = cart.items.slice().reverse();

//       subtotal = reversedItems.reduce((acc, item) => {
//         return acc + item.productId.price * item.quantity;
//       }, 0);
//     }
    
  
//     const shipping = 3; // flat rate
//     const total = subtotal + shipping;

//     res.render('user/cart', {
//      items: reversedItems, // ✅ pass reversed items instead of entire cart
//       subtotal,
//       shipping,
//       total
//     });
//   } catch (error) {
//     console.error("Error loading cart:", error.message);
//     res.redirect('/user/404');
//   }
// };





const addToCart = async (req, res) => {
  const userId    = req.user._id;
  const productId = req.params.id;

  try {
    //console.log(`Add to cart request - User: ${userId}, Product: ${productId}`);

    let cart = await Cart.findOne({ userId });
    if (!cart) {
    //  console.log("🆕 No cart found, creating new cart...");
      cart = new Cart({ userId, items: [] });
    }

    const idx = cart.items.findIndex(i => i.productId.toString() === productId);//const=item index

        let message = '';
    if (idx > -1) {
      message = '⚠️ Item already in cart.';
    } else {
      cart.items.push({ productId, quantity: 1 });
      message = 'Item added to cart.';
      await cart.save();
    }

    await cart.save();
    console.log(" Cart saved successfully:", cart);

    // ✅ Return updated cart count
    return res.json({ success: true,message, cartCount: cart.items.length });

  }
  catch (err) {
    console.error('Add to cart error:', err.message);

    if (req.xhr) {
      return res.status(500).json({ success: false , message: 'Server error'});
    }

    res.redirect('/index');
  }
};

const increaseQuantity = async (req, res) => {
  const userId = req.user._id;
  const productId = req.params.id;

  try {
    const cart = await Cart.findOne({ userId });

    const item = cart.items.find(item => item.productId.toString() === productId);
    if (item) {
      item.quantity += 1;
      await cart.save();
    }
    


    res.redirect('/user/cart');
  } catch (err) {
    console.error('Increase quantity error:', err);
    res.redirect('/user/cart');
  }
};

const decreaseQuantity = async (req, res) => {
  const userId = req.user._id;
  const productId = req.params.id;

  try {
    const cart = await Cart.findOne({ userId });

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      if (cart.items[itemIndex].quantity > 1) {
        cart.items[itemIndex].quantity -= 1;
      } else {
        cart.items.splice(itemIndex, 1); // remove if quantity is 1
      }
      await cart.save();
    }

    

    res.redirect('/user/cart');
  } catch (err) {
    console.error('Decrease quantity error:', err);
    res.redirect('/user/cart');
  }
};



const removeFromCart = async (req, res) => {
  const userId = req.user._id;
  const productId = req.params.id;

  try {
    let cart = await Cart.findOne({ userId });

    if (cart) {
      cart.items = cart.items.filter(item => item.productId.toString() !== productId);
      await cart.save();
      console.log(` Removed product ${productId} from cart`);
    }

    res.redirect('/user/cart');
  } catch (err) {
    console.error(' Error removing from cart:', err);
    res.redirect('/user/cart');
  }
};


// Add to Wishlist (JWT)


const addToWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.id;

    const user = await userSchema.findById(userId);

    // Check if product already in wishlist
    const alreadyExists = user.wishlist.includes(productId);
    if (alreadyExists) {
      return res.json({ success: false, message: 'Item already in wishlist' });
    }

    // Add to wishlist
    user.wishlist.push(productId);
    await user.save();

    // 🧠 Count only valid (non-deleted) products
    let validCount = 0;
    for (let id of user.wishlist) {
      if (await Product.exists({ _id: id })) {
        validCount++;
      }
    }

    res.json({ success: true, message: 'Added to wishlist', wishlistCount: validCount });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



// const addToWishlist = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const productId = req.params.id;

//     const user = await userSchema.findById(userId);

//     // Check if product already in wishlist
//     const alreadyExists = user.wishlist.includes(productId);
//     if (alreadyExists) {
//       return res.json({ success: false, message: 'Item already in wishlist' });
//     }

//     // Add to wishlist
//     user.wishlist.push(productId);
//     await user.save();

//     res.json({ success: true, message: 'Added to wishlist' ,   wishlistCount: user.wishlist.length })
//   } catch (err) {
//     console.error('Error adding to wishlist:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };


// Get Wishlist (JWT)
const getWishlist = async (req, res) => {
  try {
    const user = await userSchema.findById(req.user._id).populate('wishlist');

    res.render('user/wishlist', { wishlist: user.wishlist });
  } catch (err) {
    console.error(err);
    res.redirect('/user/index');
  }
};  



const removeFromWishlist = async (req, res) => {
  try {
    const user = await userSchema.findById(req.user._id);
    const productId = req.params.id;

    // Remove the item
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();

        // ✅ Count only existing products
    let validCount = 0;
    for (let id of user.wishlist) {
      if (await Product.exists({ _id: id })) {
        validCount++;
      }
    }


    res.json({ success: true ,wishlistCount:validCount});
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Failed to remove product' , });
  }
};

//without reload cart

const cartSummary = async (req, res) => {
  const userId = req.user._id;

  try {
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    let subtotal = 0;
    if (cart) {
      subtotal = cart.items.reduce((acc, item) => {
        return acc + item.productId.price * item.quantity;
      }, 0);
    }

    const shipping = 3;
    const total = subtotal + shipping;

    res.json({ subtotal, total });
  } catch (err) {
    console.error('Error in cartSummary:', err.message);
    res.status(500).json({ error: 'Failed to load cart summary' });
  }
};




//checkout

const checkoutPage = async (req, res) => {
  const userId = req.user._id;

  try {
     const user = await userSchema.findById(userId); //1
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.redirect('/user/cart'); // Redirect if cart is empty
    }

    let subtotal = 0;
    cart.items.forEach(item => {
      subtotal += item.quantity * item.productId.price;
    });


    const shippingOptions = {
      free: 0,
      flat: 3,
      pickup: 8
    };
   const discount = user.appliedCoupon?.discount || 0;   //1
    const defaultShipping = shippingOptions.flat; // You can update this dynamically via query or POST later
    const total = subtotal + defaultShipping-discount; //2

        const selectedAddress = user.addresses.find(
      addr => addr._id.toString() === user.selectedAddress?.toString()
    );

    res.render('user/checkout', {
      cart,
      subtotal,
      shippingOptions,
      selectedShipping: defaultShipping,
      total,
     selectedAddress
   // savedAddress: user.addresses || [] // 🔧 FIXED // show saved address  //2
    });

  } catch (err) {
    console.error('❌ Error loading checkout:', err.message);
    res.redirect('/user/cart');
  }
};

const saveAddressAndRenderCheckout = async (req, res) => {
  try {
    const { firstName, lastName, address, city, country, zip, mobile, email } = req.body;

    if (!firstName || !lastName || !address || !city || !country || !zip || !mobile || !email) {
      return res.status(400).send("All required fields must be filled.");
    }

    const user = await userSchema.findById(req.user._id);

    const newAddress = {
      firstName, lastName, address, city, country, zip, mobile, email
    };

    user.addresses.push(newAddress);

    // Get the _id of the newly added address
    const addedAddress = user.addresses[user.addresses.length - 1];

    user.selectedAddress = addedAddress._id;

    await user.save();

    res.redirect('/user/checkout');
  } catch (err) {
    console.log(err);
    res.status(500).send("Error saving address");
  }
};

//forchange button in checkout

const getSelectAddressPage = async (req, res) => {
  try{
     const userId = req.user._id; // From JWT
    //  const user = await userSchema.findById(userId).populate('addresses'); // Assuming addresses stored in a subcollection or array
    const user = await userSchema.findById(userId); // ❌ no populate

    res.render('user/selectAddress', { addresses: user.addresses });
   } catch (err) {
    console.error('Error loading address selection page:', err);
    res.redirect('/user/checkout');

  }
};

const postSelectedAddress = async (req, res) => {
   try{
    const userId = req.user._id;
    const { addressId } = req.body;

    
    console.log("📥 Submitted addressId:", addressId); // <-- Add this
    console.log("👤 Current user ID:", userId);        // <-- Add this



    await userSchema.findByIdAndUpdate(userId, { selectedAddress: addressId });

    res.redirect('/user/checkout'); // Where checkout page shows selected address

      } catch (err) {
    console.error('Error saving selected address:', err.message);
   res.status(500).redirect('/user/checkout');
  }
};

 const renderEditAddressForm = async (req, res) => {
  try {
    const addressId = req.params.id;
    const user = await userSchema.findById(req.user._id);

    const address = user.addresses.id(addressId); // find by MongoDB subdoc ID
    if (!address) return res.status(404).send('Address not found');

    res.render('user/editAddress', { address }); // You will create editAddress.hbs
  } catch (err) {
    console.log(err);
    res.status(500).send("Error loading address edit page");
  }
};


const updateAddress = async (req, res) => {
  try {
    const { firstName, lastName, address, city, country, zip, mobile, email, notes } = req.body;
    const addressId = req.params.id;

    const user = await userSchema.findById(req.user._id);
    const addressToUpdate = user.addresses.id(addressId);

    if (!addressToUpdate) return res.status(404).send('Address not found');

    // Update fields
    addressToUpdate.firstName = firstName;
    addressToUpdate.lastName = lastName;
    addressToUpdate.address = address;
    addressToUpdate.city = city;
    addressToUpdate.country = country;
    addressToUpdate.zip = zip;
    addressToUpdate.mobile = mobile;
    addressToUpdate.email = email;
    addressToUpdate.notes = notes;

    await user.save();
 
   // res.redirect('/user/select-address'); //
   res.redirect('/user/select-address?updated=1'); // ✅ add query param

  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating address");
  }
};

const renderAddAddressForm = (req, res) => {
  res.render('user/addAddress');
};

const addAddress = async (req, res) => {
  try {
    const {
      firstName, lastName, address, city, country,
      zip, mobile, email, notes
    } = req.body;

    const user = await userSchema.findById(req.user._id);

    user.addresses.push({
      firstName, lastName, address, city, country,
      zip, mobile, email, notes
    });

    await user.save();

    // ✅ Redirect back to select-address page
    res.redirect('/user/select-address?added=1');
  } catch (error) {
    console.log("Error adding address:", error);
    res.status(500).send("Server error while adding address.");
  }
};


//payment

const paymentPage = async (req, res) => {
  const userId = req.user._id;
const stripePublicKey = process.env.STRIPE_PUBLISHABLE_KEY; //1
  try {
    const user = await userSchema.findById(userId);
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    

    if (!cart) return res.redirect('/user/cart');

    let subtotal = 0;
    cart.items.forEach(item => {
      subtotal += item.quantity * item.productId.price;
    });
    
    const discount = user.appliedCoupon?.discount || 0; 
    const shipping = 3; // or dynamic
    const total = subtotal + shipping-discount;

    const selectedAddress = user.addresses.find(
      addr => addr._id.toString() === user.selectedAddress?.toString()
    );
   
    const stripeProducts = cart.items.map(item => ({
  name: item.productId.name,
  price: item.productId.price,
  quantity: item.quantity,
}));                                                 //2

    res.render('user/payment', {
      cart,
      subtotal,
      shipping,
      total,
      selectedAddress,
       stripePublicKey,
       stripeProducts: JSON.stringify(stripeProducts),   //3
    });
  } catch (err) {
    console.error("Payment page error:", err);
    res.redirect('/user/checkout');
  }
};

//online payement
//new that display coupon value

const createStripeCheckoutSession = async (req, res) => {
  try {
    const user = req.user;
    const { products } = req.body;

    const shippingFee = 3;

    // Calculate subtotal
    let subtotal = 0;
    products.forEach(p => {
      subtotal += p.price * p.quantity;
    });

    // Get coupon discount if available
    const discount = user.appliedCoupon?.discount || 0;

    // Calculate final total
    const grandTotal = subtotal + shippingFee - discount;

    // Split prices proportionally to apply discount to products
    const discountPerProduct = discount / products.length;

    const line_items = products.map((p) => {
      const discountedPrice = Math.round((p.price - discountPerProduct) * 100); // paise
      return {
        price_data: {
          currency: 'inr',
          product_data: { name: p.name },
          unit_amount: discountedPrice > 0 ? discountedPrice : 0, // prevent negative
        },
        quantity: p.quantity,
      };
    });

    line_items.push({
      price_data: {
        currency: 'inr',
        product_data: { name: 'Shipping Fee' },
        unit_amount: shippingFee * 100,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_email: user.email,
      success_url: `${req.protocol}://${req.get('host')}/user/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/user/payment-cancel`,
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Could not create Stripe session" });
  }
};

//old that not shown coupon value

// const createStripeCheckoutSession = async (req, res) => {
//   try {
//     const user = req.user; // from JWT cookie
//     const { products } = req.body;

//     const shippingFee = 3; // ₹3 shipping
//     const shippingLineItem = {
//       price_data: {
//         currency: 'inr',
//         product_data: { name: 'Shipping Fee' },
//         unit_amount: shippingFee * 100, // ₹ to paise
//       },
//       quantity: 1,
//     };

//     // Convert product list to Stripe line_items
//     const line_items = products.map((p) => ({
//       price_data: {
//         currency: 'inr',
//         product_data: { name: p.name },
//         unit_amount: p.price * 100, // ₹ to paise
//       },
//       quantity: p.quantity,
//     }));

//     // Add shipping as a line item
//     line_items.push(shippingLineItem);

   
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items,
//       mode: 'payment',
//       customer_email: user.email,
//       success_url: `${req.protocol}://${req.get('host')}/user/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${req.protocol}://${req.get('host')}/user/payment-cancel`,
//     });

//     res.json({ id: session.id });
//   } catch (err) {
//     console.error("Stripe error:", err);
//     res.status(500).json({ error: "Could not create Stripe session" });
//   }
// };


const stripePaymentSuccess = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    const userId = req.user._id;

    // Get user & cart
    const user = await userSchema.findById(userId);
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart) return res.redirect('/user/cart');

    // Get selected address
    const selectedAddress = user.addresses.find(
      addr => addr._id.toString() === user.selectedAddress?.toString()
    );

    let total = 0;
    cart.items.forEach(item => {
      total += item.productId.price * item.quantity;
    });
    const discount = user.appliedCoupon?.discount || 0;
    const shipping = 3;
    const grandTotal = total + shipping - discount;

    // Create order
   const newOrder = new Order({
  user: userId,
  products: cart.items.map(item => ({
    product: item.productId._id,
    quantity: item.quantity
  })),
  totalPrice: grandTotal,
  priceBreakdown: {
    subtotal: total,
    shipping,
    total: grandTotal
  },
  checkoutDetails: {
    firstName: selectedAddress.firstName,
    lastName: selectedAddress.lastName,
    address: selectedAddress.address,
    city: selectedAddress.city,
    country: selectedAddress.country,
    zip: selectedAddress.zip,
    mobile: selectedAddress.mobile,
    email: user.email, // or selectedAddress.email
    notes: selectedAddress.notes || ""
  },
  paymentMethod: 'Stripe',
  paymentStatus: 'Paid'
});


    await newOrder.save();

    // Clear cart
    await Cart.findOneAndDelete({ userId });

    res.render('user/order-success', { session });
  } catch (error) {
    console.error("Payment success fetch error:", error);
    res.redirect('/user/payment-cancel');
  }
};


const paymentcancel= (req, res) =>{ res.render('payment-cancel')}

//success page
const orderSuccess = (req, res) => {
  res.render("user/order-success");
};


//placeorder

const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user and cart
    const user = await userSchema.findById(userId);
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).send("Cart is empty");
    }

    // ✅ Get selected address
    const selectedAddress = user.addresses.id(user.selectedAddress);
    if (!selectedAddress) {
      return res.status(400).send("No address selected.");
    }

    // ✅ Calculate subtotal
    let subtotal = 0;
    const products = cart.items.map(item => {
      subtotal += item.productId.price * item.quantity;
      return {
        product: item.productId._id,
        quantity: item.quantity
      };
    });

    // ✅ Define shipping and total
    const discount = user.appliedCoupon?.discount || 0;
    const shipping = 3; // or get from user selection or default
    const total = subtotal + shipping-discount;

    // ✅ Create order
    const order = new Order({
      user: userId,
      products,
      totalPrice: total, // total with shipping
      checkoutDetails: selectedAddress.toObject(),
      priceBreakdown: {
        subtotal,
        shipping,
        total,
      },
      paymentMethod: 'COD',        
      paymentStatus: 'Pending'
    });
  console.log("DEBUG - Order being saved:", order); // ✅ Debug
    await order.save();

    // ✅ Clear cart
    await Cart.findOneAndDelete({ userId });

    res.redirect("/user/order-success");
  } catch (error) {
    console.error("❌ Order creation failed:", error);
    res.status(500).send("Something went wrong");
  }
};


const searchProducts = async (req, res) => {
  try {
    const query = req.query.query?.trim(); // Trim to handle whitespace

    if (!query) {
      // Redirect to index if search input is empty
      return res.redirect('/user/index');
    }

    // Search by name or category
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } }
      ]
    });

    res.render('user/searchresults', {
      products,
      search: query,
      noResults: products.length === 0
    });
  } catch (err) {
    console.error('Search Error:', err);
    res.status(500).send('Internal Server Error');
  }
};



//orderhistory

const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ user: userId })
      .populate('products.product')
      .sort({ createdAt: -1 }); // latest first
          const returnQuery = req.query.return;

    res.render('user/orderHistory', { orders ,  returnQuery});
  } catch (error) {
    console.error("❌ Error fetching order history:", error);
    res.status(500).send("Something went wrong");
  }
};
//order detail page
const orderProductDetail = async (req, res) => {
  const { orderId, productId } = req.params;
  const userId = req.user.id;

  try {
    const order = await Order.findOne({ _id: orderId, user: userId }).populate('products.product');

    if (!order) {
      return res.status(404).send("Order not found.");
    }

    const productDetail = order.products.find(p => p.product._id.toString() === productId);

    if (!productDetail) {
      return res.status(404).send("Product not found in this order.");
    }

    // 🧮 Calculate subtotal
    const subtotal = order.products.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    const shipping = 3; // Flat rate (you can fetch from DB if stored)
    const total = subtotal + shipping;

    //3

   let canReturn = false;
if (order.status === "Delivered" && order.deliveredAt) {
  const now = new Date();
  const deliveredDate = new Date(order.deliveredAt);
  const diffInMs = now - deliveredDate;
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  canReturn = diffInDays <= 7; // ✅ only allow return within 7 days
}


    res.render('user/orderProductDetail', {
      product: productDetail.product,
      quantity: productDetail.quantity,
      shippingDetails: order.checkoutDetails,
      orderId,
      subtotal,
      shipping,
      total,
        status: order.status,
          // ✅ Pass per-product return status
  returnStatus: productDetail.returnStatus,
  returnReply: productDetail.returnReply,
  returnReason: productDetail.returnReason,
  canReturn//4
  // returnRequested: order.returnRequested,//7
  // replacementRequested: order.replacementRequested,
    });
  } catch (err) {
    console.error("❌ Product detail error:", err);
    res.status(500).send("Server error");
  }
};


// Handle return request for a specific product in an order//5
const returnProduct = async (req, res) => {
  const { orderId, productId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  try {
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).send("Order not found.");
    }

    const productItem = order.products.find(p => p.product.toString() === productId);

    if (!productItem) {
      return res.status(404).send("Product not found in order.");
    }

    if (productItem.returnStatus !== "None") {
      return res.status(400).send("Return already requested.");
    }

    // ✅ Update product-level return info
    productItem.returnStatus = "Requested";
    productItem.returnReason = reason;
    await order.save();

    res.redirect("/user/order-history?return=success");
  } catch (error) {
    console.error("❌ Error handling return request:", error);
    res.status(500).send("Server error");
  }
};


//address page
const getAddressPage = async (req, res) => {
  try {
    const user = await userSchema.findById(req.user.id);

    res.render('user/addressBook', {
      addresses: user.addresses
    });
  } catch (error) {
    console.error('❌ Error loading address book:', error);
    res.status(500).send('Something went wrong');
  }
};

const deleteAddress = async (req, res) => {
  try {
    const user = await userSchema.findById(req.user.id);
    const addressId = req.params.id;

    // Find index of the address using _id
    const index = user.addresses.findIndex(addr => addr._id.toString() === addressId);

    if (index === -1) {
      return res.status(404).send("Address not found");
    }

    // Remove the address
    user.addresses.splice(index, 1);
    await user.save();

    res.redirect('/user/address');
  } catch (error) {
    console.error("❌ Error deleting address:", error);
    res.status(500).send("Something went wrong");
  }
};


//product detail page

const productDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).render('404', { message: 'Product not found' });
    }
    

    // 🟢 Get reviews for this product (populate user name)
    const reviews = await Review.find({ product: productId }).populate('user');

    // 🟢 Check if user has purchased this product
    let canReview = false;
    if (req.user) {
      const userOrders = await Order.find({ user: req.user._id, "products.product": productId });

      // ✅ Only if at least one order contains the product
      canReview = userOrders.length > 0;

      // 🟢 Optional: Check if already reviewed
      const alreadyReviewed = await Review.findOne({ user: req.user._id, product: productId });
      if (alreadyReviewed) {
        canReview = false;
      }
    }

    res.render('user/product-details', {
      user: req.user,
      product,
      reviews,
      canReview
    });

   // res.render('user/product-details', { product });
  } catch (err) {
    console.error('Product details error:', err);
    res.redirect('/');
  }
};

//otp

 const sendOtp = async (req, res) => {
    const {PhoneNo: phone } = req.body;
    console.log("Phone received:", phone);
    console.log("TWILIO_VERIFY_SID:", process.env.TWILIO_VERIFY_SID);


    try {
        await client.verify.v2.services(process.env.TWILIO_VERIFY_SID)
            .verifications.create({ to: `+91${phone}`, channel: "sms" });

        res.json({ success: true, message: "OTP sent" });
    } catch (err) {
      console.error("Twilio Error:", err.message);

        res.status(500).json({ success: false, message: "Failed to send OTP", error: err.message });
    }
};
 



const verifyOtp = async (req, res) => {
  const { PhoneNo: phone, otp } = req.body;

  try {
    const verification_check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({ to: `+91${phone}`, code: otp });

    if (verification_check.status === "approved") {
      let user = await userSchema.findOne({ PhoneNo: phone });

      if (!user) {
        user = new userSchema({ PhoneNo: phone });
        await user.save();
      }

      // Generate token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

      // 🔴 Set cookie
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: false, // set to true in production (HTTPS)
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      // Optional: also return success response
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid OTP" });
    }
  } catch (err) {
    console.error("Twilio Verification Error:", err);
    res.status(500).json({
      success: false,
      message: "OTP verification failed",
      error: err.message
    });
  }
};




 const updateProfile = async (req, res) => {
    const { name, email } = req.body;
    const userId = req.user.id; // Get from JWT middleware

    try {
        const user = await userSchema.findByIdAndUpdate(userId, { name, email }, { new: true });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to update profile" });
    }
};

const getProfile = async (req, res) => {
  try {
    // Example: You get user ID from JWT middleware
    const userId = req.user.id;

    const user = await userSchema.findById(userId);
    if (!user) return res.status(404).send('User not found');

    res.render('user/profile', { user });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).send("Server Error");
  }
};

const logoutUser = (req, res) => {
  res.clearCookie('jwt'); // clear the JWT cookie
  res.redirect('/user/login'); // redirect to login page
};



const generateInvoicePDF = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  try {
    const order = await Order.findOne({ _id: orderId, user: userId }).populate("products.product");

    if (!order) return res.status(404).send("Order not found.");

    const doc = new PDFDocument({ margin: 50 });

    const filename = `Invoice-${orderId}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    // 🛒 Logo & Header
    const logoPath = path.join(__dirname, '../public/img/logo.jpeg');
    doc.image(logoPath, 50, 45, { width: 100 });

    doc.fontSize(20).text("FreshBasket", 160, 50);
    doc.fontSize(10).text("123 Organic Street, Farm City, India", 160, 70);
    doc.text("Phone: +91-1234567890", 160, 85);
    doc.text("Email: support@freshbasket.com", 160, 100);
    doc.moveDown();

    doc.moveTo(50, 130).lineTo(550, 130).stroke();

    // 📄 Invoice Info
    doc.fontSize(16).text("INVOICE", 50, 140);
    doc.fontSize(10).text(`Order ID: ${orderId}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    // 📦 Shipping Address
    const addr = order.checkoutDetails;
    doc.fontSize(12).text("Shipping Address:", { underline: true });
    doc.fontSize(10).text(`${addr.firstName} ${addr.lastName}`);
    doc.text(`${addr.address}, ${addr.city}, ${addr.country}, ${addr.zip}`);
    doc.text(`Mobile: ${addr.mobile}`);
    doc.moveDown();

    // 🛍️ Products Table
    doc.fontSize(12).text("Product Details:", { underline: true });
    doc.moveDown(0.5);

    let totalAmount = 0;

    order.products.forEach((item, index) => {
      const { name, price } = item.product;
      const quantity = item.quantity;
      const subtotal = price * quantity;
      totalAmount += subtotal;

      doc.fontSize(10).text(`${index + 1}. ${name}`);
      doc.text(`   Qty: ${quantity} x Rs${price} = Rs${subtotal}`);
      doc.moveDown(0.5);
    });

    const shippingCost = 3;
    totalAmount += shippingCost;

    doc.moveDown();
    doc.fontSize(12).text(`Shipping: Rs${shippingCost}`);
    doc.fontSize(12).text(`Total: Rs${totalAmount}`, { align: 'right' });

    doc.moveDown(2);
    doc.fontSize(10).text("Thank you for shopping with FreshBasket!", {
      align: 'center',
      italic: true,
    });

    doc.end();

  } catch (err) {
    console.error("❌ PDF generation failed:", err);
    res.status(500).send("Could not generate invoice.");
  }
};


const applyCoupon = async (req, res) => {
  const { code } = req.body;
  const userId = req.user._id;

  try {
    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return res.json({ success: false, message: "❌ Invalid coupon code." });
    }

    // Check expiry
    if (new Date() > coupon.expiryDate) {
      return res.json({ success: false, message: "❌ Coupon has expired." });
    }

    // Fetch cart with populated products
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.json({ success: false, message: "❌ Your cart is empty." });
    }

    // ✅ Calculate subtotal from populated product price
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );

    // ✅ Check against minimum purchase requirement
    if (subtotal < coupon.minPurchase) {
      return res.json({
        success: false,
        message: `❌ Minimum purchase of ₹${coupon.minPurchase} required to use this coupon.`,
      });
    }

    const discount = coupon.discount;

    // Save applied coupon to the user
    await userSchema.findByIdAndUpdate(userId, {
      appliedCoupon: {
        code: coupon.code,
        discount,
        message: `✅ Coupon applied! ₹${discount} off`,
      },
    });

    return res.json({
      success: true,
      discount,
      message: `✅ Coupon applied! ₹${discount} off`,
    });
  } catch (err) {
    console.error("Coupon error:", err.message);
    return res.status(500).json({ success: false, message: "❌ Server error." });
  }
};


// const applyCoupon = async (req, res) => {
//   const { code } = req.body;
//   const userId = req.user._id;

//   try {
//     const coupon = await Coupon.findOne({ code });

//     if (!coupon) {
//       return res.json({ success: false, message: "Invalid coupon code." });
//     }
    
//     const discount = coupon.discount;

//     // Save coupon in user's DB record
//     await userSchema.findByIdAndUpdate(userId, {
//       appliedCoupon: { code: coupon.code, discount ,  message: `Coupon applied! ₹${discount} off`}
//     });

//     return res.json({ success: true, discount });
//   } catch (err) {
//     console.error("Coupon error:", err.message);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

const removeCoupon = async (req, res) => {
  await userSchema.findByIdAndUpdate(req.user._id, {
    $unset: { appliedCoupon: 1 }
  });
  res.json({ success: true });
};

const showAvailableCoupons = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.render("user/coupon", { coupons: [], message: "Your cart is empty." });
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );

    // Get coupons that are not expired and match the subtotal
    const now = new Date();
    const coupons = await Coupon.find({
      expiryDate: { $gte: now },
      minPurchase: { $lte: subtotal },
    });

    res.render("user/coupon", { coupons, subtotal });
  } catch (err) {
    console.error("Coupon display error:", err.message);
    res.redirect("/user/404");
  }
};

//review
const postReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.id;
    const content = req.body.review;

    // Optional: Check if already reviewed
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      return res.redirect(`/user/product/${productId}?error=already-reviewed`);
    }

    const review = new Review({
      user: userId,
      product: productId,
      content
    });

    await review.save();
    res.redirect(`/user/product/${productId}`);
  } catch (error) {
    console.error("❌ Error submitting review:", error);
    res.status(500).send("Failed to submit review");
  }
};

 const filterProducts = async (req, res) => {
  try {
    const { category, min, max } = req.query;
    const query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by price range
    if (min || max) {
      query.price = {};
      if (min) query.price.$gte = parseInt(min);
      if (max) query.price.$lte = parseInt(max);
    }

    const products = await Product.find(query);

    res.render('user/filter', { products }); // Render same index page with filtered products
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const requestReturn = async (req, res) => {
    const { reason } = req.body;
  await Order.findByIdAndUpdate(req.params.id, {
    returnRequested: true,
    returnStatus: 'Requested',
      returnReason: reason  
  });
  res.redirect('/user/order-history?return=success');
};



//2

 const getCounts = async (req, res) => {
   
  try {
    const userId = req.user._id;
    let cartCount = 0;
    let wishlistCount = 0;

    const cart = await Cart.findOne({ userId });
    if (cart?.items) {
      cartCount = cart.items.length;
    }

    const user = await userSchema.findById(userId);
    if (user?.wishlist) {
      let count = 0;
      for (let id of user.wishlist) {
        if (await Product.exists({ _id: id })) {
          count++;
        }
      }
      wishlistCount = count;
    }

    res.json({ cartCount, wishlistCount });
  } catch (err) {
    console.log("Count fetch error:", err.message);
    res.status(500).json({ error: 'Server error' });
  }
};


module.exports = {
  signupuser,
  loadSignup,
  loadLogin,
  loaduserindex,
  viewcart,
  checkoutPage,
  loginUser,
  searchProducts,
  addToCart,
   increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  placeOrder,
 orderSuccess,
 productDetails,
 getWishlist,
 addToWishlist,
 removeFromWishlist,
 cartSummary,
 sendOtp ,
 verifyOtp,
 updateProfile,
 getProfile,
 saveAddressAndRenderCheckout,
 getSelectAddressPage,
 postSelectedAddress,
renderEditAddressForm,
updateAddress,
renderAddAddressForm,
addAddress,
paymentPage,
getOrderHistory,
getAddressPage,
 deleteAddress,
 logoutUser,
 orderProductDetail,
 generateInvoicePDF,
 createStripeCheckoutSession,
 paymentcancel,
 stripePaymentSuccess,
 applyCoupon,
  removeCoupon,
  showAvailableCoupons,
 postReview,
 filterProducts,
 requestReturn,
returnProduct,
 getCounts


};
