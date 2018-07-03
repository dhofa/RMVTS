const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check_auth');
const async = require('async');
var MotorSchema = require('../models/motor_model');


/* GET home page. */
router.get('/',checkAuth, function(req, res, next) {
   MotorSchema.findById(req.userData.userId, (err, data)=>{
    if(err) return console.log(err);
    res.render('index',{
      username: data.vehicle_data.owner,
      email   : data.user.email,
      last_state_ignition : data.vehicle_data.last_state_ignition,
      last_state_vibration: data.vehicle_data.last_state_vibration,
      last_location: data.vehicle_data.last_location,
      last_image_capture: data.vehicle_data.last_image_capture
     });
   });
});
 
module.exports = router;
