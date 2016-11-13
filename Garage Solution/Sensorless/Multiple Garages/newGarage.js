var cmd=require('node-cmd');
var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var garagedoor;

//configurable parameters
var serviceName = 'Garage Door Opener 2';
var serviceUUID = 'hap-nodejs:accessories:secondGarageDoor';

var GARAGE_DOOR = {
  opened: false,
  open: function() {
    console.log("Opening the Garage!");
    cmd.run('sudo python /home/pi/HAP-NodeJS/python/garage2.py');
  },
  close: function() {
    console.log("Closing the Garage!");
    cmd.run('sudo python /home/pi/HAP-NodeJS/python/garage2.py');
  },
  identify: function() {
    console.log("Identify the Garage");
  }
};

console.log("Garage door set as %s",GARAGE_DOOR.opened);

// Generate a consistent UUID for our GarageDoorOpener that will remain the same even when
// restarting our server.
var garageUUID = uuid.generate(serviceUUID);

// This is the Accessory that we'll return to HAP-NodeJS that represents our Garage opener.
var garage = exports.accessory = new Accessory(serviceName, garageUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
garage.username = "C1:5D:3F:EE:5E:FA";
garage.pincode = "031-45-154";

// listen for the "identify" event for this Accessory
garage.on('identify', function(paired, callback) {
  GARAGE_DOOR.identify();
  callback(); // success
});

// Add the actual Garage Opener Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
garage
  .addService(Service.GarageDoorOpener, "Garage Door")
  .setCharacteristic(Characteristic.TargetDoorState, Characteristic.TargetDoorState.CLOSED) // force initial state to CLOSED
  .getCharacteristic(Characteristic.TargetDoorState)
  .on('set', function(value, callback) {

    if (value == Characteristic.TargetDoorState.CLOSED) {
      GARAGE_DOOR.close();
      callback();
      // now we want to set our garage "actual state" to be CLOSED so it shows as Closed in iOS apps
      garage
        .getService(Service.GarageDoorOpener)
        .setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
    }
    else if (value == Characteristic.TargetDoorState.OPEN) {
      GARAGE_DOOR.open();
      callback();
      // now we want to set our garage "actual state" to be OPEN so it shows as Open in iOS apps
      garage
        .getService(Service.GarageDoorOpener)
        .setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPEN);
    }
  });

garage
  .getService(Service.GarageDoorOpener)
  .getCharacteristic(Characteristic.CurrentDoorState)
  .on('get', function(callback) {

    var err = null;

    if (GARAGE_DOOR.opened) {
      console.log("Query: Is Garage Open? Yes.");
      callback(err, Characteristic.CurrentDoorState.OPEN);
    }
    else {
      console.log("Query: Is Garage Open? No.");
      callback(err, Characteristic.CurrentDoorState.CLOSED);
    }
  });
