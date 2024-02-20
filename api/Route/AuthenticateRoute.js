const express = require('express');
const authenticateToken = require('../Modules/AuthenticateToken');
const AuthenticateToken = new authenticateToken();
const AuthenticateRoute = express.Router();

AuthenticateRoute
    .route('/api/protected')
    .get(AuthenticateToken.authenticateToken)


module.exports = AuthenticateRoute;