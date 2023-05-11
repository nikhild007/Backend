const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const OrderSchema = new mongoose.Schema({
  products: [
    {
      type: ObjectId,
      ref: "User",
    },
  ],
  total_price: Number,
  userEmail: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
