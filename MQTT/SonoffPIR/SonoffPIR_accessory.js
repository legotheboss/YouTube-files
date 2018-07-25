var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');

var sensorName = 'Sonoff Motion Sensor'; //Sensor Name that will appear in HomeKit
var MQTT_TOPIC = 'sonoff-PIR'; //MQTT topic that was set on the Sonoff firmware


var MQTT_IP = 'localhost'; //change this if your MQTT broker is different
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
  if (message.includes('ON')){
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
  client.subscribe('cmnd/'+MQTT_TOPIC+'/POWER1')
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

// Generate a consistent UUID for our Sonoff Motion Sensor Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "motionsensor".
// Make sure the UUIDs are different across all accessory files on HAP
var motionSensorUUID = uuid.generate(sensorName+'hap-nodejs:accessories:SonoffPIR'+MQTT_TOPIC);
var motionSensor = exports.accessory = new Accessory(sensorName, motionSensorUUID);

// Add properties for publishing (in case you use Core.js and not BridgedCore.js)
motionSensor.username = "1C:B2:DD:5D:2A:CB";
motionSensor.pincode = "031-45-154";

motionSensor
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Sonoff")
  .setCharacteristic(Characteristic.Model, MQTT_TOPIC);

motionSensor.on('identify', function(paired, callback) {
  MOTION_SENSOR.identify();
  callback(); // success
});

motionSensor
  .addService(Service.MotionSensor, sensorName)
  .getCharacteristic(Characteristic.MotionDetected)
  .on('get', function(callback) {
     MOTION_SENSOR.getStatus();
     callback(null, Boolean(MOTION_SENSOR.motionDetected));
});
