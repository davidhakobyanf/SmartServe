const express = require('express');
const allbasketRoute = express.Router();
const UserBasket = require('../Modules/UserBasket');
const userBasket = new UserBasket();


allbasketRoute
    .route('/api/basket/all')
    .delete(userBasket.deleteAllBasket)

module.exports = allbasketRoute;