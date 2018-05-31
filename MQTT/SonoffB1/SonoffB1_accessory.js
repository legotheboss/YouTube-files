var MQTT_NAME = 'sonoffB1'

var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;

//MQTT setup
var mqtt = require('mqtt');
var options = {
  port: 1883,
  host: 'localhost',
  clientId: 'B1_HAP'
};

var client = mqtt.connect(options);
//console.log(clientID+ " Connected to MQTT broker");
var powerTopic = 'cmnd/'+MQTT_NAME+'/power';
var colorTopic = 'cmnd/'+MQTT_NAME+'/hsbcolor';
var dimmerTopic = 'cmnd/'+MQTT_NAME+'/dimmer';

var SONOFF_B1 = {
  powerOn: false,
  brightness: 100, // percentage
  hue: 0,
  saturation: 0,

  setPowerOn: function(on) {
    //console.log("Turning B1_HAP %s!", on ? "on" : "off");

    if (on) {
      client.publish(powerTopic, 'on');
      SONOFF_B1.powerOn = on;
   	}
    else {
	    client.publish(powerTopic,'off');
      SONOFF_B1.powerOn = false;
   };

  },
  setBrightness: function(brightness) {
    //console.log("Setting light brightness to %s", brightness);
    var message = SONOFF_B1.hue + ',' + brightness + ',' + SONOFF_B1.saturation;
    client.publish(colorTopic, message);
    client.publish(dimmerTopic, String(brightness));
    SONOFF_B1.brightness = brightness;
  },
  setHue: function(hue){
    //console.log("Setting light Hue to %s", hue);
    var message = hue + ',' + SONOFF_B1.brightness + ',' + SONOFF_B1.saturation;
    client.publish(colorTopic, message);
    SONOFF_B1.hue = hue;
  },
  setSaturation: function(saturation){
    //console.log("Setting light Saturation to %s", saturation);
    var message = SONOFF_B1.hue + ',' + SONOFF_B1.brightness + ',' + saturation;
    client.publish(colorTopic, message);
    SONOFF_B1.saturation = saturation;
  },
  identify: function() {
    //console.log("Identify the light!");
  }
}

// Generate a consistent UUID for our light Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "B1_HAP".
var lightUUID = uuid.generate('hap-nodejs:accessories:B1_HAP' + MQTT_NAME);

// This is the Accessory that we'll return to HAP-NodeJS that represents our sonoff light.
var light = exports.accessory = new Accessory(MQTT_NAME, lightUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
light.username = "1A:2B:3C:5D:6E:FF";
light.pincode = "031-45-154";

// set some basic properties (these values are arbitrary and setting them is optional)
light
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Sonoff")
  .setCharacteristic(Characteristic.Model, "B-1");

// listen for the "identify" event for this Accessory
light.on('identify', function(paired, callback) {
  SONOFF_B1.identify();
  callback(); // success
});

// Add the actual Lightbulb Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
light
  .addService(Service.Lightbulb, "Sonoff B1") // services exposed to the user should have "names" like "Fake Light" for us
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    SONOFF_B1.setPowerOn(value);
    callback(); // Our fake Light is synchronous - this value has been successfully set
  });

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
light
  .getService(Service.Lightbulb)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {

    // this event is emitted when you ask Siri directly whether your light is on or not. you might query
    // the light hardware itself to find this out, then call the callback. But if you take longer than a
    // few seconds to respond, Siri will give up.

    var err = null; // in case there were any problems

    if (SONOFF_B1.powerOn) {
      //console.log("Are we on? Yes.");
      callback(err, true);
    }
    else {
      //console.log("Are we on? No.");
      callback(err, false);
    }
  });

// also add an "optional" Characteristic for Brightness
light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Brightness)
  .on('get', function(callback) {
    callback(null, SONOFF_B1.brightness);
  })
  .on('set', function(value, callback) {
    SONOFF_B1.setBrightness(value);
    callback();
  })

light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Hue)
  .on('get',function(callback){
   callback(null,SONOFF_B1.hue);
   })
   .on('set',function(value,callback){
   SONOFF_B1.setHue(value);
   callback();
   })

light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Saturation)
  .on('get',function(callback){
   callback(null,SONOFF_B1.saturation);
   })
   .on('set',function(value,callback){
   SONOFF_B1.setSaturation(value);
   callback();
   })

//Sonoff MQTT handling which allows the status to match the Sonoff's power status
client.on('message', function(topic, message) {
//  //console.log(message.toString());
 message = message.toString();
 mqttMSG = true;
 if (message.includes('ON')){
   SONOFF_B1.powerOn = true;
 }
 else{
   SONOFF_B1.powerOn = false;
 }
 sonoff
   .getService(Service.Lightbulb)
   .setCharacteristic(Characteristic.On,SONOFF_B1.powerOn);
});
