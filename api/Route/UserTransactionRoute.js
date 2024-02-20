const express = require('express');
const userTransactionRoute = express.Router();
const UserTransaction = require('../Modules/UserTransaction')
const transaction = new UserTransaction

userTransactionRoute
    .route('/api/user/login/transaction')
    .patch(transaction.userTransaction)
    .put(transaction.editTransaction)
    .delete(transaction.deleteTransaction)

module.exports = userTransactionRoute;