const express = require('express');
const Profile = require('../Modules/Profile');
const profile = new Profile();
const ProfileRoute = express.Router();

ProfileRoute
    .route('/api/profile')
    .get(profile.user);



module.exports = ProfileRoute