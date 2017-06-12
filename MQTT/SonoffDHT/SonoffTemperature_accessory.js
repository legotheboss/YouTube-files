var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');
var MQTT_IP = 'localhost' //change this if your MQTT broker is different
var mqttMSG = false;


var name = "Sonoff Temperature Sensor"; //accessory name
var sonoffUUID = "hap-nodejs:accessories:sonoff:temperature:" + name; //change this to your preferences
var sonoffUsername = "1A:2B:3C:4D:5E:FF";
var MQTT_NAME = 'sonoff' //MQTT topic that was set on the Sonoff firmware


var options = {
  port: 1883,
  host: MQTT_IP,
//  username: 'pi', enable only if you have authentication on your MQTT broker
//  password: 'raspberry', enable only if you have authentication on your MQTT broker
  clientId: MQTT_NAME+'HAP'
};
var sonoffTopic = 'cmnd/'+MQTT_NAME+'/status';
var client = mqtt.connect(options);

client.on('connect', function () {
  client.subscribe('stat/'+MQTT_NAME+'/STATUS10')
});

var sonoffObject = {
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
  sonoffObject.identify();
  callback();
});

sonoffTemp
  .addService(Service.TemperatureSensor)
  .getCharacteristic(Characteristic.CurrentTemperature)
  .on('get', function(callback) {
    // return our current value
    callback(null, sonoffObject.currentTemperature);
  });

  client.on('message', function(topic, message) {
  //  console.log(message.toString());
    message = message.toString();
    mqttMSG = JSON.parse(message);
  //  console.log(mqttMSG.StatusSNS.DHT22.Temperature);
    sonoffObject.currentTemperature = mqttMSG.StatusSNS.DHT22.Temperature;
  });

setInterval(function() {

  sonoffObject.getReadings();

  sonoffTemp
    .getService(Service.TemperatureSensor)
    .setCharacteristic(Characteristic.CurrentTemperature, sonoffObject.currentTemperature);

}, 60000);
