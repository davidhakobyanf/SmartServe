const express = require('express');
const OrdersRoute = express.Router();
const UserOrder = require('../Modules/UserOrder');
const userOrder = new UserOrder();


OrdersRoute
    .route('/api/orders')
    .patch(userOrder.addOrder)
    .get(userOrder.getOrders)
    .delete(userOrder.deleteOrder)
    // .get(userBasket.getCardInBasket)


module.exports = OrdersRoute;