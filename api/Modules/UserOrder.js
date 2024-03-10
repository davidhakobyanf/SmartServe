const { connectToDb, getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

let db;

connectToDb((error) => {
    if (!error) {
        db = getDb();
    } else {
        console.error("Error connecting to the database:", error);
    }
});

module.exports = class UserOrder {
    async addOrder(req, res) {
        try {
            if (!db) {
                throw new Error("Database connection not established.");
            }

            const { items, allPrice, table } = req.body;

            // Создаем уникальный идентификатор заказа
            const orderId = uuidv4();

            // Создаем новый заказ
            const newOrder = {
                _id: orderId,
                items,
                allPrice,
                table,
                createdAt: new Date()
            };

            // Ищем заказы
            const orders = await db.collection('orders').findOne({});

            if (orders) {
                // Если найдены заказы, добавляем новый заказ в массив orders
                orders.orders.push(newOrder);
                await db.collection('orders').updateOne({}, { $set: { orders: orders.orders } });
                res.status(201).json({ message: "New order added successfully", order: newOrder });
            } else {
                // Если заказов не найдено, создаем новый объект с массивом orders
                const newOrderEntry = {
                    orders: [newOrder]
                };
                await db.collection('orders').insertOne(newOrderEntry);
                res.status(201).json({ message: "Order added successfully", order: newOrder });
            }
        } catch (err) {
            // Обрабатываем ошибки сервера
            console.error("Error adding order:", err);
            res.status(500).json({ err: 'Server error' });
        }
    }
};
