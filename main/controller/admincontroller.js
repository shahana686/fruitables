const adminmodel= require("../model/adminmodel")
const User = require('../model/usermodel');
const Product = require('../model/productmodel');
const Order = require('../model/ordermodel'); 
const jwt = require("jsonwebtoken");

const moment = require('moment');
const Coupon = require('../model/coupon');

const bcrypt=require('bcrypt')
  
const loadlogin=async(req,res)=>{
    res.render('admin/login')
}

const login=async(req,res)=>{
    try{
    const{username,password}=req.body
    const admin=await adminmodel.findOne({username})
    if(!admin){
      return res.render('admin/login',{message:"invalid credenitals"})
    }
    const isMatch=await bcrypt.compare(password,admin.password)
    if(!isMatch){
       return res.render('admin/login',{message:"invalid credentials"})
    }
    
    //generate jwt token and set cookie
       const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
          expiresIn: "1d",
        });
    
        // Set cookie
        res.cookie("adminToken", token, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        });
        res.redirect('/admin/dashboard')

   } catch (error) {
    console.error(error);
    res.render('admin/login', { message: 'Something went wrong' });
}

}


const loaddashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
  // const orders = await Order.find();
  const orders = await Order.find().populate('products.product');

   // Group Orders by Category
const categoryMap = {};

orders.forEach(order => {
  order.products.forEach(item => {
    const category = item.product?.category || 'Unknown';
    categoryMap[category] = (categoryMap[category] || 0) + 1;
  });
});

const orderCategories = Object.keys(categoryMap);
const orderCategoryCounts = Object.values(categoryMap);

   
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    // Prepare weekly revenue (last 7 days)
    const weeklyLabels = [];
    const weeklyRevenue = [];

    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
      weeklyLabels.push(moment().subtract(i, 'days').format('ddd')); // e.g. "Mon", "Tue"

      const dailyOrders = orders.filter(order => moment(order.createdAt).format('YYYY-MM-DD') === date);
      const dailyRevenue = dailyOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      weeklyRevenue.push(dailyRevenue);
    }
    
// Monthly Revenue (last 12 months)
const monthlyLabels = [];
const monthlyRevenue = [];

for (let i = 11; i >= 0; i--) {
  const month = moment().subtract(i, 'months').format('MMM'); // e.g. "Jan"
  monthlyLabels.push(month);

  const monthlyOrders = orders.filter(order =>
    moment(order.createdAt).format('YYYY-MM') === moment().subtract(i, 'months').format('YYYY-MM')
  );
  const monthRevenue = monthlyOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  monthlyRevenue.push(monthRevenue);
}

// Yearly Revenue (last 5 years)
const yearlyLabels = [];
const yearlyRevenue = [];

for (let i = 4; i >= 0; i--) {
  const year = moment().subtract(i, 'years').format('YYYY');
  yearlyLabels.push(year);

  const yearlyOrders = orders.filter(order =>
    moment(order.createdAt).format('YYYY') === year
  );
  const yearRevenue = yearlyOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  yearlyRevenue.push(yearRevenue);
}


    res.render('admin/dashboard', {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      weeklyLabels: JSON.stringify(weeklyLabels), // pass as JSON
      weeklyRevenue: JSON.stringify(weeklyRevenue),
        monthlyLabels: JSON.stringify(monthlyLabels),
  monthlyRevenue: JSON.stringify(monthlyRevenue),
  yearlyLabels: JSON.stringify(yearlyLabels),
  yearlyRevenue: JSON.stringify(yearlyRevenue),
   orderCategories: JSON.stringify(orderCategories),
  orderCategoryCounts: JSON.stringify(orderCategoryCounts)

    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

 
// const loaddashboard= async (req, res) => {
//     try {
//       const totalUsers = await User.countDocuments();
//       const totalProducts = await Product.countDocuments();
//       const totalOrders = await Order.countDocuments();
      
//       // Optionally calculate revenue
//       const orders = await Order.find();
//       const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  
//       res.render('admin/dashboard', {
//         totalUsers,
//         totalProducts,
//         totalOrders,
//         totalRevenue,
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(500).send('Server error');
//     }
//   };


  
// List all products
const getProducts = async (req, res) => {
    const products = await Product.find();
    res.render('admin/adminproducts', { products });
  };
  
  // Show add product form
  const getAddProduct = (req, res) => {
    res.render('admin/addproduct');
  };

  const cloudinary = require('../utils/cloudinary'); // Make sure this is correctly configured

 
  const postAddProduct = async (req, res) => {
  try {
    const { name, description, category, price, isBestSeller } = req.body;

    // req.files already contains Cloudinary URLs in file.path or file.url
    console.log("Uploaded files:", req.files);

    const images = req.files.map(file => file.path); // CloudinaryStorage sets file.path

    const bestSellerFlag = isBestSeller === 'on';
    
       const newProduct = new Product({
      name,
      description,
      price,
      category,
      image: images[0],         // first image as main image
      images: images,           // all images for product detail
      isBestSeller: bestSellerFlag,
    });

    await newProduct.save();
    res.redirect('/admin/products');
  } catch (error) {
    console.log(error);
    res.status(500).send("Error adding product");
  }
};
// const postAddProduct = async (req, res) => {
//   try {
//     const { name, description,  category ,price, isBestSeller } = req.body;
//     const image = req.file.path; // Cloudinary image URL

//     // Convert checkbox value to boolean
//     const bestSellerFlag = isBestSeller === 'on';

//     await Product.create({ name, description,  category,  price, image ,isBestSeller: bestSellerFlag });
//     res.redirect('/admin/products');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error adding product');
//   }
// };

  // Show edit product form
  const getEditProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);
    res.render('admin/editproduct', { product });
  };



  const postEditProduct = async (req, res) => {
  try {
    const { name, description, category, price, deleteImages } = req.body;
    const isBestSeller = req.body.isBestSeller === "on";

    const product = await Product.findById(req.params.id);

    let updatedImages = product.images || [];

    // 1. Remove selected images
    if (deleteImages) {
      const toDelete = Array.isArray(deleteImages) ? deleteImages : [deleteImages];
      
      updatedImages = updatedImages.filter(img => !toDelete.includes(img));

      // Optional: Also delete from Cloudinary (if stored by public_id)
      // You need to store public_id during upload to do that.
    }

    // 2. Add new images
    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map(file => file.path);
      updatedImages = updatedImages.concat(newImagePaths);
    }

    // 3. Update product
    await Product.findByIdAndUpdate(req.params.id, {
      name,
      description,
      category,
      price,
      isBestSeller,
      images: updatedImages
    });

    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating product');
  }
};

  

  
  
  // Delete product
  const deleteProduct = async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin/products');
  };


  //user

  const viewuser=async(req,res)=>{
    try{
      const users=await User.find()
      res.render('admin/viewusers',{users})
    }catch(error){
      console.log(error);
      res.status(500).send("error loading users")
      
    }
  }


   const getOrdersPage = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'email') // populate user email
      .populate('products.product') // populate product details
      .sort({ createdAt: -1 }); // newest first

    res.render('admin/orders', { orders }); // render orders page and pass data
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Server Error");
  }
};

const adminLogout = (req, res) => {
  res.clearCookie('adminToken'); // Clear the JWT cookie
  res.redirect('/admin/login');  // Redirect to admin login page
};


// const updatestatus= async (req, res) => {
//   const { orderId, status } = req.body;

//   try {
//     await Order.findByIdAndUpdate(orderId, { status});
//     res.redirect('/admin/orders'); // or wherever your admin orders page is
//   } catch (err) {
//     console.error("Failed to update order status:", err);
//     res.status(500).send("Error updating order status");
//   }
// }

const updatestatus = async (req, res) => {
  const { orderId, status } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    order.status = status;

    // ✅ If it's COD and the order is delivered, mark as paid
    if (order.paymentMethod === 'COD' && status === 'Delivered') {
      order.paymentStatus = 'Paid';
    }

    
    // ✅ Save deliveredAt when status is Delivered   //2 for 7days return
    if (status === 'Delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();
    res.redirect('/admin/orders');
  } catch (err) {
    console.error("Failed to update order status:", err);
    res.status(500).send("Error updating order status");
  }
};


const userstatus= async (req, res) => {
  const { userId, action } = req.body;
  try {
    await User.findByIdAndUpdate(userId, { blocked: action === 'block' });
    res.redirect('/admin/users');
  } catch (error) {
    console.error("Failed to update user status:", error);
    res.status(500).send("Error updating user status");
  }
};

  
const couponList = async (req, res) => {
  const coupons = await Coupon.find();
  res.render('admin/coupons', { coupons });
};

const addCouponPage = (req, res) => {
  res.render('admin/addCoupon');
};

const addCoupon = async (req, res) => {
  const { code, discount, expiryDate, minPurchase, usageLimit } = req.body;
  await Coupon.create({ code, discount, expiryDate, minPurchase, usageLimit });
  res.redirect('/admin/coupons');
};

const deleteCoupon = async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.redirect('/admin/coupons');
};

// const viewReturnRequests = async (req, res) => {
//   try {
//     const returnOrders = await Order.find({ returnRequested: true }).populate('user').sort({ createdAt: -1 });
//     res.render('admin/returnRequests', { returnOrders });
//   } catch (error) {
//     console.error("Error loading return requests:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };

// 1
const viewReturnRequests = async (req, res) => {
  try {
    const orders = await Order.find({
      'products.returnStatus': { $in: ['Requested', 'Approved', 'Rejected'] }
    })
      .populate('products.product')
      .populate('user')
      .sort({ createdAt: -1 });

    const returnRequests = [];

    orders.forEach(order => {
      order.products.forEach(product => {
        if (['Requested', 'Approved', 'Rejected'].includes(product.returnStatus)) {
          returnRequests.push({
            orderId: order._id,
            productId: product.product._id,
            productName: product.product.name,
            productImage: product.product.images?.[0],
            reason: product.returnReason,
            status: product.returnStatus,
            reply: product.returnReply,
            user: order.user,
         
          });
        }
      });
    });

    res.render('admin/returnRequests', {  returnRequests: returnRequests.reverse()  });
  } catch (error) {
    console.error("❌ Error loading return requests:", error);
    res.status(500).send("Internal Server Error");
  }
};



// const approveReturn = async (req, res) => {
//   await Order.findByIdAndUpdate(req.params.id, {
//     returnStatus: 'Approved',
//     returnReply: 'Your return has been approved.'
//   },  { new: true });
//   res.redirect('/admin/returns');
// };

// const rejectReturn = async (req, res) => {
//   await Order.findByIdAndUpdate(req.params.id, {
//     returnStatus: 'Rejected',
//     returnReply: 'Your return request was rejected.'
//   });
//   res.redirect('/admin/returns');
// };

//4
const approveProductReturn = async (req, res) => {
  const { orderId, productId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).send("Order not found");

    const product = order.products.find(p => p.product.toString() === productId);
    if (!product) return res.status(404).send("Product not found in order");

    product.returnStatus = "Approved";
    product.returnReply =  ' Refund will be processed within 5–7 working days.';

    await order.save();

    res.redirect('/admin/returns');
  } catch (err) {
    console.error("❌ Error approving product return:", err);
    res.status(500).send("Server error");
  }
};

const rejectProductReturn = async (req, res) => {
  const { orderId, productId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).send("Order not found");

    const product = order.products.find(p => p.product.toString() === productId);
    if (!product) return res.status(404).send("Product not found in order");

    product.returnStatus = "Rejected";
    product.returnReply = ' Contact support if you need further assistance.';;
    await order.save();

    res.redirect('/admin/returns');
  } catch (err) {
    console.error("❌ Error rejecting product return:", err);
    res.status(500).send("Server error");
  }
};




module.exports={
    login,
    loadlogin,
    loaddashboard,
    postAddProduct,
    getAddProduct ,
    getEditProduct ,
    postEditProduct ,
    deleteProduct,
    getProducts,
    viewuser,
   getOrdersPage,
   adminLogout,
   updatestatus,
   userstatus,
   addCoupon,
   deleteCoupon,
   addCouponPage,
   couponList,
   viewReturnRequests,
  //  approveReturn,
  //  rejectReturn,
    approveProductReturn,
    rejectProductReturn

}