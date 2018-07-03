const express = require('express');
const router = express.Router();
const async = require('async');
const mongoose = require('mongoose');
const checkAuth = require('../middleware/check_auth');

var MotorSchema = require('../models/motor_model');

router.get('/:latitude/:longitude', function(req, res) {
 res.render('gmaps_view', {
   lat: req.params.latitude,
   long: req.params.longitude
 });
});


router.get('/all', checkAuth, function(req, res) {
 async.series({
   locations: function(cb){
    MotorSchema.findById(req.userData.userId).exec(function(err, data){
     if(err) return console.log(err);
     cb(err, data.koordinat);
    });
   }
  }, function(err, data){
   res.render('gmaps_view_all',{
    datalokasi: data.locations
   });
  });
});

router.post('/date', checkAuth, function(req, res){
  var today  = new Date(req.body.periode);
  var nextday= new Date(today);
  nextday.setDate(today.getDate()+1);

  console.log(today);
  console.log(nextday);
  MotorSchema.aggregate([
  {
   $unwind: "$koordinat"
  },
  {
    $match:
      {
        _id: mongoose.Types.ObjectId(req.userData.userId),
        "koordinat.created": {
          $gte: today,
          $lt : nextday
        }
      }
  },
  {
   $project: {
    koordinat: 1,
    _id: 0
   }
  },
  {
   $sort: {
    "koordinat.created": -1
   }
  }
 ]).exec(function(err, data){
  console.log(data);
  // res.json(data);
  // var locations = JSON.stringify(data);
  // res.render('gmaps_view_periode',{
  //  datalokasi: locations
  // });
 });
});

module.exports = router;
