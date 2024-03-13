const express = require('express');
const allordersRoute = express.Router();
const UserOrder = require('../Modules/UserOrder');
const userBasket = new UserOrder();


allordersRoute
    .route('/api/orders/all')
    .delete(userBasket.deleteAllOrders)

module.exports = allordersRoute;