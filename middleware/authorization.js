const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function(req, res, next) {

  const token = req.header("Authorization");
  // console.log(req.header,"___req")
  // Check if not token
  if (!token) {
    return res.status(403).json({ msg: "authorization denied" });
  }

  try {
    const verify = jwt.verify(token, process.env.jwtSecret);
    req.user = verify.user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token is not valid" });
  }
};