//START SETUP
var garageName = 'Garage Door';
var uuidTag = 'garage';
//END SETUP

var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var cmd=require('node-cmd');

var GARAGE_DOOR = {
  opened: false,
  open: function() {
    console.log("Opening the Garage!");
    cmd.run('sudo python /home/pi/HAP-NodeJS/python/garage.py');
    GARAGE_DOOR.opened = true;
  },
  close: function() {
    console.log("Closing the Garage!");
    cmd.run('sudo python /home/pi/HAP-NodeJS/python/garage.py');
    GARAGE_DOOR.opened = false;
  },
  identify: function() {
    console.log("Identify the Garage");
  }
};

var garageUUID = uuid.generate('hap-nodejs:accessories:'+uuidTag);
var garage = exports.accessory = new Accessory(garageName, garageUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
garage.username = "C1:5D:3F:EE:5E:FA"; //edit this if you use Core.js
garage.pincode = "031-45-154";

garage
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Liftmaster")
  .setCharacteristic(Characteristic.Model, "Rev-1")
  .setCharacteristic(Characteristic.SerialNumber, "TW000165");

garage.on('identify', function(paired, callback) {
  GARAGE_DOOR.identify();
  callback();
});

garage
  .addService(Service.GarageDoorOpener, "Garage Door")
  .setCharacteristic(Characteristic.TargetDoorState, Characteristic.TargetDoorState.CLOSED) // force initial state to CLOSED
  .getCharacteristic(Characteristic.TargetDoorState)
  .on('set', function(value, callback) {

    if (value == Characteristic.TargetDoorState.CLOSED) {
      GARAGE_DOOR.close();
      callback();
      garage
        .getService(Service.GarageDoorOpener)
        .setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
    }
    else if (value == Characteristic.TargetDoorState.OPEN) {
      GARAGE_DOOR.open();
      callback();
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
