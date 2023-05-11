const jwt = require("jsonwebtoken");

async function isAuthenticated(req, res, next) {
  const token = req.headers["authorization"].split(" ")[1];
  jwt.verify(token, "secret", (err, data) => {
    if (err) {
      return res.json({ message: "Invalid Authorization/Token" });
    }
    req.user = data;
    next();
  });
}

module.exports = isAuthenticated;
