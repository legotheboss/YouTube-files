var cmd = require('node-cmd');
var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;

var relayPin = 16; //Physical Pin Number for the relay you wish to be able to use. Change as you desire...

var LightController = {
  name: "Raspberry Light", //name of accessory
  pincode: "031-45-154",
  username: "FA:3C:ED:5A:1A:1A", // MAC like address used by HomeKit to differentiate accessories.
  manufacturer: "HAP-NodeJS", //manufacturer (optional)
  model: "v1.0", //model (optional)
  serialNumber: "A12S345KGB", //serial number (optional)

  power: false, //curent power status

  outputLogs: false, //output logs

  setPower: function(status) { //set power of accessory
    if(this.outputLogs) console.log("Turning the '%s' %s", this.name, status ? "on" : "off");
    this.power = status;
    if(status) cmd.run('sudo python /home/pi/HAP-NodeJS/python/light1.py ' + relayPin);
    else cmd.run('sudo python /home/pi/HAP-NodeJS/python/light0.py ' + relayPin);
  },

  getPower: function() { //get power of accessory
    if(this.outputLogs) console.log("'%s' is %s.", this.name, this.power ? "on" : "off");
    return this.power ? true : false;
  },

  identify: function() { //identify the accessory
    if(this.outputLogs) console.log("Identify the '%s'", this.name);
  }
}

// Generate a consistent UUID for our light Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "light".
var lightUUID = uuid.generate('hap-nodejs:accessories:light' + LightController.name);

// This is the Accessory that we'll return to HAP-NodeJS that represents our light.
var lightAccessory = exports.accessory = new Accessory(LightController.name, lightUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
lightAccessory.username = LightController.username;
lightAccessory.pincode = LightController.pincode;

lightAccessory
  .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, LightController.manufacturer)
    .setCharacteristic(Characteristic.Model, LightController.model)
    .setCharacteristic(Characteristic.SerialNumber, LightController.serialNumber);

lightAccessory.on('identify', function(paired, callback) {
  LightController.identify();
  callback();
});

lightAccessory
  .addService(Service.Lightbulb, LightController.name)
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    LightController.setPower(value);
    callback();
  })
  .on('get', function(callback) {
    callback(null, LightController.getPower());
  });
