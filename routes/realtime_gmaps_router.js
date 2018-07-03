const express = require('express');
const router = express.Router();
const async = require('async');
const checkAuth = require('../middleware/check_auth');

var MotorSchema = require('../models/motor_model');


router.get('/', function(req, res) {
 res.render('gmaps_realtime_view');
});

module.exports = router;
