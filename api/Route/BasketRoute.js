const express = require('express');
const basketRoute = express.Router();
const UserBasket = require('../Modules/UserBasket');
const userBasket = new UserBasket();


basketRoute
    .route('/api/basket')
    .patch(userBasket.addCardInBasket)
    .get(userBasket.getCardInBasket)
    .delete(userBasket.deleteCardInBasket)

module.exports = basketRoute;