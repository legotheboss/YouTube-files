var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var api = require('api-quick').init(9999); // change 9999 to any port not being used
var endpoints = {};
endpoints.requestNotification = function() {
  MOTION_SENSOR.motionDetected = true;
  motionSensor
    .getService(Service.MotionSensor)
    .setCharacteristic(Characteristic.MotionDetected, MOTION_SENSOR.motionDetected);
  MOTION_SENSOR.motionDetected = false;
  return "Successfully Requested Notification";
};
api.addEndpoints(endpoints);

var MOTION_SENSOR = {
  motionDetected: false,

  getStatus: function() {
    console.log("Status Requested");
  },
  identify: function() {
    console.log("Identify the motion sensor!");
  }
}

// Generate a consistent UUID for our Motion Sensor Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "motionsensor".
var motionSensorUUID = uuid.generate('hap-nodejs:accessories:motioneyemotionsensor');


var motionSensor = exports.accessory = new Accessory('MotionEye Motion Sensor', motionSensorUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
motionSensor.username = "1A:2B:3D:4D:2E:AF";
motionSensor.pincode = "031-45-154";


// listen for the "identify" event for this Accessory
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
