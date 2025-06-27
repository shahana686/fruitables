// const jwt = require('jsonwebtoken');
// const User = require('../model/usermodel');

// const authUser = async (req, res, next) => {
//   try {
//     // console.log('Cookies:', req.cookies);
//     // console.log('JWT token:', req.cookies.jwt);

//     const token = req.cookies.jwt;
//     console.log('🔑 Token from Cookie:', token);

//     if (!token) {
//       return res.redirect('/user/login');
     
//     }
     

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log('🔓 Decoded Token:', decoded);

//     const user = await User.findById(decoded.id);
//     console.log('🔍 Fetched User:', user);

//     if (!user) {
//       console.log('User not found');
//        return res.redirect('/user/login');
//     }
     

//     req.user = user;

//         // ✅ Make user available in all views (Handlebars)
//     res.locals.user = user
//     next();
//   } catch (error) {
//     console.error(error);
//     res.redirect('/user/login');
//   }
// };

// module.exports = authUser;


const jwt = require('jsonwebtoken');
const User = require('../model/usermodel');

const authUser = async (req, res, next) => {
  try {
    // console.log('Cookies:', req.cookies);
    // console.log('JWT token:', req.cookies.jwt);

    const token = req.cookies.jwt;
  console.log('🔑 Token (header or cookie):', token);

    if (!token) {
      return res.redirect('/user/login');
     
    }
     

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔓 Decoded Token:', decoded);

    const user = await User.findById(decoded.id);
    console.log('🔍 Fetched User:', user);

    if (!user) {
      console.log('User not found');
       return res.redirect('/user/login');
    }
     

    req.user = user;

        // ✅ Make user available in all views (Handlebars)
    res.locals.user = user
    next();
  } catch (error) {
    console.error(error);
    res.redirect('/user/login');
  }
};

module.exports = authUser;

