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

    async getOrders(req, res) {
        try {
            const orders = await db.collection('orders').findOne({});
            if (!orders) {
                res.status(404).json({ error: 'Order not found' });
            } else {
                res.json(orders.orders);
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
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
            const orders = await db.collection('orders').findOne({ orders: { $exists: true } });

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
    async deleteOrder(req, res) {
        try {
            const { id } = req.body;

            // Удаляем объект с указанным id из массива orders
            const updatedProfile = await db.collection('orders').findOneAndUpdate(
                {},
                { $pull: { orders: { _id: id } } },
                { returnOriginal: false }
            );

            if (updatedProfile) {
                res.json(updatedProfile);
            } else {
                res.status(404).json({ error: "Заказ не найден или что-то пошло не так" });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }
    async deleteAllOrders(req, res) {
        try {
            // Удаляем все документы в коллекции "orders"
            const deletedOrders = await db.collection('orders').deleteMany({});

            if (deletedOrders.deletedCount > 0) {
                res.json({ message: "Все данные в коллекции 'orders' были удалены" });
            } else {
                res.status(404).json({ error: "Данные не найдены или что-то пошло не так" });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }






};
