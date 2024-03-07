const express = require('express');
const basketRoute = express.Router();
const UserBasket = require('../Modules/UserBasket');
const userBasket = new UserBasket();


basketRoute
    .route('/api/basket')
    .patch(userBasket.addCardInBasket)

module.exports = basketRoute;