const jwt = require('jsonwebtoken');

const adminAuth= (req, res, next) => {
  const token = req.cookies.adminToken;

  if (!token) {
    return res.redirect('/admin/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // Store admin info in request
    next();
  } catch (err) {
    return res.redirect('/admin/login');
  }
};

module.exports = adminAuth;