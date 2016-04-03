// HomeKit types required
var types = require("./types.js");
var exports = module.exports = {};
var cmd=require('node-cmd');
var wpi = require('wiring-pi');
var execute = function(accessory,characteristic,value) {
  console.log("executed accessory: " + accessory + ", and characteristic: " + characteristic + ", with value: " +  value + ".");
};

exports.accessory = {
  displayName: "Garage Door Opener",
  username: "3C:5A:3D:EE:5E:FA",
  pincode: "031-45-154",
  services: [{
    sType: types.ACCESSORY_INFORMATION_STYPE,
    characteristics: [{
      cType: types.NAME_CTYPE,
      onUpdate: null,
      perms: ["pr"],
      format: "string",
      initialValue: "Garage Door Opener",
      supportEvents: false,
      supportBonjour: false,
      manfDescription: "Name of the accessory",
      designedMaxLength: 255
    },{
      cType: types.MANUFACTURER_CTYPE,
      onUpdate: null,
      perms: ["pr"],
      format: "string",
      initialValue: "Oltica",
      supportEvents: false,
      supportBonjour: false,
      manfDescription: "Manufacturer",
      designedMaxLength: 255
    },{
      cType: types.MODEL_CTYPE,
      onUpdate: null,
      perms: ["pr"],
      format: "string",
      initialValue: "Rev-1",
      supportEvents: false,
      supportBonjour: false,
      manfDescription: "Model",
      designedMaxLength: 255
    },{
      cType: types.SERIAL_NUMBER_CTYPE,
      onUpdate: null,
      perms: ["pr"],
      format: "string",
      initialValue: "A1S2NASF88EW",
      supportEvents: false,
      supportBonjour: false,
      manfDescription: "SN",
      designedMaxLength: 255
    },{
      cType: types.IDENTIFY_CTYPE,
      onUpdate: null,
      perms: ["pw"],
      format: "bool",
      initialValue: false,
      supportEvents: false,
      supportBonjour: false,
      manfDescription: "Identify Accessory",
      designedMaxLength: 1
    }]
  },{
    sType: types.GARAGE_DOOR_OPENER_STYPE,
    characteristics: [{
      cType: types.NAME_CTYPE,
      onUpdate: null,
      perms: ["pr"],
      format: "string",
      initialValue: "Garage Door Opener Control",
      supportEvents: false,
      supportBonjour: false,
      manfDescription: "Name of service",
      designedMaxLength: 255
    },{
      cType: types.CURRENT_DOOR_STATE_CTYPE,
      onUpdate: function(value) {
        console.log("Change:",value);
        execute("Garage Door - current door state", "Current State", value);
      },
      onRead: function(callback) {
        console.log("Read:");
        wpi.setup('phys');
        var mainValue = wpi.digitalRead(12);
        var mainGarage = mainValue;
        console.log(mainGarage);
        callback(1 - mainValue); // returning value from the sensor
      },
      perms: ["pr","ev"],
      format: "int",
      initialValue: 0,
      supportEvents: false,
      supportBonjour: false,
      manfDescription: "BlaBla",
      designedMinValue: 0,
      designedMaxValue: 4,
      designedMinStep: 1,
      designedMaxLength: 1
    },{
      cType: types.TARGET_DOORSTATE_CTYPE,
      onUpdate: function(value) {
        console.log("Garage Door Change:",value);
        execute("Garage Door - target door state", "Current State", value);
        var mainUpdate = wpi.digitalRead(12);
        var mainStatus = mainUpdate;
        var garageStatus = 1 - mainStatus;
        cmd.run('sudo python /home/pi/HAP-NodeJS/python/garage.py'); //executing script
            console.log("Correct command");
      },
      onRead: function(callback) {
        console.log("Read:");
        var mainUpdate = wpi.digitalRead(12);
        var mainStatus = mainUpdate;
        console.log(1 - mainStatus);
        callback(1 - mainStatus);// returning the value from the sensor
      },
      perms: ["pr","pw","ev"],
      format: "int",
      initialValue: 0,
      supportEvents: false,
      supportBonjour: false,
      manfDescription: "BlaBla",
      designedMinValue: 0,
      designedMaxValue: 1,
      designedMinStep: 1,
      designedMaxLength: 1
    },{
      cType: types.OBSTRUCTION_DETECTED_CTYPE,
      onUpdate: function(value) {
        console.log("Change:",value);
        execute("Garage Door - obstruction detected", "Current State", value);
      },
      onRead: function(callback) {
        console.log("Read:");
        execute("Garage Door - obstruction detected", "Current State", null);
        callback(false); // only testing, we have no physical device to read from
      },
      perms: ["pr","ev"],
      format: "bool",
      initialValue: false,
      supportEvents: false,
      supportBonjour: false,
      manfDescription: "BlaBla"
    }]
  }]
}
