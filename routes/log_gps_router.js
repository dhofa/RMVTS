const express    = require('express');
const router     = express.Router();
const async      = require('async');
const checkAuth  = require('../middleware/check_auth');
const mongoose   = require('mongoose');
const MotorSchema = require('../models/motor_model');

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
router.get('/:tanggal_periode', checkAuth,function(req, res) {
  var today  = new Date(req.params.tanggal_periode);
  var nextday= new Date(today);
  nextday.setDate(today.getDate()+1);
  console.log("today =>", today);
  console.log("nextDay =>", nextday);

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
    $replaceRoot:{newRoot: "$koordinat"} //ini untuk mengganti root default dari object koordinat
   },
   {
    $sort: {
     "koordinat.created": -1
    }
   }
  ]).exec(function(err, data){
   if(err){
    console.log(err);   
   }

   console.log(data);
   res.render('log_gps_view',{
    datalokasi: data
   });
  });

});

module.exports = router;
