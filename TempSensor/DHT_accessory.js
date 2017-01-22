// SETUP
var temperatureNAME = 'DHT Sensor'; //the temperature sensor's name
var uuidNAME = 'hap-nodejs:accessories:dht-sensor'; //UUID name
var $pinNumber = 4 //physical pin 7, BCM pin 4
var $sensor = 11 //change to 22 if you have an AM2032 or DHT 22, leave as 11 is you have DHT11
// END of SETUP

var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var sensorLib = require('node-dht-sensor');

var DHT_SENSOR = {
  currentTemperature: 0,
  currentHumidity: 0,
  initialize: function () {
    return sensorLib.initialize($sensor, $pinNumber);
  },
  getTemperature: function() {
    console.log("Getting the current temperature!");
    if (DHT_SENSOR.initialize()) {
      var readout = sensorLib.read();
      DHT_SENSOR.currentTemperature = parseFloat(readout.temperature.toFixed(1));
      console.log(DHT_SENSOR.currentTemperature);
    } else {
      console.warn('Failed to initialize sensor');
    }
    return DHT_SENSOR.currentTemperature;
  },
  getHumidity: function() {
    console.log("Getting the current humidity");
    if (DHT_SENSOR.initialize()) {
      var readout = sensorLib.read();
      DHT_SENSOR.currentHumidity = parseFloat(readout.humidity.toFixed(1));
      console.log(DHT_SENSOR.currentHumidity);
    } else {
      console.warn('Failed to initialize sensor');
    }
    return DHT_SENSOR.currentHumidity;
  }
}

var sensorUUID = uuid.generate(uuidNAME);
var sensor = exports.accessory = new Accessory(temperatureNAME, sensorUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
sensor.username = "AB:CD:EF:12:34:56";
sensor.pincode = "031-45-154";

sensor
  .addService(Service.TemperatureSensor)
  .getCharacteristic(Characteristic.CurrentTemperature)
  .on('get', function(callback) {
    callback(null, DHT_SENSOR.getTemperature());
  });

sensor
  .addService(Service.HumiditySensor)
  .getCharacteristic(Characteristic.CurrentRelativeHumidity)
  .on('get', function(callback) {
    callback(null, DHT_SENSOR.getHumidity());
  });

// gets our temperature reading every 6 seconds
setInterval(function() {
  // updates the characteristic values so interested iOS devices can get updated
  sensor
    .getService(Service.TemperatureSensor)
    .setCharacteristic(Characteristic.CurrentTemperature, DHT_SENSOR.getTemperature());
  sensor
    .getService(Service.HumiditySensor)
    .setCharacteristic(Characteristic.CurrentRelativeHumidity, DHT_SENSOR.getHumidity());

}, 6000);
