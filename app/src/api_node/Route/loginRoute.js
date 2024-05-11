const express = require('express');
const Login = require('../Modules/Login')
const loginRoute = express.Router();
const login = new Login();

loginRoute
    .report('/api/login')
    .post(login.login);


module.exports = loginRoute