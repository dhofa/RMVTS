const MotorSchema  = require('../../models/motor_model');
const mongoose     = require('mongoose');
const moment       = require('moment');
const RandomString = require('randomstring');
const bcrypt       = require('bcrypt');
const async        = require('async');
const jwt          = require('jsonwebtoken');
const fs           = require('fs-extra');
const request      = require('request');


//multer untuk upload data berupa file
const multer    = require('multer');

const penyimpanan   = multer.diskStorage({
 destination: function(req, file, callback){
  //error di isi null, destinasi file
  let path = './public/uploads/driver';
  fs.mkdirsSync(path);
  callback(null, path);
 },
 filename: function(req, file, callback){
  callback(null, file.originalname);
 }
});

const penyimpanan_profile = multer.diskStorage({
 destination: function(req, file, callback){
  //error di isi null, destinasi file
  let path = './public/uploads/'+req.userData.userId+"/profile";
  fs.mkdirsSync(path);
  callback(null, path);
 },
 filename: function(req, file, callback){
  // var type = file.mimetype.split("/");
  // callback(null, "profile."+type[1]);
  callback(null, "profile.jpg");
 }
});

//mendefinisikan filter untuk image yg di upload
const fileFilter = function(req, file, callback){
 if(file.mimetype === 'image/jpeg'){
  //accept a file
  callback(null, true);
 }else{
  //reject a file
  callback(new Error('Gagal menyimpan foto...'), false);
 }
};

var upload = multer({
 storage: penyimpanan,
 limits : {
   fileSize: 1024 * 1024 * 5 //max 5 mb
 },
 fileFilter: fileFilter
}).single('file_foto');

var upload_profile = multer({
 storage: penyimpanan_profile,
 limits : {
   fileSize: 1024 * 1024 * 5 //max 5 mb
 },
 fileFilter: fileFilter
}).single('file_foto');

//Membuat User
exports.create_user = function(req, res, next){
 MotorSchema.find({ "user.email": req.body.email })
   .exec()
   .then(data_user => {
     if (data_user.length >= 1) {
       return res.status(409).json({
         status : "fail",
         message: "Email sudah digunakan.."
       });
     } else {
      bcrypt.hash(req.body.password, 10, function(err, hash){
        if (err) {
          return res.status(500).json({
            error: err
          });
        } else {
         var create_user = new MotorSchema({
          vehicle_data   :{
            owner        : req.body.owner,
            plate_number : req.body.plate_number,
            address      : req.body.address,
            vehicle_type : req.body.vehicle_type
          },
          user      :{
            email   : req.body.email,
            password: hash
          },
          relay     : {
           gps          : false,
           ignition     : false,
           vibration    : false,
           buzzer       : false
          }
        });

         create_user.save(function(err, data) {
          if(err) {
           console.log(err);
           res.status(500).json({
            status : "fail",
            message: "Some error occurred while creating the user"
           });
          } else {
           return res.status(201).json({
             status    : "success",
             message   : "User Created..",
             data      : {
               id_raspberry : data._id,
               vehicle_data : data.vehicle_data,
               user         : data.user
             }
           });
          }
         });
        }
      });
    }
  });
}

//Login User
exports.loginUser = async (req, res, next) => {
  MotorSchema.find({ "user.email": req.body.email })
    .exec()
    .then(function(data_user){
      if (data_user.length < 1) {
        return res.status(401).json({
          status  : "fail",
          message : "User Not found"
        });
      }
      bcrypt.compare(req.body.password, data_user[0].user.password, async function(err, result){
        if (err) {
          return res.status(401).json({
            status  : "fail",
            message : "Password didn't match.."
          });
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
          //Membuat token dari generate random string
          // let token = RandomString.generate();
          //menyimpan token ke database
          var fcm_token = req.body.fcm_token;
          await MotorSchema.findByIdAndUpdate(data_user[0]._id, {"user.token": token, "user.fcm_token":fcm_token});

          await MotorSchema.findById(data_user[0]._id, (err, data)=>{
           if(err){
            return res.status(500).json({
              status   : "fail",
              message  : "Failed to get data while login.."
            });
           }
           return res.status(200).json({
             status   : "success",
             message  : "Success login..",
             data     : {
              vehicle_data : data.vehicle_data,
              user         : data.user,
              id           : data._id
             }
           });
          });
        }
      });
    })
    .catch(function(err){
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
}

exports.addGpsData = (req, res)=>{
 var id_user       = req.params.id_user;
 var data_latitude = req.body.latitude;
 var data_longitude= req.body.longitude;

 var pushGpsData = {$push: {koordinat: {
  latitude  : data_latitude,
  longitude : data_longitude,
  created   : new Date(),
  periode   : moment().format('l')}}};

 var updateState = {"vehicle_data.last_location.last_latitude"  : data_latitude,
                    "vehicle_data.last_location.last_longitude" : data_longitude};

  async.series({
   proses1 : function(cb){
    MotorSchema.findByIdAndUpdate(id_user, pushGpsData, (err, data)=>{
     if(err) return console.log(err);
     cb(err, data);
    });
   },
   proses2 : function(cb){
    MotorSchema.findByIdAndUpdate(id_user, updateState, function(err, data) {
     if(err) return console.log(err);
     MotorSchema.findById(id_user, (err, result)=>{
      cb(err, result);
     });
    });
   }
  }, function(err, data){
   return res.status(200).json({
     status   : "success",
     message  : "Berhasil mengupdate dan upload data..",
     data     : data.proses1.vehicle_data
   });
  });
};


exports.updateGpsAndroid = (req, res)=>{
 var id_user       = req.userData.userId;
 var data_latitude = req.body.latitude;
 var data_longitude= req.body.longitude;
 var updateState = {"android_device.last_latitude"  : data_latitude,
                    "android_device.last_longitude" : data_longitude};

 MotorSchema.findByIdAndUpdate(id_user, updateState, function(err, data) {
   if(err) return console.log(err);
   MotorSchema.findById(id_user, (err, result)=>{
      if(err){
       return res.status(500).json({
         status   : "fail",
         message  : "Failed to push data.."
       });
      }
      return res.status(200).json({
        status   : "success",
        message  : "Berhasil mengupdate data .."
      });
   });
 });
}

// Driver
exports.uploadImages = (req, res)=>{
 upload(req, res, async (err) => {
  var id_user = req.body.id_user;
  
  if(err){
   return res.end("error uploading file");
  }
  //let base_location = "http://localhost:3000/uploads/driver/";
  // let base_location = "https://rmvts.herokuapp.com/uploads/driver/";
  let base_location = "https://rmvts.jagopesan.com/uploads/driver/";
  let locations = base_location+req.file.originalname;
  var pushImageData = {$push: {driver: {images: req.file.originalname,link_images: locations, created:new Date().toISOString()}}};

  await MotorSchema.findByIdAndUpdate(id_user, pushImageData, (err, data)=>{
   if(err){
    return res.status(500).json({
      status   : "fail",
      message  : "Failed to push data.."
    });
   }
   return res.status(200).json({
     status   : "success",
     message  : "Berhasil menambahkan data .."
   });
  });
  await UpdateLastImageDiver(id_user, locations);
 });

}

// Driver
exports.uploadImagesProfile = (req, res, next)=>{
 upload_profile(req, res, (err) => {
  var id_user = req.userData.userId;
  console.log(id_user);
  console.log(req.file);
  if(err){
   return res.end("error uploading foto profile");
  }
  //let base_location = "http://localhost:3000/uploads/";
  //let base_location = "https://rmvts.herokuapp.com/uploads/";
  let base_location = "https://rmvts.jagopesan.com/uploads/";
  var pushImageData = {"vehicle_data.user_photos": base_location+id_user+"/profile/profile.jpg"};
  MotorSchema.findByIdAndUpdate(id_user, pushImageData, (err, data)=>{
   if(err){
    return res.status(500).json({
      status   : "fail",
      message  : "Failed to update profile.."
    });
   }
   return res.status(200).json({
     status   : "success",
     message  : "Berhasil update profile ..",
     data     : data.vehicle_data
   });
  });
 });
}

//Log Vibration
exports.createLogsVibration = async (req, res)=>{
 var id_user = req.params.id_user;
 var title   = req.body.title;
 var detail  = req.body.detail;
 var pushVibration = {$push: {vibration: {title: title, detail: detail}}};
 await MotorSchema.findByIdAndUpdate(id_user, pushVibration, function(err, data){
  if(err){
   return res.status(500).json({
     status   : "fail",
     message  : "Failed to get data.."
   });
  }
  return res.status(200).json({
    status   : "success",
    message  : "Berhasil menambahkan log vibration..",
    data     : data.vibration
  });
 });
 await AddLogActivity(id_user, title, detail);
};



//Log Ignition
exports.createLogsIgnition = async (req, res)=>{
 var id_user = req.params.id_user;
 var title   = req.body.title;
 var detail  = req.body.detail;
 var pushIgnition = {$push: {ignition: {title: title, detail: detail}}};
 await MotorSchema.findByIdAndUpdate(id_user, pushIgnition, function(err, data){
  if(err){
   return res.status(500).json({
     status   : "fail",
     message  : "Failed to get data.."
   });
  }
  return res.status(200).json({
    status   : "success",
    message  : "Berhasil menambahkan log vibration..",
    data     : data.vibration
  });
 });
 await AddLogActivity(id_user, title, detail);
};


//Log Buzzer
exports.createLogsBuzzer = async(req, res)=>{
 var id_user = req.params.id_user;
 var title   = req.body.title;
 var detail  = req.body.detail;
 var pushBuzzer = {$push: {buzzer: {title: title, detail: detail}}};
 await MotorSchema.findByIdAndUpdate(id_user, pushBuzzer, function(err, data){
  if(err) return console.log(err);
  res.json(data);
 });
 await AddLogActivity(id_user, title, detail);
};


function AddLogActivity(id_user, title, detail) {
 var pushLogActivity = {$push: {log_activity: {title: title, detail: detail}}};
 MotorSchema.findByIdAndUpdate(id_user, pushLogActivity, function(err, data){
  if(err){console.log(err);}
 });
}

function UpdateLastImageDiver(id_user, locations){
 var updateLastImage = {"vehicle_data.last_image_capture.last_driver_photos": locations};
 MotorSchema.findByIdAndUpdate(id_user, updateLastImage, (err, data)=>{
   if(err){console.log(err);}
 });
}
// Relay State
exports.getRelayState = (req, res)=>{
 var id_user = req.params.id_user;
 MotorSchema.findById(id_user, (err, data)=>{
  if(err){
   return res.status(500).json({
     status   : "fail",
     message  : "Failed to get data.."
   });
  }
  return res.status(200).json({
    status   : "success",
    message  : "Berhasil mendapatkan data..",
    data     : data.relay
  });
 });
};

// Get Dashboard
exports.getDashboard = (req, res)=>{
 var id_user = req.userData.userId;
 console.log(id_user);
 MotorSchema.findById(id_user, (err, data)=>{
  if(err){
   return res.status(500).json({
     status   : "fail",
     message  : "Failed to get data.."
   });
  }
  return res.status(200).json({
    status   : "success",
    message  : "Berhasil mendapatkan data..",
    data     : {
     vehicle_data : data.vehicle_data,
     relay        : data.relay
    }
  });
 });
};


// Send Notification
exports.sendNotificationAPI = (req, res)=>{
 var id_user = req.params.id_user;
 var title   = req.body.title;
 var message = req.body.message;

 console.log(id_user);
 MotorSchema.findById(id_user, (err, data)=>{
  if(err){
   return res.status(500).json({
     status   : "fail",
     message  : "Failed to get data.."
   });
  }else{
   var fcm_token = data.user.fcm_token;
   var notification_response = sendNotif(fcm_token, title, message);
   res.end(notification_response);
  }
 });
};

function sendNotif(fcm_token, title, message){
 request({
  url: 'https://fcm.googleapis.com/fcm/send',
  method: 'POST',
  headers: {
    'Content-Type' : 'application/json',
    'Authorization': 'key=AAAA6SDG5dA:APA91bE9lq-PY2j9n7nMd9B8CmVXahq1C9vFbs-CNUnvsJqD6_MkLFFAm1Au5IVyBCFyXAPGa4jYGJCjgogU4HSxWETAOLtTUdb3oQ1I7FhX7SVAPjlMSwfe5Dc6HwFG5kpbvqiOROb1'
  },
  body: JSON.stringify({
    notification: {
        title: title,
        body: message
    },
    "to": fcm_token
    })
   },function(error, response, body) {
      if (error){
        return console.log(error);
      }
      else if (response.statusCode >= 400){
        return console.log("HTTP Error" + response.statusCode + "-" +response.statusCode + "\n" + body);
      }
      else{
        return console.log(body);
      }
  });
}


exports.updateStatusIgnition = (req, res)=>{
	var updateState = {"vehicle_data.last_state_ignition.status": req.body.state,
                    "vehicle_data.last_state_ignition.time": moment().format('l')
                   };
	// MotorSchema.findByIdAndUpdate(req.userData.userId, updateState, function(err, data) {
 MotorSchema.findByIdAndUpdate(req.params.id_user, updateState, function(err, data) {
  if(err){
   return res.status(500).json({
     status   : "fail",
     message  : "ID User Not Found.."
   });
  }
  // MotorSchema.findById(req.userData.userId, (err, result)=>{
  MotorSchema.findById(req.params.id_user, (err, result)=>{
   if(err){
    return res.status(500).json({
      status   : "fail",
      message  : "Gagal mengupdate data.."
    });
   }
   return res.status(200).json({
     status   : "success",
     message  : "Berhasil mengupdate data..",
   });
  });
	});
};


//update state vibration
exports.updateStatusVibration = (req, res)=>{
	var updateState = {"vehicle_data.last_state_vibration.status": req.body.state,
                    "vehicle_data.last_state_vibration.time": moment().format('l')
                   };
	// MotorSchema.findByIdAndUpdate(req.userData.userId, updateState, function(err, data) {
 MotorSchema.findByIdAndUpdate(req.params.id_user, updateState, function(err, data) {
  if(err){
   return res.status(500).json({
     status   : "fail",
     message  : "ID User Not Found.."
   });
  }
  // MotorSchema.findById(req.userData.userId, (err, result)=>{
  MotorSchema.findById(req.params.id_user, (err, result)=>{
   if(err){
    return res.status(500).json({
      status   : "fail",
      message  : "Gagal mengupdate data.."
    });
   }
   return res.status(200).json({
     status   : "success",
     message  : "Berhasil mengupdate data..",
   });
  });
	});
};

// Get Images
exports.getImages = (req, res)=>{
 var id_user = req.userData.userId;
 console.log(id_user);
 MotorSchema.findById(id_user, (err, data)=>{
  if(err) return console.log(err);
  return res.status(200).json({
    status   : "success",
    message  : "Berhasil mendapatkan data..",
    data     : {
     driver : data.driver
    }
  });
 });
};


// Get Vibration
exports.getVibration = (req, res)=>{
 var id_user = req.userData.userId;
 console.log(id_user);
 MotorSchema.findById(id_user, (err, data)=>{
  if(err) return console.log(err);
  return res.status(200).json({
    status   : "success",
    message  : "Berhasil mendapatkan data..",
    data     : {
     driver : data.vibration
    }
  });
 });
};


// Get Ignition
exports.getIgnition = (req, res)=>{
 var id_user = req.userData.userId;
 console.log(id_user);
 MotorSchema.findById(id_user, (err, data)=>{
  if(err) return console.log(err);
  return res.status(200).json({
    status   : "success",
    message  : "Berhasil mendapatkan data..",
    data     : {
     driver : data.ignition
    }
  });
 });
};

// Get Buzzer
exports.getBuzzer = (req, res)=>{
 var id_user = req.userData.userId;
 console.log(id_user);
 MotorSchema.findById(id_user, (err, data)=>{
  if(err) return console.log(err);
  return res.status(200).json({
    status   : "success",
    message  : "Berhasil mendapatkan data..",
    data     : {
     driver : data.buzzer
    }
  });
 });
};

//Get GPS
exports.getGpsData = (req, res)=>{
 async.series({
   locations: function(cb){
    MotorSchema.findById(req.userData.userId).exec(function(err, data){
     if(err) return console.log(err);
     cb(err, data.koordinat);
    });
   }
  }, function(err, data){
   return res.status(200).json({
     status   : "success",
     message  : "Berhasil mendapatkan data..",
     data     : {
      koordinat : data.locations
     }
   });
  });
}

//get gps by tanggal_periode
exports.getGpsDataByDate = (req, res)=>{
   var today  = new Date(req.query.periode);
   var nextday= new Date(today);
   nextday.setDate(today.getDate()+1);

   console.log(req.query.periode);
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
    $replaceRoot:{newRoot: "$koordinat"} //ini untuk mengganti root default dari object koordinat
   },
   {
    $sort: {
     "koordinat.created": -1
    }
   }
  ]).exec(function(err, data){
   if(err){
    return res.status(500).json({
      status   : "fail",
      message  : "Gagal mendapatkan data.."
    });
   }

   return res.status(200).json({
     status   : "success",
     message  : "Berhasil mendapatkan data..",
     data     : {
       koordinat : data
     }
   });
  });
}

//get log activity by tanggal_periode
exports.getLogActivityByDate = (req, res)=>{
   var today  = new Date(req.query.periode);
   var nextday= new Date(today);
   nextday.setDate(today.getDate()+1);
   console.log(req.query.periode);
   console.log(today);
   console.log(nextday);
   MotorSchema.aggregate([
   {
    $unwind: "$log_activity"
   },
   {
     $match:
       {
         _id: mongoose.Types.ObjectId(req.userData.userId),
         "log_activity.created": {
           $gte: today,
           $lt : nextday
         }
       }
   },
   {
    $project: {
     log_activity: 1,
     _id: 0
    }
   },
   {
    $replaceRoot:{newRoot: "$log_activity"} //ini untuk mengganti root default dari object koordinat
   },
   {
    $sort: {
     "log_activity.created": -1
    }
   }
  ]).exec(function(err, data){
   if(err){
    return res.status(500).json({
      status   : "fail",
      message  : "Gagal mendapatkan data.."
    });
   }

   return res.status(200).json({
     status   : "success",
     message  : "Berhasil mendapatkan data..",
     data     : {
       log_activity :data
     }
   });
  });
}

//get log vibration by tanggal_periode
exports.getLogVibrationByDate = (req, res)=>{
   var today  = new Date(req.query.periode);
   var nextday= new Date(today);
   nextday.setDate(today.getDate()+1);

   console.log(req.query.periode);
   console.log(today);
   console.log(nextday);
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
    return res.status(500).json({
      status   : "fail",
      message  : "Gagal mendapatkan data.."
    });
   }

   return res.status(200).json({
     status   : "success",
     message  : "Berhasil mendapatkan data..",
     data     : {
       vibration :data
     }
   });
  });
}

//get log ignition by tanggal_periode
exports.getLogIgnitionByDate = (req, res)=>{
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
    return res.status(500).json({
      status   : "fail",
      message  : "Gagal mendapatkan data.."
    });
   }

   return res.status(200).json({
     status   : "success",
     message  : "Berhasil mendapatkan data..",
     data     : {
       ignition :data
     }
   });
  });
}

//get log buzzer by tanggal_periode
exports.getLogBuzzerByDate = (req, res)=>{
   var today  = new Date(req.query.periode);
   var nextday= new Date(today);
   nextday.setDate(today.getDate()+1);

   console.log(req.query.periode);
   console.log(today);
   console.log(nextday);
   MotorSchema.aggregate([
   {
    $unwind: "$buzzer"
   },
   {
     $match:
       {
         _id: mongoose.Types.ObjectId(req.userData.userId),
         "buzzer.created": {
           $gte: today,
           $lt : nextday
         }
       }
   },
   {
    $project: {
     buzzer: 1,
     _id: 0
    }
   },
   {
    $replaceRoot:{newRoot: "$buzzer"} //ini untuk mengganti root default dari object koordinat
   },
   {
    $sort: {
     "buzzer.created": -1
    }
   }
  ]).exec(function(err, data){
   if(err){
    return res.status(500).json({
      status   : "fail",
      message  : "Gagal mendapatkan data.."
    });
   }

   return res.status(200).json({
     status   : "success",
     message  : "Berhasil mendapatkan data..",
     data     : {
       buzzer :data
     }
   });
  });
}

exports.updateRelayGps = (req, res)=>{
	var updateState = {"relay.gps": req.body.state};
	// MotorSchema.findByIdAndUpdate(req.userData.userId, updateState, function(err, data) {
 MotorSchema.findByIdAndUpdate(req.params.id_user, updateState, function(err, data) {
  if(err){
   return res.status(500).json({
     status   : "fail",
     message  : "ID User Not Found.."
   });
  }
  // MotorSchema.findById(req.userData.userId, (err, result)=>{
  MotorSchema.findById(req.params.id_user, (err, result)=>{
   if(err){
    return res.status(500).json({
      status   : "fail",
      message  : "Gagal mendapatkan data.."
    });
   }
   return res.status(200).json({
     status   : "success",
     message  : "Berhasil mendapatkan data..",
     data     : {
      relay   : result.relay
     }
   });
  });
	});
};

exports.updateRelayIgnition = (req, res)=>{
	var updateState = {"relay.ignition": req.body.state};
	// MotorSchema.findByIdAndUpdate(req.userData.userId, updateState, function(err, data) {
 MotorSchema.findByIdAndUpdate(req.params.id_user, updateState, function(err, data) {
  if(err){
   return res.status(500).json({
     status   : "fail",
     message  : "ID User Not Found.."
   });
  }
  // MotorSchema.findById(req.userData.userId, (err, result)=>{
  MotorSchema.findById(req.params.id_user, (err, result)=>{
   if(err){
    return res.status(500).json({
      status   : "fail",
      message  : "Gagal mendapatkan data.."
    });
   }
   return res.status(200).json({
     status   : "success",
     message  : "Berhasil mendapatkan data..",
     data     : {
      relay   : result.relay
     }
   });
  });
	});
};

exports.updateRelayVibration = (req, res)=>{
	var updateState = {"relay.vibration": req.body.state};
	// MotorSchema.findByIdAndUpdate(req.userData.userId, updateState, function(err, data) {
 MotorSchema.findByIdAndUpdate(req.params.id_user, updateState, function(err, data) {
  if(err){
   return res.status(500).json({
     status   : "fail",
     message  : "ID User Not Found.."
   });
  }
  // MotorSchema.findById(req.userData.userId, (err, result)=>{
  MotorSchema.findById(req.params.id_user, (err, result)=>{
   if(err){
    return res.status(500).json({
      status   : "fail",
      message  : "Gagal mendapatkan data.."
    });
   }
   return res.status(200).json({
     status   : "success",
     message  : "Berhasil mendapatkan data..",
     data     : {
      relay   : result.relay
     }
   });
  });
	});
};


exports.updateRelayBuzzer = (req, res)=>{
	var updateState = {"relay.buzzer": req.body.state};
	// MotorSchema.findByIdAndUpdate(req.userData.userId, updateState, function(err, data) {
 MotorSchema.findByIdAndUpdate(req.params.id_user, updateState, function(err, data) {
  if(err){
   return res.status(500).json({
     status   : "fail",
     message  : "ID User Not Found.."
   });
  }
  // MotorSchema.findById(req.userData.userId, (err, result)=>{
  MotorSchema.findById(req.params.id_user, (err, result)=>{
   if(err){
    return res.status(500).json({
      status   : "fail",
      message  : "Gagal mendapatkan data.."
    });
   }
   return res.status(200).json({
     status   : "success",
     message  : "Berhasil mendapatkan data..",
     data     : {
      relay   : result.relay
     }
   });
  });
	});
};














// let user = await MotorSchema.find({
//  "user.email"    : req.body.email,
//  "user.password" : req.body.password
// });
// if (user.length > 0) {
//    let token = RandomString.generate();
//    await MotorSchema.findByIdAndUpdate(user[0]._id, {"user.token": token});
//    res.json({
//     status: true,
//     message: "Berhasil login",
//     data: {
//      token: token
//     }
//    })
// } else {
//   res.json({
//    status: false,
//    message: "User tidak ditemukan"
//   })
// }


// exports.coba = async (req, res) => {
//  let mytoken = req.getParsed('x-token-header');
//  let user = await MotorSchema.find({"user.token":mytoken.token});
//  console.log(user.length);
//
//  if (user.length > 0){
//   var pushing = {"vehicle_data.address": 'Cepu'};
//   await MotorSchema.findByIdAndUpdate(user[0]._id, pushing, (err, result)=>{
//    if(err) return console.log(err);
//    res.json("berhasill");
//   });
//  } else {
//   res.json("Token Expired");
//  }
//
// }
