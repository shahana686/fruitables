const jwt = require('jsonwebtoken');
const User = require('../model/usermodel');
const checkUser = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (token) {
      console.log("JWT Found:", token);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded ID:", decoded.id);

      const user = await User.findById(decoded.id);
      if (user) {
        console.log("✅ User loaded:", user.email);
        res.locals.user = user;
        req.user = user;
      } else {
        console.log("❌ No user found with ID:", decoded.id);
      }
    } else {
      console.log("No token found.");
    }
  } catch (err) {
    console.log("checkUser error:", err.message);
  }
  next();
};


// const checkUser = async (req, res, next) => {
//   try {
//     const token = req.cookies.jwt;
//     if (token) {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await User.findById(decoded.id);
//       if (user) {
//         res.locals.user = user;
//               req.user = user;
//       }
//     }
    
//   } catch (err) {
//     console.log('checkUser error:', err.message);
//   }
//   next(); // always continue even if user not found
// };

module.exports = checkUser;
