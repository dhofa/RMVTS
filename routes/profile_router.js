const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check_auth');
const async = require('async');
const MotorSchema = require('../models/motor_model');


/* GET home page. */
router.get('/',checkAuth, function(req, res, next) {
   MotorSchema.findById(req.userData.userId, (err, data)=>{
    if(err) return console.log(err);
    res.render('profile_view',{
      owner   : data.vehicle_data.owner,
      email   : data.user.email,
      plate_number : data.vehicle_data.plate_number,
      address : data.vehicle_data.address,
      vehicle_type : data.vehicle_data.vehicle_type,
      foto_profile : data.vehicle_data.user_photos,
      device_id : data._id
     });
   });
});
 
module.exports = router;