// middleware/checkUserNotLoggedIn.js
const jwt = require('jsonwebtoken');

const checkUserNotLoggedIn = (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // If token is valid, block access to login
      return res.redirect('/user/index');
    } catch (err) {
      // If token is invalid or expired, allow access
      return next();
    }
  }

  // No token, proceed to login
  next();
};

module.exports = checkUserNotLoggedIn;
