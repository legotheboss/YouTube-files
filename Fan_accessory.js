var PythonShell = require('python-shell');
// HomeKit types required
var types = require("./types.js")
var exports = module.exports = {};

var execute = function(accessory,characteristic,value){ console.log("executed accessory: " + accessory + ", and characteristic: " + characteristic + ", with value: " +  value + "."); }

exports.accessory = {
  displayName: "Hunter Fan",
  username: "CD:23:3D:EE:4E:FB",
  pincode: "031-45-154",
  services: [{
    sType: types.ACCESSORY_INFORMATION_STYPE, 
    characteristics: [{
    	cType: types.NAME_CTYPE, 
    	onUpdate: null,
    	perms: ["pr"],
		format: "string",
		initialValue: "Fan",
		supportEvents: false,
		supportBonjour: false,
		manfDescription: "Name of the accessory",
		designedMaxLength: 255    
    },{
    	cType: types.MANUFACTURER_CTYPE, 
    	onUpdate: null,
    	perms: ["pr"],
		format: "string",
		initialValue: "Hunter Fan Company",
		supportEvents: false,
		supportBonjour: false,
		manfDescription: "Manufacturer",
		designedMaxLength: 255    
    },{
    	cType: types.MODEL_CTYPE,
    	onUpdate: null,
    	perms: ["pr"],
		format: "string",
		initialValue: "Rev-1",
		supportEvents: false,
		supportBonjour: false,
		manfDescription: "Model",
		designedMaxLength: 255    
    },{
    	cType: types.SERIAL_NUMBER_CTYPE, 
    	onUpdate: null,
    	perms: ["pr"],
		format: "string",
		initialValue: "A1S2NASF88EW",
		supportEvents: false,
		supportBonjour: false,
		manfDescription: "SN",
		designedMaxLength: 255    
    },{
    	cType: types.IDENTIFY_CTYPE, 
    	onUpdate: null,
    	perms: ["pw"],
		format: "bool",
		initialValue: false,
		supportEvents: false,
		supportBonjour: false,
		manfDescription: "Identify Accessory",
		designedMaxLength: 1    
    }]
  },{
    sType: types.FAN_STYPE, 
    characteristics: [{
    	cType: types.NAME_CTYPE,
    	onUpdate: null,
    	perms: ["pr"],
		format: "string",
		initialValue: "Fan Control",
		supportEvents: false,
		supportBonjour: false,
		manfDescription: "Name of service",
		designedMaxLength: 255   
    },{
    	cType: types.POWER_STATE_CTYPE,
	onUpdate: function(value)
    	{ 
    		console.log("Change:",value);
    		if (value) {
    			PythonShell.run('fan2.py', function (err) {
  				console.log('Fan On');
				});
    		} else {
    			PythonShell.run('fan0.py', function (err) {
  				console.log('Fan Off');
				});
    		}
    	},
    	perms: ["pw","pr","ev"],
		format: "bool",
		initialValue: false,
		supportEvents: false,
		supportBonjour: false,
		manfDescription: "Change the power state of the fan",
		designedMaxLength: 1    
    },{
    	cType: types.ROTATION_SPEED_CTYPE,
	onUpdate: function(value)
    	{ 
    		console.log("Change:",value);
    		if (value >= 1 && value <= 33) {
    			PythonShell.run('fan1.py', function (err) {
  				console.log('Fan set to 1');
				});
    		} else if (value >= 34 && value <= 66) {
    			PythonShell.run('fan2.py', function (err) {
  				console.log('Fan set to 2');
				});
    		} else if (value >= 67 && value <= 100) {
    			PythonShell.run('fan3.py', function (err) {
  				console.log('Fan set to 3');
				});
    		}
    	},
    	perms: ["pw","pr","ev"],
		format: "float",
		initialValue: 100,
		supportEvents: false,
		supportBonjour: false,
		manfDescription: "Change the speed  of the fan",
		designedMinValue: 1,
		designedMaxValue: 100,
		designedMinStep: 1,
		unit: "percentage"
    }]
  }]
}
