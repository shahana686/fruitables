
const jwt = require('jsonwebtoken');
const Product = require('../model/productmodel')
const User = require('../model/usermodel');
const Cart = require('../model/cartmodel');
const secret = process.env.JWT_SECRET || 'yourSuperSecretKey'

const setCartCount = async (req, res, next) => {
  res.locals.cartCount = 0;
    res.locals.wishlistCount = 0;

  try {
    const token = req.cookies.jwt; // Read token from cookies
    if (token) {
      const decoded = jwt.verify(token, secret);
      const userId = decoded.id;

      const cart = await Cart.findOne({ userId }); // match your schema's field
      if (cart?.items) {
        res.locals.cartCount = cart.items.length;
      }
            // Fetch wishlist count
      const user = await User.findById(userId);
      if (user?.wishlist) {
       
let count = 0;
for (let id of user.wishlist) {
  if (await Product.exists({ _id: id })) {
    count++;
  }
}
res.locals.wishlistCount = count;
      }

      // Set user on req if needed later
      req.user = user;
    }
  } catch (err) {
    console.log("Cart count middleware error:", err.message);
  }

  next();
};

module.exports = setCartCount;
