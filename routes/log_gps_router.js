const express = require('express');
const router = express.Router();
const async = require('async');
const checkAuth = require('../middleware/check_auth');

var MotorSchema = require('../models/motor_model');

/* GET users listing. */
router.get('/', checkAuth, function(req, res) {
          async.series({
            locations: function(cb){
             MotorSchema.findById(req.userData.userId).exec(function(err, data){
              if(err) return console.log(err);
              cb(err, data.koordinat);
             });
            }
           }, function(err, data){
            res.render('log_gps_view',{
             datalokasi: data.locations
            });
           });
});

/* GET users listing. */
router.get('/:tanggal_periode', function(req, res) {
  var today   = new Date(req.params.tanggal_periode);
  var nextDay = new Date(today.getDate()+1);

  console.log("today =>", today);
  console.log("nextDay =>", nextDay);

});

module.exports = router;
