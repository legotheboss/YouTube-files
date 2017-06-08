var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');
var mqttMSG = 50.0;


var name = "Sonoff Humidity Sensor"; //accessory name
var sonoffUUID = "hap-nodejs:accessories:sonoff:Humidity:" + name; //change this to your preferences
var sonoffUsername = "1C:2D:3A:43:6E:DF";
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

var sonoffHumidity = {
  CurrentRelativeHumidity: 30,
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
  sonoffHumidity.identify();
  callback();
});

sonoffHumi
  .addService(Service.HumiditySensor)
  .getCharacteristic(Characteristic.CurrentRelativeHumidity)
  .on('get', function(callback) {
    // return our current value
    callback(null, sonoffHumidity.CurrentRelativeHumidity);
  });

  client.on('message', function(topic, message) {
  //  console.log(message.toString());
    message = message.toString();
    mqttMSG = JSON.parse(message);
  //  console.log(mqttMSG.StatusSNS.DHT22.Humidity);
    sonoffHumidity.CurrentRelativeHumidity = mqttMSG.StatusSNS.DHT22.Humidity;
  });

setInterval(function() {

  sonoffHumidity.getReadings();

  sonoffHumi
    .getService(Service.HumiditySensor)
    .setCharacteristic(Characteristic.CurrentRelativeHumidity, sonoffHumidity.CurrentRelativeHumidity);

}, 60000);
