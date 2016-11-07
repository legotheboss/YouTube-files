'use strict';

var debug = require('debug')('Camera');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var clone = require('./util/clone').clone;
var uuid = require('./util/uuid');
var Service = require('./Service').Service;
var Characteristic = require('./Characteristic').Characteristic;
var StreamController = require('./StreamController').StreamController;
var HomeKitTypes = require('./gen/HomeKitTypes');
var cmd = require('node-cmd');
var fs = require('fs');
var ip = require('ip');
var spawn = require('child_process').spawn;

module.exports = {
  Camera: Camera
};

function Camera() {
  this.services = [];
  this.streamControllers = [];

  this.pendingSessions = {};
  this.ongoingSessions = {};

  let options = {
    proxy: false, // Requires RTP/RTCP MUX Proxy
    disable_audio_proxy: false, // If proxy = true, you can opt out audio proxy via this
    srtp: true, // Supports SRTP AES_CM_128_HMAC_SHA1_80 encryption
    video: {
      resolutions: [
        [640, 480, 30],
	[320, 240, 15]
      ],
      codec: {
        profiles: [0, 1, 2], // Enum, please refer StreamController.VideoCodecParamProfileIDTypes
        levels: [0, 1, 2] // Enum, please refer StreamController.VideoCodecParamLevelTypes
      }
    },
    audio: {
      comfort_noise: false,
      codecs: [
        {
          type: "OPUS", // Audio Codec
          samplerate: 24 // 8, 16, 24 KHz
        },
        {
          type: "AAC-eld",
          samplerate: 16
        }
      ]
    }
  }

  this.createCameraControlService();
  this._createStreamControllers(2, options);
}

Camera.prototype.handleSnapshotRequest = function(request, callback) {
  // Image request: {width: number, height: number}
  // Please override this and invoke callback(error, image buffer) when the snapshot is ready
  // console.log("running command 1");
  cmd.run('sudo sh /home/pi/HAP-NodeJS/task');
  var snapshot = fs.readFileSync(__dirname + '/res/snapshot.jpg');
  callback(undefined, snapshot);
}

Camera.prototype.handleCloseConnection = function(connectionID) {
  this.streamControllers.forEach(function(controller) {
    controller.handleCloseConnection(connectionID);
  });
}

Camera.prototype.prepareStream = function(request, callback) {
  // Invoked when iOS device requires stream

  var sessionInfo = {};

  let sessionID = request["sessionID"];
  let targetAddress = request["targetAddress"];

  sessionInfo["address"] = targetAddress;

  var response = {};

  let
videoInfo = request["video"];
  if (videoInfo) {
    let targetPort = videoInfo["port"];
    let srtp_key = videoInfo["srtp_key"];
    let srtp_salt = videoInfo["srtp_salt"];

    let videoResp = {
      port: targetPort,
      ssrc: 1,
      srtp_key: srtp_key,
      srtp_salt: srtp_salt
    };

    response["video"] = videoResp;

    sessionInfo["video_port"] = targetPort;
    sessionInfo["video_srtp"] = Buffer.concat([srtp_key, srtp_salt]);
    sessionInfo["video_ssrc"] = 1;
  }

  let audioInfo = request["audio"];
  if (audioInfo) {
    let targetPort = audioInfo["port"];
    let srtp_key = audioInfo["srtp_key"];
    let srtp_salt = audioInfo["srtp_salt"];

    let audioResp = {
      port: targetPort,
      ssrc: 1,
      srtp_key: srtp_key,
      srtp_salt: srtp_salt
    };

    response["audio"] = audioResp;

    sessionInfo["audio_port"] = targetPort;
    sessionInfo["audio_srtp"] = Buffer.concat([srtp_key, srtp_salt]);
    sessionInfo["audio_ssrc"] = 1;
  }

  let currentAddress = ip.address();
  var addressResp = {
    address: currentAddress
  };

  if (ip.isV4Format(currentAddress)) {
    addressResp["type"] = "v4";
  } else {
    addressResp["type"] = "v6";
  }

  response["address"] = addressResp;
  this.pendingSessions[uuid.unparse(sessionID)] = sessionInfo;

  callback(response);
}

Camera.prototype.handleStreamRequest = function(request) {
  // Invoked when iOS device asks stream to start/stop/reconfigure
  var sessionID = request["sessionID"];
  var requestType = request["type"];
  if (sessionID) {
    let sessionIdentifier = uuid.unparse(sessionID);

    if (requestType == "start") {
      var sessionInfo = this.pendingSessions[sessionIdentifier];
      if (sessionInfo) {
        var width = 640;
        var height = 480;
        var fps = 30;
        var bitrate = 900;

        let videoInfo = request["video"];
        if (videoInfo) {
          width = videoInfo["width"];
          height = videoInfo["height"];

          let expectedFPS = videoInfo["fps"];
          if (expectedFPS < fps) {
            fps = expectedFPS;
          }

        //  bitrate = videoInfo["max_bit_rate"];
        }

        let targetAddress = sessionInfo["address"];
        let targetVideoPort = sessionInfo["video_port"];
        let videoKey = sessionInfo["video_srtp"];

	let ffmpegCommand = '-re -i http://localhost:8081 -threads 0 -vcodec h264_omx -an -pix_fmt yuv420p -r '+ fps +' -f rawvideo -tune zerolatency -vf scale='+ width +':'+ height +' -b:v '+ bitrate +'k -bufsize '+ bitrate +'k -payload_type 99 -ssrc 1 -f rtp -srtp_out_suite AES_CM_128_HMAC_SHA1_80 -srtp_out_params '+videoKey.toString('base64')+' srtp://'+targetAddress+':'+targetVideoPort+'?rtcpport='+targetVideoPort+'&localrtcpport='+targetVideoPort+'&pkt_size=1378';
        let ffmpeg = spawn('ffmpeg', ffmpegCommand.split(' '), {env: process.env});
        this.ongoingSessions[sessionIdentifier] = ffmpeg;
      }

      delete this.pendingSessions[sessionIdentifier];
    } else if (requestType == "stop") {
      var ffmpegProcess = this.ongoingSessions[sessionIdentifier];
      if (ffmpegProcess) {
        ffmpegProcess.kill('SIGKILL');
      }

      delete this.ongoingSessions[sessionIdentifier];
    }
  }
}

Camera.prototype.createCameraControlService = function() {
  var controlService = new Service.CameraControl();

  // Developer can add control characteristics like rotation, night vision at here.

  this.services.push(controlService);
}

// Private

Camera.prototype._createStreamControllers = function(maxStreams, options) {
  let self = this;

  for (var i = 0; i < maxStreams; i++) {
    var streamController = new StreamController(i, options, self);

    self.services.push(streamController.service);
    self.streamControllers.push(streamController);
  }
}
