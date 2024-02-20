const express = require('express');
const userLoginRouter = express.Router();
const UserLogin = require('../Modules/UserLogin');
const userLogin = new UserLogin();


userLoginRouter 
    .route('/api/user/login')
    .post(userLogin.userLogin)
    .patch(userLogin.addCardInProfile)
    .delete(userLogin.deleteCard)
    .put(userLogin.editCard)

module.exports = userLoginRouter;