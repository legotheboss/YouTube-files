var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var ds18b20 = require('ds18b20');
var temperatureNAME = 'Temperature Sensor'; //the temperature sensor's name
var uuidNAME = 'hap-nodejs:accessories:temperature-sensor'; //UUID name
var dsSensor = '28-0215657fxxxx'; // the temperature sensor's id

// here's the temperature sensor device that we'll expose to HomeKit
var TEMP_SENSOR = {
  currentTemperature: ds18b20.temperatureSync(dsSensor),
  getTemperature: function() {
    console.log("Getting the current temperature!");
    var tempSEN = ds18b20.temperatureSync(dsSensor);
    currentTemperature = tempSEN;
    return TEMP_SENSOR.currentTemperature;
  },
}

// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary "namespace" and the string "temperature-sensor".
var sensorUUID = uuid.generate(uuidNAME);

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake lock.
var sensor = exports.accessory = new Accessory(temperatureNAME, sensorUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
sensor.username = "AB:CD:EF:12:34:56";
sensor.pincode = "031-45-154";

// Add the actual TemperatureSensor Service.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
sensor
  .addService(Service.TemperatureSensor)
  .getCharacteristic(Characteristic.CurrentTemperature)
  .on('get', function(callback) {

    // return our current value
    callback(null, TEMP_SENSOR.getTemperature());
  });

// gets our temperature reading every 10 seconds
setInterval(function() {

  var tempSEN = ds18b20.temperatureSync(dsSensor);
  TEMP_SENSOR.currentTemperature = tempSEN;

  // update the characteristic value so interested iOS devices can get notified
  sensor
    .getService(Service.TemperatureSensor)
    .setCharacteristic(Characteristic.CurrentTemperature, TEMP_SENSOR.currentTemperature);

}, 10000);
