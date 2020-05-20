var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var lightState = 0;


////////////////CHANGE THESE SETTINGS TO MATCH YOUR SETUP BEFORE RUNNING!!!!!!!!!!!!!//////////////////////////
////////////////CHANGE THESE SETTINGS TO MATCH YOUR SETUP BEFORE RUNNING!!!!!!!!!!!!!//////////////////////////
var name = "RGB Light MQTT";                                       //Name to Show to IOS
var UUID = "hap-nodejs:accessories:RGBLight1";     //Change the RGBLight to something unique for each light - this should be unique for each node on your system
var USERNAME = "DC:4F:22:8F:A8:DA";              //This must also be unique for each node - make sure you change it!

var MQTT_IP = 'localhost'
var MQTT_NAME = 'magichome'
var powerTopic = 'cmnd/'+MQTT_NAME+'/power'
var colorTopic = 'cmnd/'+MQTT_NAME+'/color'
var HSBcolorTopic = 'cmnd/'+MQTT_NAME+'/hsbcolor'
var brightness_topic = 'cmnd/'+MQTT_NAME+'/dimmer'

var resultTopic = 'stat/'+MQTT_NAME+'/RESULT'
var statPowerTopic = 'stat/'+MQTT_NAME+'/POWER'
////////////////CHANGE THESE SETTINGS TO MATCH YOUR SETUP BEFORE RUNNING!!!!!!!!!!!!!//////////////////////////
////////////////CHANGE THESE SETTINGS TO MATCH YOUR SETUP BEFORE RUNNING!!!!!!!!!!!!!//////////////////////////


var mqttMSG = false;
var mqttH = false;
var mqttS = false;
var mqttB = false;

// MQTT Setup
var mqtt = require('mqtt');
var options = {
  port: 1883,
  host: MQTT_IP,
  clientId: MQTT_NAME+'HAP'
};
var client = mqtt.connect(options);

client.on('connect', function() {
  client.subscribe(resultTopic);
  // client.subscribe(statPowerTopic);
});

// client.on('message', function(topic, message) {
//   if (topic == statPowerTopic){
//   message = message.toString();
//   mqttMSG = true;
//   if (message.includes('ON')){
//     lightAction.currentState = 1;
//   }
//   else{
//     lightAction.currentState = 0;
//   }
//   light
//     .getService(Service.Lightbulb)
//     .setCharacteristic(Characteristic.On,lightAction.currentState);
// }
// });

client.on('message', function(topic, message) {
    // console.log('RGB LIGHT %s received a message <%s> from topic %s', MQTT_NAME, message.toString(), topic);
    message = JSON.parse(message);
    if (topic == resultTopic){
      if('POWER' in message){
        mqttMSG = true;
        // console.log('"POWER" exists in message');
        if(message['POWER'] == 'ON'){
          // console.log('ON -> lightAction.currentState = 1');
          lightAction.currentState = 1;
        }
        else if(message['POWER'] == 'OFF'){
          // console.log('OFF -> lightAction.currentState = 0');
          lightAction.currentState = 0;
        }

        light.getService(Service.Lightbulb).setCharacteristic(Characteristic.On,lightAction.currentState);
      }

      if('HSBColor' in message){
        mqttH = true;
        mqqtS = true;
        mqqtB = true;
        // console.log('"HSBColor" exists in message');
        var hsb = message['HSBColor'].split(',');

        lightAction.currentHue = hsb[0];
        lightAction.currentSaturation = hsb[1];
        lightAction.currentBrightness = hsb[2];
        lightAction.lastHue = hsb[0];
        lightAction.lastSaturation = hsb[1];
        lightAction.lastBrightness = hsb[2];
        light.getService(Service.Lightbulb)
          .setCharacteristic(Characteristic.Hue, lightAction.currentHue)
          .setCharacteristic(Characteristic.Saturation, lightAction.currentSaturation)
          .setCharacteristic(Characteristic.Brightness, lightAction.currentBrightness);
      }
    }
});

//setup HK light object
var lightUUID = uuid.generate(UUID);
var light = exports.accessory = new Accessory(name, lightUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
light.username = USERNAME;
light.pincode = "031-45-154";

//add a light service and setup the On Characteristic
light
  .addService(Service.Lightbulb)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {
    callback(null, lightAction.getState());
  });

  light
  .getService(Service.Lightbulb)
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    if (mqttMSG){
      mqttMSG = false;
    }
    else{
      lightAction.setState(value);
    }
    callback();
  });

//Add and setup Brightness
  light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Brightness)
  .on('set', function(value, callback){
    if (mqttB){
      mqttB = false;
    }
    else{
      lightAction.setBrightness(value);
    }
    callback()
  });

light
  .getService(Service.Lightbulb)
  .getCharacteristic(Characteristic.Brightness)
  .on('get', function(callback){
    callback(null, lightAction.getBrightness())
  });

//Add and setup Saturation
  light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Saturation)
  .on('set', function(value, callback){
    if (mqttS){
      mqttS = false;
    }
    else{
      lightAction.setSaturation(value);
    }
    callback()
  });

light
  .getService(Service.Lightbulb)
  .getCharacteristic(Characteristic.Saturation)
  .on('get', function(callback){
    callback(null, lightAction.getSaturation())
  });

//Add and setup Hue
light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Hue)
  .on('set', function(value, callback){
    if (mqttH){
      mqttH = false;
    }
    else{
      lightAction.setHue(value);
    }
    callback()
  });

light
  .getService(Service.Lightbulb)
  .getCharacteristic(Characteristic.Hue)
  .on('get', function(callback){
    callback(null, lightAction.getHue())
  });



// here's a fake temperature sensor device that we'll expose to HomeKit
var lightAction = {

  //initialize the various state variables
  currentState: 0,
  currentBrightness: 0,
  currentHue: 0,
  currentSaturation: 0,

  lastBrightness: 0,
  lastHue: 0,
  lastSaturation: 0,


  //On Characteristic set/get
  getState: function() { return this.currentState;},
  setState: function(newState){
    if((newState == true && this.currentState == 0) || (newState == false && this.currentState == 1) ){
      console.log("Setting new outlet state: " + newState.toString());
      if(newState == true){


		
		    // pubBrightness = this.currentBrightness / 100;
		    // pubHue = this.currentHue / 360;
        // pubSaturation = this.currentSaturation / 100;
        // console.log('Current brightness: %s; current hue: %s; current saturation: %s;', this.currentBrightness, this.currentHue, this.currentSaturation);
        // console.log('Pub brightness: %s; pub hue: %s; pub saturation: %s;', pubBrightness, pubHue, pubSaturation);
		    // toPublish = 'h' + pubHue.toFixed(3).toString() + ',' + pubSaturation.toFixed(3).toString() + ',' + pubBrightness.toFixed(3).toString()
		    // client.publish(colorTopic, toPublish);
      
        this.currentState = 1;
        toPublish = this.currentHue + ',' + this.currentSaturation + ',' + this.currentBrightness;;
        client.publish(HSBcolorTopic, toPublish);

        console.log('Command %s was published to topic %s', toPublish, colorTopic)
      }
      else{
        // client.publish(colorTopic, 'h0.00,0.00,0.00');
        // console.log('Command h0.00,0.00,0.00 was published to topic %s', colorTopic)
        toPublish = 'OFF';
        client.publish(powerTopic, toPublish);
        this.currentState = 0;
      }
    }

  },

  //Brightness Characteristic set/get
  getBrightness: function(){return this.currentBrightness;},
  setBrightness: function(newBrightness){
    this.currentBrightness = newBrightness;
    this.updateLight();
  },


  //Saturation Characteristic set/get
  getSaturation: function(){return this.currentSaturation;},
  setSaturation: function(newSaturation){
    this.currentSaturation = newSaturation;
    this.updateLight();
  },


  //Hue Characteristic set/get
  getHue: function(){return this.currentHue;},
  setHue: function(newHue){
    this.currentHue = newHue;
    this.updateLight();
  },


  //other light setting functions
  updateState: function() {
    this.currentState = lightState;
  },

  updateLight: function(){
    if((this.lastSaturation != this.currentSaturation || this.lastHue != this.currentHue || this.lastBrightness != this.currentBrightness) && this.currentState != 0){
      console.log('===Trying to update light===');
      // pubBrightness = this.currentBrightness / 100;
      // pubHue = this.currentHue / 360;
      // pubSaturation = this.currentSaturation / 100;
      console.log('Current brightness: %s; current hue: %s; current saturation: %s;', this.currentBrightness, this.currentHue, this.currentSaturation);
      // console.log('Pub brightness: %s; pub hue: %s; pub saturation: %s;', pubBrightness, pubHue, pubSaturation);
      // toPublish = 'h' + pubHue.toFixed(3).toString() + ',' + pubSaturation.toFixed(3).toString() + ',' + pubBrightness.toFixed(3).toString()
      toPublish = this.currentHue + ',' + this.currentSaturation + ',' + this.currentBrightness;
      client.publish(HSBcolorTopic, toPublish);
      console.log('Command %s was published to topic %s', toPublish, HSBcolorTopic)

      
      console.log('===End of light update===');
    }
    this.lastBrightness = this.currentBrightness;
    this.lastHue = this.currentHue;
    this.lastSaturation = this.currentSaturation;
  }
  
}



// // update the characteristic values so interested iOS devices can get notified
// setInterval(function() {
//   light
//     .getService(Service.Lightbulb)
//     .setCharacteristic(Characteristic.On, lightAction.currentState);
//   light
//     .getService(Service.Lightbulb)
//     .setCharacteristic(Characteristic.Brightness, lightAction.getBrightness());
//   light
//     .getService(Service.Lightbulb)
//     .setCharacteristic(Characteristic.Hue, lightAction.getHue());
//   light
//     .getService(Service.Lightbulb)
//     .setCharacteristic(Characteristic.Saturation, lightAction.getSaturation());

// }, 2000);
