const mongoose = require('mongoose');
const motorSchema = mongoose.Schema({
 vehicle_data : {
  owner        : {type: String,default:"No Data.."},
  plate_number : {type: String,default:"No Data.."},
  address      : {type: String,default:"No Data.."},
  vehicle_type : {type: String,default:"No Data.."},
  user_photos  : {type: String, default:"https:rmvts.herokuapp.com/images/motor.jpg"},
  last_state_ignition: {
   status : {type: String,default:"No Data.."},
   time   : {type: Date, default: Date.now}
  },
  last_state_vibration: {
    status : {type: String,default:"No Data.."},
    time   : {type: Date, default: Date.now}
  },
  last_location: {
    last_latitude  : {type: Number, default: 0},
    last_longitude : {type: Number, default: 0},
    time   : {type: Date, default: Date.now}    
  },
  last_image_capture: {
    last_driver_photos : {type: String, default:"https:rmvts.herokuapp.com/images/motor.jpg"},
    time   : {type: Date, default: Date.now}    
  }
 },
 relay:{
 	gps          : Boolean,
 	ignition     : Boolean,
 	vibration    : Boolean,
 	buzzer       : Boolean
 },
 android_device : {
  last_latitude  : {type: Number, default: 0},
  last_longitude : {type: Number, default: 0},
  time   : {type: Date, default: Date.now}    
 },
 user:{
 	email     : {
      type    : String,
      required: true,
      unique  : true,
      match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
 	password  : {type: String, required: true},
  token     : {type: String,default:"No Data.."},
  fcm_token : {type: String,default:"No Data.."}
 },
 koordinat  :[{
  latitude  : {type: Number, required: true, default: 0},
  longitude : {type: Number, required: true, default: 0},
  created   : {type: Date  , required: true},
  periode   : {type: Date  , required: true}
 }],
 driver:[{
  images      : {type: String, required: true, default: "No Data"},
  link_images : {type: String, required: true, default: "No Data"},
  created     : {type: Date  , required: true}
 }],
 vibration : [{
  title       : {type: String,default:"No Data.."},
  detail      : {type: String,default:"No Data.."},
  created     : {type: Date, default: Date.now}
 }],
 ignition : [{
  title       : {type: String,default:"No Data.."},
  detail      : {type: String,default:"No Data.."},
  created     : {type: Date, default: Date.now}
 }],
 buzzer : [{
  title       : {type: String,default:"No Data.."},
  detail      : {type: String,default:"No Data.."},
  created     : {type: Date, default: Date.now}
 }],
 log_activity : [{
  title       : {type: String,default:"No Data.."},
  detail      : {type: String,default:"No Data.."},
  created     : {type: Date, default: Date.now}
 }]
},{
 timestamps: true
});

module.exports = mongoose.model('MotorSchema', motorSchema);
