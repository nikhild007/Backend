const express = require("express");
const app = express();
const mongoose = require("mongoose");
const amqp = require("amqplib");
const jwt = require("jsonwebtoken");
const Order = require("./Order");
const isAuthenticated = require("../isAuthenticated");

const PORT = process.env.PORT || 8082;
let channel;
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

async function rabbitMqConnect() {
  const connectionUrl = "amqp://rabbitmq:5672";
  const connection = await amqp.connect(connectionUrl);
  channel = await connection.createChannel();
  await channel.assertQueue("ORDER");
  console.log("Connected To RabbitMQ");
}

async function dbConnection() {
  try {
    const connection = await mongoose.connect(
      "mongodb://mongo:27017/order-service"
    );

    console.log("Order Service DB Connected");
  } catch (error) {
    console.log(error.message);
  }
}

const createOrder = (products, userEmail) => {
  const total_price = products.reduce((acc, item) => acc + item.price, 0);
  const order = new Order({ products, userEmail, total_price });
  order.save();
  return order;
};

dbConnection();
rabbitMqConnect().then(() => {
  channel.consume("ORDER", async (data) => {
    const { products, userEmail } = JSON.parse(data.content);
    const order = await createOrder(products, userEmail);
    channel.ack(data);
    channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify({ order })));
  });
});

app.listen(PORT, () => {
  console.log(`Running on Order Service Port ${PORT}`);
});
