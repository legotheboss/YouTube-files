var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');
var mqttMSG = 20.0;


var name = "Sonoff Temperature Sensor"; //accessory name
var sonoffUUID = "hap-nodejs:accessories:sonoff:temperature:" + name; //change this to your preferences
var sonoffUsername = "1A:2E:3E:4A:5E:FA";
var sonoffTopic = 'sonoff' //MQTT topic that was set on the Sonoff firmware
var MQTT_IP = 'localhost' //change this if your MQTT broker is different


var options = {
  port: 1883,
  host: MQTT_IP,
//  username: 'pi', enable only if you have authentication on your MQTT broker
//  password: 'raspberry', enable only if you have authentication on your MQTT broker
  clientId: sonoffTopic+'HAP'
};
var sonoffTopic = 'cmnd/'+sonoffTopic+'/status';
var client = mqtt.connect(options);

client.on('connect', function () {
  client.subscribe('stat/'+sonoffTopic+'/STATUS10')
});

var sonoffTemperature = {
  currentTemperature: 30,
  getReadings: function() {
    client.publish(sonoffTopic, '10');
  },
  identify: function() {
    console.log(name + " Identified!");
  }
}

var sonoffTemp = exports.accessory = new Accessory(name, uuid.generate(sonoffUUID));

sonoffTemp.username = sonoffUsername;
sonoffTemp.pincode = "031-45-154";

// listen for the "identify" event for this Accessory
sonoffTemp.on('identify', function(paired, callback) {
  sonoffTemperature.identify();
  callback();
});

sonoffTemp
  .addService(Service.TemperatureSensor)
  .getCharacteristic(Characteristic.CurrentTemperature)
  .on('get', function(callback) {
    // return our current value
    callback(null, sonoffTemperature.currentTemperature);
  });

  client.on('message', function(topic, message) {
  //  console.log(message.toString());
    message = message.toString();
    mqttMSG = JSON.parse(message);
  //  console.log(mqttMSG.StatusSNS.DHT22.Temperature);
    sonoffTemperature.currentTemperature = mqttMSG.StatusSNS.DHT22.Temperature;
  });

setInterval(function() {

  sonoffTemperature.getReadings();

  sonoffTemp
    .getService(Service.TemperatureSensor)
    .setCharacteristic(Characteristic.CurrentTemperature, sonoffTemperature.currentTemperature);

}, 5000);
