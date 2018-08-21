var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');

//START CONFIG//
var accessoryName = 'Sonoff iFan02'; //name of accessory in HomeKit
var ifanTopic = 'sonofffan' //topic configured in Tasmota
var MQTT_IP = 'localhost' //change this if your MQTT broker is different
//END CONFIG//

var options = {
  port: 1883,
  host: MQTT_IP,
//  username: 'pi', enable only if you have authentication on your MQTT broker
//  password: 'raspberry', enable only if you have authentication on your MQTT broker
  clientId: 'FanHAP-'+ifanTopic
};
var fanRTopic = 'cmnd/'+ifanTopic+'/FanSpeed';
var lghtTopic = 'cmnd/'+ifanTopic+'/POWER1';
var client = mqtt.connect(options);

var CEILING_FAN = {
  powerOn: false,
  rSpeed: 0, // percentage
  rPrev: 0, //saved value from before
  rLight: false,
  setPowerOn: function(on) {
    //console.log("setting on status to", on);
    if(on){
      CEILING_FAN.powerOn = on;
      CEILING_FAN.setSpeed(CEILING_FAN.rPrev);
    }
    else{
      client.publish(fanRTopic, '0');
      CEILING_FAN.powerOn = false;
    }
  },
  setSpeed: function(value) {
    //console.log("setting speed to", value);
    if(value != 0) {
      CEILING_FAN.rPrev = value;
      CEILING_FAN.rSpeed = value;
      //console.log("rPrev:", CEILING_FAN.rPrev);
      //console.log("rSpeed:", CEILING_FAN.rSpeed);
      if (value > 0 && value <= 34) {
        client.publish(fanRTopic, '1');
      } else if (value > 34 && value <= 66) {
        client.publish(fanRTopic, '2');
      } else  if (value > 66 && value <= 101) {
        client.publish(fanRTopic, '3');
      }
    }
    else{
      CEILING_FAN.rSpeed = value;
      client.publish(fanRTopic, '0');
    }
  },
  setPowerOnLight: function(on){
    CEILING_FAN.rLight = on;
    if(on){
      client.publish(lghtTopic, '1');
    }
    else{
      client.publish(lghtTopic, '0')
    }
  },
  identify: function() {
    //console.log("Fan Indentified!");
  }
}

var fanUUID = uuid.generate('hap-nodejs:accessories:fan:'+ifanTopic);
var fan = exports.accessory = new Accessory(ifanTopic, fanUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
fan.username = "1C:2E:1C:4D:5A:2F";
fan.pincode = "031-45-154";

client.on('connect', function () {
  client.subscribe('stat/'+ifanTopic+'/RESULT')
});

fan
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "iTead/Sonoff")

// listen for the "identify" event for this Accessory
fan.on('identify', function(paired, callback) {
  CEILING_FAN.identify();
  callback(); // success
});

fan
  .addService(Service.Fan, accessoryName)
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    CEILING_FAN.setPowerOn(value);
    callback();
  });

fan
  .getService(Service.Fan)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {
    var err = null;
    client.publish(fanRTopic, '');
    if (CEILING_FAN.powerOn) {
      callback(err, true);
    }
    else {
      callback(err, false);
    }
  });

fan
  .getService(Service.Fan)
  .addCharacteristic(Characteristic.RotationSpeed)
  .on('get', function(callback) {
    callback(null, CEILING_FAN.rSpeed);
  })
  .on('set', function(value, callback) {
    if(value == 0){
      CEILING_FAN.setPowerOn(false);
      callback();
    } else{
      CEILING_FAN.setSpeed(value);
      callback();
    }
  })

fan
  .addService(Service.Lightbulb, accessoryName+" Light") 
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {
    client.publish(lghtTopic, '');
    callback(null, CEILING_FAN.rLight);
  })
  .on('set', function(value, callback) {
    CEILING_FAN.setPowerOnLight(value);
    callback();
  });

client.on('message', function(topic, message) {
  //console.log(message.toString());
  message = message.toString();

  if(message.includes('FanSpeed')){
    msage = JSON.parse(message);
    //console.log("MQTT MSG:", msage)
    newSpeed = parseInt(msage.FanSpeed)*33;
    //console.log("RESULT:",newSpeed);
    if(newSpeed == 0){
      CEILING_FAN.powerOn = false;
      fan
        .getService(Service.Fan)
        .updateCharacteristic(Characteristic.On,false);
    }
    else{
      CEILING_FAN.powerOn = true;
      CEILING_FAN.rSpeed = newSpeed
      CEILING_FAN.rPrev = newSpeed
    fan
      .getService(Service.Fan)
      .updateCharacteristic(Characteristic.RotationSpeed,CEILING_FAN.rSpeed);
    fan
      .getService(Service.Fan)
      .updateCharacteristic(Characteristic.On,true);
    }
  }

  if(message.includes('POWER1')){
    if (message.includes('ON')){
      CEILING_FAN.rLight = true;
    }
    else{
      CEILING_FAN.rLight = false;
    }
    fan
      .getService(Service.Lightbulb)
      .updateCharacteristic(Characteristic.On,CEILING_FAN.rLight);
  }
});
