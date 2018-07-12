const express = require('express');
const router = express.Router();
const async = require('async');
const MotorSchema = require('../models/motor_model');
const checkAuth = require('../middleware/check_auth');
const mongoose   = require('mongoose');


router.get('/', checkAuth, function(req, res) {
  async.series({
   driver: (cb)=>{
     MotorSchema.findById(req.userData.userId).exec(function(err, data){
       if(err) return console.log(err);
         cb(err, data.driver);
       });
      }
  },(err, data)=>{
    res.render('log_camera_view',{
      data_images: data.driver
    });
  });
});


/* GET users listing. */
router.get('/:tanggal_periode', checkAuth,function(req, res) {
  var date_now = req.params.tanggal_periode.split("-"); //2018-06-28
  var today  = new Date(date_now[1]+"-"+date_now[2]+"-"+date_now[0]);
  var nextday= new Date(today);
  nextday.setDate(today.getDate()+1);
  console.log("today =>", today);
  console.log("nextDay =>", nextday);

  MotorSchema.aggregate([
   {
    $unwind: "$driver"
   },
   {
     $match:
       {
         _id: mongoose.Types.ObjectId(req.userData.userId),
         "driver.created": {
           $gte: today,
           $lt : nextday
         }
       }
   },
   {
    $project: {
     driver: 1,
     _id: 0
    }
   },
   {
    $replaceRoot:{newRoot: "$driver"} //ini untuk mengganti root default dari object
   },
   {
    $sort: {
     "driver.created": -1
    }
   }
  ]).exec(function(err, data){
   if(err){
    console.log(err);   
   }

   console.log(data);
   res.render('log_camera_view',{
    data_images: data
  });
  });

});

module.exports = router;
