var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');
var MQTT_IP = 'localhost' //change this if your MQTT broker is different


var name = "Contact Sensor"; //accessory name
var contactSensorUsername = "1A:2B:3C:4D:5E:FF"; //change this if
var MQTT_NAME = 'rf_bridge_topic' //MQTT topic that was set on the Sonoff firmware of the RF Bridge
var SENSOR_IDENTIFIER = 'ABCDE' //Five character identifier of the contact sensor


var options = {
  port: 1883,
  host: MQTT_IP,
//  username: 'pi', //enable only if you have authentication on your MQTT broker
//  password: 'raspberry', //enable only if you have authentication on your MQTT broker
  clientId: SENSOR_IDENTIFIER+'HAP'
};

var client = mqtt.connect(options);
var contactSensorUUID = "hap-nodejs:accessories:RFcontactsensor"+SENSOR_IDENTIFIER;

client.on('connect', function () {
  client.subscribe('stat/'+MQTT_NAME+'/RESULT')
});

var contactSensorObject = {
  contact: 0,
  tamper: 0,
  lowBattery: 0,
  identify: function() {
    console.log(name + " Identified!");
  }
}

var contactSensor = exports.accessory = new Accessory(name, uuid.generate(contactSensorUUID+name));

contactSensor.username = contactSensorUsername;
contactSensor.pincode = "031-45-154";

contactSensor.on('identify', function(paired, callback) {
  contactSensorObject.identify();
  callback();
});

contactSensor
  .addService(Service.ContactSensor, name)
  .getCharacteristic(Characteristic.ContactSensorState)
  .on('get', function(callback) {
    callback(undefined, contactSensorObject.contact);
  });

contactSensor
    .getService(Service.ContactSensor)
    .addCharacteristic(Characteristic.StatusTampered)
    .on('get', function(callback) {
      callback(null, contactSensorObject.tamper);
    });

contactSensor
    .getService(Service.ContactSensor)
    .addCharacteristic(Characteristic.StatusLowBattery)
    .on('get', function(callback) {
      callback(null, contactSensorObject.lowBattery);
    });

client.on('message', function(topic, message) {
  messageTXT = message.toString();
  messageJSON = JSON.parse(message)
  if (messageTXT.includes(SENSOR_IDENTIFIER)){

      RECV_DATA = messageJSON.RfReceived.Data;
      RECV_MESSAGE = RECV_DATA.charAt(5);

      switch(RECV_MESSAGE){
        case 'A': //opened state
          contactSensorObject.contact = 1;
          break;
        case 'E': //closed state
          contactSensorObject.contact = 0;
          break;
        case '7': //tamper state
          contactSensorObject.tamper = 1;
          break;
        case '6': //low battery
          contactSensorObject.lowBattery = 1;
          break;
      }

      contactSensor
        .getService(Service.ContactSensor)
        .updateCharacteristic(Characteristic.ContactSensorState,contactSensorObject.contact);
      contactSensor
        .getService(Service.ContactSensor)
        .updateCharacteristic(Characteristic.StatusTampered,contactSensorObject.tamper);
      contactSensor
        .getService(Service.ContactSensor)
        .updateCharacteristic(Characteristic.StatusLowBattery,contactSensorObject.lowBattery);

  }
});
