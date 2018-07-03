const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check_auth_api');

/* API for Node. */
const motorController = require('../api/controllers/motor_controller');

//Authentication
router.post('/users/create-user', motorController.create_user);
router.post('/users/login', motorController.loginUser);

//Gps Router Api
router.post('/gps/:id_user', motorController.addGpsData);
router.get('/gps', checkAuth, motorController.getGpsData);
router.get('/gps-periode', checkAuth, motorController.getGpsDataByDate);

//Log activity
router.get('/log-activity-periode', checkAuth, motorController.getLogActivityByDate);

//Driver Photos
router.post('/images/upload', motorController.uploadImages);
router.get('/get-images', checkAuth, motorController.getImages);

//Log_Vibration
router.post('/log-vibration/create/:id_user', motorController.createLogsVibration);
router.get('/get-vibration', checkAuth, motorController.getVibration);
router.get('/log-vibration-periode', checkAuth, motorController.getLogVibrationByDate);

//Log_Ignition
router.post('/log-ignition/create/:id_user', motorController.createLogsIgnition);
router.get('/get-ignition', checkAuth, motorController.getIgnition);
router.get('/log-ignition-periode', checkAuth, motorController.getLogIgnitionByDate);

//Log_Buzzer
router.post('/log-buzzer/create/:id_user', motorController.createLogsBuzzer);
router.get('/get-buzzer', checkAuth, motorController.getBuzzer);
router.get('/log-buzzer-periode', checkAuth, motorController.getLogBuzzerByDate);

//relay
router.get('/get-relay-state/:id_user', motorController.getRelayState);
router.post('/update-relay/gps/:id_user', motorController.updateRelayGps);
router.post('/update-relay/ignition/:id_user', motorController.updateRelayIgnition);
router.post('/update-relay/vibration/:id_user', motorController.updateRelayVibration);
router.post('/update-relay/buzzer/:id_user', motorController.updateRelayBuzzer);

//dashboard
router.get('/get-dashboard', checkAuth, motorController.getDashboard);
router.post('/update-status-ignition/:id_user', motorController.updateStatusIgnition);
router.post('/update-status-vibration/:id_user', motorController.updateStatusVibration);

//send Notification
router.post('/notification/create/:id_user', motorController.sendNotificationAPI);

//profile
router.post('/update-profile', checkAuth, motorController.uploadImagesProfile);

//update GPS android_device
router.post('/update-gps-android', checkAuth, motorController.updateGpsAndroid);

module.exports = router;
