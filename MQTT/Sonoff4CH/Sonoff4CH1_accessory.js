var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');
var MQTT_IP = 'localhost' //change this if your MQTT broker is different
var mqttMSG = false;

var name = "Sonoff 4CH Outlet1"; //accessory name
var sonoffUUID = "hap-nodejs:accessories:sonoff4CH1" + name; //change this to your preferences
var sonoffUsername = "1D:2D:31:41:5A:41";
var MQTT_NAME = 'sonoff4ch' //MQTT topic that was set on the Sonoff firmware


var options = {
  port: 1883,
  host: MQTT_IP,
//  username: 'pi', //enable only if you have authentication on your MQTT broker
//  password: 'raspberry', //enable only if you have authentication on your MQTT broker
  clientId: MQTT_NAME+'1Sonoff4CH'
};
var sonoffTopic = 'cmnd/'+MQTT_NAME+'/power1';
var client = mqtt.connect(options);

client.on('message', function(topic, message) {
//  console.log(message.toString());
  message = message.toString();
  mqttMSG = true;
  if (message.includes('ON')){
    sonoffObject.powerOn = true;
  }
  else{
    sonoffObject.powerOn = false;
  }
  sonoff
    .getService(Service.Outlet)
    .setCharacteristic(Characteristic.On,sonoffObject.powerOn);
});

client.on('connect', function () {
  client.subscribe('stat/'+MQTT_NAME+'/POWER1')
});

var sonoffObject = {
  powerOn: false,
  setPowerOn: function(on) {
    sonoffObject.powerOn = on;
    if (on) {
      client.publish(sonoffTopic, 'on');
    } else {
      client.publish(sonoffTopic, 'off');
    }
  },
  identify: function() {
    console.log(name + " Identified!");
  }
}

var sonoff = exports.accessory = new Accessory(name, uuid.generate(sonoffUUID));

sonoff.username = sonoffUsername;
sonoff.pincode = "031-45-154";

// listen for the "identify" event for this Accessory
sonoff.on('identify', function(paired, callback) {
  sonoffObject.identify();
  callback();
});

sonoff
  .addService(Service.Outlet, name)
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    if(mqttMSG){
      mqttMSG = false;
      callback();
    }
    else {
      sonoffObject.setPowerOn(value);
      callback();
    }
  });

sonoff
  .getService(Service.Outlet)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {
    client.publish(sonoffTopic,'')
    callback(undefined, sonoffObject.powerOn);
  });
