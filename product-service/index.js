const express = require("express");
const app = express();
const mongoose = require("mongoose");
const amqp = require("amqplib");
const jwt = require("jsonwebtoken");
const Product = require("./Product");
const isAuthenticated = require("../isAuthenticated");

let channel;
const PORT = process.env.PORT || 8081;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

async function rabbitMqConnect() {
  const connectionUrl = "amqp://rabbitmq:5672";
  const connection = await amqp.connect(connectionUrl);
  channel = await connection.createChannel();
  await channel.assertQueue("PRODUCT");
  console.log("Connected To RabbitMQ");
}

async function dbConnection() {
  try {
    const connection = await mongoose.connect(
      "mongodb://mongo:27017/product-service"
    );

    console.log("Product Service DB Connected");
  } catch (error) {
    console.log(error.message);
  }
}

app.post("/products/new", isAuthenticated, async (req, res) => {
  //req.user
  const { title, description, price } = req.body;
  const product = new Product({
    title,
    description,
    price,
  });
  await product.save();
  return res.json({ data: product, message: "success" });
});

app.post("/products/buy", isAuthenticated, async (req, res) => {
  try {
    //req.user
    const { ids } = req.body;
    const products = await Product.find({ _id: { $in: ids } });
    const { email } = req.user;
    channel.sendToQueue(
      "ORDER",
      Buffer.from(JSON.stringify({ products, userEmail: email }))
    );
    let orderStatus = false;
    channel.consume("PRODUCT", (data) => {
      if (orderStatus === false) {
        orderStatus = true;
        const { order } = JSON.parse(data.content);
        channel.ack(data);
        return res.json({ order, message: "Order Placed" });
      }
    });
  } catch (error) {
    console.log(error.message);
  }
});

dbConnection();
rabbitMqConnect();

app.listen(PORT, () => {
  console.log(`Running on Product Service Port ${PORT}`);
});
