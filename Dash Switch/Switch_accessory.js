//START CONFIG
var dashMAC = "xx:xx:xx:xx:xx:xx";  //enter your Amazon Dash Button mac ID here
var accessoryName = 'Sample Dash'; //enter what you want your Amazon Dash to be called in HomeKit
var uuidNAME = 'SampleDash';      //enter a singleword name here (use for UUID)
//END CONFIG


var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var node_dash = require('node-dash-button');
var dashUUID = uuid.generate('hap-nodejs:accessories:'+uuidNAME);
var detector = node_dash(dashMAC);
var switchState = false;
var dash = exports.accessory = new Accessory(accessoryName, dashUUID);

// Properties for Core.js
dash.username = dashMAC;
dash.pincode = "031-45-154";

dash
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Amazon")
  .setCharacteristic(Characteristic.Model, "Dash")

dash.on('identify', function(paired, callback) {
  console.log(accessoryName + 'Identified!');
  callback();
});

dash
  .addService(Service.Switch, accessoryName)
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    callback();
  });

//dash detector

dash
  detector.on("detected", function (){
    switchState = !switchState;
    console.log(accessoryName+" Toggled!");
    dash
    .getService(Service.Switch)
    .setCharacteristic(Characteristic.On, switchState);
  });
