const express=require('express')
const router=express.Router()
const admincontroller=require('../controller/admincontroller')
const adminAuth = require('../middleware/adminauth');
const upload = require('../middleware/multer');
const noCache = require("../middleware/nocache");
const checkAdminNotLoggedIn = require("../middleware/checkAdminNotLoggedIn");




router.get('/login',noCache,checkAdminNotLoggedIn,admincontroller.loadlogin)
router.post('/login',admincontroller.login)
router.get('/dashboard',adminAuth,admincontroller.loaddashboard)
router.get('/products', admincontroller.getProducts);
router.get('/product/add',admincontroller.getAddProduct);
// router.post('/product/add',upload.single('image'),  admincontroller.postAddProduct);

router.post('/product/add', upload.array('images', 5), admincontroller.postAddProduct); 
// <-- 'images' is the name from form input, 5 = max files

router.get('/product/edit/:id',admincontroller.getEditProduct);
// router.post('/product/edit/:id', upload.single('image'), admincontroller.postEditProduct);
router.post('/product/edit/:id', upload.array("images", 5), admincontroller.postEditProduct);

router.post('/update-order-status', admincontroller.updatestatus)
router.post('/user-status',admincontroller.userstatus)

router.get('/coupons', admincontroller.couponList);
router.get('/coupons/add', admincontroller.addCouponPage);
router.post('/coupons/add', admincontroller.addCoupon);
router.get('/coupons/delete/:id', admincontroller.deleteCoupon);

router.get('/returns', adminAuth, admincontroller.viewReturnRequests);
// router.post('/returns/:id/approve', adminAuth, admincontroller.approveReturn);
// router.post('/returns/:id/reject', adminAuth, admincontroller.rejectReturn);

// 3

router.post('/returns/:orderId/product/:productId/approve', adminAuth, admincontroller.approveProductReturn);
router.post('/returns/:orderId/product/:productId/reject', adminAuth, admincontroller.rejectProductReturn);




router.get('/product/delete/:id',admincontroller.deleteProduct);
router.get('/users',admincontroller.viewuser)
router.get('/orders', admincontroller.getOrdersPage);
router.get('/logout',admincontroller.adminLogout);


module.exports=router

