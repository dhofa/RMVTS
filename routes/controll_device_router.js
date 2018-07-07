const express = require('express');
const router = express.Router();
const async = require('async');
const checkAuth = require('../middleware/check_auth');

var MotorSchema = require('../models/motor_model');

/* GET home page. */
router.get('/', checkAuth, function(req, res, next){
 async.series({
   all_data: function(cb){
    MotorSchema.findById(req.userData.userId).exec(function(err, data){
     if(err) return console.log(err);
     cb(err, data);
    });
   }
  }, function(err, data){
   console.log(data.data_relay);
   res.render('controll_device_view',{
    data_relay: data.all_data.relay,
    last_driver_photos : data.all_data.vehicle_data.last_image_capture.last_driver_photos
   });
  });
});

module.exports = router;
