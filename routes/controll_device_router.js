const express = require('express');
const router = express.Router();
const async = require('async');
const checkAuth = require('../middleware/check_auth');

var MotorSchema = require('../models/motor_model');

/* GET home page. */
router.get('/', checkAuth, function(req, res, next){
 async.series({
   data_relay: function(cb){
    MotorSchema.findById(req.userData.userId).exec(function(err, data){
     if(err) return console.log(err);
     cb(err, data.relay);
    });
   }
  }, function(err, data){
   console.log(data.data_relay);
   res.render('controll_device_view',{
    data_relay: data.data_relay
   });
  });
});

module.exports = router;
