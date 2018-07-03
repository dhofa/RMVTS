const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bodyParser  = require('body-parser');
const headerParser  = require('header-parser');
const mongoose    = require('mongoose');
const database = require('./config/database');

const indexRouter = require('./routes/index');
const apiRouter   = require('./routes/api_router');
const logGpsRouter= require('./routes/log_gps_router');
const logCameraRouter= require('./routes/log_camera_router');
const logVibrationRouter= require('./routes/log_vibration_router');
const logIgnitionRouter= require('./routes/log_ignition_router');
const controllDeviceRouter = require('./routes/controll_device_router');
const gmapsRouter = require('./routes/gmaps_router');
const realtimeGmapsRouter = require('./routes/realtime_gmaps_router');
const loginRouter = require('./routes/login_router');
const checkAuth = require('./middleware/check_auth');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
require('dotenv').config();

//koneksi ke database mongoDB ATLAS
// mongoose.connect('mongodb+srv://admin:admin123@rmvts-kqh55.mongodb.net/',{
//   dbName: 'RMVTS'
// });

mongoose.connect(database.url, (err)=>{
 console.log('MongoDB Connected..');
});
mongoose.Promise = global.Promise;

require('./socket/socket')(io);

app.use(function(req, res, next){
 res.io = io;
 next();
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(headerParser);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/api', apiRouter);
app.use('/log_gps', logGpsRouter);
app.use('/log_camera', logCameraRouter);
app.use('/log_vibration', logVibrationRouter);
app.use('/log_ignition', logIgnitionRouter);
app.use('/controll_device', controllDeviceRouter);
app.use('/gmaps', gmapsRouter);
app.use('/realtime_gmaps', realtimeGmapsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = {app: app, server: server};
