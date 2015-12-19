var cmd=require('node-cmd');
var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var err = null; // in case there were any problems
var SiriName = "Vizio TV" //what you should tell Siri to turn on the TV

// here's a fake hardware device that we'll expose to HomeKit
var TV_OUTLET = {
    setPowerOn: function(on) { 
    console.log("Turning the TV %s!...", on ? "on" : "off");
    if (on) {
          TV_OUTLET.powerOn = true;
          if(err) { return console.log(err); }
          cmd.run('sh /home/pi/HAP-NodeJS/TV/tvON');
	  console.log("the TV is now on.");
    } else {
          TV_OUTLET.powerOn = false;
          if(err) { return console.log(err); }
          cmd.run('sh /home/pi/HAP-NodeJS/TV/tvOFF');
	  console.log("the TV is now off.");
    }
  },
    identify: function() {
    console.log("Identify the outlet.");
    }
}

// Generate a consistent UUID for our outlet Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the accessory name.
var outletUUID = uuid.generate('hap-nodejs:accessories:VizioTV');

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake TV.
var outlet = exports.accessory = new Accessory(SiriName, outletUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
outlet.username = "1A:2Z:3D:4B:5D:FF";
outlet.pincode = "031-45-154";

// set some basic properties (these values are arbitrary and setting them is optional)
outlet
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Vizio Inc.")
  .setCharacteristic(Characteristic.Model, "E60i-A3")
  .setCharacteristic(Characteristic.SerialNumber, "A1S2NASF88EW");

// listen for the "identify" event for this Accessory
outlet.on('identify', function(paired, callback) {
  TV_OUTLET.identify();
  callback(); // success
});

// Add the actual outlet Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
outlet
  .addService(Service.Outlet, SiriName) // services exposed to the user should have "names" like "Fake Light" for us
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    TV_OUTLET.setPowerOn(value);
    callback(); // Our fake Outlet is synchronous - this value has been successfully set
  });

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
//outlet
//  .getService(Service.Outlet)
//  .getCharacteristic(Characteristic.On)
//  .on('get', function(callback) {
//
    // this event is emitted when you ask Siri directly whether your light is on or not. you might query
    // the light hardware itself to find this out, then call the callback. But if you take longer than a
    // few seconds to respond, Siri will give up.

//    var err = null; // in case there were any problems
//
//    if (TV_OUTLET.powerOn) {
//      console.log("Are we on? Yes.");
//      callback(err, true);
//    }
//    else {
//      console.log("Are we on? No.");
//      callback(err, false);
//  }
// }); 
