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
router.get('/tanggal_periode', function(req, res) {
  MotorSchema.find()
          .populate({ periode: { $regex: /req.params.tanggal_periode/ } })
          .select('_id latitude longitude created')
          // .limit(5)
          .then(function(data){
            res.render('log_gps_view', {
              datalokasi: data
            });
          })
          .catch(function(error) {
            console.log(error);
            res.status(500).json({error});
          });
});

module.exports = router;
