var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var api = require('api-quick');
api.init(9999,{'consoleLog':'none'});
var endpoints = {};

var sensorName = 'MotionEye Motion Sensor';
var motionSensorUUID = uuid.generate('hap-nodejs:accessories:raspberrymotionsensor'+ sensorName);
var motionSensor = exports.accessory = new Accessory(sensorName, motionSensorUUID);
// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
motionSensor.username = "AA:31:4D:41:2E:BC";
motionSensor.pincode = "031-45-154";

var MOTION_SENSOR = {
  motionDetected: false,
  getStatus: function() {
//    console.log("Status Requested");
  },
  identify: function() {
    console.log("Identify the motion sensor!");
  }
}

motionSensor.on('identify', function(paired, callback) {
  MOTION_SENSOR.identify();
  callback(); // success
});

motionSensor
  .addService(Service.MotionSensor, "Motion Sensor")
  .getCharacteristic(Characteristic.MotionDetected)
  .on('get', function(callback) {
     MOTION_SENSOR.getStatus();
     callback(null, Boolean(MOTION_SENSOR.motionDetected));
});

endpoints.startMotion = function() {
  MOTION_SENSOR.motionDetected = true;
  motionSensor
    .getService(Service.MotionSensor)
    .setCharacteristic(Characteristic.MotionDetected, MOTION_SENSOR.motionDetected);
//  return "Set to: Motion Detected";
};
endpoints.endMotion = function() {
  MOTION_SENSOR.motionDetected = false;
  motionSensor
    .getService(Service.MotionSensor)
    .setCharacteristic(Characteristic.MotionDetected, MOTION_SENSOR.motionDetected);
//  return "Set to: Motion No-More";
};
api.addEndpoints(endpoints);
