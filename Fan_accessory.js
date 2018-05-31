
var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var cmd = require('node-cmd');

//START CONFIG//
var accessoryName = 'Ceiling Fan';
var fanUUID = uuid.generate('hap-nodejs:accessories:CeilingHunterFan');
//END CONFIG//

// here's a fake hardware device that we'll expose to HomeKit
var CEILING_FAN = {
  powerOn: false,
  rSpeed: 0, // percentage
  setPowerOn: function(on) {
    if(on){
        CEILING_FAN.powerOn = on;
    	CEILING_FAN.setSpeed(CEILING_FAN.rPrev);
    }
    else{
      cmd.run('sudo python /home/pi/HAP-NodeJS/python/fan0.py');
      CEILING_FAN.powerOn = false;
    }
  },
  setSpeed: function(value) {
    console.log("Setting fan rSpeed to %s", value);
    CEILING_FAN.rSpeed = value;
    if (value > 0 && value < 33) {
      cmd.run('sudo python /home/pi/HAP-NodeJS/python/fan1.py');
    } else if (value == 0) {
      cmd.run('sudo python /home/pi/HAP-NodeJS/python/fan0.py');
    } else if (value > 34 && value < 66) {
      cmd.run('sudo python /home/pi/HAP-NodeJS/python/fan2.py');
    } else  if (value > 67 && value < 101) {
      cmd.run('sudo python /home/pi/HAP-NodeJS/python/fan3.py');
    }
  },
  identify: function() {
    console.log("Fan Indentified!");
  }
}

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake fan.
var fan = exports.accessory = new Accessory('Hunter Fan', fanUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
fan.username = "1A:2B:3C:4D:5E:FF";
fan.pincode = "031-45-154";

// set some basic properties (these values are arbitrary and setting them is optional)
fan
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Hunter Fan Inc.")

// listen for the "identify" event for this Accessory
fan.on('identify', function(paired, callback) {
  CEILING_FAN.identify();
  callback(); // success
});

// Add the actual Lightbulb Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
fan
  .addService(Service.Fan, accessoryName) // services exposed to the user should have "names" like "Fake Light" for us
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    CEILING_FAN.setPowerOn(value);
    callback(); // Our fake Light is synchronous - this value has been successfully set
  });

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
fan
  .getService(Service.Fan)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {

    // this event is emitted when you ask Siri directly whether your fan is on or not. you might query
    // the fan hardware itself to find this out, then call the callback. But if you take longer than a
    // few seconds to respond, Siri will give up.

    var err = null; // in case there were any problems

    if (CEILING_FAN.powerOn) {
      callback(err, true);
    }
    else {
      callback(err, false);
    }
  });

// also add an "optional" Characteristic for Brightness
fan
  .getService(Service.Fan)
  .addCharacteristic(Characteristic.RotationSpeed)
  .on('get', function(callback) {
    callback(null, CEILING_FAN.rSpeed);
  })
  .on('set', function(value, callback) {
    CEILING_FAN.setSpeed(value);
    callback();
  })
