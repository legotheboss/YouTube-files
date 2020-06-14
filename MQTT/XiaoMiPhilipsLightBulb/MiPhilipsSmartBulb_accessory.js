var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var miio = require('miio');

//!!!!!!!!!!!!!!!!
var name = "Kitchen light 1"; //accessory name!!!
var philipsUUID = "hap-nodejs:accessories:philips:SmartBulb:" + name; //change this to your preferences
var philipsUsername = "78:11:DC:07:05:E0"; //MAC address!!!!
var address = '192.168.88.102' //miio host IP address
var token = '3b1792aeba4477aebddd3215456606ac' //miio token
//!!!!!!!!!!!!!!!!!

var options = {
    address: address, //host IP
    token: token //token
  };

var device = new miio.Device({
    address: options.address,
    token: options.token
});

var miPhilipsSmartBulb = exports.accessory = new Accessory(name, uuid.generate(philipsUUID));

miPhilipsSmartBulb.username = philipsUsername;
miPhilipsSmartBulb.pincode = "031-45-154"; //???

//Device functions

var getPower = function(callback) {
    device.call("get_prop", ["power"]).then(result => {
        console.log("[MiPhilipsLightPlatform][DEBUG]MiPhilipsSmartBulb - Light - getPower: " + result);
        callback(null, result[0] === 'on' ? true : false);
    }).catch(function(err) {
        console.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsSmartBulb - Light - getPower Error: " + err);
        callback(err);
    });
}

var setPower = function(value, callback) {
    device.call("set_power", [value ? "on" : "off"]).then(result => {
        console.log("[MiPhilipsLightPlatform][DEBUG]MiPhilipsSmartBulb - Light - setPower Result: " + result);
        if(result[0] === "ok") {
            callback(null);
        } else {
            callback(new Error(result[0]));
        }
    }).catch(function(err) {
        console.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsSmartBulb - Light - setPower Error: " + err);
        callback(err);
    });
}

var getBrightness = function(callback) {
    device.call("get_prop", ["bright"]).then(result => {
        console.log("[MiPhilipsLightPlatform][DEBUG]MiPhilipsSmartBulb - Light - getBrightness: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
        console.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsSmartBulb - Light - getBrightness Error: " + err);
        callback(err);
    });
}

var setBrightness = function(value, callback) {
    if(value > 0) {
        device.call("set_bright", [value]).then(result => {
            console.log("[MiPhilipsLightPlatform][DEBUG]MiPhilipsSmartBulb - Light - setBrightness Result: " + result);
            if(result[0] === "ok") {
                callback(null);
            } else {
                callback(new Error(result[0]));
            }
        }).catch(function(err) {
            console.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsSmartBulb - Light - setBrightness Error: " + err);
            callback(err);
        });
    } else {
        callback(null);
    }
}

var getColorTemperature = function(callback) {
    device.call("get_prop", ["cct"]).then(result => {
        console.log("[MiPhilipsLightPlatform][DEBUG]MiPhilipsSmartBulb - Light - getColorTemperature: " + result);
        callback(null, result[0] * 350);
    }).catch(function(err) {
        console.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsSmartBulb - Light - getColorTemperature Error: " + err);
        callback(err);
    });
}

var setColorTemperature = function(value, callback) {
    value = value - 50;
    value = value / 350 * 100;
    value = Math.round(100 - value);
    if(value == 0) {
        value = 1;
    }
    device.call("set_cct", [value]).then(result => {
        console.debug("[MiPhilipsLightPlatform][DEBUG]MiPhilipsSmartBulb - Light - setColorTemperature Result: " + result);
        if(result[0] === "ok") {
            callback(null);
        } else {
            callback(new Error(result[0]));
        }
    }).catch(function(err) {
        console.error("[MiPhilipsLightPlatform][ERROR]MiPhilipsSmartBulb - Light - setColorTemperature Error: " + err);
        callback(err);
    });
}

//Characteristics binding

// listen for the "identify" event for this Accessory
miPhilipsSmartBulb.on('identify', function(paired, callback) {
    console.log(name + " Identified!");
    callback();
  });

miPhilipsSmartBulb
  .addService(Service.Lightbulb)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {
    // return our current value
    getPower(callback);
});

miPhilipsSmartBulb
  .getService(Service.Lightbulb)
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    // set value
    setPower(value, callback);
});

miPhilipsSmartBulb
  .getService(Service.Lightbulb)
  .getCharacteristic(Characteristic.Brightness)
  .on('get', function(callback) {
    // return our current value
    getBrightness(callback);
});

miPhilipsSmartBulb
  .getService(Service.Lightbulb)
  .getCharacteristic(Characteristic.Brightness)
  .on('set', function(value, callback) {
    // set value
    setBrightness(value, callback);
});

miPhilipsSmartBulb
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.ColorTemperature)
  .setProps({
    minValue: 50,
    maxValue: 400,
    minStep: 1
  })
  .on('get', function(callback) {
    // return our current value
    getColorTemperature(callback);
});

miPhilipsSmartBulb
  .getService(Service.Lightbulb)
  .getCharacteristic(Characteristic.ColorTemperature)
  .on('set', function(value, callback) {
    // set value
    setColorTemperature(value, callback);
});
