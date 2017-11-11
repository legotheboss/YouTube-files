var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');
var mqttMSG = 0;


var name = "Sonoff Temperature Sensor"; //accessory name
var sonoffUUID = "hap-nodejs:accessories:sonoff:temperature:" + name; //change this to your preferences
var sonoffUsername = "1C:2A:3D:7D:5E:FA";
var MQTT_NAME = 'sonoff' //MQTT topic that was set on the Sonoff firmware
var MQTT_IP = 'localhost' //change this if your MQTT broker is different
var sensorType = 'DHT22';

var options = {
  port: 1883,
  host: MQTT_IP,
//  username: 'pi', //enable only if you have authentication on your MQTT broker
//  password: 'raspberry', //enable only if you have authentication on your MQTT broker
  clientId: MQTT_NAME+'TempHAP'
};
var sonoffTopic = 'cmnd/'+MQTT_NAME+'/status';
var client = mqtt.connect(options);

client.on('connect', function () {
  client.subscribe('stat/'+MQTT_NAME+'/STATUS10')
});

var sonoffObject = {
  currentTemperature: 38,
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
    sonoffObject.currentTemperature = mqttMSG.StatusSNS.sensorType.Temperature;
  });

setInterval(function() {

  sonoffObject.getReadings();

  sonoffTemp
    .getService(Service.TemperatureSensor)
    .setCharacteristic(Characteristic.CurrentTemperature, sonoffObject.currentTemperature);

}, 30000);
