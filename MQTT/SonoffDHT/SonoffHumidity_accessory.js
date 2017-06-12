var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');
var mqttMSG = 0;


var name = "Sonoff Humidity Sensor"; //accessory name
var sonoffUUID = "hap-nodejs:accessories:sonoff:Humidity:" + name; //change this to your preferences
var sonoffUsername = "1A:2C:3A:4E:5E:FF";
var MQTT_NAME = 'sonoff' //MQTT topic that was set on the Sonoff firmware
var MQTT_IP = 'localhost' //change this if your MQTT broker is different


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
  getReadings: function() {
    client.publish(sonoffTopic, '10');
  },
  identify: function() {
    console.log(name + " Identified!");
  }
}

var sonoffHumi = exports.accessory = new Accessory(name, uuid.generate(sonoffUUID));

sonoffHumi.username = sonoffUsername;
sonoffHumi.pincode = "031-45-154";

// listen for the "identify" event for this Accessory
sonoffHumi.on('identify', function(paired, callback) {
  sonoffObject.identify();
  callback();
});

sonoffHumi
  .addService(Service.HumiditySensor)
  .getCharacteristic(Characteristic.CurrentRelativeHumidity)
  .on('get', function(callback) {
    // return our current value
    callback(null, sonoffObject.CurrentRelativeHumidity);
  });

  client.on('message', function(topic, message) {
  //  console.log(message.toString());
    message = message.toString();
    mqttMSG = JSON.parse(message);
  //  console.log(mqttMSG.StatusSNS.DHT22.Humidity);
    sonoffObject.CurrentRelativeHumidity = mqttMSG.StatusSNS.DHT22.Humidity;
  });

setInterval(function() {

  sonoffObject.getReadings();

  sonoffHumi
    .getService(Service.HumiditySensor)
    .setCharacteristic(Characteristic.CurrentRelativeHumidity, sonoffObject.CurrentRelativeHumidity);

}, 60000);
