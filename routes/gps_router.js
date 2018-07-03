const express = require('express');
const router = express.Router();
const async = require('async');
const checkAuth = require('../middleware/check_auth');

var MotorSchema = require('../models/motor_model');

/* GET home page. */
router.get('/', checkAuth, function(req, res, next){
 async.series({
  oby_motor: function(cb){
   MotorSchema.find({}).exec(function(err, data){
    if(err) return console.log(err);
    cb(err, data);
   });
  }
 }, function(err, result){
  res.render('gps_view',{
   //digunakan di view (di tampilkan data user ke table)
   data_motor: result.oby_motor._id
  });
 });
});

router.get('/:motorId', function(req, res) {
 async.series({
  relaystatus: (cb)=>{
   MotorSchema.findById(req.params.motorId, (err, data)=>{
    if(err) return console.log(err);
    cb(err, data.relay);
   });
  }
 }, (err, result)=>{
  console.log(result.relaystatus);
  res.render('kontrolled-detail', {relay: result.relaystatus, mobilId: req.params.motorId});
 });

});

module.exports = router;
