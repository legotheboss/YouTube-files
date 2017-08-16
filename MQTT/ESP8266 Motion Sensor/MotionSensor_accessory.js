var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');

var MQTT_IP = 'localhost' //change this if your MQTT broker is different
var MQTT_TOPIC = 'SecondaryBedroomMotionSensor' //MQTT topic that was set on the Sonoff firmware


var options = {
  port: 1883,
  host: MQTT_IP,
//  username: 'pi', //enable only if you have authentication on your MQTT broker
//  password: 'raspberry', //enable only if you have authentication on your MQTT broker
  clientId: MQTT_TOPIC+'HAP'
};
var client = mqtt.connect(options);
var prevStatus = false;
client.on('message', function(topic, message) {
//  console.log(message.toString());
  prevStatus = MOTION_SENSOR.motionDetected;
  message = message.toString();
  if (message.includes('TRUE')){
    MOTION_SENSOR.motionDetected = true;
  }
  else{
    MOTION_SENSOR.motionDetected = false;
  }
  if (prevStatus != MOTION_SENSOR.motionDetected){
    motionSensor
      .getService(Service.MotionSensor)
      .setCharacteristic(Characteristic.MotionDetected, MOTION_SENSOR.motionDetected);
  }
});

client.on('connect', function () {
  client.subscribe(MQTT_TOPIC+'/data')
});

var MOTION_SENSOR = {
  motionDetected: false,

  getStatus: function() {
    return MOTION_SENSOR.motionDetected;
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
motionSensor.username = "1C:B2:DD:5D:2A:CB";
motionSensor.pincode = "031-45-154";

// set some basic properties (these values are arbitrary and setting them is optional)
motionSensor
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "ESP8266")
  .setCharacteristic(Characteristic.Model, MQTT_TOPIC);

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
