// middleware/checkAdminNotLoggedIn.js
const jwt = require("jsonwebtoken");

const checkAdminNotLoggedIn = (req, res, next) => {
  const token = req.cookies.adminToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect("/admin/dashboard"); // Already logged in
    } catch (err) {
      return next(); // Token expired or invalid
    }
  }

  next(); // No token, continue to login page
};

module.exports = checkAdminNotLoggedIn;
