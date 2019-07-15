var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');
var MQTT_IP = 'localhost' //change this if your MQTT broker is different
var mqttMSG = false;


var name = "MagicHome LED Strip"; //accessory name
var ledstripUUID = "hap-nodejs:accessories:magichomeLED"; //change this to your preferences
var ledstripUsername = "1A:2B:3C:4D:5E:FF";
var MQTT_NAME = 'led_strip_topic' //MQTT topic that was set on the Sonoff firmware


var options = {
  port: 1883,
  host: MQTT_IP,
//  username: 'pi', //enable only if you have authentication on your MQTT broker
//  password: 'raspberry', //enable only if you have authentication on your MQTT broker
  clientId: MQTT_NAME+'HAP'
};
var mqttTopic = 'cmnd/'+MQTT_NAME+'/';
var client = mqtt.connect(options);

client.on('connect', function () {
  client.subscribe('stat/'+MQTT_NAME+'/RESULT')
});

var ledstripObject = {
  powerOn: false,
  setPowerOn: function(on) {
    ledstripObject.powerOn = on;
    if (on) {
      client.publish(mqttTopic+'POWER', 'on');
    } else {
      client.publish(mqttTopic+'POWER', 'off');
    }
  },
  hue: 0,
  saturation: 0,
  brightness: 0,
  setHueVal: function(value){
    this.hue = value;
    client.publish(mqttTopic+'HSBColor1', value.toString());
  },
  setSaturationVal: function(value){
    this.saturation = value;
    client.publish(mqttTopic+'HSBColor2', value.toString());
  },
  setBrightnessVal: function(value){
    this.brightness = value;
    client.publish(mqttTopic+'HSBColor3', value.toString());
  },
  identify: function() {
    console.log(name + " Identified!");
  }
}

var ledstrip = exports.accessory = new Accessory(name, uuid.generate(ledstripUUID+name));

ledstrip.username = ledstripUsername;
ledstrip.pincode = "031-45-154";

ledstrip.on('identify', function(paired, callback) {
  ledstripObject.identify();
  callback();
});

ledstrip
  .addService(Service.Lightbulb, name)
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
      ledstripObject.setPowerOn(value);
      callback();
  });

ledstrip
  .getService(Service.Lightbulb)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {
    callback(undefined, ledstripObject.powerOn);
  });

ledstrip
    .getService(Service.Lightbulb)
    .addCharacteristic(Characteristic.Brightness)
    .on('set', function(value, callback) {
      ledstripObject.setBrightnessVal(value);
      callback();
    })
    .on('get', function(callback) {
      callback(null, ledstripObject.brightness);
    });

ledstrip
    .getService(Service.Lightbulb)
    .addCharacteristic(Characteristic.Saturation)
    .on('set', function(value, callback) {
      ledstripObject.setSaturationVal(value);
      callback();
    })
    .on('get', function(callback) {
      callback(null, ledstripObject.saturation);
    });

ledstrip
    .getService(Service.Lightbulb)
    .addCharacteristic(Characteristic.Hue)
    .on('set', function(value, callback) {
      ledstripObject.setHueVal(value);
      callback();
    })
    .on('get', function(callback) {
      callback(null, ledstripObject.hue);
    });

function CSVToArray( strData, strDelimiter ){

   strDelimiter = (strDelimiter || ",");

   var objPattern = new RegExp(
       (

           "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

           "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

           "([^\"\\" + strDelimiter + "\\r\\n]*))"
       ),
       "gi"
       );

   var arrData = [[]];

   var arrMatches = null;

   while (arrMatches = objPattern.exec( strData )){

       var strMatchedDelimiter = arrMatches[ 1 ];

       if (
           strMatchedDelimiter.length &&
           strMatchedDelimiter !== strDelimiter
           ){
           arrData.push( [] );
       }

       var strMatchedValue;

       if (arrMatches[ 2 ]){

           strMatchedValue = arrMatches[ 2 ].replace(
               new RegExp( "\"\"", "g" ),
               "\""
               );

       } else {

           strMatchedValue = arrMatches[ 3 ];

       }


       arrData[ arrData.length - 1 ].push( strMatchedValue );
   }

   return( arrData );
}


client.on('message', function(topic, message) {
  messageTXT = message.toString();
  messageJSON = JSON.parse(message)
  mqttMSG = true;
  if (messageTXT.includes('HSBColor')){
      HSBData = CSVToArray(messageJSON.HSBColor, ',');
      hue = parseInt(HSBData[0]);
      saturation = parseInt(HSBData[1]);
      brightness = parseInt(HSBData[2]);

      ledstrip
        .getService(Service.Lightbulb)
        .updateCharacteristic(Characteristic.Hue,ledstripObject.hue);
      ledstrip
        .getService(Service.Lightbulb)
        .updateCharacteristic(Characteristic.Brightness,ledstripObject.brightness);
      ledstrip
        .getService(Service.Lightbulb)
        .updateCharacteristic(Characteristic.Saturation,ledstripObject.saturation);
  } else if (messageTXT.includes('POWER')){
      if(messageTXT.includes('ON')) ledstripObject.powerOn = true;
      else ledstripObject.powerOn = false;

      ledstrip
        .getService(Service.Lightbulb)
        .updateCharacteristic(Characteristic.On,ledstripObject.powerOn);
  }

});

client.publish(mqttTopic+'HSBColor', '  ')
