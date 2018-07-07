const express = require('express');
const router = express.Router();
const async = require('async');
const checkAuth = require('../middleware/check_auth');
const mongoose   = require('mongoose');
const MotorSchema = require('../models/motor_model');

/* GET users listing. */
router.get('/', checkAuth, function(req, res) {
          async.series({
            ignitions: function(cb){
             MotorSchema.findById(req.userData.userId).exec(function(err, data){
              if(err) return console.log(err);
              cb(err, data.ignition);
             });
            }
           }, function(err, data){
            res.render('log_ignition_view',{
             dataignition: data.ignitions
            });
           });
});

/* GET users listing. */
router.get('/:tanggal_periode',checkAuth, function(req, res) {
  var today  = new Date(req.query.periode);
  var nextday= new Date(today);
  nextday.setDate(today.getDate()+1);

  console.log(req.query.periode);
  console.log(today);
  console.log(nextday);
  MotorSchema.aggregate([
  {
   $unwind: "$ignition"
  },
  {
    $match:
      {
        _id: mongoose.Types.ObjectId(req.userData.userId),
        "ignition.created": {
          $gte: today,
          $lt : nextday
        }
      }
  },
  {
   $project: {
    ignition: 1,
    _id: 0
   }
  },
  {
   $replaceRoot:{newRoot: "$ignition"} //ini untuk mengganti root default dari object koordinat
  },
  {
   $sort: {
    "ignition.created": -1
   }
  }
 ]).exec(function(err, data){
  if(err){
    console.log(err);
  }

  res.render('log_ignition_view',{
    dataignition: data
   });
 });
});

module.exports = router;
