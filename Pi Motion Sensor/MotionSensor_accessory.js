var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var wpi = require('wiring-pi');
var sensorReading;
var newStatus;

var MOTION_SENSOR = {
  motionDetected: false,

  getStatus: function() {
    wpi.setup('phys');
    sensorReading = wpi.digitalRead(15);
    sensorReading = Number(sensorReading);
    if (sensorReading == '1'){
      MOTION_SENSOR.motionDetected = true;
    }
    if (sensorReading == '0'){
      MOTION_SENSOR.motionDetected = false;
    }
  },
  identify: function() {
    console.log("Identify the motion sensor!");
  }
}

// Generate a consistent UUID for our Motion Sensor Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "motionsensor".
var motionSensorUUID = uuid.generate('hap-nodejs:accessories:motionsensor');


var motionSensor = exports.accessory = new Accessory('Motion Sensor', motionSensorUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
motionSensor.username = "1A:2B:3D:4D:2E:AF";
motionSensor.pincode = "031-45-154";

// set some basic properties (these values are arbitrary and setting them is optional)
motionSensor
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Generic")
  .setCharacteristic(Characteristic.Model, "Motion Sensor");

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

setInterval(function() {
  wpi.setup('phys');
  sensorReading = wpi.digitalRead(15);
  sensorReading = Number(sensorReading);
  if (sensorReading == 1){
    newStatus = true;
  }
  if (sensorReading == 0){
    newStatus = false;
  }

  if(newStatus != MOTION_SENSOR.motionDetected){
    console.log("updated status to: " + newStatus);
    MOTION_SENSOR.motionDetected = newStatus;
    motionSensor
      .getService(Service.MotionSensor)
      .setCharacteristic(Characteristic.MotionDetected, MOTION_SENSOR.motionDetected);
  }
}, 500);
