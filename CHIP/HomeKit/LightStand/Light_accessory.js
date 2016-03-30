var cmd=require('node-cmd');
var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var secondaryName = 'testpilot' //enter a single random word here
var serviceName = 'Relay Light' //enter the name you want here
var lightDIR = '/srv/relayLight'  //enter the directory of the scripts here

var FAKE_LIGHT = {
  powerOn: false,
  
  setPowerOn: function(on) { 
    if (on) {
          FAKE_LIGHT.powerOn = true;
          cmd.run('python '+ lightDIR +'/lightON');	  
          console.log(serviceName + " is now on.");
    } else {
          FAKE_LIGHT.powerOn = false;
	  cmd.run('python '+ lightDIR +'/lightOFF');
	  console.log(serviceName + " is now off.");
    }
  },
  identify: function() {
    console.log("Identify the light!");
  }
}

// Generate a consistent UUID for our light Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "light".
var lightUUID = uuid.generate('hap-nodejs:accessories:'+secondaryName);

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake light.
var light = exports.accessory = new Accessory(serviceName, lightUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
light.username = "1A:2B:3C:4E:55:FF";
light.pincode = "031-45-154";


// listen for the "identify" event for this Accessory
light.on('identify', function(paired, callback) {
  FAKE_LIGHT.identify();
  callback(); // success
});

// Add the actual Lightbulb Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
light
  .addService(Service.Lightbulb, serviceName) // services exposed to the user should have "names" like "Fake Light" for us
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    FAKE_LIGHT.setPowerOn(value);
    callback(); // Our fake Light is synchronous - this value has been successfully set
  });

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
light
  .getService(Service.Lightbulb)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {
    
    // this event is emitted when you ask Siri directly whether your light is on or not. you might query
    // the light hardware itself to find this out, then call the callback. But if you take longer than a
    // few seconds to respond, Siri will give up.
    
    var err = null; // in case there were any problems
    
    if (FAKE_LIGHT.powerOn) {
      console.log("Is " + serviceName + " on? Yes.");
      callback(err, true);
    }
    else {
      console.log("Is " + serviceName + " on? No.");
      callback(err, false);
    }
  });

