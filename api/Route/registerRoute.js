const express = require('express');
const Register = require('../Modules/Register')
const registerRoute = express.Router();
const register = new Register();

registerRoute
    .route('/api/register')
    .post(register.reg);

module.exports = registerRoute