/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(0);

// Compatibility shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// General Variables
var APP_NAME = 'SFT';
var room = '';
var socketConnected = false;
var peerConnected = false;
var peerid = '';
var peerSettings = {
    host: 'sft-peer.herokuapp.com',
    secure: true,
    port: 443,
    debug: 3,
    config: { 'iceServers': [{
            url: "stun:global.stun.twilio.com:3478?transport=udp"
        }, {
            url: "turn:global.turn.twilio.com:3478?transport=udp",
            username: "d44a3662a61e115cf3df7254d44d6b276d90300d065a1560a1618fa49bbdd5f3",
            credential: "0JZh27bgCb3oM0EmXKkctvuQT6S5qIJJthvUxho20r8="
        }, {
            url: "turn:global.turn.twilio.com:3478?transport=tcp",
            username: "d44a3662a61e115cf3df7254d44d6b276d90300d065a1560a1618fa49bbdd5f3",
            credential: "0JZh27bgCb3oM0EmXKkctvuQT6S5qIJJthvUxho20r8="
        }, {
            url: "turn:global.turn.twilio.com:443?transport=tcp",
            username: "d44a3662a61e115cf3df7254d44d6b276d90300d065a1560a1618fa49bbdd5f3",
            credential: "0JZh27bgCb3oM0EmXKkctvuQT6S5qIJJthvUxho20r8="
        }] }
};

// Create PeerJS and Socket connections.
var socket = io();
var peerjs = new Peer(peerSettings);

/**
* PeerJS: On Connection.
*
* @param  socket - Clients Socket Object.
* @return void
*/
peerjs.on('open', function () {
    consoleMessage('Peerjs Connected'); // Connected message.
    peerjsConnectedUI(); // Display peerjs connected.
    peerConnected = true; // Connection has been made.
    findPeer(); // Find peer to call.
});

/**
* PeerJS: Recieving a call.
*
* @param call - Recieving call.
* @return void
*/
peerjs.on('call', function (call) {
    call.answer(window.localStream); // Answer call.
    makeCall(call);
});

/**
* PeerJS: Display any errors within the call.
*
* @param err - Errors with call.
* @return void
*/
peerjs.on('error', function (err) {
    callConnectedUI(false, 'Not In Call'); // Display Call In Progress
    console.log(err.message); // Display errors.
    if (peerjs.disconnected) {
        peerjs.disconnect();
        peerjs.reconnect();
    }
});

/**
* Socket.IO: On Connection.
*
* @param  socket - Clients Socket Object.
* @return void
*/
socket.on('connect', function (socket) {
    consoleMessage('Socket Connected'); // Connected message.
    socketConnectedUI(); // UI display for connected.
    socketConnected = true; // Connection has been made.
    findPeer(); // Find peer to call.
});

/**
* Socket.IO: Matched with a peer, and call has started.
*
* @return void
*/
socket.on('call start', function (data) {
    // Save the room name.
    room = data.room;

    // For testing, print all collected data.
    console.log("Room: " + data.room);
    console.log("Peer ID: " + data.peer);

    // Ensure only one person starts the call.
    if (data.caller == 'this') {
        // Call given the matched up peer id.
        var call = peerjs.call(data.peer, window.localStream);
        makeCall(call);
    }
});

/**
* Socket.IO: Call has ended.
*
* @return void
*/
socket.on('call end', function (data) {
    room = '';
    if (window.existingCall) {
        window.existingCall.close(); // Kill the current call.
    }
    callConnectedUI(false, 'Not in call.'); // Display Call In Progress
    $('#their-id').text('Not in call.'); // Dev purposes display status.
});

/**
* Socket.IO: When disconnect of the call has occurred.
*
* @return void
*/
socket.on('disconnect', function () {
    console.log('Connection fell or your browser is closing.');
});

/**
* Socket.IO: Helper function to toggle the UI when socket.io is connected.
*
* @return void
*/
function socketConnectedUI() {
    $('#socket-connected').addClass('badge-success').removeClass('badge-danger');
    $('#socket-connected').text('Connected');
    $('#socket-id').text(socket.id);
}

/**
* PeerJS: Helper function to toggle the UI when peerjs is connected.
*
* @uses PeerJS
* @return void
*/
function peerjsConnectedUI() {
    // UI: Peerjs connection status.
    $('#peerjs-connected').addClass('badge-success').removeClass('badge-danger');
    $('#peerjs-connected').text('Connected');
    $('#my-peerjs-id').text(peerjs.id);
}

/**
* Helper function to display call connected/not connected.
*
* @return void
*/
function callConnectedUI(status, message) {
    // Class names.
    var to = 'success';
    var from = 'dark';

    // Check status
    if (status != true) {
        to = 'dark';
        from = 'success';
    }

    // UI: Peerjs connection status.
    $('#call-connected').addClass('badge-' + to).removeClass('badge-' + from);
    $('#call-connected').text(message);
}

/**
* Helper function to display console messages.
*
* @return void
*/
function consoleMessage() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    console.log(APP_NAME + ':\t' + message);
}

/**
* Find a peer to call with.
*
* @return void
*/
function findPeer() {

    // Display message.
    callConnectedUI(false, 'Finding Call.');

    // Hang up on an existing call if present
    if (window.existingCall) {
        window.existingCall.close();
    }

    // Ensure services are connected.
    if (socketConnected && peerConnected) {
        // Send peerid and find call partner.
        socket.emit('peerid', peerjs.id);
    }
}

/**
* Setup call information.
*
* @return void
*/
function setupCall() {
    // Get audio/video stream
    navigator.getUserMedia({ audio: true, video: true }, function (stream) {
        $('#my-video').prop('src', URL.createObjectURL(stream)); // Set your video displays
        window.localStream = stream; // Make stream
        $('#enable-camera-alert').hide();
    }, function (err) {
        console.log('Failed to get local stream', err);
    });
}

/**
* Make Call Function.
*
* @param call - Call Object
* @return void
*/
function makeCall(call) {

    // Hang up on an existing call if present
    if (window.existingCall) {
        window.existingCall.close();
    }

    // Wait for stream on the call, then set peer video display
    call.on('stream', function (stream) {
        $('#their-video').prop('src', URL.createObjectURL(stream));
    });

    // UI stuff
    window.existingCall = call;
    $('#their-id').text(call.peer);

    // Display Call In Progress
    callConnectedUI(true, "In Call");

    // Call Ended
    call.on('close', function () {
        console.log("Call Ended");

        // Hang up on an existing call if present
        if (window.existingCall) {
            window.existingCall.close();
        }
    });
}

// Click handlers setup
$(function () {

    // Retry if getUserMedia fails
    $('#step1-retry').click(function () {
        setupCall();
    });

    // Get things started
    setupCall();
});

/***/ })
/******/ ]);
//# sourceMappingURL=App.bundle.js.map