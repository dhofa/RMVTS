const express = require('express');
const router = express.Router();
const async = require('async');
const checkAuth = require('../middleware/check_auth');

var MotorSchema = require('../models/motor_model');


/* GET users listing. */
router.get('/', checkAuth, function(req, res) {
          async.series({
            vibrations: function(cb){
             MotorSchema.findById(req.userData.userId).exec(function(err, data){
              if(err) return console.log(err);
              cb(err, data.vibration);
             });
            }
           }, function(err, data){
            res.render('log_vibration_view',{
             datavibration: data.vibrations
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
   $unwind: "$vibration"
  },
  {
    $match:
      {
        _id: mongoose.Types.ObjectId(req.userData.userId),
        "vibration.created": {
          $gte: today,
          $lt : nextday
        }
      }
  },
  {
   $project: {
    vibration: 1,
    _id: 0
   }
  },
  {
   $replaceRoot:{newRoot: "$vibration"} //ini untuk mengganti root default dari object koordinat
  },
  {
   $sort: {
    "vibration.created": -1
   }
  }
 ]).exec(function(err, data){
  if(err){
    concole.log(err);
  }

  res.render('log_vibration_view',{
    datavibration: data
   });
 });
});

module.exports = router;
