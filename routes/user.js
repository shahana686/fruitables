
const express=require('express')
const router=express.Router()
const usercontroller=require('../controller/usercontroller')
const authUser = require('../middleware/auth')
const setCartCount = require('../middleware/setCartCount');
const checkUser = require('../middleware/checkUser');
const noCache= require('../middleware/nocache');
const checkUserNotLoggedIn = require('../middleware/checkUserNotLoggedin');



router.get('/testimonial', (req, res) => {
    res.render('user/testimonial');
});

router.get('/404', (req, res) => {
    res.render('user/404');
});

router.get('/contact', (req, res) => {
    res.render('user/contact');
});
  

router.get('/login',noCache,checkUserNotLoggedIn,usercontroller.loadLogin)
router.post('/login',usercontroller.loginUser)
router.get('/signup',usercontroller.loadSignup)
router.post('/signup',usercontroller.signupuser)
router.get('/index',setCartCount,usercontroller.loaduserindex)
router.get('/cart',authUser,setCartCount,usercontroller.viewcart)
router.post('/add-to-cart/:id',authUser,usercontroller.addToCart);
router.post('/increase-quantity/:id', authUser, usercontroller.increaseQuantity);
router.post('/decrease-quantity/:id', authUser, usercontroller.decreaseQuantity);
router.post('/remove-from-cart/:id', authUser, usercontroller.removeFromCart);
router.get('/cart-summary',authUser, usercontroller.cartSummary);
router.get('/checkout',authUser,setCartCount,usercontroller.checkoutPage)
router.post('/checkout', authUser, usercontroller.saveAddressAndRenderCheckout); //5

router.get('/select-address', authUser,usercontroller.getSelectAddressPage);//1
router.post('/select-address',authUser, usercontroller.postSelectedAddress);
router.get('/edit-address/:id',authUser, usercontroller.renderEditAddressForm);
router.post('/edit-address/:id',authUser, usercontroller.updateAddress);
router.get('/add-address', authUser, usercontroller.renderAddAddressForm);
router.post('/add-address', authUser, usercontroller.addAddress);
router.post('/delete-address/:id', authUser, usercontroller.deleteAddress);

router.get('/order-history',authUser,usercontroller.getOrderHistory);
router.get('/order/:orderId/product/:productId', authUser, usercontroller.orderProductDetail);
router.get('/download-invoice/:orderId',authUser, usercontroller.generateInvoicePDF);
router.post('/order/return/:orderId/:productId', usercontroller.returnProduct);//4



router.post('/place-order',authUser,usercontroller.placeOrder)
router.get('/payment', authUser, usercontroller.paymentPage);
router.post('/create-stripe-session', authUser, usercontroller.createStripeCheckoutSession);
router.get('/payment-success', authUser, usercontroller.stripePaymentSuccess);
router.get('/payment-cancel', authUser,usercontroller.paymentcancel);
router.post('/apply-coupon', authUser, usercontroller.applyCoupon);
router.post('/remove-coupon', authUser, usercontroller.removeCoupon);
router.get("/coupon", authUser,usercontroller.showAvailableCoupons);
router.post('/product/:id/review',authUser,usercontroller.postReview)
router.get('/filter', setCartCount,usercontroller.filterProducts);


//router.post('/checkout',authUser, usercontroller.placeOrder);
router.get('/order-success',authUser, usercontroller.orderSuccess);
router.get('/search',  setCartCount,usercontroller.searchProducts);
router.get('/product/:id',authUser,setCartCount,usercontroller.productDetails);
router.post('/add-to-wishlist/:id', authUser, usercontroller.addToWishlist);
router.get('/wishlist', authUser, setCartCount,usercontroller.getWishlist);
router.post('/wishlist/remove/:id', authUser, usercontroller.removeFromWishlist);

router.post('/send-otp', usercontroller.sendOtp);
router.post('/verify-otp', usercontroller.verifyOtp);
router.post("/update-profile",authUser, usercontroller.updateProfile);
router.get('/profile', authUser, usercontroller.getProfile);
router.get('/address', authUser, usercontroller.getAddressPage);


router.post('/order/return/:id', authUser, usercontroller.requestReturn);
//router.post('/order/replacement/:id', authUser, usercontroller.requestReplacement);


router.get('/counts',authUser, usercontroller.getCounts);  //1


router.get('/logout', authUser, usercontroller.logoutUser);




module.exports=router
