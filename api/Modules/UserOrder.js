const { connectToDb, getDb } = require('../db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

let db;
connectToDb((error) => {
    if (!error) {
        db = getDb();
    }
});

module.exports = class UserOrder {
    async addOrder(req, res) {
        try {
            const { items, allPrice } = req.body;

            // Check if the order already exists based on items and allPrice
            const order = await db.collection('orders').findOne({ items, allPrice });

            if (order) {
                // If order exists, send it back
                res.send(order);
            } else {
                // If order doesn't exist, handle accordingly
                res.status(404).json({ err: "Order not found" });
            }
        } catch (err) {
            // Handle any server errors
            console.error("Error adding order:", err);
            res.status(500).json({ err: 'Server error' });
        }
    }





}