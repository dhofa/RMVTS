const express = require('express');
const router = express.Router();
const async = require('async');
const MotorSchema = require('../models/motor_model');
const checkAuth = require('../middleware/check_auth');

router.get('/', checkAuth, function(req, res) {
  async.series({
   driver: (cb)=>{
     MotorSchema.findById("5af166ddaf533a4b9c3fc0d6").exec((err, data)=>{
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


router.get('/tanggal_periode', function(req, res) {
  MotorSchema.find()
          .populate({ "koordinat.periode": { $regex: /req.params.tanggal_periode/ } })
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
