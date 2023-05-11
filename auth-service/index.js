const express = require("express");
const app = express();
const mongoose = require("mongoose");
const User = require("./User");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

async function dbConnection() {
  try {
    const connection = await mongoose.connect(
      "mongodb://mongo:27017/auth-service"
    );

    console.log("AUTH Service DB Connected");
  } catch (error) {
    console.log(error.message);
  }
}

app.post("/auth/register", async (req, res) => {
  const { email, name, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    return res.json({ message: "User already exists" });
  }

  const newuser = new User({ email, password, name });
  newuser.save();
  return res.json({ message: "Success", data: newuser });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ message: "No User exists" });
  }

  if (password !== user.password) {
    return res.json({ message: "Invalid Credentials" });
  }
  const token = await jwt.sign({ email, name: user.name }, "secret");
  return res.json({ message: "Success", token });
});

dbConnection();

app.listen(PORT, () => {
  console.log(`Auth Service Running on Port ${PORT}`);
});
