var express = require('express');
var router = express.Router();
var MotorSchema  = require('../models/motor_model');
var bcrypt       = require('bcrypt');
var jwt          = require('jsonwebtoken');

router.get('/', (req, res) => {
  res.render('login_view');
});
 
router.post('/signin', (req, res, next) => {
   console.log(req.body.email);
   console.log(req.body.password);

   MotorSchema.find({ "user.email": req.body.email })
     .exec()
     .then(function(data_user){
       if (data_user.length < 1) {
        res.redirect('/login?check=2');          
       }
       bcrypt.compare(req.body.password, data_user[0].user.password, async function(err, result){
         if (err) {
          res.redirect('/login?check=2'); 
         }
         if (result) {
           const token = jwt.sign({
             //parameter pertama payload yg ingin disisipkan
             email : data_user[0].user.email,
             userId: data_user[0]._id
            },
             //parameter kedua private key
             process.env.JWT_KEY
            // ,{expiresIn: "1h"}
           );
           await MotorSchema.findByIdAndUpdate(data_user[0]._id, {"user.token": token});
           console.log(token);
           //set cookie
           await res.cookie('token', token, {
             // path: '/',
             // domain: process.env.SERVER_HOST,
             httpOnly: true,
             // secure: true,
             maxAge: 1000 * 60 * 60 * 24 * 30 * 12
             // expires: 1000 * 60 * 60 * 24 * 30 * 12
           });
           res.redirect('/');
         }
       });
     })
     .catch(function(err){
       console.log(err);
       res.status(500).json({
         error: err
       });
     });
});


router.post('/signup', (req, res, next) => {
  console.log(req.body.email);
  console.log(req.body.password);

  MotorSchema.find({ "user.email": req.body.email })
  .exec()
  .then(data_user => {
    if (data_user.length >= 1) {
      res.redirect('/login?check=1'); 
    } else {
     bcrypt.hash(req.body.signup_password, 10, function(err, hash){
       if (err) {
        console.log(err);
       } else {
        var create_user = new MotorSchema({
         vehicle_data   :{
           owner        : req.body.signup_owner,
           plate_number : req.body.signup_plate_number,
           address      : req.body.signup_address,
           vehicle_type : req.body.signup_vehicle_type
         },
         user      :{
           email   : req.body.signup_email,
           password: hash
         },
         relay     : {
          gps          : false,
          ignition     : false,
          vibration    : false,
          buzzer       : false,
          realtime_gps : false
         }
       });

        create_user.save(function(err, data) {
         if(err) {
          res.redirect('/login?check=1');   
         } else {
          res.redirect('/login');   
         }
        });
       }
     });
   }
 });

});

module.exports = router;
